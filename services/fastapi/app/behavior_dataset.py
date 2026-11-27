"""사람 행동 패턴 학습 데이터셋 구축.

실제 영상에서 YOLO Pose로 관절을 추출하고, 시간적 특징(속도·자세·지속)
라벨을 붙여 행동 분류 학습 데이터로 저장한다.

행동 클래스:
  standing, walking, running, falling, crouching, lying,
  lifting, helping, altercation, loitering

저장 형식: JSONL (한 줄 = 한 프레임의 관절+특징+라벨)
"""
from __future__ import annotations

import json
import math
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / ".data" / "behavior_dataset"
LABEL_FILE = DATA_DIR / "patterns.jsonl"
DATA_DIR.mkdir(parents=True, exist_ok=True)

CLASSES = [
    "standing", "walking", "running", "falling", "crouching", "lying",
    "lifting", "helping", "altercation", "loitering",
]

# 관절 인덱스 (COCO pose): 0코 5어깨L 6어깨R 11엉덩이 13무릎L 14무릎R 15발L 16발R
IDX = {"nose": 0, "sh_l": 5, "sh_r": 6, "hip": 11, "knee_l": 13, "knee_r": 14, "ankle_l": 15, "ankle_r": 16}


def _features(kp: list[list[float]], prev: dict[str, Any] | None, now: float) -> dict[str, float]:
    def pt(name: str) -> list[float]:
        i = IDX.get(name, 0)
        return kp[i] if i < len(kp) else [0.0, 0.0]

    hip, sh_l, sh_r = pt("hip"), pt("sh_l"), pt("sh_r")
    ankle_l, ankle_r = pt("ankle_l"), pt("ankle_r")
    sh_cy = (sh_l[1] + sh_r[1]) / 2
    body_h = max(1.0, abs(hip[1] - sh_cy) * 2)
    hip_y = hip[1]
    # 자세: 엉덩이가 발목에 가까우면 앉기/눕기
    ankle_y = (ankle_l[1] + ankle_r[1]) / 2
    crouch = max(0.0, (hip_y - ankle_y + body_h) / max(1.0, body_h))
    # 어깨 기울기 (넘어짐 단서)
    shoulder_tilt = abs(sh_l[1] - sh_r[1]) / max(1.0, abs(sh_l[0] - sh_r[0]))
    speed = 0.0
    if prev:
        dt = max(0.05, now - prev.get("t", now))
        speed = math.hypot(hip[0] - prev.get("x", hip[0]), hip[1] - prev.get("y", hip[1])) / dt
    return {
        "body_h": round(body_h, 3),
        "hip_y": round(hip_y, 3),
        "crouch": round(crouch, 3),
        "shoulder_tilt": round(shoulder_tilt, 3),
        "speed": round(speed, 3),
    }


def classify(f: dict[str, float]) -> str:
    """위험도순 규칙 기반 라벨 (학습 데이터의 초기 라벨로 사용)."""
    if f["crouch"] > 2.4 or f["shoulder_tilt"] > 1.6:
        return "lying"
    if f["speed"] > 14:
        return "running"
    if f["crouch"] > 1.5:
        return "crouching"
    if f["speed"] < 0.8:
        return "loitering"
    if f["speed"] > 2:
        return "walking"
    return "standing"


def capture(frame: Any, threshold: float = 0.35) -> list[dict[str, Any]]:
    """프레임에서 관절 특징을 추출해 학습 데이터로 저장."""
    from . import behavior_recognizer

    model = behavior_recognizer.get_pose_model()
    results = model.predict(source=frame, conf=threshold, verbose=False)
    now = time.time()
    records: list[dict[str, Any]] = []
    for result in results:
        if result.keypoints is None:
            continue
        for kp in result.keypoints.xy.cpu().numpy():
            pts = [[float(p[0]), float(p[1])] for p in kp]
            f = _features(pts, None, now)
            label = classify(f)
            rec = {
                "t": now, "label": label, "features": f,
                "keypoints": [[round(p[0], 2), round(p[1], 2)] for p in pts],
            }
            records.append(rec)
    if records:
        with LABEL_FILE.open("a", encoding="utf-8") as fp:
            for r in records:
                fp.write(json.dumps(r, ensure_ascii=False) + "\n")
    return records


def stats() -> dict[str, Any]:
    counts: dict[str, int] = {c: 0 for c in CLASSES}
    total = 0
    if LABEL_FILE.exists():
        for line in LABEL_FILE.read_text(encoding="utf-8").splitlines():
            try:
                r = json.loads(line)
                counts[r.get("label", "unknown")] = counts.get(r.get("label", "unknown"), 0) + 1
                total += 1
            except Exception:
                continue
    return {
        "total": total, "classes": CLASSES, "counts": counts,
        "path": str(LABEL_FILE),
        "note": "실제 영상에서 추출한 관절 특징 기반 초기 라벨. 사람이 검토해 정정하면 정확도가 오릅니다.",
    }
