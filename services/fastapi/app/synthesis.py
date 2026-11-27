"""합성 데이터 증강: 실제 현장 데이터 부족 시 증강 기반 의사 합성 샘플 생성."""
from __future__ import annotations

import random
from pathlib import Path
from typing import Any

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = ROOT / ".models" / "datasets"


def _adjust_label(text: str, flip: bool) -> str:
    if not flip or not text.strip():
        return text
    out = []
    for line in text.strip().splitlines():
        parts = line.split()
        if len(parts) >= 5:
            parts[1] = f"{1 - float(parts[1]):.5f}"
        out.append(" ".join(parts))
    return "\n".join(out)


def synthesize(dataset_id: str, copies: int = 3) -> dict[str, Any]:
    dataset = DATASET_ROOT / dataset_id
    img_dir = dataset / "images" / "train"
    lbl_dir = dataset / "labels" / "train"
    if not img_dir.exists():
        return {"error": "dataset not found", "created": 0}
    created = 0
    sources = list(img_dir.glob("*.jpg"))
    for src in sources:
        label = lbl_dir / f"{src.stem}.txt"
        label_text = label.read_text(encoding="utf-8") if label.exists() else ""
        image = cv2.imread(str(src))
        if image is None:
            continue
        for i in range(max(0, min(copies, 20))):
            aug = image.copy()
            flip = random.random() < 0.5
            if flip:
                aug = cv2.flip(aug, 1)
            if random.random() < 0.7:
                gamma = random.uniform(0.6, 1.6)
                lut = np.array([((j / 255.0) ** (1 / gamma)) * 255 for j in range(256)]).astype("uint8")
                aug = cv2.LUT(aug, lut)
            if random.random() < 0.5:
                angle = random.uniform(-12, 12)
                h, w = aug.shape[:2]
                m = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
                aug = cv2.warpAffine(aug, m, (w, h), borderValue=(114, 114, 114))
            name = f"syn_{src.stem}_{i}"
            cv2.imwrite(str(img_dir / f"{name}.jpg"), aug)
            (lbl_dir / f"{name}.txt").write_text(_adjust_label(label_text, flip), encoding="utf-8")
            created += 1
    return {"datasetId": dataset_id, "created": created, "method": "flip/gamma/rotation"}
