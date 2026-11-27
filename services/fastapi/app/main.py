"""VisionFlow Studio — FastAPI 분석 백엔드 (옵션: backend=fastapi)"""
from __future__ import annotations

import asyncio
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, Form, HTTPException, Response, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .analyzer import VideoAnalyzer
from . import (
    yolo_detector, depth_estimator, trainer, behavior_recognizer,
    events, event_store, prediction, stream, preprocessing,
    broker, timeseries, clip_store, resolution, safety, active_learning, synthesis,
    dataset_manager, accident_analyzer, evaluation, auto_retrain, feedback,
    behavior_dataset, external_datasets, data_catalog,
)
from .measurement import measure_objects

app = FastAPI(title="VisionFlow CV API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    # 이 프로젝트 전용 프론트엔드 주소만 허용 (외부 프로젝트 연동 차단)
    allow_origins=[
        "http://localhost:53710",
        "http://localhost:53711",
        "http://localhost:53712",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup() -> None:
    events.set_loop(asyncio.get_running_loop())


@app.websocket("/ws/analysis")
async def websocket_analysis(websocket: WebSocket):
    await events.connect(websocket)


CONFIG_PATH = Path(__file__).resolve().parents[3] / "configs" / "app.config.json"
config = json.loads(CONFIG_PATH.read_text(encoding="utf-8")) if CONFIG_PATH.exists() else {}
yolo_detector.configure(config.get("detection", {}))
# 학습된 커스텀 모델이 있으면 재시작 후에도 자동 적용
if trainer.CUSTOM_MODEL.exists():
    try:
        _names = json.loads(
            (trainer.CUSTOM_MODEL.parent / "custom_names.json").read_text(encoding="utf-8")
        )
        yolo_detector.use_model(str(trainer.CUSTOM_MODEL), _names)
    except Exception:
        pass
preprocessing.configure(config.get("preprocessing", {}))
broker.configure(config.get("broker", {}))
resolution.configure(config.get("detection", {}))
safety.configure(config.get("safety", {}))
accident_analyzer.configure(config)
active_learning.configure(config.get("training", {}))
timeseries.init()
analyzer = VideoAnalyzer()


class AnalyzeRequest(BaseModel):
    videoName: str = "demo_surveillance_clip.mp4"
    videoUrl: str | None = None
    performance: dict = Field(default_factory=dict)
    accuracy: dict = Field(default_factory=dict)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "engine": "fastapi-yolo",
        "model": yolo_detector.active_model_info(),
        "isolation": config.get("isolation", {}).get("standalone", False),
    }


@app.get("/api/config")
def get_config():
    if not CONFIG_PATH.exists():
        raise HTTPException(status_code=404, detail="config not found")
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    if not req.videoName:
        raise HTTPException(status_code=400, detail="videoName is required")
    return analyzer.analyze(req.videoName, req.performance or {}, req.accuracy or {})


@app.post("/api/detect-frame")
async def detect_frame(
    file: UploadFile = File(...),
    threshold: float = Form(0.5),
):
    """재생 중인 프레임 1장을 YOLO로 감지한다 (실시간 추적용)."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty frame")
    try:
        det_cfg = config.get("detection", {})
        dets = yolo_detector.detect_image(
            np.array(Image.open(io.BytesIO(data)).convert("RGB")), threshold, 640,
            True,
            bool(det_cfg.get("personBoost", {}).get("value", True)),
            float(det_cfg.get("personBoostMinConf", {}).get("value", 0.3)),
        )
        # 화면 대부분을 덮는 차량/중장비 박스는 배경 오탐(잔해·붕괴 장면)으로 제거
        filtered = [
            d for d in dets
            if d.get("kind") == "person"
            or (d.get("bbox", {}).get("w", 0) * d.get("bbox", {}).get("h", 0) / 100) <= 22
        ]
        return {"detections": filtered}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YOLO detect failed: {exc}")


@app.post("/api/measure-frame")
async def measure_frame(
    file: UploadFile = File(...),
    threshold: float = Form(0.5),
    depth: bool = Form(False),
):
    """프레임에서 객체를 감지하고 상대/실측 근사치(깊이 포함)를 반환한다."""
    import time as _time

    t_req = _time.perf_counter()
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty frame")
    t_read = _time.perf_counter()
    try:
        from PIL import Image
        import numpy as np

        image = np.array(Image.open(io.BytesIO(data)).convert("RGB"))
        clip_store.push(image)
        t_image = _time.perf_counter()
        # 실시간 프레임은 경량 추론(imgsz 320) + 깊이 생략으로 지연을 줄인다.
        import time as _time

        # 실시간 경로는 설정된 단일 스케일로 추론하고 이벤트 루프를 막지 않도록 스레드에서 실행
        realtime_imgsz = int(config.get("detection", {}).get("realtimeImgsz", {}).get("value", 960))
        detections = await asyncio.to_thread(
            yolo_detector.detect_image, image, threshold, realtime_imgsz, True,
            bool(config.get("detection", {}).get("personBoost", {}).get("value", True)),
            float(config.get("detection", {}).get("personBoostMinConf", {}).get("value", 0.3)),
        )
        t_detect = _time.perf_counter()
        disparity = None
        if depth and config.get("measurement", {}).get("depthEstimation", {}).get("value", False):
            disparity = depth_estimator.estimate_disparity(image)
        items = measure_objects(detections, image.shape[1], image.shape[0], config.get("measurement", {}), disparity)
        preds = []
        if config.get("prediction", {}).get("enabled", {}).get("value", True):
            preds = prediction.update_and_predict(
                detections,
                config.get("prediction", {}).get("roiPolygons", {}).get("value", []),
                float(config.get("prediction", {}).get("horizonSec", {}).get("value", 2)),
            )
        safety_events, context_description = safety.analyze(detections)
        accident_events = accident_analyzer.analyze(detections, preds)
        captured = active_learning.capture(image, detections, safety_events)
        t_end = _time.perf_counter()
        payload = {
            "width": image.shape[1],
            "height": image.shape[0],
            "depthUsed": disparity is not None,
            "timingsMs": {
                "read": round((t_read - t_req) * 1000, 1),
                "decode": round((t_image - t_read) * 1000, 1),
                "detect": round((t_detect - t_image) * 1000, 1),
                "measure": round((t_end - t_detect) * 1000, 1),
            },
            "predictions": preds,
            "safetyEvents": safety_events,
            "accidentEvents": accident_events,
            "contextDescription": context_description,
            "capturedNegative": captured,
            "measurements": items,
        }
        danger = any(p.get("danger") for p in preds) or any(
            e.get("severity") == "critical" for e in accident_events
        )
        clip = clip_store.maybe_save(danger)
        await events.publish({
            "type": "frame",
            "predictions": preds,
            "safetyEvents": safety_events,
            "accidentEvents": accident_events,
            "contextDescription": context_description,
            "capturedNegative": captured,
            "danger": danger or any(e.get("severity") == "critical" for e in safety_events),
            "clip": clip,
        })
        if config.get("storage", {}).get("eventLog", {}).get("value", True):
            event_store.append({"kind": "frame", "predictions": preds, "danger": danger, "clip": clip})
        for ae in accident_events:
            evaluation.add_prediction(ae)
        broker.publish({"kind": "frame", "danger": danger, "predictions": preds, "clip": clip})
        timeseries.insert(len(detections), danger, payload["timingsMs"]["detect"], label="")
        payload["clip"] = clip
        return payload
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"measure failed: {exc}")


@app.post("/api/analyze-video")
async def analyze_video(
    file: UploadFile = File(...),
    threshold: float = Form(0.5),
):
    """업로드된 영상을 YOLO로 분석해 실제 감지/트랙 결과를 반환한다."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty video")
    try:
        det_cfg = config.get("detection", {})
        fps = float(det_cfg.get("analysisFps", {}).get("value", 6))
        imgsz = int(det_cfg.get("analysisImgsz", {}).get("value", 640))
        if det_cfg.get("opticalFlow", {}).get("value", False):
            return await asyncio.to_thread(yolo_detector.analyze_video_optical_flow, data, fps)
        return await asyncio.to_thread(yolo_detector.analyze_video_bytes, data, threshold, fps, imgsz)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YOLO video analysis failed: {exc}")


