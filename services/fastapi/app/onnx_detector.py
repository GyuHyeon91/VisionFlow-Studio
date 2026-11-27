"""ONNX Runtime 기반 고속 YOLO 추론.

- PyTorch/Ultralytics 오버헤드를 제거해 프레임 지연을 크게 줄인다.
- GPU(CUDAExecutionProvider)가 있으면 자동 사용, 없으면 CPU.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import cv2
import numpy as np

MODEL_DIR = Path(__file__).resolve().parents[2] / ".models"
# 입력 크기별로 세션을 캐시한다. 크기를 오갈 때마다 세션을 새로 만들면
# 실시간 추적 지연이 수백 ms까지 늘어난다.
_sessions: dict[str, tuple[Any, str]] = {}
_names: list[str] = []
_active_onnx: str | None = None


def _coco_names() -> list[str]:
    import json

    custom = MODEL_DIR / "custom_names.json"
    if _active_onnx and "custom" in _active_onnx and custom.exists():
        try:
            return json.loads(custom.read_text(encoding="utf-8"))
        except Exception:
            pass
    try:
        from .trainer import COCO_NAMES

        return COCO_NAMES
    except Exception:
        return [f"class_{i}" for i in range(80)]


def ensure_onnx(model_path: str, imgsz: int = 320) -> str:
    """モデル을 ONNX로 내보내고 경로를 반환한다."""
    global _active_onnx
    src = Path(model_path)
    # 입력 크기별 모델을 별도 저장 (정적 ONNX 형상 대응)
    onnx_path = src.with_name(f"{src.stem}_{imgsz}.onnx")
    if not onnx_path.exists():
        from ultralytics import YOLO

        import shutil

        YOLO(str(src)).export(format="onnx", imgsz=imgsz, simplify=True, verbose=False)
        # Ultralytics는 항상 <model>.onnx 로 내보내므로 원하는 크기별 파일로 복사
        default_out = src.with_suffix(".onnx")
        if default_out.exists() and default_out.resolve() != onnx_path.resolve():
            shutil.copy2(default_out, onnx_path)
    _active_onnx = str(onnx_path)
    return str(onnx_path)


def get_session(path: str):
    global _names
    cached = _sessions.get(path)
    if cached is not None:
        return cached
    import onnxruntime as ort

    available = ort.get_available_providers()
    providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if "CUDAExecutionProvider" in available else ["CPUExecutionProvider"]
    options = ort.SessionOptions()
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    options.intra_op_num_threads = max(1, min(8, os.cpu_count() or 4))
    session = ort.InferenceSession(path, sess_options=options, providers=providers)
    input_name = session.get_inputs()[0].name
    _sessions[path] = (session, input_name)
    _names = _coco_names()
    return _sessions[path]


def letterbox(image: np.ndarray, imgsz: int):
    h, w = image.shape[:2]
    scale = min(imgsz / w, imgsz / h)
    nw, nh = int(round(w * scale)), int(round(h * scale))
    resized = cv2.resize(image, (nw, nh), interpolation=cv2.INTER_LINEAR)
    canvas = np.full((imgsz, imgsz, 3), 114, dtype=np.uint8)
    px = (imgsz - nw) // 2
    py = (imgsz - nh) // 2
    canvas[py:py + nh, px:px + nw] = resized
    x = canvas.astype(np.float32) / 255.0
    x = np.transpose(x, (2, 0, 1))[None, ...]
    return np.ascontiguousarray(x), scale, px, py


def detect(image: np.ndarray, threshold: float = 0.5, imgsz: int = 320, model_path: str | None = None, nms: float = 0.45) -> list[dict[str, Any]]:
    path = ensure_onnx(model_path or str(MODEL_DIR / "yolov8n.pt"), imgsz)
    session, input_name = get_session(path)
    x, scale, px, py = letterbox(image, imgsz)
    out = session.run(None, {input_name: x})[0][0]  # [84, N]
    boxes = out[:4, :]
    cls_scores = out[4:, :]
    cls_ids = np.argmax(cls_scores, axis=0)
    confs = cls_scores[cls_ids, np.arange(cls_scores.shape[1])]
    keep = confs >= threshold
    boxes, confs, cls_ids = boxes[:, keep], confs[keep], cls_ids[keep]
    if boxes.shape[1] == 0:
        return []

    cx, cy, bw, bh = boxes
    x1 = cx - bw / 2
    y1 = cy - bh / 2
    x2 = cx + bw / 2
    y2 = cy + bh / 2
    # letterbox 좌표 → 원본 이미지 좌표
    x1 = np.clip((x1 - px) / scale, 0, image.shape[1])
    y1 = np.clip((y1 - py) / scale, 0, image.shape[0])
    x2 = np.clip((x2 - px) / scale, 0, image.shape[1])
    y2 = np.clip((y2 - py) / scale, 0, image.shape[0])

    rects = [[float(a), float(b), float(c - a), float(d - b)] for a, b, c, d in zip(x1, y1, x2, y2)]
    indices = cv2.dnn.NMSBoxes(rects, confs.tolist(), threshold, nms)
    if len(indices) == 0:
        return []
    indices = np.array(indices).flatten()

    from .yolo_detector import CLASS_KIND, KOREAN_LABEL

    results = []
    for i in indices:
        name = _names[int(cls_ids[i])] if int(cls_ids[i]) < len(_names) else "object"
        rx, ry, rw, rh = rects[i]
        results.append({
            "label": KOREAN_LABEL.get(name, name),
            "labelKo": KOREAN_LABEL.get(name, name),
            "kind": CLASS_KIND.get(name, "object"),
            "confidence": round(float(confs[i]), 3),
            "bbox": {
                "x": round(rx / image.shape[1] * 100, 2),
                "y": round(ry / image.shape[0] * 100, 2),
                "w": round(rw / image.shape[1] * 100, 2),
                "h": round(rh / image.shape[0] * 100, 2),
            },
        })
    return results


def runtime_info() -> dict[str, Any]:
    import onnxruntime as ort

    return {
        "providers": ort.get_available_providers(),
        "active": _active_onnx,
        "device": "cuda" if "CUDAExecutionProvider" in ort.get_available_providers() else "cpu",
    }
