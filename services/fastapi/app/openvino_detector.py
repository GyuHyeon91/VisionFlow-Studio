"""OpenVINO 런타임 추론 (Intel CPU/iGPU 최적화, 무료)."""
from __future__ import annotations

from typing import Any

import cv2
import numpy as np

from . import onnx_detector

_core = None
# 모델 경로(입력 크기별 ONNX)마다 컴파일 결과를 캐시한다.
# 기존에는 크기가 바뀔 때마다 재컴파일해 프레임당 1초 이상 지연이 발생했다.
_compiled: dict[str, Any] = {}


def _get_compiled(path: str):
    global _core
    cached = _compiled.get(path)
    if cached is not None:
        return cached
    import openvino as ov

    if _core is None:
        _core = ov.Core()
    model = _core.read_model(path)
    compiled = _core.compile_model(model, "CPU")
    _compiled[path] = compiled
    return compiled


def detect(image: np.ndarray, threshold: float = 0.5, imgsz: int = 320, model_path: str | None = None, nms: float = 0.45) -> list[dict[str, Any]]:
    from pathlib import Path

    src = model_path or str(onnx_detector.MODEL_DIR / "yolov8n.pt")
    onnx_path = onnx_detector.ensure_onnx(src, imgsz)
    compiled = _get_compiled(onnx_path)
    x, scale, px, py = onnx_detector.letterbox(image, imgsz)
    outputs = compiled([x])
    out = list(outputs.values())[0][0]
    boxes = out[:4, :]
    cls_scores = out[4:, :]
    cls_ids = np.argmax(cls_scores, axis=0)
    confs = cls_scores[cls_ids, np.arange(cls_scores.shape[1])]
    keep = confs >= threshold
    boxes, confs, cls_ids = boxes[:, keep], confs[keep], cls_ids[keep]
    if boxes.shape[1] == 0:
        return []
    cx, cy, bw, bh = boxes
    x1 = np.clip((cx - bw / 2 - px) / scale, 0, image.shape[1])
    y1 = np.clip((cy - bh / 2 - py) / scale, 0, image.shape[0])
    x2 = np.clip((cx + bw / 2 - px) / scale, 0, image.shape[1])
    y2 = np.clip((cy + bh / 2 - py) / scale, 0, image.shape[0])
    rects = [[float(a), float(b), float(c - a), float(d - b)] for a, b, c, d in zip(x1, y1, x2, y2)]
    idx = cv2.dnn.NMSBoxes(rects, confs.tolist(), threshold, nms)
    if len(idx) == 0:
        return []
    from .yolo_detector import CLASS_KIND, KOREAN_LABEL

    names = onnx_detector._coco_names()
    results = []
    for i in np.array(idx).flatten():
        name = names[int(cls_ids[i])] if int(cls_ids[i]) < len(names) else "object"
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
    return {"active": _active, "device": "CPU", "backend": "OpenVINO"}
