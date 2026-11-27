"""건설현장 안전 판별: 추락 vs 다툼 오인식 방지.

- 객체 소실(개구부), 급격한 수직 하강 + 정지 지속, 다중 작업자 접근을 종합
- 위험 구역(ROI) 내 이상은 추락으로 우선 판단
- VLM 대신 무료 룰 기반 문맥 추론으로 상황 설명 생성
"""
from __future__ import annotations

import math
import time
from typing import Any

_settings: dict[str, Any] = {
    "zones": [],
    "disappearanceSec": 1.2,
    "stillSec": 3.0,
    "gatherCount": 3,
}
_tracks: dict[str, dict[str, Any]] = {}
_emitted: dict[str, float] = {}


def configure(config: dict[str, Any]) -> None:
    _settings["zones"] = config.get("fallRiskZones", {}).get("value", []) or []
    _settings["disappearanceSec"] = float(config.get("disappearanceSec", {}).get("value", 1.2))
    _settings["stillSec"] = float(config.get("stillSec", {}).get("value", 3))
    _settings["gatherCount"] = int(config.get("gatherCount", {}).get("value", 3))


def settings() -> dict[str, Any]:
    return dict(_settings)


def _in_zone(x: float, y: float, poly: list[list[float]]) -> bool:
    inside = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if ((y1 > y) != (y2 > y)) and (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1):
            inside = not inside
    return inside


def _zone_name(x: float, y: float) -> str | None:
    for idx, poly in enumerate(_settings["zones"]):
        if len(poly) >= 3 and _in_zone(x, y, poly):
            return f"위험구역 {idx + 1}"
    return None


def _emit(event_type: str, track_id: str, events: list[dict[str, Any]], label: str,
          severity: str, confidence: float, reason: str, evidence: list[str], zone: str) -> None:
    key = f"{event_type}:{track_id}"
    now = time.time()
    if now - _emitted.get(key, 0) < 8:
        return
    _emitted[key] = now
    events.append({
        "id": f"sf-{event_type}-{track_id}-{int(now)}",
        "type": event_type,
        "labelKo": label,
        "severity": severity,
        "confidence": confidence,
        "timestamp": round(now, 2),
        "reason": reason,
        "evidence": evidence,
        "zone": zone,
    })


