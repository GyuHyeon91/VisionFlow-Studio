# VisionFlow Studio 데이터 카탈로그

웹에 구성된 데이터의 **종류 · 경로 · 생성 주체 · 연결 API**를 정리한 문서입니다.
동일 내용을 앱의 **「데이터 카탈로그」** 탭과 `GET /api/data-catalog`에서 확인할 수 있습니다.

- 기준 경로: 프로젝트 루트 (`C:\Users\mbc\Desktop\학생방\박규현\visionflow-studio`)
- 상태: `exists`(파일/폴더 있음) · `pending`(아직 생성 전) · `memory`(메모리 상주)
- 외부 데이터셋 카탈로그: `GET /api/external-datasets`, 가져오기 경로는 `.data/datasets/external/`

## 1. 설정

| 데이터 | 경로 | 종류 | 생성 주체 | 연결 API | 상태 |
|---|---|---|---|---|---|
| 중앙 설정 | `configs/app.config.json` | JSON | SSOT | `GET /api/config` | exists |
| 설정 스키마 | `configs/app.config.schema.json` | JSON Schema | 정의 | - | exists |
| ByteTrack 설정 | `services/fastapi/app/custom_bytetrack.yaml` | YAML | 프로젝트 정의 | - | exists |

## 2. 영상

| 데이터 | 경로 | 종류 | 생성 주체 | 연결 API |
|---|---|---|---|---|
| 업로드 영상 보존 | `services/.data/uploads/` | MP4 | 사용자 업로드 | `POST /api/analyze-video` |
| 위험 클립 | `services/.data/clips/` | AVI | 사고 감지 시 자동 저장 | `GET /api/clips` |

## 3. 모델

| 데이터 | 경로 | 종류 | 생성 주체 | 연결 API |
|---|---|---|---|---|
| 커스텀 모델 | `services/.models/custom.pt` | YOLO 가중치 | 학습 파이프라인 | `POST /api/model/use` |
| 사전학습 모델 | `services/.models/yolov8s.pt` | YOLO 가중치 | Ultralytics | `POST /api/model/set` |
| ONNX 추론 모델 | `services/.models/*_320.onnx`, `*_640.onnx` | ONNX | 자동 export | - |

## 4. 학습

| 데이터 | 경로 | 종류 | 생성 주체 | 연결 API |
|---|---|---|---|---|
| 건설현장 데이터셋 | `services/.models/datasets/construction/` | YOLO 라벨+이미지 | 영상에서 자동 구축 | `GET /api/dataset/analyze` |
| 하드 네거티브 | `services/.models/datasets/active_negative/` | 빈 라벨 이미지 | 액티브 러닝 | `GET /api/active-learning` |
| 오탐 신고 | `services/.data/feedback.jsonl` | JSONL | UI ✕ 신고 | `GET /api/feedback/zones` |
| 행동 패턴 | `services/.data/behavior_dataset/patterns.jsonl` | JSONL | YOLO Pose 추출 | `GET /api/behavior-dataset/stats` |
| 외부 데이터셋 | `services/.data/datasets/external/` | 카탈로그/가이드 | AI-Hub·UCF-Crime 등 | `GET /api/external-datasets` |

## 5. 분석 결과

| 데이터 | 경로 | 종류 | 생성 주체 | 연결 API |
|---|---|---|---|---|
| 이벤트 로그 | `services/.data/events.jsonl` | JSONL | 프레임 분석 | `GET /api/events` |
| 시계열 지표 | `services/.data/metrics.db` | SQLite | 분석 결과 집계 | `GET /api/metrics` |
| 정확도 평가 | `services/.data/evaluation` | 지표(메모리) | 사용자 검토 | `GET /api/evaluation` |

## 6. 외부 공개 데이터셋 (8종)

| ID | 이름 | 출처 | 용도 |
|---|---|---|---|
| `aihub_traffic_accident` | AI-Hub 교통사고 영상 | AI-Hub | 사고 유형 분류·과실 비율 |
| `aihub_driving_habit` | AI-Hub 사고위험 운전습관 | AI-Hub | 위험 주행 멀티모달 분석 |
| `aihub_construction_risk` | AI-Hub 건설현장 위험상태 | AI-Hub | 안전장구·추락·협착 전조 |
| `kosis_construction_objects` | 국토안전관리원 위험객체 13종 | 공공데이터포털 | 건설기계·작업자 인식 |
| `dota` | DoTA 교통이상탐지 | 해외 오픈 | 사고 구간 시공간 탐지 |
| `ccd` | CCD Car Crash Dataset | 해외 오픈 | 차량 충돌 분석 |
| `hf_car_accident` | Hugging Face Car Accident Video | Hugging Face | 스마트시티 차량 충돌 |
| `ucf_crime` | UCF-Crime / ShanghaiTech | 해외 오픈 | 폭행·화재·쓰러짐 등 이상행동 |

> 데이터 자체는 포함되지 않습니다. 각 플랫폼의 이용약관·인증 후 내려받아
> `services/.data/datasets/external/<dataset_id>/`에 넣고 변환해 사용합니다.

## 7. 웹 UI 동작

- 사이드바 **「데이터 카탈로그」** 탭에서 조회
- 그룹별 `DataCard` 카드 — 설명 문구와 눈 아이콘(숨김/표시) 제공
- 각 행: 이름 · 종류 배지 · 생성 상태 · 상대 경로(복사 버튼) · 설명 · 생성 주체 · 연결 API
- 상단 개요 카드: 항목 수 · 그룹 수 · 외부 데이터셋 수 · 프로젝트 루트 경로
- 백엔드 미실행 시 오류 카드와 "다시 시도" 버튼 표시
