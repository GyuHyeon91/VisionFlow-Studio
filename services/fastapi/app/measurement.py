"""사물 측정: 상대 크기 + 기준물 보정 + 깊이 추정 기반 실측 근사치."""
from __future__ import annotations

import math
from typing import Any

import numpy as np


def _median_disparity(disparity: np.ndarray, det: dict, width: int, height: int) -> float:
    # 깊이 맵 해상도(예: 256×256)에 맞춰 BBox 비율 좌표를 스케일링한다.
    dh, dw = disparity.shape[:2]
    x1 = max(0, min(dw - 1, int(det["bbox"]["x"] / 100 * dw)))
    y1 = max(0, min(dh - 1, int(det["bbox"]["y"] / 100 * dh)))
    x2 = max(x1 + 1, min(dw, int((det["bbox"]["x"] + det["bbox"]["w"]) / 100 * dw)))
    y2 = max(y1 + 1, min(dh, int((det["bbox"]["y"] + det["bbox"]["h"]) / 100 * dh)))
    crop = disparity[y1:max(y1 + 1, y2), x1:max(x1 + 1, x2)]
    return float(np.median(crop)) if crop.size else 1.0


def measure_objects(
    detections: list[dict[str, Any]],
    image_width: int,
    image_height: int,
    config: dict[str, Any],
    disparity: np.ndarray | None = None,
) -> list[dict[str, Any]]:
    fov = float(config.get("fieldOfViewDeg", {}).get("value", 60))
    focal_px = image_width / (2 * math.tan(math.radians(fov) / 2))
    known_width_m = float(config.get("knownWidthCm", {}).get("value", 180)) / 100
    ref_type = config.get("referenceObject", {}).get("value", "car")

    reference = None
    if ref_type != "none":
        for d in detections:
            kind = d.get("kind")
            label = d.get("label")
            matched = (
                (ref_type == "car" and kind == "vehicle")
                or (ref_type == "person" and kind == "person")
                or label == ref_type
            )
            if matched:
                reference = d
                break

    ref_distance = None
    depth_scale = None
    if reference:
        ref_px = max(1.0, reference["bbox"]["w"] / 100 * image_width)
        ref_distance = known_width_m * focal_px / ref_px
        if disparity is not None:
            ref_disp = _median_disparity(disparity, reference, image_width, image_height)
            depth_scale = ref_distance / max(ref_disp, 1e-6)

    results: list[dict[str, Any]] = []
    for det in detections:
        wpx = det["bbox"]["w"] / 100 * image_width
        hpx = det["bbox"]["h"] / 100 * image_height
        distance = None
        if disparity is not None and depth_scale is not None:
            disp = _median_disparity(disparity, det, image_width, image_height)
            distance = disp * depth_scale
        elif ref_distance is not None:
            # 깊이 모델이 없으면 기준물과 같은 평면에 있다고 가정
            distance = ref_distance

        width_m = wpx * distance / focal_px if distance else None
        height_m = hpx * distance / focal_px if distance else None
        results.append({
            "label": det.get("labelKo") or det.get("label"),
            "kind": det.get("kind"),
            "confidence": det.get("confidence"),
            "bbox": det["bbox"],
            "widthPx": round(wpx, 1),
            "heightPx": round(hpx, 1),
            "widthPercent": round(det["bbox"]["w"], 2),
            "heightPercent": round(det["bbox"]["h"], 2),
            "areaPercent": round(det["bbox"]["w"] * det["bbox"]["h"] / 100, 2),
            "aspectRatio": round(wpx / max(hpx, 1), 2),
            "distanceM": round(distance, 2) if distance else None,
            "widthCm": round(width_m * 100, 1) if width_m else None,
            "heightCm": round(height_m * 100, 1) if height_m else None,
            "method": (
                "reference+depth" if disparity is not None and depth_scale is not None
                else "reference-plane" if ref_distance is not None
                else "relative-only"
            ),
        })
    return results