def analyze(detections: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], str]:
    now = time.time()
    persons = [d for d in detections if d.get("kind") == "person"]
    events: list[dict[str, Any]] = []
    current_ids: set[str] = set()

    for i, det in enumerate(persons):
        b = det.get("bbox", {})
        cx = b.get("x", 0) + b.get("w", 0) / 2
        cy = b.get("y", 0) + b.get("h", 0) / 2
        h = b.get("h", 0)

        # 최근접 매칭으로 트랙 ID 유지
        best_id, best_dist = None, float("inf")
        for tid, state in _tracks.items():
            dist = math.hypot(state["cx"] - cx, state["cy"] - cy)
            if dist < best_dist:
                best_id, best_dist = tid, dist
        if best_id is None or best_dist > 12:
            best_id = f"W{len(_tracks) + 1}"
            _tracks[best_id] = {
                "cx": cx, "cy": cy, "h": h, "t": now,
                "still_since": now, "drop_candidate": False, "confirmed": False,
                "in_zone": _zone_name(cx, cy) is not None, "zone": _zone_name(cx, cy) or "-",
            }
        state = _tracks[best_id]
        dt = max(0.05, now - state["t"])
        speed = math.hypot(cx - state["cx"], cy - state["cy"]) / dt
        dropped = state["h"] > 0 and h < state["h"] * 0.7 and cy > state["cy"] + 2
        if dropped:
            state["drop_candidate"] = True
        if speed < 1.5:
            still = now - state["still_since"]
        else:
            still = 0
            state["still_since"] = now
        state.update({
            "cx": cx, "cy": cy, "h": h, "t": now,
            "in_zone": _zone_name(cx, cy) is not None,
            "zone": _zone_name(cx, cy) or state["zone"],
        })
        current_ids.add(best_id)

        zone = state["zone"]
        # 수직 하강 + 정지 지속 → 추락 확정
        if state["drop_candidate"] and still >= _settings["stillSec"] and not state["confirmed"]:
            state["confirmed"] = True
            gather = sum(
                1 for j, other in enumerate(persons)
                if j != i and math.hypot(
                    (other["bbox"]["x"] + other["bbox"]["w"] / 2) - cx,
                    (other["bbox"]["y"] + other["bbox"]["h"] / 2) - cy,
                ) < 12
            )
            is_fall = state["in_zone"] or gather >= _settings["gatherCount"]
            if is_fall:
                _emit(
                    "fall", best_id, events, "추락 의심", "critical", 0.9,
                    "급격한 수직 하강 후 움직임이 없어 추락으로 판단했습니다."
                    + (" 위험 구역 내 발생." if state["in_zone"] else " 주변 작업자가 접근했습니다."),
                    [f"정지 {still:.1f}s", f"접근 작업자 {gather}명", f"구역 {zone}"], zone,
                )
            else:
                _emit(
                    "fall_candidate", best_id, events, "낙상 의심 (관찰)", "warning", 0.65,
                    "급격한 자세 변화가 있었으나 다툼 가능성을 배제하기 위해 관찰 중입니다.",
                    [f"정지 {still:.1f}s", f"구역 {zone}"], zone,
                )

    # 다툼: 두 객체가 위험구역 밖에서 가까이 겹치며 계속 움직일 때만
    for i in range(len(persons)):
        for j in range(i + 1, len(persons)):
            a, b = persons[i], persons[j]
            ca = (a["bbox"]["x"] + a["bbox"]["w"] / 2, a["bbox"]["y"] + a["bbox"]["h"] / 2)
            cb = (b["bbox"]["x"] + b["bbox"]["w"] / 2, b["bbox"]["y"] + b["bbox"]["h"] / 2)
            dist = math.hypot(ca[0] - cb[0], ca[1] - cb[1])
            in_zone = _zone_name(*ca) is not None or _zone_name(*cb) is not None
            if dist < 8 and not in_zone:
                _emit(
                    "altercation", f"pair-{i}-{j}", events, "다툼·폭력 의심", "critical", 0.82,
                    "두 작업자가 위험 구역 밖에서 근접하며 지속적으로 움직이고 있습니다.",
                    [f"거리 {dist:.1f}%", "구역 밖 상호작용"], "일반 작업구역",
                )

    # 객체 소실: 위험 구역에서 트랙이 갑자기 사라지면 추락
    for tid, state in list(_tracks.items()):
        if tid in current_ids:
            continue
        gone = now - state["t"]
        if gone >= _settings["disappearanceSec"] and state["in_zone"] and not state["confirmed"]:
            _emit(
                "fall", tid, events, "개구부 추락 의심", "critical", 0.88,
                "위험 구역에서 작업자 추적이 갑자기 소실되어 추락으로 판단했습니다.",
                [f"소실 {gone:.1f}s", f"구역 {state['zone']}"], state["zone"],
            )
            state["confirmed"] = True
        if gone > 6:
            _tracks.pop(tid, None)

    if events:
        fall_events = [e for e in events if e["type"] == "fall"]
        if fall_events:
            description = (
                f"{fall_events[0]['zone']}에서 작업자 추적이 소실되거나 쓰러진 상태가 "
                f"{_settings['stillSec']:.0f}초 이상 유지되어 추락 사고가 의심됩니다. "
                "다툼과 달리 타격 동작 없이 수직 하강만 관측되었습니다."
            )
        else:
            description = "위험 구역 밖에서 작업자 간 근접 상호작용이 감지되어 다툼 가능성이 있습니다."
    else:
        description = "특이 안전 이벤트가 없습니다."

    return events, description
