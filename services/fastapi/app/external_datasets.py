"""공개 사고/이상행동 데이터셋 카탈로그 및 가져오기 안내.

AI-Hub, 공공데이터포털, 해외 오픈 벤치마크에서 구할 수 있는
사고 분석 학습 데이터를 프로젝트 데이터셋 파이프라인에 연결한다.

주의: 실제 데이터 다운로드는 각 플랫폼의 이용약관·인증이 필요하므로
이 모듈은 카탈로그/가이드/로컬 적재 경로만 제공한다.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
IMPORT_DIR = ROOT / ".data" / "datasets" / "external"
IMPORT_DIR.mkdir(parents=True, exist_ok=True)

CATALOG: list[dict[str, Any]] = [
    {
        "id": "aihub_traffic_accident", "name": "AI-Hub 교통사고 영상",
        "source": "AI-Hub", "purpose": "교통사고 유형 분류·과실 비율",
        "scale": "영상 약 2.1만건 / 이미지 328만장",
        "labels": ["사고 유무", "사고 유형", "차량 BBox", "사고 시점"],
        "format": "영상 + 프레임 라벨(JSON/COCO)",
        "note": "한국 도로 환경. 심의·다운로드 승인 필요",
    },
    {
        "id": "aihub_driving_habit", "name": "AI-Hub 사고위험 운전습관",
        "source": "AI-Hub", "purpose": "위험 주행 멀티모달 분석",
        "scale": "주행영상 + CAN + 상황 텍스트",
        "labels": ["위험 상황", "급제동", "급가속"],
        "format": "영상 + 시계열 + 텍스트",
        "note": "멀티모달 융합 모델 학습 가능",
    },
    {
        "id": "aihub_construction_risk", "name": "AI-Hub 건설현장 위험상태",
        "source": "AI-Hub", "purpose": "안전장구·추락·협착 전조 감지",
        "scale": "건설현장 CCTV",
        "labels": ["안전모", "추락위험", "협착"],
        "format": "영상 + BBox",
        "note": "현재 프로젝트의 산업현장 분석과 직접 연동 가능",
    },
    {
        "id": "kosis_construction_objects", "name": "국토안전관리원 위험객체 13종",
        "source": "공공데이터포털", "purpose": "건설기계·작업자·안전시설물 인식",
        "scale": "13종 객체 위치·위험도",
        "labels": ["건설기계", "작업자", "안전시설물"],
        "format": "이미지 + BBox + 위험도",
        "note": "지게차 등 건설기계 정확도 개선에 적합",
    },
    {
        "id": "dota", "name": "DoTA 교통이상탐지",
        "source": "해외 오픈", "purpose": "사고 구간 시공간 탐지",
        "scale": "블랙박스 영상 다수",
        "labels": ["사고 구간", "원인 객체", "사고 유형"],
        "format": "영상 + Temporal Localization",
        "note": "사고 전·중·후 시간적 분석 학습에 적합",
    },
    {
        "id": "ccd", "name": "CCD Car Crash Dataset",
        "source": "해외 오픈", "purpose": "차량 충돌 분석",
        "scale": "사고 직전/직후 프레임 + 기상·조도",
        "labels": ["충돌", "사고 주체", "조건"],
        "format": "프레임 + 메타데이터",
        "note": "충돌 판정 규칙 보강에 활용",
    },
    {
        "id": "hf_car_accident", "name": "Hugging Face Car Accident Video",
        "source": "Hugging Face", "purpose": "스마트시티 차량 충돌",
        "scale": "약 5,000 클립",
        "labels": ["충돌 여부"],
        "format": "영상 클립",
        "note": "비디오 분류 모델 학습 가능",
    },
    {
        "id": "ucf_crime", "name": "UCF-Crime / ShanghaiTech",
        "source": "해외 오픈", "purpose": "폭행·화재·쓰러짐 등 이상행동",
        "scale": "CCTV 이상행동 벤치마크",
        "labels": ["정상", "폭행", "쓰러짐", "화재", "절도"],
        "format": "영상 + 이상 구간",
        "note": "현재 목업 사고 유형을 실제 이상탐지로 대체 가능",
    },
]


def catalog() -> dict[str, Any]:
    return {
        "datasets": CATALOG,
        "importDir": str(IMPORT_DIR),
        "note": "데이터 자체는 포함되지 않습니다. 각 플랫폼에서 내려받아 importDir에 넣은 뒤 변환하세요.",
    }


def imported() -> list[dict[str, Any]]:
    items = []
    for p in sorted(IMPORT_DIR.iterdir()) if IMPORT_DIR.exists() else []:
        if p.is_dir():
            files = list(p.rglob("*"))
            items.append({
                "name": p.name, "path": str(p),
                "files": len([f for f in files if f.is_file()]),
            })
    return items


def guide(dataset_id: str) -> dict[str, Any]:
    ds = next((d for d in CATALOG if d["id"] == dataset_id), None)
    if not ds:
        return {"error": "unknown dataset", "available": [d["id"] for d in CATALOG]}
    target = IMPORT_DIR / dataset_id
    target.mkdir(parents=True, exist_ok=True)
    return {
        **ds,
        "localPath": str(target),
        "steps": [
            f"1. {ds['source']}에서 데이터 이용 신청/다운로드",
            f"2. 다운로드 파일을 {target} 에 저장",
            "3. 프레임별 라벨을 COCO/YOLO 형식으로 변환",
            "4. 학습 파이프라인에서 해당 데이터셋 경로를 지정해 재학습",
        ],
        "privacy": "번호판·얼굴 비식별화 적용 여부 확인 필요",
    }
