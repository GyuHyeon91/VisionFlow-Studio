"""사용자 오탐 신고 → 하드 네거티브 학습 데이터 저장.

화면에서 잘못 표시된 BBox를 신고하면 해당 프레임을 라벨 없는
배경(네거티브) 샘플로 저장하고, 재학습 시 오탐 억제에 사용한다.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATASET = ROOT / ".models" / "datasets" / "active_negative"
IMG_DIR = DATASET / "images" / "train"
LBL_DIR = DATASET / "labels" / "train"
LOG = ROOT / ".data" / "feedback.jsonl"
for d in (IMG_DIR, LBL_DIR, LOG.parent):
    d.mkdir(parents=True, exist_ok=True)


def report(frame_bytes: bytes, label: str, confidence: float, bbox: dict[str, Any]) -> dict[str, Any]:
    stem = f"fp_{int(time.time() * 1000)}"
    # OpenCV 한글 경로 문제 피하려고 상대경로 사용
    img_rel = (Path("services") / ".models" / "datasets" / "active_negative" / "images" / "train" / f"{stem}.jpg").as_posix()
    import cv2

    import numpy as np

    image = cv2.imdecode(np.frombuffer(frame_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("frame decode failed")
    ok = cv2.imwrite(img_rel, image)
    if not ok:
        raise ValueError("frame save failed")
    # 빈 라벨 = 이 영역은 배경(오탐)
    (LBL_DIR / f"{stem}.txt").write_text("", encoding="utf-8")
    record = {
        "ts": time.time(), "file": f"{stem}.jpg", "label": label,
        "confidence": confidence, "bbox": bbox, "kind": "false_positive",
    }
    with LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return record


def zones(limit: int = 50) -> list[dict[str, Any]]:
    """신고된 오탐 영역(BBox) 목록 — 실시간 필터링에 사용."""
    result: list[dict[str, Any]] = []
    if LOG.exists():
        for line in LOG.read_text(encoding="utf-8").splitlines()[-limit:]:
            try:
                r = json.loads(line)
                bbox = r.get("bbox") or {}
                if all(k in bbox for k in ("x", "y", "w", "h")):
                    result.append({"label": r.get("label", ""), "bbox": bbox})
            except Exception:
                continue
    return result


def stats(limit: int = 30) -> dict[str, Any]:
    records = []
    if LOG.exists():
        for line in LOG.read_text(encoding="utf-8").splitlines()[-limit:]:
            try:
                records.append(json.loads(line))
            except Exception:
                continue
    return {"count": len(list(IMG_DIR.glob("fp_*.jpg"))), "recent": records[::-1]}
