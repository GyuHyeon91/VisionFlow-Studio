"""추론 전 영상 전처리: ROI 제외 영역 마스킹 + 감마 보정."""
from __future__ import annotations

from typing import Any

import cv2
import numpy as np

_active: dict[str, Any] = {"nmsIoU": 0.45, "gamma": 1.0, "excludeZones": []}


def configure(preprocessing: dict[str, Any]) -> None:
    _active["nmsIoU"] = float(preprocessing.get("nmsIoU", {}).get("value", 0.45))
    _active["gamma"] = float(preprocessing.get("gamma", {}).get("value", 1.0))
    zones = preprocessing.get("excludeZones", {}).get("value", [])
    if isinstance(zones, dict):
        zones = zones.get("value", [])
    _active["excludeZones"] = zones or []


def settings() -> dict[str, Any]:
    return dict(_active)


def apply(image: np.ndarray) -> np.ndarray:
    gamma = _active.get("gamma", 1.0)
    if gamma and abs(gamma - 1.0) > 0.01:
        inv = 1.0 / gamma
        lut = np.array([((i / 255.0) ** inv) * 255 for i in range(256)]).astype("uint8")
        image = cv2.LUT(image, lut)

    h, w = image.shape[:2]
    for zone in _active.get("excludeZones", []):
        if len(zone) < 3:
            continue
        pts = np.array([[int(x / 100 * w), int(y / 100 * h)] for x, y in zone], dtype=np.int32)
        # 회색 패딩값으로 덮어써 모델이 배경으로 인식하게 한다.
        cv2.fillPoly(image, [pts], (114, 114, 114))
    return image
