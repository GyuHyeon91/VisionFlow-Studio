"""무료 예측 모듈: 칼만 필터 이동 예측 + ROI 위험구역 교차 판단."""
from __future__ import annotations

import math
import time
from typing import Any

_tracks: dict[str, dict[str, Any]] = {}


class Kalman2D:
    """2D 위치/속도 칼만 필터 (상수 속도 모델)."""

    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
        self.vx = 0.0
        self.vy = 0.0
        self.p = 1.0

    def update(self, x: float, y: float, dt: float = 0.1) -> None:
        dt = max(0.01, dt)
        measured_vx = (x - self.x) / dt
        measured_vy = (y - self.y) / dt
        self.vx = 0.6 * self.vx + 0.4 * measured_vx
        self.vy = 0.6 * self.vy + 0.4 * measured_vy
        self.x = 0.55 * self.x + 0.45 * x
        self.y = 0.55 * self.y + 0.45 * y
        self.p = max(0.05, self.p * 0.9)

    def predict(self, seconds: float) -> tuple[float, float]:
        return self.x + self.vx * seconds, self.y + self.vy * seconds


def _point_in_poly(x: float, y: float, poly: list[list[float]]) -> bool:
    inside = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if ((y1 > y) != (y2 > y)) and (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1):
            inside = not inside
    return inside


def _seg_intersect(a, b, c, d) -> bool:
    def cross(p, q, r):
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])

    d1, d2 = cross(a, b, c), cross(a, b, d)
    d3, d4 = cross(c, d, a), cross(c, d, b)
    return ((d1 > 0) != (d2 > 0)) and ((d3 > 0) != (d4 > 0))


def _path_hits_roi(start, end, poly: list[list[float]]) -> bool:
    if _point_in_poly(*end, poly):
        return True
    for i in range(len(poly)):
        if _seg_intersect(start, end, poly[i], poly[(i + 1) % len(poly)]):
            return True
    return False


def update_and_predict(
    detections: list[dict[str, Any]],
    roi_polygons: list[list[list[float]]],
    horizon_sec: float = 2.0,
    threshold: float = 0.5,
) -> list[dict[str, Any]]:
    now = time.time()
    results = []
    for det in detections:
        bbox = det.get("bbox", {})
        cx = bbox.get("x", 0) + bbox.get("w", 0) / 2
        cy = bbox.get("y", 0) + bbox.get("h", 0) / 2
        tid = str(det.get("trackId") or det.get("id") or f"{cx:.0f}-{cy:.0f}")
        state = _tracks.get(tid)
        if state is None:
            state = {"filter": Kalman2D(cx, cy), "t": now}
            _tracks[tid] = state
        else:
            state["filter"].update(cx, cy, now - state["t"])
            state["t"] = now
        px, py = state["filter"].predict(horizon_sec)
        # 차량/중장비는 위험구역을 통행하는ものとして 위험 판정에서 제외.
        # 사람(작업자)이 위험구역에 접근할 때만 경고한다.
        kind = det.get("kind")
        label = det.get("labelKo") or det.get("label") or ""
        is_person = kind == "person" or label in ("사람", "작업자", "person")
        danger = is_person and any(
            _path_hits_roi((cx, cy), (px, py), poly) for poly in roi_polygons
        )
        results.append({
            "id": tid,
            "label": det.get("labelKo") or det.get("label") or "객체",
            "current": [round(cx, 1), round(cy, 1)],
            "predicted": [round(px, 1), round(py, 1)],
            "speed": round(math.hypot(state["filter"].vx, state["filter"].vy), 1),
            "danger": danger,
            "horizonSec": horizon_sec,
        })
    # 예측 경로 간 충돌 가능성 (두 객체의 예측 위치가 가까우면 위험)
    for i in range(len(results)):
        for j in range(i + 1, len(results)):
            a, b = results[i], results[j]
            dist = math.hypot(a["predicted"][0] - b["predicted"][0], a["predicted"][1] - b["predicted"][1])
            if dist < 8:
                a["danger"] = True
                b["danger"] = True
                a["collisionWith"] = b["id"]
                b["collisionWith"] = a["id"]

    for tid in list(_tracks):
        if now - _tracks[tid]["t"] > 5:
            _tracks.pop(tid, None)
    return results
