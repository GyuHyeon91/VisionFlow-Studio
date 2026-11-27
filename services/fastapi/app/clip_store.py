"""위험 감지 시점 전후 영상 클립 저장 (업로드 영상용 링 버퍼)."""
from __future__ import annotations

import time
from collections import deque
from pathlib import Path
from typing import Any

import cv2
import numpy as np

CLIP_DIR = Path(__file__).resolve().parents[2] / ".data" / "clips"
CLIP_DIR.mkdir(parents=True, exist_ok=True)
_buffer: deque[tuple[float, np.ndarray]] = deque(maxlen=200)
_last_save = 0.0


def push(frame: np.ndarray) -> None:
    _buffer.append((time.time(), frame.copy()))


def maybe_save(danger: bool, fps: int = 10) -> str | None:
    global _last_save
    if not danger or time.time() - _last_save < 10 or len(_buffer) < 10:
        return None
    _last_save = time.time()
    path = CLIP_DIR / f"clip_{int(_last_save)}.avi"
    h, w = _buffer[0][1].shape[:2]
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"MJPG"), fps, (w, h))
    for _, frame in list(_buffer)[-50:]:
        if frame.shape[:2] == (h, w):
            writer.write(frame)
    writer.release()
    return str(path)


def list_clips() -> list[dict[str, Any]]:
    return [
        {"name": p.name, "size": p.stat().st_size, "path": str(p)}
        for p in sorted(CLIP_DIR.glob("*.avi"), reverse=True)[:30]
    ]


def _clip_path(name: str) -> Path:
    """클립 이름을 검증해 CLIP_DIR 내부의 AVI 파일만 허용한다."""
    path = (CLIP_DIR / Path(name).name).resolve()
    if path.parent != CLIP_DIR.resolve() or path.suffix.lower() != ".avi" or not path.exists():
        raise FileNotFoundError(name)
    return path


def clip_info(name: str) -> dict[str, Any]:
    """클립의 프레임 수·해상도·FPS를 반환한다 (라벨링 UI용)."""
    cap = cv2.VideoCapture(str(_clip_path(name)))
    try:
        count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 10)
        return {
            "name": name,
            "frames": count,
            "width": width,
            "height": height,
            "fps": fps,
            "seconds": round(count / fps, 2) if fps else 0,
        }
    finally:
        cap.release()


def get_frame(name: str, index: int) -> bytes:
    """클립의 지정 프레임을 JPEG 바이트로 반환한다."""
    cap = cv2.VideoCapture(str(_clip_path(name)))
    try:
        cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, int(index)))
        ok, frame = cap.read()
        if not ok:
            raise ValueError(f"frame {index} out of range")
        ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        if not ok:
            raise ValueError("frame encode failed")
        return buf.tobytes()
    finally:
        cap.release()
