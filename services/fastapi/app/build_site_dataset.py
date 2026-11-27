"""건설현장 CCTV 영상에서 지게차/트럭/사람 라벨 데이터셋을 구축한다.

COCO 사전학습 모델은 지게차 클래스가 없어 지게차를 truck으로,
트럭 적재함/운전실을 truck/bus/car로 차례로 검출한다.
CCTV는 고정 카메라라 BBox 위치가 일정하므로, 감지 좌표와
프레임 내 위치로 정확한 클래스를 재매핑해 학습 라벨을 만든다.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BASE_SOURCES = [
    ("fork", ROOT / ".models" / "upload_1795137690253.mp4"),
    ("bus", ROOT / ".models" / "upload_1795137674597.mp4"),
    ("road", ROOT / ".models" / "upload_1795137553318.mp4"),
]
# 웹에 업로드된 영상은 .data/uploads에 보존된다 — 오탐/붕괴 장면 재학습에 자동 포함
UPLOAD_DIR = ROOT / ".data" / "uploads"
DATASET = ROOT / ".models" / "datasets" / "construction"
# COCO 사전학습에 forklift 클래스가 없어 위치 규칙으로 만든 라벨이 오탐을 유발했다.
# 신뢰할 수 있는 클래스만 학습한다.
CLASSES = ["person", "car", "truck", "bus"]


def _sources() -> list[tuple[str, Path]]:
    items = list(BASE_SOURCES)
    if UPLOAD_DIR.exists():
        for p in sorted(UPLOAD_DIR.glob("*.mp4"), key=lambda x: x.stat().st_mtime, reverse=True):
            items.append(("upload", p))
    return items


def _classify(det: dict[str, Any], source: str = "fork") -> str | None:
    b = det["bbox"]
    cx = b["x"] + b["w"] / 2
    cy = b["y"] + b["h"] / 2
    area = b["w"] * b["h"] / 100
    label = det.get("label", "")
    if label in ("사람", "person"):
        return "person"
    if area < 0.3:
        return None
    if source == "fork":
        # 위치 규칙은 제거 — COCO 원본 클래스만 신뢰
        if label in ("자동차", "car"):
            return "car"
        if label in ("트럭", "truck"):
            return "truck"

    elif source == "bus":
        # 버스 영상: COCO bus 검출만 신뢰
        if label in ("버스", "bus"):
            return "bus"
    elif source == "road":
        # 야간 도로: COCO 원본 클래스 유지 (자동차를 트럭으로 합치지 않음)
        if label in ("자동차", "car"):
            return "car"
        if label in ("트럭", "truck"):
            return "truck"
    elif source == "upload":
        # 웹에서 업로드된 영상: COCO가 잔해를 트럭/자동차로 오인하므로
        # 사람만 신뢰하고 나머지는 라벨에서 제외한다 (오탐 학습 방지)
        if label in ("사람", "person", "작업자"):
            return "person"
    return None


def build(sample_sec: float = 1.0, val_ratio: float = 0.2) -> dict[str, Any]:
    for split in ("train", "val"):
        d = DATASET / "images" / split
        if d.exists():
            for old in d.glob("*.jpg"):
                old.unlink()
        l = DATASET / "labels" / split
        if l.exists():
            for old in l.glob("*.txt"):
                old.unlink()
        d.mkdir(parents=True, exist_ok=True)
        l.mkdir(parents=True, exist_ok=True)
    (DATASET / "classes.txt").write_text("\n".join(CLASSES), encoding="utf-8")

    from . import yolo_detector, preprocessing, resolution

    config = json.loads((ROOT.parent / "configs" / "app.config.json").read_text(encoding="utf-8"))
    yolo_detector.configure(config.get("detection", {}))
    preprocessing.configure(config.get("preprocessing", {}))
    resolution.configure(config.get("detection", {}))
    # 라벨 생성은 COCO 사전학습 모델로 한다 (커스텀 모델은 지게차에 과적합되어 있음)
    yolo_detector.use_model(str(ROOT / ".models" / config["detection"]["model"]["value"]))

    sources = _sources()
    all_frames: list[tuple[str, int, np.ndarray]] = []
    for source_name, video_path in sources:
        if not video_path.exists():
            continue
        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        # 짧은 영상은 모든 프레임, 긴 영상은 1초 간격 샘플링
        step = 1 if total / fps <= 6 else max(1, int(fps * sample_sec))
        for idx in range(0, total, step):
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ok, frame = cap.read()
            if ok:
                all_frames.append((source_name, idx, cv2.resize(frame, (640, 360))))
        cap.release()

    split_at = max(1, int(len(all_frames) * (1 - val_ratio)))
    counts: dict[str, int] = {c: 0 for c in CLASSES}
    samples = 0
    for i, (source, idx, frame) in enumerate(all_frames):
        rgb = np.array(Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)))
        detections = yolo_detector.detect_image(rgb, 0.3, 640, fast=True)
        # 같은 objects가 적재함/운전실로 분리 검출되므로 클래스별 최대 BBox만 유지
        by_class: dict[str, list[dict[str, Any]]] = {}
        for det in detections:
            cls = _classify(det, source)
            if cls is None:
                continue
            by_class.setdefault(cls, []).append(det)
        lines = []
        for cls, dets in by_class.items():
            dets.sort(key=lambda d: d["bbox"]["w"] * d["bbox"]["h"], reverse=True)
            keep = dets[: 1 if cls in ("car", "truck", "bus") else 3]
            for det in keep:
                b = det["bbox"]
                cx = (b["x"] + b["w"] / 2) / 100
                cy = (b["y"] + b["h"] / 2) / 100
                w = b["w"] / 100
                h = b["h"] / 100
                lines.append(f"{CLASSES.index(cls)} {cx:.5f} {cy:.5f} {w:.5f} {h:.5f}")
                counts[cls] += 1
        if not lines:
            continue
        split = "train" if i < split_at else "val"
        name = f"{source}_{idx:05d}"
        # OpenCV는 한글 포함 절대경로를 쓰지 못하므로 상대경로로 저장
        img_rel = (Path("services") / ".models" / "datasets" / "construction" / "images" / split / f"{name}.jpg").as_posix()
        cv2.imwrite(img_rel, frame)
        (DATASET / "labels" / split / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8")
        samples += 1

    # 화면에서 신고된 오탐 네거티브(빈 라벨)를 학습 데이터에 포함
    neg_img_dir = ROOT / ".models" / "datasets" / "active_negative" / "images" / "train"
    neg_lbl_dir = ROOT / ".models" / "datasets" / "active_negative" / "labels" / "train"
    negatives = 0
    if neg_img_dir.exists():
        import shutil
        for jpg in sorted(neg_img_dir.glob("*.jpg"))[-100:]:
            dst_img = DATASET / "images" / "train" / f"neg_{jpg.name}"
            dst_lbl = DATASET / "labels" / "train" / f"neg_{jpg.stem}.txt"
            shutil.copy2(jpg, dst_img)
            src_lbl = neg_lbl_dir / f"{jpg.stem}.txt"
            dst_lbl.write_text(
                src_lbl.read_text(encoding="utf-8") if src_lbl.exists() else "", encoding="utf-8"
            )
            negatives += 1

    (DATASET / "data.yaml").write_text(
        f"path: {DATASET.as_posix()}\ntrain: images/train\nval: images/val\n"
        f"nc: {len(CLASSES)}\nnames: {CLASSES}\n",
        encoding="utf-8",
    )
    return {
        "negatives": negatives,
        "datasetId": "construction",
        "sources": [str(p) for _, p in sources if p.exists()],
        "frames": len(all_frames),
        "samples": samples,
        "train": min(split_at, samples),
        "val": samples - min(split_at, samples),
        "classes": CLASSES,
        "counts": counts,
        "dataYaml": str(DATASET / "data.yaml"),
    }