class CaptureRequest(BaseModel):
    datasetId: str = "capture"
    detections: list[dict] = Field(default_factory=list)


class ClipLabelRequest(BaseModel):
    datasetId: str = "capture"
    index: int = 0
    detections: list[dict] = Field(default_factory=list)


class DatasetImportRequest(BaseModel):
    datasetId: str = "construction"
    sourcePath: str = ""
    classes: list[str] = Field(default_factory=list)
    valRatio: float = 0.2


class DatasetCreateRequest(BaseModel):
    datasetId: str = "capture"
    classes: list[str] = Field(default_factory=list)


class TrainRequest(BaseModel):
    datasetId: str = "capture"
    epochs: int = 30
    imgsz: int = 640
    batch: int = 8
    baseModel: str = "yolov8n.pt"
    augmentation: dict = Field(default_factory=dict)


@app.post("/api/behavior/frame")
async def behavior_frame(
    file: UploadFile = File(...),
    threshold: float = Form(0.5),
):
    """재생 중 프레임에서 인물 행동(포즈+이동)을 인식한다."""
    import numpy as np
    from PIL import Image

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty frame")
    try:
        image = np.array(Image.open(io.BytesIO(data)).convert("RGB"))
        return {"behaviors": behavior_recognizer.recognize(image, threshold)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"behavior recognize failed: {exc}")


