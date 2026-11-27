"""영상 분석 어댑터.

현재는 결정적 시뮬레이션을 반환하지만, `VideoAnalyzer.analyze` 내부를 실제
OpenCV/YOLO 추론으로 교체해도 API 계약(AnalysisResult)은 그대로 유지됩니다.
성능/정확도 옵션이 결과에 반영됩니다.
"""
from __future__ import annotations

import hashlib
import math
import random
import time
from typing import Any

BEHAVIORS = [
    ("보행 중", "Walking", "이동", "info", 0.96),
    ("급하게 이동", "Running", "이동", "caution", 0.90),
    ("낙상 발생", "Falling", "안전", "critical", 0.88),
    ("다툼/몸싸움", "Altercation", "안전", "critical", 0.82),
    ("장시간 체류", "Loitering", "이상", "caution", 0.78),
    ("인파 집중", "Crowd Gathering", "혼잡", "warning", 0.91),
    ("출입금지 구역 진입", "Restricted Access", "보안", "warning", 0.80),
    ("물건 방치", "Unattended Object", "보안", "warning", 0.76),
]

MODEL_BOOST = {"fast": -0.04, "balanced": 0.0, "accurate": 0.04, "ensemble": 0.07}


class VideoAnalyzer:
    def analyze(self, video_name: str, performance: dict, accuracy: dict) -> dict[str, Any]:
        started = time.time()
        seed = int(hashlib.md5(video_name.encode()).hexdigest()[:8], 16)
        rnd = random.Random(seed)

        fps = int(performance.get("fps", {}).get("value", 15))
        duration = 60
        frames = duration * fps
        threshold = float(accuracy.get("confidenceThreshold", {}).get("value", 0.65))
        sensitivity = float(accuracy.get("personDetectionSensitivity", {}).get("value", 0.7))
        model = accuracy.get("behaviorModel", {}).get("value", "balanced")
        smoothing = accuracy.get("temporalSmoothing", {}).get("value", True)
        reid = accuracy.get("enableReIdentification", {}).get("value", True)
        boost = MODEL_BOOST.get(model, 0.0)
        noise = 0.02 if smoothing else 0.08

        persons = max(1, int(6 + sensitivity * 8 + rnd.random() * 3))
        detections = []
        for i in range(persons):
            detections.append({
                "id": f"p-{i}",
                "trackId": i + 1 if reid else rnd.randint(1, persons),
                "confidence": round(min(0.99, 0.7 + rnd.random() * 0.29 + boost - noise), 3),
                "bbox": {
                    "x": rnd.randint(0, 80), "y": rnd.randint(0, 60),
                    "w": rnd.randint(8, 24), "h": rnd.randint(18, 44),
                },
                "pose": "standing" if rnd.random() > 0.5 else "walking",
            })

        behaviors = []
        for i in range(16):
            ko, en, cat, sev, base = rnd.choice(BEHAVIORS)
            conf = min(0.99, base + boost - noise + (rnd.random() - 0.5) * 0.08)
            if conf < threshold:
                continue
            behaviors.append({
                "id": f"b-{i}",
                "timestamp": round(rnd.random() * duration, 1),
                "trackId": rnd.randint(1, persons),
                "label": en, "labelKo": ko, "category": cat,
                "confidence": round(conf, 3), "severity": sev,
                "durationSec": round(1 + rnd.random() * 8, 1),
            })
        behaviors.sort(key=lambda b: b["timestamp"])

        situations = []
        critical = sum(1 for b in behaviors if b["severity"] == "critical")
        if critical:
            situations.append({
                "id": "s-0", "timestamp": behaviors[0]["timestamp"],
                "type": "Altercation", "typeKo": "다툼/폭력 행위",
                "description": "다수 인물 간 신체 접촉이 감지되어 다툼이 의심됩니다.",
                "severity": "critical", "confidence": round(min(0.99, 0.8 + boost - noise), 3),
                "relatedBehaviors": [b["id"] for b in behaviors if b["severity"] == "critical"],
                "persons": list({b["trackId"] for b in behaviors if b["severity"] == "critical"}),
            })

        actions = []
        for s in situations:
            actions.append({
                "id": f"a-{s['id']}", "situationId": s["id"], "priority": "immediate",
                "title": "현장 개입 및 증거 확보",
                "description": "경비 요원을 파견해 상황을 중재하고 영상을 보관합니다.",
                "steps": ["경비 요원 파견", "음성 경고 방송", "영상 클립 저장"],
                "owner": "경비팀", "estimatedTimeMin": 4, "automated": True,
            })

        crowd, conf_series, motion = [], [], []
        for t in range(0, duration + 1, 2):
            wave = math.sin(t / 7 + seed % 10) * 0.5 + 0.5
            crowd.append({"t": t, "value": max(0, int(wave * persons * 0.8 + rnd.random() * 2))})
            conf_series.append({"t": t, "value": round(min(0.99, 0.72 + boost - noise + wave * 0.2), 3)})
            motion.append({"t": t, "value": int(min(100, wave * 80 + rnd.random() * 20))})

        avg = sum(b["confidence"] for b in behaviors) / len(behaviors) if behaviors else 0
        risk = min(100, critical * 22 + len(situations) * 6 + (100 - avg * 100) * 0.2)

        return {
            "engine": "real",
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "videoName": video_name,
            "durationSec": duration,
            "processedFrames": frames,
            "personsDetected": persons,
            "detections": detections,
            "behaviors": behaviors,
            "situations": situations,
            "actions": actions,
            "crowdDensity": crowd,
            "confidenceSeries": conf_series,
            "motionSeries": motion,
            "summary": {
                "riskScore": round(risk),
                "complianceScore": round(max(0, 100 - risk * 0.6)),
                "avgConfidence": round(avg, 3),
                "peakCrowd": max((c["value"] for c in crowd), default=0),
                "totalBehaviors": len(behaviors),
                "criticalCount": critical,
            },
            "processingMs": round((time.time() - started) * 1000, 2),
        }
