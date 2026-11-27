"""실제 건설현장 CCTV 데이터셋 수집·검증·파인튜닝 준비.

- 수집한 이미지/라벨을 학습 데이터셋으로 가져오고 train/val로 분할한다.
- 클래스 분포·사고/정상 비율·라벨 오류를 분석해 학습 전 점검 결과를 제공한다.
"""
from __future__ import annotations

import random
import shutil
from collections import Counter
from pathlib import Path
from typing import Any

from . import trainer

ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = ROOT / ".models" / "datasets"
RAW_DIR = ROOT / ".data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".bmp"}
ACCIDENT_KEYWORDS = ("fall", "accident", "collapse", "fire", "injury", "추락", "사고", "붕괴", "화재")


def _root(dataset_id: str) -> Path:
    name = Path(dataset_id).name
    if not name or name in (".", ".."):
        raise ValueError("invalid datasetId")
    return DATASET_DIR / name


def _classes(dataset_id: str, provided: list[str] | None = None) -> list[str]:
    root = _root(dataset_id)
    root.mkdir(parents=True, exist_ok=True)
    if provided:
        names = [c.strip() for c in provided if c and c.strip()]
        (root / "classes.txt").write_text("\n".join(names), encoding="utf-8")
        return names
    cls_file = root / "classes.txt"
    if cls_file.exists():
        names = [line.strip() for line in cls_file.read_text(encoding="utf-8").splitlines() if line.strip()]
        if names:
            return names
    return list(trainer.COCO_NAMES)


def _write_yaml(dataset_id: str, names: list[str]) -> None:
    root = _root(dataset_id)
    val = "images/val" if (root / "images" / "val").exists() else "images/train"
    (root / "data.yaml").write_text(
        f"path: {root.as_posix()}\ntrain: images/train\nval: {val}\n"
        f"nc: {len(names)}\nnames: {names}\n",
        encoding="utf-8",
    )


def import_directory(
    dataset_id: str,
    source_path: str,
    classes: list[str] | None = None,
    val_ratio: float = 0.2,
) -> dict[str, Any]:
    """로컬 원본 폴더의 이미지/라벨을 데이터셋으로 가져와 train/val 분할."""
    source = Path(source_path).expanduser().resolve()
    # 이 프로젝트 서비스 루트 밖은 읽지 않는다 (다른 프로젝트 간섭 방지).
    if ROOT.resolve() not in source.parents and source != ROOT.resolve():
        raise ValueError(f"source must be inside {ROOT}")
    if not source.is_dir():
        raise FileNotFoundError(str(source))

    pairs: list[tuple[Path, Path | None]] = []
    for image in sorted(source.rglob("*")):
        if image.suffix.lower() not in IMAGE_EXT:
            continue
        label = image.with_suffix(".txt")
        # images/·labels/로 나뉜 구조면 labels/ 쪽 라벨을 우선 찾는다.
        if not label.exists():
            parts = list(image.parts)
            if "images" in parts:
                idx = parts.index("images")
                alt = source.joinpath(*parts[:idx], "labels", *parts[idx + 1:]).with_suffix(".txt")
                if alt.exists():
                    label = alt
        pairs.append((image, label if label.exists() else None))
    if not pairs:
        raise ValueError("no images found in source")

    root = _root(dataset_id)
    names = _classes(dataset_id, classes)
    random.Random(42).shuffle(pairs)
    split = max(1, int(len(pairs) * (1 - min(0.5, max(0.05, val_ratio)))))
    for subset, chunk in (("train", pairs[:split]), ("val", pairs[split:])):
        img_dir = root / "images" / subset
        lbl_dir = root / "labels" / subset
        img_dir.mkdir(parents=True, exist_ok=True)
        lbl_dir.mkdir(parents=True, exist_ok=True)
        for image, label in chunk:
            shutil.copy2(image, img_dir / image.name)
            (lbl_dir / f"{image.stem}.txt").write_text(
                label.read_text(encoding="utf-8") if label else "", encoding="utf-8"
            )
    _write_yaml(dataset_id, names)
    return {
        "datasetId": dataset_id,
        "imported": len(pairs),
        "train": split,
        "val": len(pairs) - split,
        "classes": len(names),
        "source": str(source),
        "analysis": analyze(dataset_id),
    }


