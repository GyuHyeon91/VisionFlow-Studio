"""시간 기반 사고 판단 모듈.

단일 프레임 감지 결과만으로 사고를 판정하지 않고, 프레임 히스토리를 유지해
거리 변화·속도 변화·자세 변화·지속 시간을 종합해 사고를 판단한다.

판정 유형:
- collision: 두 객체 거리 급감 + 이후 감속/정지
- sudden_stop: 급정지
- fall: 사람의 급격한 수직 하강 + 정지 지속
- proximity: 위험 근접 (지속 시간 기반)

주의: 규칙 기반 보조 판단이며, 실제 사고 확정은 검증 데이터로 평가해야 한다.
"""
from __future__ import annotations

import math
import time
from collections import deque
from typing import Any

# 트랙별 최근 히스토리 (최대 60프레임 ≈ 6초 @10fps)
_history: dict[str, deque[dict[str, Any]]] = {}
_MAX_HISTORY = 60
_MAX_AGE_SEC = 8.0

_settings: dict[str, Any] = {
    "enabled": True,
    "collisionDistDrop": 0.65,   # 거리가 이 비율 이상 급감하면 충돌 후보
    "collisionWindowSec": 2.0,
    "stopSpeedThreshold": 2.0,   # 화면 %/초
    "fallDropPct": 8.0,
    "minFrames": 3,              # 최소 지속 프레임
}


def configure(config: dict[str, Any]) -> None:
    acc = (config or {}).get("accidentAnalysis", {}) or {}
    for key in _settings:
        if key in acc:
            _settings[key] = acc[key].get("value", _settings[key]) if isinstance(acc[key], dict) else acc[key]


def settings() -> dict[str, Any]:
    return dict(_settings)


def reset() -> None:
    _history.clear()


def _record(track_id: str, x: float, y: float, w: float, h: float, label: str, now: float,
            kind: str | None = None) -> None:
    q = _history.setdefault(track_id, deque(maxlen=_MAX_HISTORY))
    q.append({"t": now, "x": x, "y": y, "w": w, "h": h, "label": label, "kind": kind})


def _speed(q: deque[dict[str, Any]], idx: int = -1) -> tuple[float, float]:
    if len(q) < 2:
        return 0.0, 0.0
    a, b = q[idx - 1], q[idx]
    dt = max(0.016, b["t"] - a["t"])
    return (b["x"] - a["x"]) / dt, (b["y"] - a["y"]) / dt


def _recent(q: deque[dict[str, Any]], seconds: float) -> list[dict[str, Any]]:
    if not q:
        return []
    latest = q[-1]["t"]
    return [p for p in q if latest - p["t"] <= seconds]


