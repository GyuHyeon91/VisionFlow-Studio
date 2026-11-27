""" VisionFlow Studio 데이터 카탈로그.

웹에 구성된 데이터 종류·저장 경로·생성 주체·연결 엔드포인트를 한눈에 제공한다.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]

CATALOG: list[dict[str, Any]] = [
    {"group": "설정", "name": "중앙 설정", "path": "configs/app.config.json",
     "kind": "JSON", "source": "SSOT", "endpoint": "GET /api/config",
     "desc": "파이프라인·옵션·포트·분석 설정의 단일 진실 공급원"},
    {"group": "설정", "name": "설정 스키마", "path": "configs/app.config.schema.json",
     "kind": "JSON Schema", "source": "정의", "endpoint": "-",
     "desc": "설정 유효성 검증"},
    {"group": "영상", "name": "업로드 영상 보존", "path": "services/.data/uploads/",
     "kind": "MP4", "source": "사용자 업로드", "endpoint": "POST /api/analyze-video",
     "desc": "분석에 사용한 원본 영상 (재학습 데이터)"},
    {"group": "영상", "name": "위험 클립", "path": "services/.data/clips/",
     "kind": "AVI", "source": "사고 감지 시 자동 저장", "endpoint": "GET /api/clips",
     "desc": "위험 시점 전후 링버퍼 클립"},
    {"group": "모델", "name": "커스텀 모델", "path": "services/.models/custom.pt",
     "kind": "YOLO 가중치", "source": "학습 파이프라인", "endpoint": "POST /api/model/use",
     "desc": "파인튜닝된 감지 모델 (재시작 시 자동 적용)"},
    {"group": "모델", "name": "사전학습 모델", "path": "services/.models/yolov8s.pt",
     "kind": "YOLO 가중치", "source": "Ultralytics", "endpoint": "POST /api/model/set",
     "desc": "COCO 사전학습 모델"},
    {"group": "모델", "name": "ONNX 추론 모델", "path": "services/.models/*_320.onnx, *_640.onnx",
     "kind": "ONNX", "source": "자동 export", "endpoint": "-",
     "desc": "크기별 고속 추론용 (ONNX Runtime / OpenVINO)"},
    {"group": "학습", "name": "건설현장 데이터셋", "path": "services/.models/datasets/construction/",
     "kind": "YOLO 라벨+이미지", "source": "영상에서 자동 구축", "endpoint": "GET /api/dataset/analyze",
     "desc": "person/car/truck/bus 학습 데이터 + 네거티브"},
    {"group": "학습", "name": "하드 네거티브", "path": "services/.models/datasets/active_negative/",
     "kind": "빈 라벨 이미지", "source": "액티브 러닝", "endpoint": "GET /api/active-learning",
     "desc": "오탐 억제용 정상/모호 샘플"},
    {"group": "학습", "name": "오탐 신고", "path": "services/.data/feedback.jsonl",
     "kind": "JSONL", "source": "UI ✕ 신고", "endpoint": "GET /api/feedback/zones",
     "desc": "사용자 신고 오탐 영역 (실시간 차단)"},
    {"group": "학습", "name": "행동 패턴", "path": "services/.data/behavior_dataset/patterns.jsonl",
     "kind": "JSONL", "source": "YOLO Pose 추출", "endpoint": "GET /api/behavior-dataset/stats",
     "desc": "10개 행동 클래스 관절 특징 데이터"},
    {"group": "학습", "name": "외부 데이터셋", "path": "services/.data/datasets/external/",
     "kind": "카탈로그/가이드", "source": "AI-Hub·UCF-Crime 등", "endpoint": "GET /api/external-datasets",
     "desc": "공개 사고 데이터셋 8종 연결 경로"},
    {"group": "분석 결과", "name": "이벤트 로그", "path": "services/.data/events.jsonl",
     "kind": "JSONL", "source": "프레임 분석", "endpoint": "GET /api/events",
     "desc": "프레임별 예측·위험·클립 이벤트"},
    {"group": "분석 결과", "name": "시계열 지표", "path": "services/.data/metrics.db",
     "kind": "SQLite", "source": "분석 결과 집계", "endpoint": "GET /api/metrics",
     "desc": "감지 수·위험·지연 시계열"},
    {"group": "분석 결과", "name": "정확도 평가", "path": "services/.data/evaluation (메모리)",
     "kind": "지표", "source": "사용자 검토", "endpoint": "GET /api/evaluation",
     "desc": "Precision/Recall/F1/혼동행렬·ID 유지율"},
    {"group": "설정", "name": "ByteTrack 설정", "path": "services/fastapi/app/custom_bytetrack.yaml",
     "kind": "YAML", "source": "프로젝트 정의", "endpoint": "-",
     "desc": "ID 유지 버퍼 45·낮은 신뢰도 추적 연결"},
]


def _status(path: str) -> str:
    p = ROOT / path.split(" (")[0]
    if "(" in path:
        return "memory"
    if p.exists():
        return "exists"
    return "pending"


def catalog() -> dict[str, Any]:
    items = []
    for item in CATALOG:
        items.append({**item, "status": _status(item["path"])})
    groups = sorted({i["group"] for i in items})
    return {
        "groups": groups,
        "items": items,
        "total": len(items),
        "root": str(ROOT),
        "note": "경로는 프로젝트 루트 기준 상대경로입니다.",
    }
