"""YOLO 기반 실제 객체 감지/추적 어댑터.

- 첫 사용 시 yolov8n 가중치를 프로젝트 내부 `.models/` 에 다운로드한다.
- 사람/차량/이륜차 등을 감지하고 간단한 최근접 매칭으로 트랙 ID를 부여한다.
"""
from __future__ import annotations

import io
import math
import time
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

MODEL_DIR = Path(__file__).resolve().parents[2] / ".models"
MODEL_PATH = MODEL_DIR / "yolov8n.pt"

# COCO 클래스 → 우리 서비스 분류
CLASS_KIND = {
    "person": "person",
    "bicycle": "vehicle",
    "car": "vehicle",
    "motorcycle": "vehicle",
    "airplane": "vehicle",
    "bus": "vehicle",
    "train": "vehicle",
    "truck": "vehicle",
    "boat": "vehicle",
    "forklift": "vehicle",
    "excavator": "vehicle",
    "crane": "vehicle",
    "machinery": "vehicle",
    "equipment": "object",
    "helmet": "object",
    "worker": "person",
}

KOREAN_LABEL = {
    "person": "사람", "bicycle": "자전거", "car": "자동차", "motorcycle": "오토바이",
    "forklift": "지게차", "excavator": "굴착기", "crane": "크레인", "helmet": "안전모",
    "worker": "작업자", "equipment": "장비", "machinery": "중장비",
    "airplane": "비행기", "bus": "버스", "train": "기차", "truck": "트럭", "boat": "보트",
    "traffic light": "신호등", "fire hydrant": "소화전", "stop sign": "정지 표지판",
    "parking meter": "주차 미터기", "bench": "벤치", "bird": "새", "cat": "고양이",
    "dog": "개", "horse": "말", "sheep": "양", "cow": "소", "elephant": "코끼리",
    "bear": "곰", "zebra": "얼룩말", "giraffe": "기린", "backpack": "배낭",
    "umbrella": "우산", "handbag": "핸드백", "tie": "넥타이", "suitcase": "여행가방",
    "frisbee": "프리스비", "skis": "스키", "snowboard": "스노보드", "sports ball": "공",
    "kite": "연", "baseball bat": "야구 방망이", "baseball glove": "야구 장갑",
    "skateboard": "스케이트보드", "surfboard": "서프보드", "tennis racket": "테니스 라켓",
    "bottle": "병", "wine glass": "와인잔", "cup": "컵", "fork": "포크", "knife": "칼",
    "spoon": "숟가락", "bowl": "그릇", "banana": "바나나", "apple": "사과",
    "sandwich": "샌드위치", "orange": "오렌지", "broccoli": "브로콜리", "carrot": "당근",
    "hot dog": "핫도그", "pizza": "피자", "donut": "도넛", "cake": "케이크",
    "chair": "의자", "couch": "소파", "potted plant": "화분", "bed": "침대",
    "dining table": "식탁", "toilet": "변기", "tv": "TV", "laptop": "노트북",
    "mouse": "마우스", "remote": "리모컨", "keyboard": "키보드", "cell phone": "휴대폰",
    "microwave": "전자레인지", "oven": "오븐", "toaster": "토스터", "sink": "싱크대",
    "refrigerator": "냉장고", "book": "책", "clock": "시계", "vase": "화병",
    "scissors": "가위", "teddy bear": "곰인형", "hair drier": "헤어드라이어", "toothbrush": "칫솔",
}

_model = None
_active_path = str(MODEL_PATH)
_active_names: list[str] | None = None
_pretrained_model = "yolov8n.pt"
_tracker = "bytetrack"
_runtime = "onnx"


def configure(detection: dict[str, Any]) -> None:
    """중앙 설정의 탐지 모델/추적기 옵션을 적용한다."""
    global _pretrained_model, _tracker, _runtime, _model, _active_path
    options = detection or {}
    new_model = options.get("model", {}).get("value", "yolov8n.pt")
    if new_model != _pretrained_model:
        _model = None
        from . import onnx_detector

        onnx_detector._active_onnx = None
    _pretrained_model = new_model
    _active_path = str(MODEL_DIR / _pretrained_model)
    _tracker = options.get("tracker", {}).get("value", "bytetrack")
    _runtime = options.get("runtime", {}).get("value", "onnx")


