# VisionFlow Studio

영상 기반 **데이터 분석 / 인물 행동 감지 / 상황별 조치 권고**를 하나의 파이프라인으로 연결한 웹 스튜디오입니다.

> ⚠️ **독립 실행 프로젝트**: 다른 프로젝트와 연동하지 않으며, 포트·주소·설정·의존성을 공유하지 않습니다.
> 자세한 내용은 [`docs/ISOLATION.md`](docs/ISOLATION.md) 참조.

## 링크

- **GitHub**: https://github.com/GyuHyeon91/VisionFlow-Studio.git
- **작업일지(Notion)**: https://app.notion.com/p/41d10b5d185380a4bf4ec755b8d57ac4?source=copy_link

## 작업 위치

```
C:\Users\mbc\Desktop\학생방\박규현\visionflow-studio
```

## 전용 주소 (다른 프로젝트와 겹치지 않음)

| 컴포넌트 | 옵션 | 주소 |
|---|---|---|
| 기준 웹 앱 (React) | `frontend=react` | http://localhost:53710 |
| Next.js 앱 | `frontend=next` | http://localhost:53711 |
| Vue 앱 | `frontend=vue` | http://localhost:53712 |
| FastAPI 백엔드 | `backend=fastapi` | http://localhost:53720 |
| Express 백엔드 | `backend=express` | http://localhost:53721 |

포트 충돌 확인:

```bash
npm run ports:check
```

## 빠른 시작

```bash
# 1) 의존성 설치 (이 프로젝트 폴더 내부에만 설치됨)
npm install

# 2) 포트 충돌 검사
npm run ports:check

# 3) 기준 웹 앱 실행
npm run dev        # http://localhost:53710
```

최초 접속 시에는 데모 분석이 실행되지 않습니다. 영상을 업로드하거나 명시적으로 분석을 실행한 뒤에만 파이프라인이 동작합니다.

## 주요 기능

### 1. 파이프라인 구조
- 영상 입력 → 프레임 디코딩 → 인물 감지 → 행동 인식 → 상황 판단 → 조치 권고 / 리포트
- 노드 드래그 배치, 추가/삭제/라벨 수정/활성 토글, 노드 간 연결 관리
- 위상 정렬 기반 병렬 실행 (동시 실행 수 옵션 반영)
- **노드 생성·수정·삭제 또는 옵션 변경 시 그래프가 새 버전(vN)으로 자동 재구성되고 재분석**

### 2. 영상 기준 데이터 분석 결과 출력
- 위험/준수 점수, 평균 신뢰도, 감지 인물 수 메트릭 카드
- 시간대별 인구 밀도 AreaChart, 움직임 강도 BarChart, 혼잡 히트맵, RadialGauge
- 프레임·처리 시간·엔진 정보 표시

### 3. 인물 행동 감지 및 상황별 조치
- 영상 프레임에 Bounding Box / 트랙 ID / 신뢰도 오버레이
- 행동 이벤트를 심각도(정보·주의·경고·위험)별 필터링
- 감지 상황에 맞는 조치 카드(우선순위, 담당자, 예상 시간, 자동화 여부, 실행 절차)

### 4. 기능별 옵션 (독립 선택)
| 그룹 | 옵션 |
|---|---|
| 모듈 | 프론트엔드(`react/next/vue`), 분석 엔진(`mock/real/hybrid`), 백엔드(`none/fastapi/express`), 디자인(`aurora/midnight/light/cyber`), 언어(`ko/en`) |
| 성능 조절 | 해상도, 분석 FPS, 동시 실행 수, 배치 크기, 하드웨어 가속, 적응형 품질 |
| 정확도 보완 | 신뢰도 임계값, 인물 감지 민감도, NMS 임계값, 행동 모델 프로파일, 시계열 평활화, Re-ID |

### 5. 고급 시각화 / 디자인 (기능 구현)
- 4종 프리미엄 테마 전환, 글래스모피즘·그라데이션 테두리·그리드 배경
- Framer Motion 기반 페이지/토스트 전환, SVG 게이지·스파크라인·히트맵
- 경고 토스트, 인터랙티브 호버 효과, 반응형 그리드

### 6. 현장 학습 데이터 관리
- **클립 수동 라벨링**: 위험 감지로 저장된 클립의 프레임을 탐색하며 드래그로 BBox를 수정하고 YOLO 라벨로 저장 (`/api/clips/**`)
- **실제 건설현장 데이터셋**: 원본 이미지/라벨 폴더를 가져와 train/val로 분할하고, 사고·정상 비율·클래스 분포·라벨 오류를 학습 전에 점검 (`/api/dataset/analyze`, `/api/dataset/import-dir`)
- 하드 네거티브·합성 데이터와 함께 커스텀 YOLO 미세조정에 사용
- 단계별 전체 이력은 [`docs/WORKLOG.md`](docs/WORKLOG.md), 요약은 [`docs/WORKLOG_SUMMARY.md`](docs/WORKLOG_SUMMARY.md)

### 7. 기능별 안내 팝업 (옵션)
- 처음 방문하는 탭에서 기능 안내 팝업 자동 표시 — 옵션/설정에서 OFF 가능, 상단 "안내" 버튼으로 언제든 재열기
- 탭별 목적·사용 순서·주요 데이터·주의 사항·관련 데이터 경로 출력
- 방문 기록/옵션은 브라우저 로컬 저장소(`visionflow-studio:guide`)에 보관

### 8. 데이터 카탈로그 UI
- `GET /api/data-catalog`·`GET /api/external-datasets` 결과를 웹에서 그룹별 카드로 출력
- 데이터 종류·상대 경로·생성 주체·연결 API·생성 상태(exists/pending/memory) 표시, 경로 복사 버튼 제공
- 상세 내용은 [`docs/DATA_CATALOG.md`](docs/DATA_CATALOG.md) 참조

## 백엔드 실행 (선택)

```bash
# Python FastAPI
pip install -r services/fastapi/requirements.txt
npm run backend:fastapi     # :53720

# Node Express
npm run backend:express     # :53721
```

프론트엔드의 `options.analysisEngine`을 `real` 또는 `hybrid`로, `options.backend`를 사용할 백엔드로 변경하면 해당 API를 호출합니다. (`none` + `mock` 조합은 백엔드 없이 완전히 독립 동작)

## 폴더 구조

```
visionflow-studio/
├─ configs/                  # 단일 진실 공급원(app.config.json) + 스키마
├─ scripts/check-ports.mjs   # 포트 충돌 검사
├─ docs/                     # 격리/아키텍처 문서
├─ apps/
│  ├─ web-react/             # 기준 앱 (전체 기능 구현, :53710)
│  ├─ web-next/              # Next.js 옵션 (:53711)
│  └─ web-vue/               # Vue 옵션 (:53712)
└─ services/
   ├─ fastapi/               # Python CV 백엔드 (:53720)
   └─ express/               # Node 백엔드 (:53721)
```

## 빌드

```bash
npm run build                 # React 기준 앱
npm run build -w apps/web-vue # Vue 앱
npm run build -w apps/web-next# Next 앱
```
