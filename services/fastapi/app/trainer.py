"""YOLO 커스텀 학습 파이프라인.

- 감지 결과를 YOLO 라벨로 저장해 데이터셋을 만든다.
- 업로드/수집된 데이터셋으로 미세조정(fine-tuning)을 실행한다.
- 학습 완료 모델을 감지기에 즉시 적용한다.
"""
from __future__ import annotations

import shutil
import threading
import time
from pathlib import Path
from typing import Any

MODEL_DIR = Path(__file__).resolve().parents[2] / ".models"
DATASET_DIR = MODEL_DIR / "datasets"
TRAIN_DIR = MODEL_DIR / "train"
CUSTOM_MODEL = MODEL_DIR / "custom.pt"
DATASET_DIR.mkdir(parents=True, exist_ok=True)
TRAIN_DIR.mkdir(parents=True, exist_ok=True)

STATE: dict[str, Any] = {
    "status": "idle",
    "progress": 0,
    "epoch": 0,
    "totalEpochs": 0,
    "message": "학습 대기 중",
    "modelPath": None,
    "error": None,
    "datasetId": None,
    "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
}
_lock = threading.Lock()


COCO_NAMES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
    "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop",
    "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush",
]


def _update(**kwargs: Any) -> None:
    with _lock:
        STATE.update(kwargs)
        STATE["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def status() -> dict[str, Any]:
    with _lock:
        return dict(STATE)


def prepare_dataset(dataset_id: str, classes: list[str] | None = None) -> Path:
    """데이터셋 폴더에 data.yaml 이 없으면 자동 생성한다."""
    root = DATASET_DIR / dataset_id
    (root / "images" / "train").mkdir(parents=True, exist_ok=True)
    (root / "labels" / "train").mkdir(parents=True, exist_ok=True)
    class_file = root / "classes.txt"
    if classes is not None:
        class_file.write_text("\n".join(classes), encoding="utf-8")
    if class_file.exists():
        names = [line.strip() for line in class_file.read_text(encoding="utf-8").splitlines() if line.strip()]
    else:
        names = classes or COCO_NAMES
    yaml_path = root / "data.yaml"
    if not yaml_path.exists():
        val = "images/train" if not (root / "images" / "val").exists() else "images/val"
        yaml_path.write_text(
            f"path: {root.as_posix()}\ntrain: images/train\nval: {val}\n"
            f"nc: {len(names)}\nnames: {names}\n",
            encoding="utf-8",
        )
    return root


def import_zip(dataset_id: str, data: bytes) -> dict[str, Any]:
    """외부 데이터셋 ZIP(images/, labels/, classes.txt)을 가져온다."""
    import io
    import zipfile

    root = DATASET_DIR / dataset_id
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for member in archive.namelist():
            if member.startswith("/") or ".." in member:
                continue
            archive.extract(member, root)
    prepare_dataset(dataset_id)
    images = len(list((root / "images").rglob("*.*")))
    labels = len(list((root / "labels").rglob("*.txt")))
    return {"datasetId": dataset_id, "images": images, "labels": labels}


def save_capture(dataset_id: str, image_bytes: bytes, detections: list[dict], image_name: str) -> int:
    """감지 결과를 YOLO 라벨(txt)로 저장한다. 저장된 라벨 수를 반환."""
    from PIL import Image

    root = prepare_dataset(dataset_id)
    img_dir = root / "images" / "train"
    lbl_dir = root / "labels" / "train"
    stem = Path(image_name).stem
    idx = len(list(img_dir.glob(f"{stem}*")))
    name = f"{stem}_{idx}" if idx else stem
    img = Image.open(__import__("io").BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    img.save(img_dir / f"{name}.jpg", quality=90)

    class_file = root / "classes.txt"
    names = (
        [line.strip() for line in class_file.read_text(encoding="utf-8").splitlines() if line.strip()]
        if class_file.exists() else COCO_NAMES
    )
    lines = []
    for det in detections:
        label = det.get("label") or det.get("labelKo") or ""
        from . import yolo_detector

        reverse = {v: k for k, v in yolo_detector.KOREAN_LABEL.items()}
        name = reverse.get(label, label)
        try:
            cls = names.index(name)
        except ValueError:
            try:
                cls = names.index(label)
            except ValueError:
                continue
        bbox = det["bbox"]
        cx = (bbox["x"] + bbox["w"] / 2) / 100
        cy = (bbox["y"] + bbox["h"] / 2) / 100
        bw = bbox["w"] / 100
        bh = bbox["h"] / 100
        lines.append(f"{cls} {cx:.5f} {cy:.5f} {bw:.5f} {bh:.5f}")
    (lbl_dir / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8")
    return len(lines)


def start_training(
    dataset_id: str,
    epochs: int = 30,
    imgsz: int = 640,
    batch: int = 8,
    base_model: str = "yolov8n.pt",
    augmentation: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if STATE["status"] == "running":
        return status()
    root = prepare_dataset(dataset_id)
    data_yaml = root / "data.yaml"
    if not data_yaml.exists():
        return {**status(), "status": "error", "error": "data.yaml not found"}

    _update(
        status="running",
        progress=0,
        epoch=0,
        totalEpochs=epochs,
        message="학습 시작",
        error=None,
        datasetId=dataset_id,
    )

    def run() -> None:
        try:
            from ultralytics import YOLO

            model = YOLO(base_model)
            run_name = f"run_{int(time.time())}"

            def on_epoch_end(trainer):
                epoch = int(trainer.epoch) + 1
                _update(
                    epoch=epoch,
                    progress=min(1.0, epoch / max(epochs, 1)),
                    message=f"에포크 {epoch}/{epochs} 학습 중",
                )

            model.add_callback("on_train_epoch_end", on_epoch_end)
            aug = augmentation or {}
            model.train(
                data=str(data_yaml),
                epochs=epochs,
                imgsz=imgsz,
                batch=batch,
                device="cuda" if __import__("torch").cuda.is_available() else "cpu",
                project=str(TRAIN_DIR),
                name=run_name,
                exist_ok=True,
                verbose=False,
                # 다양한 사물/각도/조명에 대한 일반화 성능을 높이는 증강 옵션
                fliplr=float(aug.get("fliplr", 0.5)),
                flipud=float(aug.get("flipud", 0.1)),
                mosaic=float(aug.get("mosaic", 1.0)),
                mixup=float(aug.get("mixup", 0.1)),
                hsv_h=float(aug.get("hsvH", 0.015)),
                hsv_s=float(aug.get("hsvS", 0.7)),
                hsv_v=float(aug.get("hsvV", 0.4)),
                degrees=float(aug.get("degrees", 5.0)),
                scale=float(aug.get("scale", 0.5)),
            )
            best = TRAIN_DIR / run_name / "weights" / "best.pt"
            if best.exists():
                shutil.copy2(best, CUSTOM_MODEL)
                class_file = root / "classes.txt"
                trained_names = (
                    [line.strip() for line in class_file.read_text(encoding="utf-8").splitlines() if line.strip()]
                    if class_file.exists() else COCO_NAMES
                )
                (CUSTOM_MODEL.parent / "custom_names.json").write_text(
                    __import__("json").dumps(trained_names), encoding="utf-8"
                )
                from . import yolo_detector, onnx_detector

                yolo_detector.use_model(str(CUSTOM_MODEL), list(trained_names))
                try:
                    onnx_detector.ensure_onnx(str(CUSTOM_MODEL), 320)
                except Exception:
                    pass  # ONNX 변환 실패 시 PyTorch 경로 사용
            _update(
                status="completed",
                progress=1,
                message="학습 완료 · 커스텀 모델 적용됨",
                modelPath=str(CUSTOM_MODEL) if best.exists() else None,
            )
        except Exception as exc:  # noqa: BLE001
            _update(status="error", error=str(exc), message="학습 실패")

    threading.Thread(target=run, daemon=True).start()
    return status()