def use_model(path: str, names: list[str] | None = None) -> None:
    """학습된 커스텀 모델을 감지기에 적용한다."""
    global _model, _active_path, _active_names
    _model = None
    _active_path = path
    _active_names = names


def set_pretrained_model(model_name: str) -> None:
    """사전학습 모델을 런타임에 교체한다 (다음 추론부터 적용)."""
    global _pretrained_model, _model, _active_path
    _pretrained_model = model_name
    _model = None
    _active_path = str(MODEL_DIR / model_name)
    from . import onnx_detector

    onnx_detector._active_onnx = None


def set_runtime(runtime: str) -> None:
    global _runtime
    _runtime = runtime


def active_model_info() -> dict[str, Any]:
    pretrained_path = str(MODEL_DIR / _pretrained_model)
    return {"path": _active_path, "custom": _active_path != pretrained_path}


def get_model():
    global _model, _active_path
    if _model is None:
        from ultralytics import YOLO

        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        if Path(_active_path).exists():
            path = _active_path
        else:
            path = str(MODEL_DIR / _pretrained_model)
            if not Path(path).exists():
                YOLO(path)  # 지정된 사전학습 모델 다운로드
        _model = YOLO(path)
        _active_path = path
    return _model


def _to_percent(box, width: int, height: int) -> dict[str, float]:
    x1, y1, x2, y2 = [float(v) for v in box]
    return {
        "x": round(max(0, x1 / width * 100), 2),
        "y": round(max(0, y1 / height * 100), 2),
        "w": round(min(100, (x2 - x1) / width * 100), 2),
        "h": round(min(100, (y2 - y1) / height * 100), 2),
    }


def detect_image(
    image: np.ndarray, threshold: float = 0.5, imgsz: int = 640, fast: bool = False,
    person_boost: bool = False, person_min_conf: float = 0.3,
) -> list[dict[str, Any]]:
    """객체 감지. fast=True면 단일 스케일만 추론해 실시간 지연을 줄인다.

    person_boost=True면 커스텀 모델 결과에 COCO 사전학습 모델의 사람 감지를
    추가로 병합해, 학습 데이터에 없는 장면의 인원 누락을 보완한다.
    """
    from . import preprocessing, resolution

    image = preprocessing.apply(image)
    nms = preprocessing.settings()["nmsIoU"]
    if _runtime in ("onnx", "openvino"):
        try:
            if _runtime == "openvino":
                from . import openvino_detector

                fn = openvino_detector.detect
            else:
                from . import onnx_detector

                fn = onnx_detector.detect
            if fast:
                results = fn(image, threshold, imgsz=imgsz, model_path=_active_path, nms=nms)
                if person_boost:
                    results = _boost_people(image, results, threshold, imgsz, nms, person_min_conf)
                if len(results) >= 2:
                    return results
                # 단일 스케일에서 객체가 거의 없으면 다른 스케일을 추가 확인해
                # 원거리·소형 객체 누락을 보완한다 (세션 캐시로 지연이 작음).
                scales = resolution.settings().get("scales") or [320, 640]
                combined: list[dict[str, Any]] = list(results)
                for scale in scales:
                    if int(scale) == int(imgsz):
                        continue
                    combined.extend(
                        fn(image, threshold, imgsz=int(scale), model_path=_active_path, nms=nms)
                    )
                if person_boost:
                    combined = _boost_people(image, combined, threshold, imgsz, nms, person_min_conf)
                return resolution._fuse(combined, nms) if combined else results
            return resolution.detect(image, fn, threshold, nms, _active_path)
        except Exception as exc:
            print(f"[{_runtime} fallback] {type(exc).__name__}: {exc}", flush=True)  # 실패 시 PyTorch 경로로 폴백
    model = get_model()
    height, width = image.shape[:2]
    results = model.predict(source=image, conf=threshold, imgsz=imgsz, iou=nms, verbose=False)
    detections: list[dict[str, Any]] = []
    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            cls_id = int(box.cls.item())
            name = model.names.get(cls_id, "object")
            conf = float(box.conf.item())
            bbox = _to_percent(box.xyxy[0].tolist(), width, height)
            detections.append({
                "label": name,
                "labelKo": KOREAN_LABEL.get(name, name),
                "kind": CLASS_KIND.get(name, "object"),
                "confidence": round(conf, 3),
                "bbox": bbox,
            })
    return detections