@app.post("/api/dataset/create")
def dataset_create(req: DatasetCreateRequest):
    """사용자 정의 클래스 목록으로 데이터셋을 생성한다."""
    trainer.prepare_dataset(req.datasetId, req.classes)
    return {"datasetId": req.datasetId, "classes": len(req.classes)}


@app.post("/api/dataset/upload")
async def dataset_upload(
    file: UploadFile = File(...),
    datasetId: str = Form("imported"),
):
    """외부 데이터셋 ZIP을 업로드한다."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty zip")
    try:
        return trainer.import_zip(datasetId, data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"invalid zip: {exc}")


@app.post("/api/dataset/capture")
async def dataset_capture(
    file: UploadFile = File(...),
    payload: str = Form("{}"),
):
    """현재 감지 결과를 학습용 데이터셋(YOLO 라벨)으로 저장한다."""
    import json as _json

    try:
        req = _json.loads(payload)
    except Exception:
        req = {}
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty frame")
    count = trainer.save_capture(
        req.get("datasetId", "capture"),
        data,
        req.get("detections", []),
        file.filename or "frame.jpg",
    )
    return {"saved": count, "datasetId": req.get("datasetId", "capture")}


@app.get("/api/train/status")
def train_status():
    return trainer.status()


@app.post("/api/train/start")
def train_start(req: TrainRequest):
    return trainer.start_training(
        req.datasetId,
        epochs=max(1, min(req.epochs, 300)),
        imgsz=int(req.imgsz),
        batch=max(1, min(req.batch, 64)),
        base_model=req.baseModel,
        augmentation=req.augmentation,
    )


class StreamRequest(BaseModel):
    rtspUrl: str


@app.get("/api/events")
def get_events(limit: int = 100):
    return {"events": event_store.recent(limit)}


@app.get("/api/stream/status")
def stream_status():
    return {**stream.status(), "clients": events.client_count()}


@app.post("/api/stream/start")
def stream_start(req: StreamRequest):
    return stream.start(req.rtspUrl, config)


@app.post("/api/stream/stop")
def stream_stop():
    return stream.stop()


@app.get("/api/runtime")
def runtime_info():
    from . import openvino_detector

    return {
        "wsClients": events.client_count(),
        "stream": stream.status(),
        "openvino": openvino_detector.runtime_info(),
        "broker": broker.status(),
        "webrtcUrl": config.get("streaming", {}).get("webrtcUrl", {}).get("value", ""),
    }


@app.get("/api/metrics")
def get_metrics(limit: int = 100):
    return {"metrics": timeseries.recent(limit)}


class ReviewRequest(BaseModel):
    eventId: str
    verdict: str  # true | false
    accidentType: str = "unknown"
    reviewedBy: str = "user"


@app.get("/api/evaluation")
def get_evaluation():
    return evaluation.evaluate()


@app.post("/api/evaluation/review")
def review_event(req: ReviewRequest):
    if req.verdict not in ("true", "false"):
        raise HTTPException(status_code=400, detail="verdict must be true or false")
    return evaluation.add_review(req.eventId, req.verdict, req.accidentType, req.reviewedBy)


class AutoRetrainRequest(BaseModel):
    epochs: int = 10
    imgsz: int = 640
    baseModel: str = "yolov8n.pt"


@app.post("/api/feedback/false-positive")
async def report_false_positive(
    file: UploadFile = File(...),
    label: str = Form(""),
    confidence: float = Form(0.0),
    bbox: str = Form("{}"),
):
    """화면에서 잘못 탐지된 BBox를 신고 → 네거티브 샘플로 저장."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty frame")
    try:
        record = feedback.report(data, label, confidence, json.loads(bbox))
        from . import evaluation as _ev
        _ev.add_review(record["file"], "false", label or "unknown")
        return {"saved": True, "record": record}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"feedback failed: {exc}")


