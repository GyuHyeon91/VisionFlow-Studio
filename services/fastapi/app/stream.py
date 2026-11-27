"""RTSP 스트림 수신 + 서버 측 분석 워커 (무료 OpenCV 기반)."""
from __future__ import annotations

import threading
import time
from collections import deque
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from . import events, event_store, prediction, yolo_detector

CLIP_DIR = Path(__file__).resolve().parents[2] / ".data" / "clips"
CLIP_DIR.mkdir(parents=True, exist_ok=True)

_state: dict[str, Any] = {"running": False, "url": "", "frames": 0, "lastError": None}
_capture = None
_thread = None
_stop = threading.Event()


def _worker(url: str, config: dict[str, Any]) -> None:
    global _capture, _state
    cap = cv2.VideoCapture(url)
    _capture = cap
    if not cap.isOpened():
        _state.update({"running": False, "lastError": "cannot open stream"})
        return
    fps = cap.get(cv2.CAP_PROP_FPS) or 15.0
    sample_fps = min(8.0, float(config.get("performance", {}).get("fps", {}).get("value", 8)))
    step = max(1, int(fps / sample_fps))
    roi = config.get("prediction", {}).get("roiPolygons", {}).get("value", [])
    horizon = float(config.get("prediction", {}).get("horizonSec", {}).get("value", 2))
    frames = deque(maxlen=150)
    idx = 0
    while not _stop.is_set():
        ok, frame = cap.read()
        if not ok:
            _state["lastError"] = "stream read failed"
            time.sleep(0.5)
            continue
        frames.append(frame.copy())
        if idx % step != 0:
            idx += 1
            continue
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        try:
            dets = yolo_detector.detect_image(rgb, 0.6, imgsz=320)
        except Exception as exc:
            _state["lastError"] = str(exc)
            idx += 1
            continue
        preds = prediction.update_and_predict(dets, roi, horizon) if config.get("prediction", {}).get("enabled", {}).get("value", True) else []
        event = {
            "type": "stream_frame",
            "source": url,
            "detections": dets,
            "predictions": preds,
            "danger": any(p.get("danger") for p in preds),
            "timestamp": time.time(),
        }
        events.publish_sync(event)
        if config.get("storage", {}).get("eventLog", {}).get("value", True):
            event_store.append(event)
        if event["danger"] and len(frames) >= 10:
            path = CLIP_DIR / f"clip_{int(time.time())}.avi"
            writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"MJPG"), 10, (frame.shape[1], frame.shape[0]))
            for f in list(frames)[-30:]:
                writer.write(f)
            writer.release()
        _state["frames"] += 1
        idx += 1
    cap.release()


def start(url: str, config: dict[str, Any]) -> dict[str, Any]:
    global _thread, _stop
    if _state["running"]:
        return status()
    _stop.clear()
    _state.update({"running": True, "url": url, "frames": 0, "lastError": None})
    _thread = threading.Thread(target=_worker, args=(url, config), daemon=True)
    _thread.start()
    return status()


def stop() -> dict[str, Any]:
    _stop.set()
    _state["running"] = False
    return status()


def status() -> dict[str, Any]:
    return dict(_state)
