"""액티브 러닝: 애매한 신뢰도/오탐 프레임을 하드 네거티브로 자동 수집."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DATASET = ROOT / ".models" / "datasets" / "active_negative"
LOG_PATH = ROOT / ".data" / "active_learning.jsonl"
IMG_DIR = DATASET / "images" / "train"
LBL_DIR = DATASET / "labels" / "train"
for d in (IMG_DIR, LBL_DIR):
    d.mkdir(parents=True, exist_ok=True)

_settings: dict[str, Any] = {
    "enabled": True, "min": 0.35, "max": 0.7, "clipWindowSec": 5,
}
_last_capture = 0.0


def configure(config: dict[str, Any]) -> None:
    _settings["enabled"] = bool(config.get("activeLearning", {}).get("value", True))
    _settings["min"] = float(config.get("ambiguousMin", {}).get("value", 0.35))
    _settings["max"] = float(config.get("ambiguousMax", {}).get("value", 0.7))
    _settings["clipWindowSec"] = int(config.get("clipWindowSec", {}).get("value", 5))


def settings() -> dict[str, Any]:
    return dict(_settings)


def capture(image: np.ndarray, detections: list[dict[str, Any]], safety_events: list[dict[str, Any]]) -> dict[str, Any] | None:
    global _last_capture
    if not _settings["enabled"]:
        return None
    ambiguous = [
        d for d in detections
        if _settings["min"] <= d.get("confidence", 0) <= _settings["max"]
    ]
    candidates = [e for e in safety_events if e.get("type") in ("fall_candidate", "altercation")]
    if not ambiguous and not candidates:
        return None
    now = time.time()
    if now - _last_capture < 2:
        return None
    _last_capture = now

    stem = f"hn_{int(now * 1000)}"
    cv2.imwrite(str(IMG_DIR / f"{stem}.jpg"), image)
    # 네거티브 샘플: 라벨 파일을 비워 둔다 (배경/정상 동작)
    (LBL_DIR / f"{stem}.txt").write_text("", encoding="utf-8")
    record = {
        "ts": now, "file": f"{stem}.jpg",
        "ambiguous": len(ambiguous),
        "candidates": [e.get("type") for e in candidates],
        "reason": "hard-negative" if ambiguous else "safety-candidate",
    }
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return record


def stats(limit: int = 30) -> dict[str, Any]:
    records = []
    if LOG_PATH.exists():
        for line in LOG_PATH.read_text(encoding="utf-8").splitlines()[-limit:]:
            try:
                records.append(json.loads(line))
            except Exception:
                continue
    return {
        "count": len(list(IMG_DIR.glob("hn_*.jpg"))),
        "recent": records[::-1],
        "settings": dict(_settings),
    }