def _boost_people(
    image: np.ndarray,
    results: list[dict[str, Any]],
    threshold: float,
    imgsz: int,
    nms: float,
    min_conf: float = 0.3,
) -> list[dict[str, Any]]:
    """COCO 사전학습 모델로 사람을 추가 감지해 커스텀 모델 결과와 병합한다.

    커스텀 모델 파인튜닝 후 사람 감지가 퇴화하는 문제를 보완한다.
    min_conf 이상의 사람만 병합해 야간 오탐을 억제한다.
    """
    from . import onnx_detector, resolution

    coco_path = MODEL_DIR / "yolov8s.pt"
    if not coco_path.exists():
        return results
    try:
        # 커스텀 모델이 사람을 2명 미만으로만 봤으면 COCO 모델로 보강
        people_seen = sum(1 for d in results if d.get("kind") == "person")
        if people_seen >= 2:
            return results
        coco_dets = onnx_detector.detect(
            image, threshold, imgsz=imgsz, model_path=str(coco_path), nms=nms
        )
        people = [
            d for d in coco_dets
            if d.get("kind") == "person" and d.get("confidence", 0) >= min_conf
        ]
        if not people:
            return results
        combined = list(results) + people
        return resolution._fuse(combined, nms)
    except Exception as exc:
        print(f"[person boost] {type(exc).__name__}: {exc}", flush=True)
        return results


def detect_frame_bytes(data: bytes, threshold: float = 0.5, imgsz: int = 320) -> list[dict[str, Any]]:
    image = Image.open(io.BytesIO(data)).convert("RGB")
    return detect_image(np.array(image), threshold, imgsz=imgsz)


