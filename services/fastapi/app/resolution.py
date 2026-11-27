"""해상도 대응 추론: 다중 스케일 앙상블 + 타일 분할 추론."""
from __future__ import annotations

from typing import Any, Callable

import cv2
import numpy as np

DetectFn = Callable[..., list[dict[str, Any]]]

_settings: dict[str, Any] = {"mode": "multiscale", "scales": [320, 640]}


def configure(config: dict[str, Any]) -> None:
    _settings["mode"] = config.get("resolutionMode", {}).get("value", "multiscale")
    scales = config.get("scales", {}).get("value", [320, 640])
    _settings["scales"] = [int(s) for s in scales] if isinstance(scales, list) else [320, 640]


def settings() -> dict[str, Any]:
    return dict(_settings)


def _bbox_xyxy(det: dict[str, Any]) -> tuple[float, float, float, float]:
    b = det["bbox"]
    return b["x"], b["y"], b["x"] + b["w"], b["y"] + b["h"]


def _fuse(detections: list[dict[str, Any]], nms: float) -> list[dict[str, Any]]:
    if not detections:
        return []
    detections = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    rects = [_bbox_xyxy(d) for d in detections]
    x1 = [r[0] for r in rects]; y1 = [r[1] for r in rects]
    x2 = [r[2] for r in rects]; y2 = [r[3] for r in rects]
    boxes = [[a, b, c - a, d - b] for a, b, c, d in zip(x1, y1, x2, y2)]
    confs = [d["confidence"] for d in detections]
    idx = cv2.dnn.NMSBoxes(boxes, confs, 0.25, nms)
    if len(idx) == 0:
        return []
    return [detections[int(i)] for i in np.array(idx).flatten()]


def detect(
    image: np.ndarray,
    detect_fn: DetectFn,
    threshold: float,
    nms: float,
    model_path: str,
) -> list[dict[str, Any]]:
    mode = _settings["mode"]
    scales = _settings["scales"] or [320]
    if mode == "single":
        return detect_fn(image, threshold, imgsz=scales[0], model_path=model_path, nms=nms)

    if mode == "tiled":
        h, w = image.shape[:2]
        results: list[dict[str, Any]] = []
        for gy in range(2):
            for gx in range(2):
                tile = image[gy * h // 2:(gy + 1) * h // 2, gx * w // 2:(gx + 1) * w // 2]
                if tile.size == 0:
                    continue
                for det in detect_fn(tile, threshold, imgsz=320, model_path=model_path, nms=nms):
                    b = det["bbox"]
                    b = dict(b)
                    b["x"] = (b["x"] / 100 * tile.shape[1] + gx * w // 2) / w * 100
                    b["y"] = (b["y"] / 100 * tile.shape[0] + gy * h // 2) / h * 100
                    b["w"] = b["w"] / 100 * tile.shape[1] / w * 100
                    b["h"] = b["h"] / 100 * tile.shape[0] / h * 100
                    results.append({**det, "bbox": b})
        return _fuse(results, nms)

    # multiscale: 각 스케일에서 추론 후 좌표를 원본 비율로 통합
    results = []
    for scale in scales:
        results.extend(detect_fn(image, threshold, imgsz=int(scale), model_path=model_path, nms=nms))
    return _fuse(results, nms)
