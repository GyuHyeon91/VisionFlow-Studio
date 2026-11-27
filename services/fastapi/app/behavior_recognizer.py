"""인물 행동 인식 (YOLO Pose + 시계열 휴리스틱).

- 낙상/앉기/서기/걷기/달리기/손짓/체류를 관절 각도와 트랙 이동량으로 분류
- 트랙별 상태를 유지해 프레임 간 행동을 연결
"""
from __future__ import annotations

import math
import threading
import time
from pathlib import Path
from typing import Any

import numpy as np

MODEL_DIR = Path(__file__).resolve().parents[2] / ".models"
POSE_MODEL = MODEL_DIR / "yolov8n-pose.pt"

_model = None
_lock = threading.Lock()
_tracks: dict[str, dict[str, Any]] = {}

LABEL_KO = {
    "standing": "보행 중",
    "walking": "걷기",
    "running": "급하게 이동",
    "sitting": "앉아 있음",
    "falling": "낙상 발생",
    "waving": "손짓/호출",
    "helping": "도움 요청/제공",
    "loitering": "장시간 체류",
    "moving": "이동 중",
}
SEVERITY = {
    "falling": "critical",
    "running": "caution",
    "waving": "info",
    "helping": "info",
    "loitering": "caution",
    "sitting": "info",
    "standing": "info",
    "walking": "info",
    "moving": "info",
}


def get_pose_model():
    global _model
    if _model is None:
        from ultralytics import YOLO

        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        if not POSE_MODEL.exists():
            YOLO(str(POSE_MODEL))  # 다운로드
        _model = YOLO(str(POSE_MODEL))
    return _model


def _angle(a, b, c) -> float:
    """a-b-c 관절 각도(도). b가 정점."""
    ba = np.array(a) - np.array(b)
    bc = np.array(c) - np.array(b)
    denom = np.linalg.norm(ba) * np.linalg.norm(bc)
    if denom < 1e-6:
        return 180.0
    return math.degrees(math.acos(float(np.clip(np.dot(ba, bc) / denom, -1, 1))))


def recognize(image: np.ndarray, threshold: float = 0.5) -> list[dict[str, Any]]:
    model = get_pose_model()
    results = model.predict(source=image, conf=threshold, verbose=False)
    h, w = image.shape[:2]
    now = time.time()
    found: list[dict[str, Any]] = []

    for result in results:
        if result.boxes is None or result.keypoints is None:
            continue
        boxes = result.boxes.xyxy.cpu().numpy()
        keypoints = result.keypoints.xy.cpu().numpy()
        confs = result.keypoints.conf.cpu().numpy() if result.keypoints.conf is not None else None
        for i, (box, kps) in enumerate(zip(boxes, keypoints)):
            x1, y1, x2, y2 = [float(v) for v in box]
            cx = (x1 + x2) / 2 / w * 100
            cy = (y1 + y2) / 2 / h * 100
            bw = (x2 - x1) / w * 100
            bh = (y2 - y1) / h * 100

            # COCO pose: 0 nose,5 l_sh,6 r_sh,11 l_hip,12 r_hip,13 l_knee,14 r_knee,15 l_ank,16 r_ank
            def kp(idx):
                if idx >= len(kps):
                    return None
                point = kps[idx]
                if confs is not None and idx < len(confs[i]) and confs[i][idx] < 0.3:
                    return None
                return (float(point[0]), float(point[1]))

            ls, rs = kp(5), kp(6)
            lh, rh = kp(11), kp(12)
            lk, rk = kp(13), kp(14)
            head = kp(0)

            with _lock:
                track_id = f"P{i + 1}"
                state = _tracks.setdefault(track_id, {"last": None, "lastT": now, "wrist": [], "still": 0})

            speed = 0.0
            if state["last"]:
                dt = max(0.05, now - state["lastT"])
                speed = math.hypot(cx - state["last"][0], cy - state["last"][1]) / dt
            state["last"] = (cx, cy)
            state["lastT"] = now

            behavior = "standing"
            reason = "관절 기반 기본 자세"
            if head and ls and rs and lh and rh:
                shoulder_y = (ls[1] + rs[1]) / 2 / h
                hip_y = (lh[1] + rh[1]) / 2 / h
                head_y = head[1] / h
                # 몸이 거의 수평이면 낙상 의심
                if abs(shoulder_y - hip_y) < 0.04 and abs(ls[0] - rh[0]) / w > 0.12:
                    behavior = "falling"
                    reason = "어깨-골반이 수평에 가까움"
                elif hip_y - shoulder_y < 0.08 and bh < 30:
                    behavior = "sitting"
                    reason = "골반이 낮고 신장이 줄어듦"
            if lk and lh:
                knee_angle = _angle(lh, lk, kp(15) or (lk[0], lk[1] + 10))
                if knee_angle < 100 and behavior == "standing":
                    behavior = "sitting"
                    reason = f"무릎 각도 {knee_angle:.0f}도"

            # BBox 급감 + 중심 하강 → 낙상
            if state.get("lastH") and bh < state["lastH"] * 0.65 and cy > state.get("lastCY", cy) + 3:
                behavior = "falling"
                reason = "신장 급감 및 중심 하강"
            state["lastH"] = bh
            state["lastCY"] = cy

            if behavior not in ("falling", "sitting"):
                if speed > 14:
                    behavior = "running"
                    reason = f"이동 속도 {speed:.1f}%/s"
                elif speed > 4:
                    behavior = "walking"
                    reason = f"이동 속도 {speed:.1f}%/s"
                else:
                    state["still"] += 1
                    if state["still"] > 40:
                        behavior = "loitering"
                        reason = "장간 정지"
                if speed > 1:
                    state["still"] = 0

            # 손목 상하 변동이 크면 손짓
            wrists = [kp(9), kp(10)]
            wrist = next((p for p in wrists if p), None)
            if wrist:
                state["wrist"].append(wrist[1] / h)
                state["wrist"] = state["wrist"][-12:]
                if len(state["wrist"]) >= 6:
                    rng = max(state["wrist"]) - min(state["wrist"])
                    if rng > 0.12:
                        behavior = "waving"
                        reason = f"손목 변동 {rng:.2f}"

            found.append({
                "id": f"bh-{track_id}",
                "trackId": i + 1,
                "label": behavior,
                "labelKo": LABEL_KO.get(behavior, behavior),
                "category": "행동",
                "confidence": round(float(np.clip(0.6 + min(speed / 40, 0.3), 0.6, 0.95)), 3),
                "severity": SEVERITY.get(behavior, "info"),
                "durationSec": round(now - state["lastT"] + 0.1, 1),
                "timestamp": round(now, 2),
                "reason": reason,
            })
    return found