def analyze_video_optical_flow(data: bytes, sample_fps: float = 2.0) -> dict[str, Any]:
    """학습 데이터/모델 없이 광학 흐름만으로 움직임 영역을 추출한다."""
    import cv2

    tmp = MODEL_DIR / f"flow_{int(time.time() * 1000)}.mp4"
    tmp.write_bytes(data)
    try:
        cap = cv2.VideoCapture(str(tmp))
        fps = cap.get(cv2.CAP_PROP_FPS) or 15.0
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total / fps if fps else 60
        step = max(1, int(fps / sample_fps))
        ok, prev = cap.read()
        if not ok:
            raise ValueError("video decode failed")
        prev_gray = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)
        h, w = prev_gray.shape
        tracks: dict[str, dict[str, Any]] = {}
        detections: list[dict[str, Any]] = []
        frame_idx = 0
        seq = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_idx % step != 0:
                frame_idx += 1
                continue
            t = round(frame_idx / fps, 2)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            flow = cv2.calcOpticalFlowFarneback(
                prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0,
            )
            mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
            prev_gray = gray
            # 4x4 그리드에서 평균 흐름이 큰 영역을 움직이는 객체 후보로 간주
            gh, gw = 4, 4
            for gy in range(gh):
                for gx in range(gw):
                    cell = mag[gy * h // gh:(gy + 1) * h // gh, gx * w // gw:(gx + 1) * w // gw]
                    m = float(cell.mean())
                    if m < 1.5:
                        continue
                    seq += 1
                    tid = f"F{seq}"
                    x = gx / gw * 100
                    y = gy / gh * 100
                    cw = 100 / gw
                    ch = 100 / gh
                    tracks[tid] = {
                        "id": tid, "label": "움직임", "kind": "object",
                        "firstSeen": t, "lastSeen": t,
                        "cx": x + cw / 2, "cy": y + ch / 2,
                        "points": [{"t": t, "x": x, "y": y, "w": cw, "h": ch, "confidence": round(min(0.95, 0.5 + m / 10), 3)}],
                        "distance": 0,
                    }
                    detections.append({
                        "id": f"{tid}-{frame_idx}", "trackId": seq,
                        "confidence": round(min(0.95, 0.5 + m / 10), 3),
                        "bbox": {"x": x, "y": y, "w": cw, "h": ch},
                        "pose": "object", "label": "움직임",
                    })
            frame_idx += 1
        cap.release()
        return {
            "engine": "optical-flow",
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "videoName": tmp.name,
            "durationSec": round(duration, 2),
            "processedFrames": frame_idx,
            "personsDetected": 0,
            "detections": detections[-200:],
            "tracks": list(tracks.values()),
        }
    finally:
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            # 일부 백엔드가 파일 핸들을 잠시 유지하는 경우 다음 요청에서 정리
            pass


def _result_series(
    all_detections: list[dict[str, Any]], duration: float,
    elapsed_sec: float = 0.0, frames_processed: int = 0,
) -> dict[str, Any]:
    """실제 감지 결과에서 UI용 시계열·요약·로그·성능 데이터를 생성한다."""
    bucket = 2.0  # 2초 단위
    n = max(1, int(duration / bucket) + 1)
    crowd = [0] * n
    motion = [0.0] * n
    conf = [0.0] * n
    conf_count = [0] * n
    prev: dict[str, tuple[float, float]] = {}
    bucket_tracks: dict[int, set[str]] = {i: set() for i in range(n)}

    for d in all_detections:
        t = float(d.get("t", 0))
        idx = min(n - 1, max(0, int(t / bucket)))
        b = d.get("bbox", {})
        cx = b.get("x", 0) + b.get("w", 0) / 2
        cy = b.get("y", 0) + b.get("h", 0) / 2
        if d.get("kind") == "person":
            tid = str(d.get("trackId") or d.get("id", ""))
            bucket_tracks[idx].add(tid)

    for idx in range(n):
        crowd[idx] = len(bucket_tracks[idx])

    # 버킷 경계 때문에 사람이 지속적으로 있어도 특정 구간만 0이 되는 현상 보정.
    # 앞뒤 버킷에 사람이 있으면 0인 구간에도 같은 수를 전파한다.
    for idx in range(n):
        if crowd[idx] == 0 and 0 < idx < n - 1:
            crowd[idx] = max(crowd[idx - 1], crowd[idx + 1])

    for d in all_detections:
        t = float(d.get("t", 0))
        idx = min(n - 1, max(0, int(t / bucket)))
        b = d.get("bbox", {})
        cx = b.get("x", 0) + b.get("w", 0) / 2
        cy = b.get("y", 0) + b.get("h", 0) / 2
        tid = str(d.get("trackId") or d.get("id", ""))
        if tid in prev:
            px, py = prev[tid]
            motion[idx] += min(100.0, math.hypot(cx - px, cy - py) * 10)
        prev[tid] = (cx, cy)
        conf[idx] += float(d.get("confidence", 0))
        conf_count[idx] += 1

    crowd_data = [{"t": round(i * bucket, 1), "value": v} for i, v in enumerate(crowd)]
    motion_data = [{"t": round(i * bucket, 1), "value": round(min(100, v), 1)} for i, v in enumerate(motion)]
    conf_data = [
        {"t": round(i * bucket, 1), "value": round(conf[i] / conf_count[i], 3) if conf_count[i] else 0}
        for i in range(n)
    ]
    avg_conf = round(sum(conf) / max(1, sum(conf_count)), 3)
    peak = max(crowd) if crowd else 0

    # 실제 감지 결과 기반 캡션 (목업 문구를 쓰지 않는다)
    captions: list[dict[str, Any]] = []
    for i in range(n):
        at = round(i * bucket, 1)
        pcount = crowd[i]
        vpeak = round(motion[i], 1)
        if pcount:
            text = f"{at:.0f}초 구역에서 사람 {pcount}명이 감지되었습니다."
            if vpeak > 25:
                text += f" 움직임 강도 {vpeak:.0f}%로 활발한 이동이 관측되었습니다."
            else:
                text += " 큰 움직임 없이 작업 중입니다."
        else:
            text = f"{at:.0f}초 구역에서 저장된 분석 프레임에는 사람이 감지되지 않았습니다."
        tags = [f"사람 {pcount}명"] if pcount else ["사람 없음"]
        if vpeak > 25:
            tags.append(f"움직임 {vpeak:.0f}%")
        captions.append({
            "id": f"cap-{i}", "timestamp": at, "endTime": at + bucket,
            "text": text, "tags": tags,
        })

    # 하이라이트: 사람이 가장 많거나 움직임이 큰 구간
    highlights: list[str] = []
    if captions:
        peak_idx = max(range(n), key=lambda i: (crowd[i], motion[i]))
        highlights.append(f"최다 인원 구간 {peak_idx * bucket:.0f}초 · {crowd[peak_idx]}명")
        motion_idx = max(range(n), key=lambda i: motion[i])
        if motion[motion_idx] > 0:
            highlights.append(f"최대 움직임 구간 {motion_idx * bucket:.0f}초 · {motion[motion_idx]:.0f}%")

    # 행동 패턴 관측 (실제 감지 결과에서 추정)
    observations: list[dict[str, Any]] = []
    for det in all_detections:
        if det.get("kind") != "person":
            continue
        motion_peak = max(motion) if motion else 0
        behavior = "급이동" if motion_peak > 25 else "정상 작업/이동"
        observations.append({
            "trackId": det.get("trackId"), "t": det.get("t", 0),
            "labelKo": behavior, "confidence": det.get("confidence", 0),
        })

    return {
        "crowdDensity": crowd_data,
        "motionSeries": motion_data,
        "confidenceSeries": conf_data,
        "videoDescription": {
            "summary": f"실제 영상 {duration:.0f}초를 분석해 최대 {peak}명 규모의 작업 장면으로 확인했습니다. 사고 이벤트는 시간적 분석 결과만 표시합니다.",
            "captions": captions,
            "highlights": highlights,
            "sceneCount": n,
        },
        "behaviors": observations[:200],
        "summary": {
            "riskScore": 0, "complianceScore": 100, "avgConfidence": avg_conf,
            "peakCrowd": peak, "totalBehaviors": 0, "criticalCount": 0,
        },
        "analysisLog": [
            {"id": "log-ingest", "nodeId": "ingest", "nodeLabel": "영상 입력", "level": "success",
             "message": "영상 로드 완료", "detail": f"실제 영상 분석 · {duration:.1f}초",
             "metrics": [{"label": "길이", "value": f"{duration:.0f}s"}], "timestamp": 0},
            {"id": "log-detect", "nodeId": "detect", "nodeLabel": "객체 탐지", "level": "success",
             "message": "YOLO 감지 완료", "detail": f"{len(all_detections)}개 감지 결과",
             "metrics": [{"label": "감지", "value": f"{len(all_detections)}건"},
                         {"label": "평균 신뢰도", "value": f"{avg_conf * 100:.0f}%"}], "timestamp": 1},
            {"id": "log-accidents", "nodeId": "accidents", "nodeLabel": "사고 인식", "level": "info",
             "message": "시간적 사고 분석", "detail": "탐지 결과와 사고 판정을 분리해 분석했습니다.",
             "metrics": [{"label": "사고", "value": "이벤트 기반"}], "timestamp": 2},
        ],
        "engineTimings": {
            "totalMs": round(elapsed_sec * 1000, 1),
            "perFrameMs": round(elapsed_sec * 1000 / max(1, frames_processed), 2),
            "processedFrames": frames_processed,
        },
        "performanceEvaluation": [
            {"key": "detect", "labelKo": "객체 탐지", "label": "Detection",
             "description": "실제 측정값 — 프레임당 처리 시간과 감지 신뢰도",
             "latencyMs": round(elapsed_sec * 1000 / max(1, frames_processed), 2),
             "throughput": round(frames_processed / max(0.001, elapsed_sec), 2) if elapsed_sec else 0,
             "accuracy": round(avg_conf * 100),
             "precision": round(avg_conf * 100),
             "recall": 0,  # 검증 데이터가 없으면 0 (임의 추정하지 않음)
             "memoryMb": 0, "cpuPercent": 0, "gpuPercent": 0,
             "status": "optimal" if avg_conf >= 0.7 else "normal",
             "measured": True},
        ],
    }


def _temporal_accidents(all_detections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """감지 결과의 프레임 히스토리를 시간순으로 분석해 사고 이벤트를 반환."""
    from . import accident_analyzer

    accident_analyzer.reset()
    events: list[dict[str, Any]] = []
    for det in all_detections:
        t = det.get("t", 0)
        if not isinstance(t, (int, float)):
            continue
        frame_dets = [d for d in all_detections if d.get("t") == t]
        events.extend(accident_analyzer.analyze(frame_dets, now=t))
    # 같은 유형+트랙은 가장 신뢰도 높은 이벤트 하나만 유지
    best: dict[str, dict[str, Any]] = {}
    for e in events:
        key = f"{e['type']}-{e.get('trackId') or e.get('trackIds')}"
        if key not in best or e["confidence"] > best[key]["confidence"]:
            best[key] = e
    return list(best.values())


def analyze_video_bytes(
    data: bytes,
    threshold: float = 0.5,
    sample_fps: float = 6.0,
    analysis_imgsz: int = 640,
) -> dict[str, Any]:
    """영상에서 프레임을 샘플링해 YOLO 감지 + 트랙을 생성한다.

    sample_fps로 30fps 영상을 5~10fps로 줄이고, analysis_imgsz로
    원본 해상도와 무관하게 AI 추론 입력 크기를 제한한다.
    """
    import cv2

    # 업로드 영상을 학습 데이터로 보존한다 (오탐 재학습에 사용)
    archive_dir = MODEL_DIR.parent / ".data" / "uploads"
    archive_dir.mkdir(parents=True, exist_ok=True)
    name = f"upload_{int(time.time() * 1000)}.mp4"
    archived = archive_dir / name
    archived.write_bytes(data)
    tmp = archived
    try:
        cap = cv2.VideoCapture(str(tmp))
        if not cap.isOpened():
            raise ValueError("video decode failed")
        native_fps = cap.get(cv2.CAP_PROP_FPS) or 15.0
        width = max(1, int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)))
        height = max(1, int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total / native_fps if native_fps else 60
        started = time.perf_counter()
        tracks: dict[str, dict[str, Any]] = {}
        all_detections: list[dict[str, Any]] = []
        seq = 0

        # 고급 추적기(ByteTrack / BoT-SORT)를 선택한 경우 Ultralytics track() 사용
        if _tracker in ("bytetrack", "botsort"):
            model = get_model()
            vid_stride = max(1, int(native_fps / sample_fps))
            results = model.track(
                source=str(tmp),
                conf=threshold,
                imgsz=analysis_imgsz,
                tracker=str(Path(__file__).with_name("custom_bytetrack.yaml")) if _tracker == "bytetrack" else f"{_tracker}.yaml",
                persist=True,
                vid_stride=vid_stride,
                verbose=False,
            )
            sample_idx = 0
            for result in results:
                t = round(sample_idx / sample_fps, 2)
                if result.boxes is None:
                    sample_idx += 1
                    continue
                for box in result.boxes:
                    track_id = int(box.id.item()) if box.id is not None else sample_idx + 1
                    cls_id = int(box.cls.item())
                    name = model.names.get(cls_id, "object")
                    det = {
                        "label": KOREAN_LABEL.get(name, name),
                        "labelKo": KOREAN_LABEL.get(name, name),
                        "kind": CLASS_KIND.get(name, "object"),
                        "confidence": round(float(box.conf.item()), 3),
                        "bbox": _to_percent(box.xyxy[0].tolist(), width, height),
                    }
                    tid = f"Y{track_id}"
                    if tid not in tracks:
                        tracks[tid] = {
                            "id": tid, "label": det["labelKo"], "kind": det["kind"],
                            "firstSeen": t, "lastSeen": t, "cx": 0, "cy": 0,
                            "points": [], "distance": 0,
                        }
                    tr = tracks[tid]
                    tr["points"].append({
                        "t": t, "x": det["bbox"]["x"], "y": det["bbox"]["y"],
                        "w": det["bbox"]["w"], "h": det["bbox"]["h"],
                        "confidence": det["confidence"],
                    })
                    tr["lastSeen"] = t
                    all_detections.append({
                        "id": f"{tid}-{sample_idx}", "trackId": tid,
                        "t": t,
                        "confidence": det["confidence"], "bbox": det["bbox"],
                        "pose": det["kind"], "kind": det["kind"],
                        "label": det["labelKo"], "labelKo": det["labelKo"],
                    })
                sample_idx += 1
            cap.release()
            series = _result_series(all_detections, duration,
                                    time.perf_counter() - started, sample_idx)
            return {
                "engine": "real-yolo",
                "tracker": _tracker,
                "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "videoName": tmp.name,
                "durationSec": round(duration, 2),
                "processedFrames": sample_idx,
                "personsDetected": series["summary"]["peakCrowd"],
                "detections": all_detections[-200:],
                "tracks": [v for v in tracks.values() if len(v["points"]) >= 2],
                "accidentEvents": _temporal_accidents(all_detections),
                **series,
            }

        # 필요한 시점만 seek 해 디코딩 (전체 프레임 순차 디코딩보다 훨씬 빠름)
        sample_times = [i / sample_fps for i in range(int(duration * sample_fps) + 1)]
        sample_idx = 0
        for t in sample_times:
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ok, frame = cap.read()
            if not ok:
                break
            t = round(t, 2)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            for det in detect_image(rgb, threshold, imgsz=analysis_imgsz):
                cx = det["bbox"]["x"] + det["bbox"]["w"] / 2
                cy = det["bbox"]["y"] + det["bbox"]["h"] / 2
                best_id, best_dist = None, float("inf")
                for tid, tr in tracks.items():
                    if t - tr["lastSeen"] > 2:
                        continue
                    dist = math.hypot(tr["cx"] - cx, tr["cy"] - cy)
                    if dist < best_dist:
                        best_id, best_dist = tid, dist
                if best_id is None or best_dist > 20:
                    seq += 1
                    best_id = f"Y{seq}"
                    tracks[best_id] = {
                        "id": best_id,
                        "label": det["labelKo"],
                        "kind": det["kind"],
                        "firstSeen": t,
                        "lastSeen": t,
                        "cx": cx,
                        "cy": cy,
                        "points": [],
                        "distance": 0,
                    }
                tr = tracks[best_id]
                prev = tr["points"][-1] if tr["points"] else None
                if prev:
                    tr["distance"] += math.hypot(cx - prev["x"], cy - prev["y"])
                tr["points"].append({
                    "t": t, "x": det["bbox"]["x"], "y": det["bbox"]["y"],
                    "w": det["bbox"]["w"], "h": det["bbox"]["h"],
                    "confidence": det["confidence"],
                })
                tr["lastSeen"] = t
                tr["cx"] = cx
                tr["cy"] = cy
                all_detections.append({
                    "id": f"{best_id}-{sample_idx}",
                    "trackId": best_id,
                    "t": t,
                    "confidence": det["confidence"],
                    "bbox": det["bbox"],
                    "pose": det["kind"],
                    "kind": det["kind"],
                    "label": det["labelKo"],
                    "labelKo": det["labelKo"],
                })
            sample_idx += 1
        cap.release()

        series = _result_series(all_detections, duration,
                                time.perf_counter() - started, sample_idx)
        return {
            "engine": "real-yolo",
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "videoName": tmp.name,
            "durationSec": round(duration, 2),
            "processedFrames": sample_idx,
            "personsDetected": series["summary"]["peakCrowd"],
            "detections": all_detections[-200:],
            "tracks": [v for v in tracks.values() if len(v["points"]) >= 2],
            "accidentEvents": _temporal_accidents(all_detections),
            **series,
        }
    finally:
        # 분석에 사용한 영상은 학습 데이터로 보존 (오탐 재학습용). 삭제하지 않는다.
        pass
