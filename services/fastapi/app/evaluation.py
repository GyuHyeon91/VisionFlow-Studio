"""사고 인식·객체 추적 성능 평가 모듈.

- 사고 유형별 Precision / Recall / F1 / 혼동행렬
- 객체 추적 ID 유지 성능 (ID switch, fragment,保温率)
- 실제 검증 데이터(수동 검토 결과)가 있을 때만 신뢰할 수 있는 지표를 계산한다.
"""
from __future__ import annotations

import time
from collections import Counter, defaultdict
from typing import Any

# 검토 결과 저장: event_id -> {"type": str, "verdict": "true"|"false", "reviewedBy": str}
_reviews: dict[str, dict[str, Any]] = {}
# 추적 관측: track_id -> {"ids": set, "frames": int, "gaps": int}
_track_observations: dict[str, dict[str, Any]] = {}
# 예측 이벤트 로그
_predictions: list[dict[str, Any]] = []


def add_prediction(event: dict[str, Any]) -> None:
    _predictions.append({
        "id": str(event.get("id", "")),
        "type": event.get("type", "unknown"),
        "trackId": str(event.get("trackId") or event.get("trackIds") or ""),
        "confidence": float(event.get("confidence", 0)),
        "ts": time.time(),
    })
    if len(_predictions) > 2000:
        del _predictions[:500]


def add_review(event_id: str, verdict: str, accident_type: str, reviewed_by: str = "user") -> dict[str, Any]:
    _reviews[str(event_id)] = {
        "type": accident_type, "verdict": verdict, "reviewedBy": reviewed_by, "ts": time.time(),
    }
    return {"eventId": event_id, "verdict": verdict, "type": accident_type}


def observe_track(track_id: str, frame_idx: int) -> None:
    state = _track_observations.setdefault(track_id, {"ids": set(), "lastFrame": -1, "gaps": 0, "frames": 0})
    state["frames"] += 1
    if state["lastFrame"] >= 0 and frame_idx - state["lastFrame"] > 1:
        state["gaps"] += 1
    state["lastFrame"] = frame_idx


def _prf(tp: int, fp: int, fn: int) -> dict[str, float]:
    p = tp / (tp + fp) if tp + fp else 0.0
    r = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * p * r / (p + r) if p + r else 0.0
    return {"precision": round(p, 3), "recall": round(r, 3), "f1": round(f1, 3)}


def evaluate() -> dict[str, Any]:
    """검토된 이벤트를 기준으로 유형별 지표를 계산한다."""
    per_type: dict[str, dict[str, int]] = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    confusion: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for pred in _predictions:
        review = _reviews.get(pred["id"])
        if not review:
            continue
        ptype = pred["type"]
        actual = review["type"]
        verdict = review["verdict"]
        if verdict == "true":
            if actual == ptype:
                per_type[ptype]["tp"] += 1
            else:
                per_type[ptype]["fp"] += 1
                per_type[actual]["fn"] += 1
                confusion[ptype][actual] += 1
        else:
            per_type[ptype]["fp"] += 1
            confusion[ptype]["none"] += 1

    types = sorted(set(per_type) | {r["type"] for r in _reviews.values()})
    type_metrics: dict[str, Any] = {}
    totals = {"tp": 0, "fp": 0, "fn": 0}
    for t in types:
        c = per_type[t]
        totals["tp"] += c["tp"]; totals["fp"] += c["fp"]; totals["fn"] += c["fn"]
        type_metrics[t] = {**c, **_prf(c["tp"], c["fp"], c["fn"])}

    # 추적 지표
    total_tracks = len(_track_observations)
    fragmented = sum(1 for s in _track_observations.values() if s["gaps"] > 0)
    id_switches = max(0, sum(len(s["ids"]) - 1 for s in _track_observations.values()))
    tracking = {
        "tracks": total_tracks,
        "fragmentedTracks": fragmented,
        "idSwitches": id_switches,
        "idPreservationRate": round(1 - fragmented / total_tracks, 3) if total_tracks else 0.0,
    }

    reviewed = len(_reviews)
    return {
        "reviewedEvents": reviewed,
        "predictedEvents": len(_predictions),
        "overall": {**totals, **_prf(totals["tp"], totals["fp"], totals["fn"])},
        "perType": type_metrics,
        "confusionMatrix": {k: dict(v) for k, v in confusion.items()},
        "tracking": tracking,
        "reliable": reviewed >= 5,
        "note": "검토 결과가 5건 미만이면 지표 신뢰도가 낮습니다." if reviewed < 5 else "검토 결과 기반 지표입니다.",
    }


def status() -> dict[str, Any]:
    return {
        "reviews": len(_reviews),
        "predictions": len(_predictions),
        "tracks": len(_track_observations),
    }