def analyze(dataset_id: str) -> dict[str, Any]:
    """데이터셋 통계와 학습 전 권고사항을 반환한다."""
    root = _root(dataset_id)
    cls_file = root / "classes.txt"
    names = [line.strip() for line in cls_file.read_text(encoding="utf-8").splitlines() if line.strip()] if cls_file.exists() else list(trainer.COCO_NAMES)
    counts: Counter[str] = Counter()
    total_labels = 0
    empty_labels = 0
    malformed = 0
    accident_images = 0
    labeled_images = 0

    for txt in root.rglob("*.txt"):
        if txt.name in ("classes.txt", "data.yaml"):
            continue
        lines = [line.strip() for line in txt.read_text(encoding="utf-8", errors="ignore").splitlines() if line.strip()]
        if not lines:
            empty_labels += 1
            continue
        labeled_images += 1
        has_accident = False
        for line in lines:
            parts = line.split()
            total_labels += 1
            if len(parts) < 5:
                malformed += 1
                continue
            try:
                cls = int(parts[0])
            except ValueError:
                malformed += 1
                continue
            name = names[cls] if 0 <= cls < len(names) else f"class_{cls}"
            counts[name] += 1
            if any(kw in name.lower() for kw in ACCIDENT_KEYWORDS):
                has_accident = True
        if has_accident:
            accident_images += 1

    images = len([p for p in root.rglob("*") if p.suffix.lower() in IMAGE_EXT])
    val_images = len([p for p in (root / "images" / "val").glob("*") if p.suffix.lower() in IMAGE_EXT])
    accident_ratio = round(accident_images / labeled_images, 3) if labeled_images else 0.0

    recommendations: list[str] = []
    if images == 0:
        recommendations.append("이미지가 없습니다. 원본 폴더를 가져오거나 프레임을 수집하세요.")
    if labeled_images == 0:
        recommendations.append("라벨이 없습니다. 클립 라벨링 또는 캡처로 라벨을 추가하세요.")
    if 0 < labeled_images and accident_ratio < 0.05:
        recommendations.append("사고 클래스 비율이 5% 미만입니다. 사고 클립을 더 수집하거나 언더샘플링을 고려하세요.")
    if accident_ratio > 0.5:
        recommendations.append("사고 클래스 비율이 50%를 넘습니다. 정상 샘플(하드 네거티브)을 보강하세요.")
    if empty_labels:
        recommendations.append(f"라벨 없는 네거티브 샘플 {empty_labels}장이 포함되어 있습니다 (오탐 감소에 도움).")
    if malformed:
        recommendations.append(f"형식이 잘못된 라벨 {malformed}줄이 있습니다. 학습 전 확인하세요.")
    if val_images == 0 and images:
        recommendations.append("검증(val) 세트가 없습니다. 실제 현장 데이터셋 가져오기를 사용하면 자동 분할됩니다.")

    return {
        "datasetId": dataset_id,
        "images": images,
        "labeledImages": labeled_images,
        "emptyLabels": empty_labels,
        "valImages": val_images,
        "totalLabels": total_labels,
        "accidentImages": accident_images,
        "accidentRatio": accident_ratio,
        "classes": names,
        "classCounts": dict(counts.most_common()),
        "recommendations": recommendations,
        "ready": images > 0 and labeled_images > 0 and val_images > 0 and malformed == 0,
    }


def raw_datasets() -> list[dict[str, Any]]:
    """가져올 수 있는 services/.data/raw 하위 폴더 목록."""
    return [
        {"name": p.name, "path": str(p)}
        for p in sorted(RAW_DIR.iterdir()) if p.is_dir()
    ]