def analyze(
    detections: list[dict[str, Any]],
    predictions: list[dict[str, Any]] | None = None,
    now: float | None = None,
) -> list[dict[str, Any]]:
    """감지/예측 결과를 받아 시간적 사고 이벤트를 반환한다.

    now를 지정하면 영상 분석처럼 재생 시각 기준으로 히스토리를 기록한다.
    """
    if not _settings["enabled"] or not detections:
        return []
    now = now if now is not None else time.time()
    events: list[dict[str, Any]] = []

    pred_by_id = {p.get("id"): p for p in (predictions or [])}
    for det in detections:
        b = det.get("bbox") or {}
        cx = float(b.get("x", 0)) + float(b.get("w", 0)) / 2
        cy = float(b.get("y", 0)) + float(b.get("h", 0)) / 2
        tid = str(det.get("trackId") or det.get("id") or f"{cx:.0f}-{cy:.0f}")
        _record(tid, cx, cy, float(b.get("w", 0)), float(b.get("h", 0)),
                det.get("labelKo") or det.get("label") or "", now,
                det.get("kind"))

    # 오래된 트랙 정리
    for tid in list(_history):
        if now - _history[tid][-1]["t"] > _MAX_AGE_SEC:
            _history.pop(tid, None)

    ids = list(_history)
    # 1) 급정지: 최근 속도가 높았다가 현재 거의 정지
    for tid in ids:
        q = _history[tid]
        if len(q) < _settings["minFrames"]:
            continue
        vx, vy = _speed(q)
        speed = math.hypot(vx, vy)
        recent = _recent(q, _settings["collisionWindowSec"])
        if len(recent) < 3:
            continue
        peak = 0.0
        for i in range(1, len(recent)):
            dt = max(0.016, recent[i]["t"] - recent[i - 1]["t"])
            peak = max(peak, math.hypot(
                (recent[i]["x"] - recent[i - 1]["x"]) / dt,
                (recent[i]["y"] - recent[i - 1]["y"]) / dt,
            ))
        if peak >= 12 and speed < _settings["stopSpeedThreshold"]:
            events.append({
                "type": "sudden_stop", "labelKo": "급정지 의심", "severity": "warning",
                "trackId": tid, "confidence": min(0.95, 0.5 + peak / 100),
                "evidence": [f"최고 속도 {peak:.1f}%/s → 현재 {speed:.1f}%/s"],
            })

    # 2) 충돌: 두 트랙 거리가 짧아지며 속도가 급감
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = _history[ids[i]], _history[ids[j]]
            if not a or not b:
                continue
            if a[-1]["t"] != b[-1]["t"]:
                continue
            dist_now = math.hypot(a[-1]["x"] - b[-1]["x"], a[-1]["y"] - b[-1]["y"])
            window_a = _recent(a, _settings["collisionWindowSec"])
            window_b = _recent(b, _settings["collisionWindowSec"])
            if len(window_a) < 2 or len(window_b) < 2:
                continue
            dist_before = math.hypot(window_a[0]["x"] - window_b[0]["x"],
                                     window_a[0]["y"] - window_b[0]["y"])
            if dist_before < 1:
                continue
            drop = 1 - dist_now / dist_before
            if drop >= _settings["collisionDistDrop"] and dist_now < 12:
                vax, vay = _speed(a)
                vbx, vby = _speed(b)
                if math.hypot(vax, vbx) + math.hypot(vbx, vby) < 12:
                    events.append({
                        "type": "collision", "labelKo": "차량 충돌 의심", "severity": "critical",
                        "trackIds": [ids[i], ids[j]], "confidence": min(0.95, 0.55 + drop * 0.4),
                        "evidence": [f"거리 {dist_before:.1f}% → {dist_now:.1f}% ({drop * 100:.0f}% 감소)",
                                     "충돌 후 두 객체 감속"],
                    })

    # 3) 넘어짐/추락: 수직 하강 또는 자세 변화(종횡비 급변) + 정지
    for tid in ids:
        q = _history[tid]
        label = q[-1]["label"]
        is_person = any(k in label for k in ("사람", "person", "작업자")) or q[-1].get("kind") == "person"
        if len(q) < _settings["minFrames"] or not is_person:
            continue
        window = _recent(q, max(2.0, _settings["collisionWindowSec"]))
        if len(window) < 3:
            continue
        y_drop = window[-1]["y"] - window[0]["y"]
        _, vy = _speed(q)
        # 종횡비: 서 있을 때 w/h가 작고, 넘어지면 커진다
        ar_first = window[0]["w"] / max(1.0, window[0]["h"])
        ar_last = window[-1]["w"] / max(1.0, window[-1]["h"])
        posture_change = ar_last - ar_first
        # 붕괴 현장처럼 갑자기 아래로 이동하거나 자세가 눕는 경우
        fall_by_drop = y_drop >= _settings["fallDropPct"]
        fall_by_posture = posture_change >= 0.35 and y_drop >= 2.0
        if fall_by_drop or fall_by_posture:
            still = abs(vy) < _settings["stopSpeedThreshold"] or y_drop >= _settings["fallDropPct"] * 1.5
            if still:
                evidence = [f"수직 하강 {y_drop:.1f}%",
                            f"자세 변화(종횡비) {ar_first:.2f} → {ar_last:.2f}"]
                if fall_by_posture and not fall_by_drop:
                    evidence.insert(0, "급격한 자세 변화(넘어짐) 감지")
                events.append({
                    "type": "fall", "labelKo": "추락·넘어짐 의심", "severity": "critical",
                    "trackId": tid,
                    "confidence": min(0.95, 0.5 + max(y_drop / 40, posture_change)),
                    "evidence": evidence,
                })

    # 4) 위험 근접: 예측 경로가 가까운 상태가 일정 시간 지속
    proximity = _settings.get("proximitySec", 1.5)
    for p in predictions or []:
        if not p.get("danger") or not p.get("collisionWith"):
            continue
        events.append({
            "type": "proximity", "labelKo": "위험 근접", "severity": "warning",
            "trackId": p.get("id"), "confidence": 0.6,
            "evidence": [f"예측 경로 충돌: {p.get('collisionWith')}"],
        })

    # 5) 지게차-작업자 충돌 위험: 두 객체가 급격히 가까워지고 감속
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = _history[ids[i]], _history[ids[j]]
            la, lb = a[-1], b[-1]
            if la["t"] != lb["t"] or not a or not b:
                continue
            kinds = {la.get("kind"), lb.get("kind")}
            labels = {la.get("label", ""), lb.get("label", "")}
            is_fork = any(k in labels for k in ("지게차", "forklift")) or "forklift" in kinds
            is_person = any(k in labels for k in ("사람", "작업자")) or "person" in kinds
            if not (is_fork and is_person):
                continue
            wa = _recent(a, _settings["collisionWindowSec"])
            wb = _recent(b, _settings["collisionWindowSec"])
            if len(wa) < 2 or len(wb) < 2:
                continue
            d_before = math.hypot(wa[0]["x"] - wb[0]["x"], wa[0]["y"] - wb[0]["y"])
            d_now = math.hypot(la["x"] - lb["x"], la["y"] - lb["y"])
            if d_before > 1 and d_now < d_before * 0.5 and d_now < 12:
                events.append({
                    "type": "forklift_worker", "labelKo": "지게차-작업자 충돌 의심",
                    "severity": "critical", "trackIds": [ids[i], ids[j]],
                    "confidence": min(0.95, 0.6 + (1 - d_now / d_before) * 0.35),
                    "evidence": [f"지게차-작업자 거리 {d_before:.1f}% → {d_now:.1f}%",
                                 "상호 접근 후 감속"],
                })

    # 6) 추돌 위험: 같은 방향으로 주행하던 후방 객체가 급격히 접근
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = _history[ids[i]], _history[ids[j]]
            la, lb = a[-1], b[-1]
            if la["t"] != lb["t"] or len(a) < 3 or len(b) < 3:
                continue
            vax, vay = _speed(a)
            vbx, vby = _speed(b)
            # 두 객체가 같은 방향(속도 벡터 유사)인지 확인
            dot = vax * vbx + vay * vby
            norm = math.hypot(vax, vay) * math.hypot(vbx, vby)
            if norm < 1 or dot / norm < 0.7:
                continue
            # y 좌표가相近하면 같은 차선으로 판단
            dy = abs(la["y"] - lb["y"])
            d_now = math.hypot(la["x"] - lb["x"], la["y"] - lb["y"])
            if dy < 8 and d_now < 15 and math.hypot(vax, vay) > 6:
                events.append({
                    "type": "rear_end", "labelKo": "추돌 위험", "severity": "warning",
                    "trackIds": [ids[i], ids[j]], "confidence": 0.62,
                    "evidence": [f"동일 차선 후방 접근 {d_now:.1f}%",
                                 f"선행 객체 속도 {math.hypot(vbx, vby):.1f}%/s"],
                })

    return events