@app.get("/api/data-catalog")
def get_data_catalog():
    return data_catalog.catalog()


@app.get("/api/external-datasets")
def list_external_datasets():
    return {**external_datasets.catalog(), "imported": external_datasets.imported()}


@app.get("/api/external-datasets/{dataset_id}/guide")
def external_dataset_guide(dataset_id: str):
    return external_datasets.guide(dataset_id)


@app.get("/api/behavior-dataset/stats")
def behavior_dataset_stats():
    return behavior_dataset.stats()


@app.get("/api/feedback/stats")
def feedback_stats():
    return feedback.stats()


@app.get("/api/feedback/zones")
def feedback_zones():
    return {"zones": feedback.zones()}


@app.get("/api/auto-retrain/status")
def auto_retrain_status():
    return auto_retrain.status()


@app.post("/api/auto-retrain/start")
def auto_retrain_start(req: AutoRetrainRequest):
    return auto_retrain.run(
        epochs=max(3, min(req.epochs, 50)),
        imgsz=int(req.imgsz),
        base_model=req.baseModel,
    )


@app.get("/api/clips")
def get_clips():
    return {"clips": clip_store.list_clips()}


@app.get("/api/clips/{name}/info")
def get_clip_info(name: str):
    try:
        return clip_store.clip_info(name)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.get("/api/clips/{name}/frame/{index}")
def get_clip_frame(name: str, index: int):
    """클립 프레임을 JPEG로 반환 (라벨링 UI 미리보기)."""
    try:
        return Response(content=clip_store.get_frame(name, index), media_type="image/jpeg")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/clips/{name}/label")
def label_clip_frame(name: str, req: ClipLabelRequest):
    """수동으로 수정한 BBox를 YOLO 라벨로 저장. detections가 비면 네거티브 샘플."""
    try:
        frame = clip_store.get_frame(name, req.index)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    saved = trainer.save_capture(
        req.datasetId, frame, req.detections, f"clip_{Path(name).stem}_{req.index}.jpg"
    )
    return {"saved": saved, "datasetId": req.datasetId, "negative": saved == 0}


@app.get("/api/dataset/classes")
def get_dataset_classes(datasetId: str = "capture"):
    root = trainer.prepare_dataset(datasetId)
    cls_file = root / "classes.txt"
    names = [line.strip() for line in cls_file.read_text(encoding="utf-8").splitlines() if line.strip()] if cls_file.exists() else trainer.COCO_NAMES
    return {"datasetId": datasetId, "classes": names}


@app.get("/api/dataset/analyze")
def analyze_dataset(datasetId: str = "capture"):
    return dataset_manager.analyze(datasetId)


@app.get("/api/dataset/raw")
def list_raw_datasets():
    return {"datasets": dataset_manager.raw_datasets(), "root": str(dataset_manager.RAW_DIR)}


@app.post("/api/dataset/import-dir")
def import_dataset_dir(req: DatasetImportRequest):
    try:
        return dataset_manager.import_directory(req.datasetId, req.sourcePath, req.classes, req.valRatio)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/broker/recent")
def get_broker_events(limit: int = 50):
    return {"events": broker.recent(limit)}


@app.get("/api/active-learning")
def active_learning_status():
    return active_learning.stats()


@app.post("/api/dataset/synthesize")
def synthesize(datasetId: str = "capture", copies: int = 3):
    return synthesis.synthesize(datasetId, copies)


@app.post("/api/model/set")
def model_set(model: str = "yolov8s.pt", runtime: str | None = None):
    yolo_detector.set_pretrained_model(model)
    if runtime:
        yolo_detector.set_runtime(runtime)
    return {
        "model": yolo_detector.active_model_info(),
        "runtime": runtime or yolo_detector._runtime,
    }


@app.post("/api/model/use")
def model_use(pretrained: bool = True):
    if pretrained:
        from pathlib import Path as _Path

        yolo_detector.use_model(str(_Path(yolo_detector.MODEL_PATH)))
    else:
        yolo_detector.use_model(str(trainer.CUSTOM_MODEL))
    return yolo_detector.active_model_info()
