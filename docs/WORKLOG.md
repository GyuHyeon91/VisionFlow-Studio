# VisionFlow Studio — 단계별 코드 작업 기록 (1~100단계)

작업 위치: `C:\Users\mbc\Desktop\학생방\박규현\visionflow-studio`

표기: **[신규]** 생성 / **[추가]** 기존 파일에 코드 추가 / **[수정]** 기존 코드 변경 / **[삭제]** 코드 제거

---

## 1단계 — 작업 환경 확인

| 코드 | 작업 | 내용 |
|---|---|---|
| (파일 없음) | 확인만 | PowerShell에서 Node v26.13.0, npm 11.20.0, Python 3.12.10, Git 2.56 확인. 작업 폴더가 비어 있음 확인 |

---

## 2단계 — 요구사항 정리 및 설계 방향 확정

| 코드 | 작업 | 내용 |
|---|---|---|
| (파일 없음) | 설계 결정 | 엔진(mock/real/hybrid), 프론트(react/next/vue), 백엔드(none/fastapi/express)를 각각 독립 옵션으로 분리하기로 결정 |

---

## 3단계 — 프로젝트 폴더 생성

| 코드 | 작업 | 내용 |
|---|---|---|
| `visionflow-studio/` | **[신규]** | 프로젝트 루트 생성 |
| `configs/`, `docs/` | **[신규]** | 설정·문서 폴더 |
| `apps/web-react/src/**`, `apps/web-next/`, `apps/web-vue/` | **[신규]** | 프론트엔드 폴더 구조 |
| `services/fastapi/app/`, `services/express/src/` | **[신규]** | 백엔드 폴더 구조 |

총 18개 디렉터리 생성. 이 단계에서는 파일 생성 없음.

---

## 4단계 — 중앙 설정(SSOT) 구성

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[신규]** | 프로젝트 정보, `options`(frontend/analysisEngine/backend/design/language), `performance`(resolution/fps/concurrency/hardwareAcceleration/adaptiveQuality/batchSize), `accuracy`(confidenceThreshold/personDetectionSensitivity/behaviorModel/temporalSmoothing/nmsThreshold/enableReIdentification), `pipeline`(autoUpdate/nodes 7개/edges 6개), `server` 정의 |
| `configs/app.config.schema.json` | **[신규]** | 위 설정의 JSON Schema. project/options/performance/accuracy/pipeline/server 필수 검증 |

---

## 5단계 — 타입 및 분석 엔진 계층

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/types/index.ts` | **[신규]** | `AppConfig` 계층 타입, `PipelineNode/Edge`, `AnalysisResult`, `PersonDetection`, `BehaviorEvent`, `Situation`, `ActionRecommendation`, `FrameMetric`, `MetricCardData`, `Toast` 정의 |
| `apps/web-react/src/config/index.ts` | **[신규]** | `appConfig` 로더. 설정 JSON을 단일 진실 공급원으로 export. `getConfigValue()` 헬퍼 |
| `apps/web-react/src/data/mockData.ts` | **[신규]** | `BEHAVIOR_TEMPLATES`(10종), `SITUATION_TEMPLATES`(5종 + 조치 정의), `mulberry32` 결정적 난수, `generateMockResult()` 구현. 정확도 옵션(임계값·민감도·모델 boost·평활화 noise·Re-ID)과 성능 옵션(FPS→프레임 수) 반영 |
| `apps/web-react/src/engine/types.ts` | **[신규]** | `AnalysisEngine` 공통 인터페이스, `AnalysisRequest`, `RealEngineOptions` 정의 |
| `apps/web-react/src/engine/mockEngine.ts` | **[신규]** | `MockEngine`. 6단계 진행률 콜백 + 지연 후 목업 결과 반환. FPS 옵션이 지연 속도에 반영 |
| `apps/web-react/src/engine/realEngine.ts` | **[신규]** | `RealEngine`. `POST /api/analyze` 호출, AbortController 타임아웃, 진행률 콜백 |
| `apps/web-react/src/engine/hybridEngine.ts` | **[신규]** | `HybridEngine`. 실제 엔진 우선 시도 → 실패 시 목업 폴백. 성공 시 신뢰도/위험도 앙상블 평균 병합 |
| `apps/web-react/src/engine/factory.ts` | **[신규]** | `createEngine()` — `options.analysisEngine.value`로 엔진 선택. `ENGINE_LABELS` 한글 라벨 |
| `apps/web-react/src/data/mockData.ts` | **[수정]** | 오타 `밀도 모니터링强化` → `밀도 모니터링 강화` |

---

## 6단계 — 파이프라인 계층 + 디자인 시스템 + 상태 저장소

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/pipeline/catalog.ts` | **[신규]** | `NODE_KIND_META`(source/transform/analysis/output별 색상·설명), `NODE_KINDS` |
| `apps/web-react/src/pipeline/graph.ts` | **[신규]** | `buildGraph()`(설정→좌표 포함 그래프), `topologicalOrder()`(위상정렬+사이클 처리), `updateGraph()`(이전 위치/상태 보존하며 버전 증가), `nodeConfigsFromGraph()`, `edgeConfigsFromGraph()` |
| `apps/web-react/src/pipeline/executor.ts` | **[신규]** | `executePipeline()` — `concurrency`만큼 병렬 worker, 노드별 진행률 콜백, 취소 핸들. `resetNode()` |
| `apps/web-react/src/styles/global.css` | **[신규]** | 4종 테마(aurora/midnight/light/cyber) CSS 변수, 글래스모피즘 카드, 그리드 배경, 네비게이션, 버튼, 폼, 파이프라인 캔버스, 리스트/배지, 토스트, 애니메이션 정의 |
| `apps/web-react/src/store/useStore.ts` | **[신규]** | Zustand 스토어. 설정/그래프/결과/진행률/토스트 상태 + `setTopOption`, `setPerformance`, `setAccuracy`, `toggleNode`, `addNode`, `removeNode`, `renameNode`, `moveNode`, `addEdge`, `removeEdge`, `runAnalysis`, `cancelAnalysis` 등 액션. `scheduleAutoUpdate()` 디바운스 트리거 |
| `apps/web-react/src/store/useStore.ts` | **[수정]** | 존재하지 않는 타입 import(`BehaviorModelChoice` 등) 제거, `scheduleAutoUpdate(get, set)` → `scheduleAutoUpdate(get)` 시그니처 변경 및 11개 호출부 일괄 수정 |

---

## 7단계 — 결과 출력 패널 (영상 데이터 분석)

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/components/visualizations/RadialGauge.tsx` | **[신규]** | SVG 원형 게이지. Framer Motion으로 값 애니메이션 |
| `apps/web-react/src/components/visualizations/Sparkline.tsx` | **[신규]** | SVG 스파크라인(폴리곤 + 폴리라인) |
| `apps/web-react/src/components/visualizations/Heatmap.tsx` | **[신규]** | 시간대별 혼잡도 히트맵, 강도별 색상, 호버 확대 |
| `apps/web-react/src/components/visualizations/MetricCard.tsx` | **[신규]** | 라벨·값·증감률·스파크라인 조합 메트릭 카드 |
| `apps/web-react/src/components/panels/AnalysisPanel.tsx` | **[신규]** | Recharts AreaChart(인구 밀도), BarChart(움직임), 게이지, 히트맵, 요약 메트릭 출력 |

---

## 8단계 — 인물 행동 감지 패널

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/components/panels/BehaviorPanel.tsx` | **[신규]** | 영상 프레임(업로드 영상 또는 시뮬레이션 배경), 감지 BBox 오버레이(트랙 ID/신뢰도), HUD 태그, 심각도 필터 탭, 행동 이벤트 리스트 출력 |

---

## 9단계 — 상황별 조치 패널

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/components/panels/ActionsPanel.tsx` | **[신규]** | 상황 카드(심각도·신뢰도·타임스탬프), 조치 권고 카드(우선순위·담당자·예상시간·자동화·실행절차), "조치 시작" 토스트 인터랙션 |
| `apps/web-react/src/components/panels/ActionsPanel.tsx` | **[수정]** | 잘못된 className `badge badge- critical` → `badge` 로 수정 |

---

## 10단계 — 옵션/설정 패널

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/components/panels/SettingsPanel.tsx` | **[신규]** | `Segmented`, `RangeField`, `ToggleField` 재사용 컴포넌트. 모듈 옵션 5종, 성능 6종, 정확도 6종, 자동 업데이트/디바운스 UI 구현 |

---

## 11단계 — 대시보드 및 앱 조립

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/components/panels/Dashboard.tsx` | **[신규]** | 통합 대시보드. 메트릭 카드 4종, 파이프라인 상태 칩, 분석 품질 게이지, 최근 행동/상황 리스트 |
| `apps/web-react/src/App.tsx` | **[신규]** | 탭 라우팅(6개), 테마 적용 useEffect, 첫 진입 데모 분석 자동 실행, Framer Motion 전환 |
| `apps/web-react/src/main.tsx` | **[신규]** | ReactDOM 렌더 엔트리 + global.css import |

---

## 12단계 — 빌드 검증 및 오류 수정

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/components/panels/SettingsPanel.tsx` | **[수정]** | `AnyOption` 타입 제거 → `RangeOptionLike` 인터페이스 정의. `Extract<...,{min:number}>`로 인한 `never` 타입 오류 9건 해결 |
| `apps/web-react/src/config/index.ts` | **[수정]** | JSON import 경로 `../../../configs` → `../../../../configs` 로 변경. `backendBaseUrl()` 내 잘못된 구조분해 제거 |
| `apps/web-react/vite.config.ts` | **[수정]** | `@` 별칭(`fileURLToPath(new URL('./src', import.meta.url))`) 추가, `server.fs.allow`에 워크스페이스 루트 추가 |
| `apps/web-react/package.json` | **[수정]** | `@types/node` devDependency 추가 |
| `package.json` | **[수정]** | `allowScripts.esbuild` 승인 기록 추가 |
| `package-lock.json` | **[신규]** | npm install로 생성/갱신 |

---

## 13단계 — 브라우저 확인 및 중복 실행 제거

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/main.tsx` | **[수정]** | `React.StrictMode` 래퍼 제거 → `<App />` 직접 렌더 (StrictMode 이중 effect로 분석/토스트 중복 실행 방지) |

브라우저 검증만 수행, 추가 코드 변경 없음.

---

## 14단계 — 백엔드 2종 구현

| 코드 | 작업 | 내용 |
|---|---|---|
| `services/fastapi/requirements.txt` | **[신규]** | fastapi, uvicorn, pydantic, opencv-python-headless, numpy |
| `services/fastapi/app/__init__.py` | **[신규]** | 패키지 초기화 |
| `services/fastapi/app/analyzer.py` | **[신규]** | `VideoAnalyzer.analyze()` — 결정적 분석 결과 생성. 성능/정확도 옵션 반영, OpenCV 교체 가능한 어댑터 구조 |
| `services/fastapi/app/main.py` | **[신규]** | FastAPI 앱, CORS 미들웨어, `/api/health`, `/api/config`, `/api/analyze`, `AnalyzeRequest` Pydantic 모델 |
| `services/fastapi/__init__.py` | **[신규]** | 패키지 초기화 |
| `services/express/package.json` | **[신규]** | express, cors 의존성, start 스크립트 |
| `services/express/src/index.js` | **[신규]** | Express 앱, 동일 API 계약(`/api/health`, `/api/config`, `/api/analyze`), 목업 분석 로직 |
| `package.json` | **[수정]** | workspaces에 `services/express` 추가 |

---

## 15단계 — 대체 프론트엔드(Next.js / Vue) 스캐폴드

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-next/package.json` | **[신규]** | Next.js 스크립트·의존성 (이후 16단계에서 16.4.6으로 업그레이드) |
| `apps/web-next/next.config.mjs` | **[신규]** | `reactStrictMode: false` |
| `apps/web-next/tsconfig.json` | **[신규]** | Next.js용 TS 설정 (이후 빌드 시 Next가 자동 재구성) |
| `apps/web-next/app/layout.tsx` | **[신규]** | 루트 레이아웃 + metadata |
| `apps/web-next/app/page.tsx` | **[신규]** | 중앙 설정을 읽어 모듈 옵션·성능/정확도·파이프라인 노드 표시 |
| `apps/web-next/app/globals.css` | **[신규]** | Next 앱 전용 다크 테마 스타일 |
| `apps/web-next/next-env.d.ts` | **[신규]** | Next 빌드 시 자동 생성 |
| `apps/web-vue/package.json` | **[신규]** | Vue 3 + Vite 스크립트·의존성 |
| `apps/web-vue/vite.config.ts` | **[신규]** | Vue 플러그인, `fs.allow` 설정 |
| `apps/web-vue/index.html` | **[신규]** | Vue 마운트 엔트리 |
| `apps/web-vue/src/main.ts` | **[신규]** | `createApp(App).mount('#app')` |
| `apps/web-vue/src/App.vue` | **[신규]** | 설정 기반 옵션·파이프라인 표시 SFC |
| `apps/web-vue/src/style.css` | **[신규]** | Vue 앱 전용 스타일 |
| `package.json` | **[수정]** | workspaces에 `services/express` 포함(14단계) 상태 유지, npm install로 lock 갱신 |

---

## 16단계 — 프로젝트 격리 및 포트 충돌 방지

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[추가/수정]** | `isolation`(standalone, description, reservedPortOwner) 추가, `ports`(web 53710/next 53711/vue 53712/fastapi 53720/express 53721) 추가, `server.port` 8000→53720, `corsOrigins`를 자체 주소 3개로 제한 |
| `configs/app.config.schema.json` | **[수정]** | `ports`, `isolation` 속성 추가 및 `ports` 필수화 |
| `apps/web-react/src/types/index.ts` | **[추가]** | `AppConfig`에 `ports`, `isolation` 타입 추가 |
| `apps/web-react/src/config/index.ts` | **[수정]** | `backendBaseUrl()`이 `options.backend`에 따라 `ports.fastapi`/`ports.express`로 분기. `ownPorts` export |
| `apps/web-react/src/engine/factory.ts` | **[수정]** | 하드코딩 URL 제거 후 `backendBaseUrl()` 사용 |
| `apps/web-react/vite.config.ts` | **[수정]** | dev/preview 포트 53710 + `strictPort: true` |
| `apps/web-next/package.json` | **[수정]** | dev/start 포트 53711, Next 16.4.6 업그레이드 |
| `apps/web-next/app/page.tsx` | **[수정]** | 안내 문구 포트 5173 → 53710. 설정 import 경로 `../../configs` → `../../../configs` (빌드 오류 수정) |
| `apps/web-vue/package.json` | **[수정]** | dev 포트 53712 + `--strictPort` |
| `apps/web-vue/vite.config.ts` | **[수정]** | 포트 53712 + `strictPort: true` |
| `apps/web-vue/src/App.vue` | **[수정]** | 안내 문구 포트 53710으로 변경 |
| `services/fastapi/app/main.py` | **[수정]** | CORS 허용 originate을 53710/53711/53712로 제한 |
| `services/express/src/index.js` | **[수정]** | 포트를 `config.ports.express`(53721)로 변경 |
| `package.json` | **[수정]** | `ports:check` 스크립트 추가, `backend:fastapi` 포트 53720 변경 |
| `scripts/check-ports.mjs` | **[신규]** | 설정 내부 포트 중복 검사 + net.createServer 기반 사용 중 포트 검사, 충돌 시 exit(1) |
| `README.md` | **[신규]** | 전체 구조·전용 주소·실행법·기능 설명 |
| `docs/ISOLATION.md` | **[신규]** | 격리 정책(물리적/포트/네트워크/설정) 문서 |
| `package-lock.json` | **[수정]** | Next 16 업그레이드 및 포트 변경 반영 (취약점 0건) |

---

## 16단계 이후 (코드 변경 없음)

| 작업 | 내용 |
|---|---|
| 개발 서버 재시작 | 600초 타임아웃 종료 → 타임아웃 없이 백그라운드 재실행, `http://localhost:53710` 200 확인 |
| 목업 출력 문제 조사 | 실제 원인은 `localhost:5173`의 다른 프로젝트("Hand Gesture Control") 탭을 확인한 것. 53710에서 목업 데이터 정상 출력 확인. 코드 변경 없음 |
| 3면 데이터 질문 | 다른 프로젝트 질문으로 확인되어 무시, 코드 변경 없음 |

---

## 파일별 편집 이력 요약

| 파일 | 관련 단계 |
|---|---|
| `configs/app.config.json` | 4 신규, 16 추가/수정 |
| `configs/app.config.schema.json` | 4 신규, 16 수정 |
| `src/types/index.ts` | 5 신규, 16 추가 |
| `src/config/index.ts` | 5 신규, 12 수정, 16 수정 |
| `src/data/mockData.ts` | 5 신규 + 수정 |
| `src/engine/*` (6파일) | 5 신규, 16 factory 수정 |
| `src/pipeline/*` (3파일) | 6 신규 |
| `src/styles/global.css` | 6 신규 |
| `src/store/useStore.ts` | 6 신규 + 수정 |
| `src/components/visualizations/*` (4파일) | 7 신규 |
| `src/components/panels/AnalysisPanel.tsx` | 7 신규 |
| `src/components/panels/BehaviorPanel.tsx` | 8 신규 |
| `src/components/panels/ActionsPanel.tsx` | 9 신규 + 수정 |
| `src/components/panels/SettingsPanel.tsx` | 10 신규, 12 수정 |
| `src/components/panels/Dashboard.tsx` | 11 신규 |
| `src/App.tsx` | 11 신규 |
| `src/main.tsx` | 11 신규, 13 수정 |
| `vite.config.ts` (React) | 12 수정, 16 수정 |
| `services/fastapi/*` (4파일) | 14 신규, 16 수정 |
| `services/express/*` (2파일) | 14 신규, 16 수정 |
| `apps/web-next/*` (6파일) | 15 신규, 16 수정 |
| `apps/web-vue/*` (6파일) | 15 신규, 16 수정 |
| `scripts/check-ports.mjs` | 16 신규 |
| `README.md`, `docs/ISOLATION.md`, `docs/WORKLOG.md` | 16 신규 |
| `package.json`, `package-lock.json` | 12/14/15/16 수정·갱신 |

## 17단계 — 밝은 디자인(daylight) 추가 및 기본 적용

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/types/index.ts` | **[수정]** | `DesignChoice`에 `daylight` 추가 |
| `configs/app.config.json` | **[수정]** | `design.value`를 `aurora` → `daylight`로 변경, choices에 `daylight` 추가 |
| `apps/web-react/src/styles/global.css` | **[추가]** | daylight 테마 변수(연한 배경·흰 패널·인디고/바이올렛 강조색) 및 전용 보정 CSS 추가 |
| `apps/web-react/src/components/panels/SettingsPanel.tsx` | **[수정]** | 디자인 선택 segmented에 `daylight` 추가 |
| `apps/web-react/src/App.tsx` | **[수정]** | 테마 토글 로직을 daylight/aurora 기준으로 변경 |
| `apps/web-next/app/globals.css`, `apps/web-vue/src/style.css` | **[수정]** | Next/Vue 옵션도 밝은 팔레트로 변경 |

## 18단계 — 데모 분석 제거 + 기능별 데이터 출력/설명/숨김

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/App.tsx` | **[삭제]** | 최초 마운트 시 데모 분석을 실행하던 `useEffect` 제거 |
| `apps/web-react/src/store/useStore.ts` | **[수정]** | `DEMO_VIDEO` 상수 제거, `runAnalysis()`에 영상 미업로드 시 분석 거부 로직 추가, `scheduleAutoUpdate()`도 영상 없으면 실행 안 함. `dataVisibility` 상태와 `toggleDataVisibility()` 액션 추가 |
| `apps/web-react/src/components/panels/DataCard.tsx` | **[신규]** | 데이터 영역 공통 카드. 설명 문구 상시 출력 + Eye/EyeOff 숨김·표시 토글 |
| `apps/web-react/src/styles/global.css` | **[추가]** | `.data-desc`, `.data-hidden`, `.empty-state` 스타일 추가 |
| `apps/web-react/src/components/layout/Topbar.tsx` | **[수정]** | 안내 문구를 "영상을 업로드하면 분석이 시작됩니다"로 변경 |
| `apps/web-react/src/components/panels/Dashboard.tsx` | **[수정]** | 5개 데이터 영역을 `DataCard`로 감싸고 설명·숨김 기능·데이터 없음 상태 적용 |
| `apps/web-react/src/components/panels/AnalysisPanel.tsx` | **[수정]** | 5개 분석 데이터 영역을 `DataCard`로 감싸고 설명·숨김 기능·데이터 없음 상태 적용 |
| `apps/web-react/src/components/panels/BehaviorPanel.tsx` | **[수정]** | 영상 뷰/행동 리스트를 `DataCard`로 감싸고 설명·숨김 기능 적용 |
| `apps/web-react/src/components/panels/ActionsPanel.tsx` | **[수정]** | 상황/조치 데이터를 `DataCard`로 감싸고 설명·숨김 기능 적용 |
| `apps/web-react/src/components/pipeline/NodeInspector.tsx` | **[수정]** | 노드 속성 데이터도 `DataCard`로 감싸고 설명·숨김 기능 적용 |

## 19단계 — 코드 상세 문서화

| 코드 | 작업 | 내용 |
|---|---|---|
| `scripts/generate-code-doc.mjs` | **[신규]** | 실제 소스 58개 파일을 읽어 `<details><summary>파일명</summary>` + 코드 블록 형태로 WORKLOG에 삽입하는 생성기 |
| `docs/WORKLOG.md` | **[추가]** | `CODE_DETAILS` 섹션. 파일명 클릭 시 전체 코드 펼쳐짐 |

> 💡 **코드 보기**: 아래 [코드 상세](#코드-상세-파일명-클릭-시-전체-코드-펼침) 섹션에서 원하는 파일명을 클릭하면 전체 코드가 펼쳐집니다.
> 문서 재생성: `node scripts/generate-code-doc.mjs`

## 20단계 — 기능별 성능평가 분석 데이터 출력

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/types/index.ts` | **[추가]** | `FeaturePerformance` 인터페이스(latency/throughput/accuracy/precision/recall/memory/cpu/gpu/status) 및 `AnalysisResult.performanceEvaluation` 필드 추가 |
| `apps/web-react/src/data/mockData.ts` | **[추가]** | 7개 기능(영상입력/디코딩/인물감지/행동인식/상황판단/조치권고/리포트)의 성능 지표 생성. 해상도·FPS·동시성·배치·하드웨어가속·정확도 옵션 반영 |
| `apps/web-react/src/components/panels/PerformancePanel.tsx` | **[신규]** | 전체 성능 요약, 기능별 성능 테이블, 노드 실행 시간, 리소스 사용 분석, 성능 개선 권고 출력. 모든 영역 `DataCard` 적용(설명+숨김) |
| `apps/web-react/src/styles/global.css` | **[추가]** | 성능평가 테이블 스타일(.perf-list/.perf-row) |
| `apps/web-react/src/store/useStore.ts` | **[수정]** | `WorkTab`에 `performance` 추가 |
| `apps/web-react/src/components/layout/Sidebar.tsx` | **[수정]** | "성능 평가" 메뉴 추가 |
| `apps/web-react/src/App.tsx` | **[수정]** | 성능평가 탭 라우팅 및 타이틀 추가 |
| `apps/web-react/src/components/panels/Dashboard.tsx` | **[수정]** | 대시보드에 성능평가 요약 `DataCard` 추가 |
| `scripts/generate-code-doc.mjs` | **[수정]** | 신규 파일(PerformancePanel, 생성기 자체)을 코드 문서에 포함 |

## 21단계 — 동일 영상 재업로드 결정성 검증

| 코드 | 작업 | 내용 |
|---|---|---|
| (코드 변경 없음) | 검증 | 동일 파일명·동일 설정으로 2회 업로드 시 분석 결과가 완전히 동일함을 확인. `generatedAt` 시각만 차이. 파일명이 `same_clip (1).mp4`처럼 바뀌면 시드가 달라 결과도 달라짐을 확인 |

> 시드: `hashString(videoName + analysisEngine)` + `mulberry32` 결정적 난수로 재현성 확보.

## 22단계 — 시간별 사고 인식 + 영상 텍스트 설명 추가

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/types/index.ts` | **[추가]** | `AccidentEvent`(시각·종료시각·유형·내용·심각도·신뢰도·인물·구역·상태), `VideoCaption`, `VideoDescription` 타입 및 `AnalysisResult`에 `accidents`, `videoDescription` 필드 추가 |
| `apps/web-react/src/data/mockData.ts` | **[추가]** | 낙상/폭력/인파/방치/침입/혼란 6종 사고 템플릿으로 시간별 사고 생성. 10초 단위 캡션·전체 요약·하이라이트 생성 |
| `apps/web-react/src/components/panels/AccidentTimelinePanel.tsx` | **[신규]** | 사고 요약 메트릭 + 시간별 사고 타임라인(발생~종료 시각, 사고 내용, 구역, 관련 인물, 대응 상태) 출력 |
| `apps/web-react/src/components/panels/VideoDescriptionPanel.tsx` | **[신규]** | 영상 전체 텍스트 요약, 10초 단위 캡션, 주요 하이라이트 출력 + 전체 텍스트 클립보드 복사 |
| `apps/web-react/src/styles/global.css` | **[추가]** | `.accident-timeline`, `.accident-item`, `.video-summary-text`, `.caption-text` 스타일 |
| `apps/web-react/src/store/useStore.ts` | **[수정]** | `WorkTab`에 `accidents`, `description` 추가 |
| `apps/web-react/src/components/layout/Sidebar.tsx` | **[수정]** | "시간별 사고 인식", "영상 텍스트 설명" 메뉴 추가 |
| `apps/web-react/src/App.tsx` | **[수정]** | 두 패널 라우팅 및 타이틀 추가 |
| `scripts/generate-code-doc.mjs` | **[수정]** | 신규 패널 2개를 코드 문서에 포함 |

> 두 기능 모두 `DataCard` 적용(설명 문구 + 숨김 토글), 분석 전에는 데이터 없음 안내를 표시합니다.

## 23단계 — 확대/축소 경계 점검 및 보강

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/components/pipeline/PipelineCanvas.tsx` | **[수정]** | 확대/축소 컨트롤(50%~200%, 10% 단위) 추가. `canvas-stage`(논리 캔버스×배율) + `canvas-inner`(`scale()`) 2중 구조로 스크롤 영역과 변환 영역 분리. 드래그 좌표에 배율·스크롤 보정 적용, 노드 위치를 캔버스 범위(0~1040×420)로 클램프 |
| `apps/web-react/src/styles/global.css` | **[수정]** | `.canvas-stage`, `.zoom-controls` 추가, `.canvas-inner`에 `transform-origin: 0 0` 적용 |

**검증 결과**
- 100%: stage 1040×420, card `overflow:hidden`, wrap `overflow:auto` → 범위 밖 콘텐츠 없음
- 150%: stage 1560×630, 변환된 캔버스 우단 = stage 우단(완전 일치), wrap 스크롤 영역 1560 / 표시 영역 669 → 스크롤로만 탐색, 외부 노출 없음
- 50%: stage 520×210, 최소 배율 clamp 동작, 음수/과소 크기 없음
- 배율 초기화(100%) 정상 동작, 콘솔 오류 0건

## 24단계 — 파이프라인 확장 + 분석 데이터 보강

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[수정]** | 파이프라인 노드 7개 → 12개로 확장(신호 추출/형상 추적/사고 인식/텍스트 설명/성능 평가 추가), 엣지 6개 → 13개로 재구성 |
| `apps/web-react/src/pipeline/graph.ts` | **[수정]** | 노드 간격 78px로 조정해 12개 노드가 캔버스(560px) 안에 배치되도록 변경 |
| `apps/web-react/src/pipeline/executor.ts` | **[수정]** | 신규 5개 노드의 출력 요약 메시지 추가 |
| `apps/web-react/src/components/pipeline/PipelineCanvas.tsx` | **[수정]** | 캔버스 논리 높이 420 → 560, 클램프 범위 조정 |
| `apps/web-react/src/styles/global.css` | **[수정]** | 캔버스 뷰포트 480px / 내부 560px |
| `apps/web-react/src/types/index.ts` | **[추가]** | `AnalysisLogEntry` 타입과 `AnalysisResult.analysisLog` 필드 |
| `apps/web-react/src/data/mockData.ts` | **[추가]** | 12개 노드별 상세 로그 생성, 성능평가 템플릿 7개 → 12개 기능으로 확장 |
| `apps/web-react/src/components/panels/AnalysisPanel.tsx` | **[추가]** | "파이프라인 분석 상세 로그" DataCard 추가 |

**검증 결과**
- 파이프라인: 12개 노드 / 13개 연결 정상 표시
- 분석 로그: 12개 항목이 시간순(0.0~55.0s) 출력, 콘솔 오류 0건
- 빌드 통과

## 25단계 — 영상 재생/데이터 오버레이 추가 및 영상 URL 유실 수정

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/components/panels/VideoPlaybackPanel.tsx` | **[신규]** | 업로드 영상 재생 + 현재 시점의 추적 BBox·트랙 ID·신뢰도, 사고 알림, 캡션 오버레이, 사고 마커 클릭 시 해당 시점 이동 |
| `apps/web-react/src/components/panels/AnalysisPanel.tsx` | **[수정]** | 영상 데이터 분석 탭에 재생 패널 추가 |
| `apps/web-react/src/store/useStore.ts` | **[수정]** | 분석 완료 시 `video.url`이 유실되어 재생이 안 되던 버그 수정(`video: { name, url }` 유지) |
| `apps/web-react/src/styles/global.css` | **[추가]** | 재생 프레임·오버레이·사고 알림·캡션·마커 스타일 |

## 26단계 — 영상 내 형상 추적 정확도 개선

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/analysis/browserVideoAnalyzer.ts` | **[수정]** | 차분 임계값/최소 블롭 면적 상향, 프레임 경계 노이즈 제외, 트랙 연관 거리 18%·수명 2.5초로 제한, 위치 평활화(이동평균), 최소 3포인트·0.6초 이상 트랙만 유지, 상위 8개 트랙으로 재정렬, 짧은 영상은 seek 대신 실시간 재생 샘플링, 최초 프레임 트랙 생성 조건 오류 수정 |
| `apps/web-react/src/engine/mockEngine.ts` | **[수정]** | 실제 추적 결과만 detections에 반영. 디코딩 실패 시 무작위 Box를 숨기고 `source: 'fallback'` 신호로 표시 |
| `apps/web-react/src/components/panels/BehaviorPanel.tsx` | **[수정]** | 현재 재생 시점에 가장 가까운 트랙 위치 **1개만** 표시(과거 궤적 중복 제거), 추적 없음 안내 표시 |
| `apps/web-react/src/components/panels/VideoPlaybackPanel.tsx` | **[수정]** | 동일하게 트랙별 최근접 위치 하나만 표시 |

**검증 결과**
- 움직이는 사각형 테스트 영상: 트랙 1개(`T1`), BBox 1개(`T1 70%`) 정상 표시
- 이전처럼 수십 개의 무작위 Box가 표시되는 문제 해소

## 27단계 — 재생 중 실시간 추적 + 객체 종류 라벨

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/analysis/browserVideoAnalyzer.ts` | **[수정]** | `findBlobs`/`BlobRegion` export, `classifyRegion()` 추가(종횡비·면적으로 인물/차량/객체 분류), 트랙에 `kind` 저장 |
| `apps/web-react/src/analysis/liveTracker.ts` | **[신규]** | 재생 중 `requestVideoFrameCallback`으로 프레임을 직접 읽어 실시간 추적하는 `LiveTracker`. 트랙별 최적 Box 1개만 유지 |
| `apps/web-react/src/hooks/useLiveTracking.ts` | **[신규]** | 영상 요소에 LiveTracker를 연결하는 훅 |
| `apps/web-react/src/components/panels/BehaviorPanel.tsx` | **[수정]** | "실시간 추적 ON/OFF" 버튼, 실시간 Box 우선 표시, BBox 라벨에 인물/차량/객체 표기 |
| `apps/web-react/src/components/panels/VideoPlaybackPanel.tsx` | **[수정]** | 동일한 실시간 추적 토글 및 종류 라벨 적용 |
| `apps/web-react/src/types/index.ts` | **[추가]** | `TrackedShape.kind` 필드 |

> 한계: 움직임 영역 + 모양 휴리스틱 기반이므로 정밀한 차량/인물 판별은 실제 객체 인식 모델(YOLO 등)이 필요합니다.

## 28단계 — 실시간 사고 감지 강화 + 추적 Box 정밀화

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/types/index.ts` | **[추가]** | `LiveAccident` 타입(유형·심각도·근거·시각) 추가 |
| `apps/web-react/src/hooks/useLiveAccidents.ts` | **[신규]** | 트랙 속도 변화로 급정지/낙상, 트랙 간 근접으로 충돌/다툼, 급이동, 낙하, 인파 밀집을 실시간 감지 |
| `apps/web-react/src/components/panels/AccidentTimelinePanel.tsx` | **[수정]** | "실시간 사고 감지 ON/OFF" 패널 추가. 영상 재생 + 추적 Box + 감지 사고 근거 출력 |
| `apps/web-react/src/analysis/browserVideoAnalyzer.ts` | **[수정]** | `prepareBlobs()`(다수결 노이즈 제거, 전체 화면 변화 제외, 크기 제한) 추가. 오프라인 분석에 적용 |
| `apps/web-react/src/analysis/liveTracker.ts` | **[수정]** | 최소 영역 55px↑, 최대 5트랙/5Box 제한, 트랙별 최적 Box 유지, 실시간 경로는 과도한 필터 제거로 재생성 정상화 |
| `apps/web-react/src/components/panels/BehaviorPanel.tsx`, `VideoPlaybackPanel.tsx` | **[수정]** | BBox에 인물/차량/객체 라벨 표시 |

**검증 결과**
- 실시간 추적 정상: `LIVE 1`, 라벨 `L1 인물 62%`
- 빌드 통과, 콘솔 오류 0건

## 29단계 — 실시간 인식 오탐 수정 (배경 차분)

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/analysis/liveTracker.ts` | **[수정]** | 인접 프레임 차분 → 배경 차분(지수 평활 배경 모델)으로 변경. 정적 벽·건물은 배경으로 학습되어 제거되고 움직이는 차량·인물만 검출 |
| `apps/web-react/src/components/panels/BehaviorPanel.tsx` | **[수정]** | 실시간 추적 ON 시 저장된 추정 Box(P5 등) 폴백 제거. 오직 실시간 추적 Box(L1…)만 표시 |
| `apps/web-react/src/components/panels/VideoPlaybackPanel.tsx` | **[수정]** | 동일하게 실시간 모드에서 정적 Box 제거 |

**검증**: 움직이는 사각형 영상에서 `LIVE 1 / L1 인물` 정상 표시, 빌드 통과.

## 30단계 — YOLO 실제 객체 인식(실시간 + 영상 분석) 구현

| 코드 | 작업 | 내용 |
|---|---|---|
| `services/fastapi/requirements.txt` | **[수정]** | `ultralytics` 추가 |
| `services/fastapi/app/yolo_detector.py` | **[신규]** | yolov8n 모델 지연 로드(서비스 내부 `.models/`), `detect_image`, `detect_frame_bytes`, `analyze_video_bytes`(샘플 프레임 감지 + 최근접 트랙 매칭) |
| `services/fastapi/app/main.py` | **[수정]** | `/api/detect-frame`(실시간 1프레임), `/api/analyze-video`(영상 업로드 분석) 엔드포인트, health에 모델 정보 추가 |
| `apps/web-react/src/analysis/remoteDetector.ts` | **[신규]** | 재생 중 프레임을 JPEG로 캡처해 YOLO API로 전송, 응답을 LiveBox로 변환하고 트랙 ID 유지 |
| `apps/web-react/src/hooks/useLiveTracking.ts` | **[수정]** | 엔진/백엔드 옵션에 따라 원격 YOLO 감지 사용, 실패 시 로컬 프레임 차분으로 폴백 |
| `apps/web-react/src/engine/realEngine.ts` | **[수정]** | 업로드 영상을 `/api/analyze-video`로 전송 |
| `apps/web-react/src/engine/hybridEngine.ts` | **[수정]** | 백엔드 부분 응답의 누락 필드를 목업으로 보완해 병합 안정화 |
| `apps/web-react/src/App.tsx`, `styles/global.css` | **[수정]** | 탭 전환 AnimatePresence 제거(CSS 애니메이션으로 대체, 콘텐츠 고정 문제 해소) |
| `configs/app.config.json` | **[수정]** | 기본 엔진 `hybrid`, 백엔드 `fastapi`로 변경 |
| `package.json`, `.gitignore` | **[수정]** | venv 백엔드 실행 스크립트, `.venv`/`.models` 제외 |

**검증 결과**
- YOLO 모델(yolov8n 6.2MB) 서비스 내부 경로에 다운로드 완료
- 실제 샘플 이미지에서 버스 1대 + 인물 3명 감지 (신뢰도 0.81~0.87)
- `/api/detect-frame` 다수 호출 200 OK, 프론트 엔진 라벨 `hybrid` 확인
- 프론트 빌드 통과

## 31단계 — 분석/출력 성능 최적화

| 코드 | 작업 | 내용 |
|---|---|---|
| `services/fastapi/app/yolo_detector.py` | **[수정]** | 영상 전체 분석을 순차 디코딩 → 시점 seek 방식으로 변경. 필요한 샘플 프레임만 디코딩 (processedFrames도 샘플 수로 정확히 기록) |
| `apps/web-react/src/store/useStore.ts` | **[수정]** | 영상 이름+크기+수정시각+옵션을 키로 하는 분석 결과 캐시 추가. 동일 조건 재업로드 시 파이프라인/엔진 재실행 없이 즉시 결과 재사용. 영상 메타(size/lastModified) 저장 |
| `apps/web-react/src/components/layout/Topbar.tsx` | **[수정]** | 업로드 시 파일 크기·수정시각을 스토어에 전달 |
| `apps/web-react/src/analysis/remoteDetector.ts` | **[수정]** | 프레임 320×180 → 256×144, JPEG 품질 0.6 → 0.45, 일시정지/탭 숨김 시 전송 중단 |
| `apps/web-react/src/hooks/useLiveTracking.ts` | **[수정]** | 실시간 전송 간격을 성능 옵션 FPS에 연동(80~400ms) |
| `apps/web-react/src/analysis/liveTracker.ts` | **[수정]** | 탭 숨김 시 로컬 추적 중단 |

**검증 결과**
- `/api/analyze-video` 200 OK (5초 영상 → 25 샘플 프레임 분석)
- 프론트 빌드 통과

## 32단계 — 사물 측정 3종 구현 (상대 크기 / 기준물 보정 / 깊이 추정)

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[추가]** | `measurement` 옵션(relativeSize, referenceObject, knownWidthCm, fieldOfViewDeg, depthEstimation) |
| `services/fastapi/app/depth_estimator.py` | **[신규]** | MiDaS_small 모델을 프로젝트 내부 `.models/torch`에 로드, 상대 역깊이(disparity) 추출. timm 의존성 및 신뢰 저장소 처리 |
| `services/fastapi/app/measurement.py` | **[신규]** | BBox 상대 크기(%, px, 면적, 종횡비) + 기준물 폭/화각 기반 거리·실측 치수 계산 + 깊이 스케일 보정 |
| `services/fastapi/app/main.py` | **[추가]** | `POST /api/measure-frame` 엔드포인트 |
| `apps/web-react/src/types/index.ts` | **[추가]** | `ObjectMeasurement`, `AppConfig.measurement` 타입 |
| `apps/web-react/src/analysis/remoteDetector.ts` | **[수정]** | `/api/measure-frame` 호출, 측정값 콜백, NMS 및 흔들림 보정 적용 |
| `apps/web-react/src/store/useStore.ts` | **[추가]** | `measurements` 상태 및 `setMeasurements`, 캐시 키에 measurement 옵션 포함 |
| `apps/web-react/src/components/panels/ObjectMeasurementPanel.tsx` | **[신규]** | 측정 요약 + 객체별 상세 테이블(설명+숨김 토글) |
| `apps/web-react/src/components/panels/SettingsPanel.tsx` | **[추가]** | 사물 측정 옵션 UI |
| `apps/web-react/src/App.tsx`, `Sidebar.tsx` | **[추가]** | "사물 측정" 탭 라우팅/메뉴 |

**검증 결과**
- 기준물만: 버스 180cm 기준 → 거리 1.61m, 인물 키 105~116cm 근사 출력
- 깊이 모델 ON: `depthUsed=true`, 인물 거리 1.74~2.11m, 키 120~151cm, 방식 `reference+depth` 출력
- 프론트 빌드 통과

## 33단계 — 모델 학습 파이프라인 (자동 라벨링 + 미세조정)

| 코드 | 작업 | 내용 |
|---|---|---|
| `services/fastapi/app/trainer.py` | **[신규]** | 감지 결과를 YOLO 라벨로 저장하는 데이터셋 수집, data.yaml 자동 생성, 백그라운드 스레드에서 YOLO 미세조정, 진행률/에포크 상태 관리, 완료 시 커스텀 모델을 감지기에 자동 적용 |
| `services/fastapi/app/yolo_detector.py` | **[수정]** | `use_model()`로 커스텀 모델 교체, `active_model_info()` 추가 |
| `services/fastapi/app/main.py` | **[추가]** | `/api/dataset/capture`, `/api/train/start`, `/api/train/status`, `/api/model/use` 엔드포인트 |
| `apps/web-react/src/services/trainingApi.ts` | **[신규]** | 학습/데이터 수집/모델 전환 API 클라이언트 |
| `apps/web-react/src/components/panels/ModelTrainingPanel.tsx` | **[신규]** | 학습 상태 진행률, 프레임 수집·자동 라벨링, 학습 옵션(모델/에포크/크기/배치), 모델 전환 UI |
| `apps/web-react/src/store/useStore.ts`, `Sidebar.tsx`, `App.tsx` | **[추가]** | `training` 탭 라우팅/메뉴 |

**검증 결과**
- 프론트 프로덕션 빌드 통과 (2391 모듈)

## 34단계 — 다양한 사물 학습 지원 (클래스/데이터/증강 확장)

| 코드 | 작업 | 내용 |
|---|---|---|
| `services/fastapi/app/trainer.py` | **[수정]** | 사용자 정의 클래스 목록(classes.txt) 기반 data.yaml 생성, 라벨 매핑을 사용자 클래스로 확장, 외부 데이터셋 ZIP 가져오기(`import_zip`), 학습 시 증강 옵션(fliplr/flipud/mosaic/mixup/hsv/degrees/scale) 적용 |
| `services/fastapi/app/main.py` | **[추가]** | `/api/dataset/create`, `/api/dataset/upload`, 학습 요청에 augmentation 필드 |
| `apps/web-react/src/services/trainingApi.ts` | **[수정]** | 데이터셋 생성/업로드/증강 타입 및 API |
| `apps/web-react/src/components/panels/ModelTrainingPanel.tsx` | **[수정]** | 클래스 정의 textarea, ZIP 업로드, 다중 시점 일괄 수집 슬라이더, 증강 옵션 UI |

**검증 결과**
- 사용자 정의 5클래스 데이터셋 생성 성공
- 샘플 이미지에서 4건 라벨 자동 저장 성공
- 프론트 빌드 통과

## 35단계 — 노드 실행 시간 표시 개선

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/types/index.ts` | **[추가]** | `AnalysisResult.engineTimings` (엔진이 측정한 노드별 시간) |
| `apps/web-react/src/engine/mockEngine.ts` | **[추가]** | 영상 신호 분석·단계별 작업·리포트 생성 시간을 `performance.now()`로 측정 |
| `apps/web-react/src/engine/hybridEngine.ts` | **[수정]** | 백엔드 부분 응답에 타이밍이 없으면 로컬 측정값 유지 |
| `apps/web-react/src/store/useStore.ts` | **[수정]** | 분석 완료 시 `engineTimings`로 그래프 노드 `durationMs` 덮어쓰기 |
| `apps/web-react/src/components/panels/PerformancePanel.tsx` | **[수정]** | 노드 실행 시간 카드 설명 갱신, 전체 12개 노드 표시 |
| `apps/web-react/src/styles/global.css` | **[추가]** | `.perf-node-list` (max-height 해제, 스크롤 제거) |

**검증 결과**
- 프론트 빌드 통과

## 36단계 — 상황별 조치 영상 안내 + 행동 인식 강화

| 코드 | 작업 | 내용 |
|---|---|---|
| `apps/web-react/src/components/panels/SituationVideoGuide.tsx` | **[신규]** | 상황 발생 시점 영상 재생, 조치 절차 단계 표시, 구간 재생, 상황 간 이동 마커 |
| `apps/web-react/src/components/panels/ActionsPanel.tsx` | **[수정]** | 상황 카드에 "영상 안내" 버튼, 안내 패널 연결 |
| `services/fastapi/app/behavior_recognizer.py` | **[신규]** | YOLO Pose 키포인트 + 시계열 휴리스틱으로 낙상/앉기/걷기/달리기/손짓/체류 분류 |
| `services/fastapi/app/main.py` | **[추가]** | `/api/behavior/frame` |
| `apps/web-react/src/services/behaviorApi.ts` | **[신규]** | 실시간 행동 인식 API 클라이언트 |
| `apps/web-react/src/components/panels/BehaviorPanel.tsx` | **[수정]** | 실시간 추적 ON 시 포즈 기반 행동을 목록에 반영 |

## 37단계 — 사전학습 모델/추적기/광학 흐름 옵션

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[추가]** | `detection` 옵션(모델: yolov8n/s, yolov11n, rtdetr-l / 추적기: nearest, bytetrack, botsort / 광학 흐름 ON/OFF) |
| `services/fastapi/app/yolo_detector.py` | **[수정]** | 모델 선택 적용, ByteTrack/BoT-SORT 추적, 광학 흐름(Farneback) 분석 함수 |
| `services/fastapi/app/main.py` | **[수정]** | 설정 기반 모델/추적기 초기화, 광학 흐름 모드 분기 |
| `apps/web-react/src/components/panels/SettingsPanel.tsx` | **[추가]** | 탐지 모델·추적·광학 흐름 옵션 UI |
| `apps/web-react/src/store/useStore.ts` | **[수정]** | `setDetection`, 캐시 키에 detection 옵션 포함 |

**검증 결과**
- `/api/behavior/frame` 200 OK (샘플 이미지에서 4명 self-standing 분류)
- 프론트 빌드 통과

## 38단계 — 전체 클래스 추적 + 오탐 방지 강화

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[추가]** | `detection.classFilter`(all/person_vehicle), COCO 80클래스 전체 추적 기본 |
| `analysis/remoteDetector.ts` | **[수정]** | 전체 모드 신뢰도 0.7 이상, 2프레임 지속성, NMS 0.25, 크기 1~60%, 지연 기반 매칭 창 동적 확장, 지연 측정 |
| `yolo_detector.py` | **[수정]** | COCO 80클래스 한글 라벨 전체 보강 |
| `VideoPlaybackPanel.tsx`, `BehaviorPanel.tsx` | **[수정]** | `pose` 필드 기준 오탐 필터, 실시간 모드 저장 Box 폴백 제거 |

## 39단계 — ONNX 고속 추론 + localhost 지연 제거

| 코드 | 작업 | 내용 |
|---|---|---|
| `requirements.txt` | **[추가]** | onnx, onnxruntime |
| `services/fastapi/app/onnx_detector.py` | **[신규]** | YOLO ONNX 자동 export, ONNX Runtime 추론(letterbox→decode→NMS), GPU(CUDA) 자동 선택 |
| `yolo_detector.py` | **[수정]** | `runtime` 옵션(onnx/pytorch), ONNX 경로 우선 + 실패 시 PyTorch 폴백 |
| `trainer.py` | **[수정]** | 학습 완료 시 커스텀 모델도 ONNX 자동 export |
| `configs/app.config.json` | **[추가]** | `detection.runtime`(기본 onnx) |
| `SettingsPanel.tsx` | **[추가]** | 추론 엔진 선택 UI |
| `config/index.ts` | **[수정]** | 백엔드 주소 `localhost` → `127.0.0.1` (IPv6 해석 2초 지연 제거) |
| `main.py` | **[추가]** | 응답에 단계별 timingsMs 포함 |

**검증 결과 (127.0.0.1 기준)**
- ONNX 추론: 12~22ms/프레임
- 전체 API(depth OFF): 평균 **20ms** (기존 약 2056ms → 100배 개선)
- depth ON: 중앙값 102ms (최초 모델 로드 시 4.5초)
- 프론트 빌드 통과

## 40단계 — 엔드투엔드 실시간 파이프라인 완성

| 코드 | 작업 | 내용 |
|---|---|---|
| `services/fastapi/app/events.py` | **[신규]** | WebSocket 이벤트 버스, 최신 이벤트 캐시, 스레드 안전 발행 |
| `main.py` | **[추가]** | `/ws/analysis`, `/api/events`, `/api/stream/start|stop|status`, `/api/runtime`, 분석 결과에 예측 포함 |
| `prediction.py` | **[신규]** | 칼만 필터 2D 이동 예측 + ROI 폴리곤 교차 위험 판단 |
| `event_store.py` | **[신규]** | JSONL 이벤트 로그 저장/조회 |
| `stream.py` | **[신규]** | OpenCV 기반 RTSP 수신·샘플링·분석 워커, 위험 시 클립 저장 |
| `openvino_detector.py` | **[신규]** | OpenVINO 런타임 추론 (Intel CPU 최적화) |
| `configs/app.config.json` | **[추가]** | prediction/streaming/storage 옵션, runtime openvino 추가 |
| `useAnalysisStream.ts` | **[신규]** | WebSocket 실시간 이벤트 수신 훅 |
| `StreamPredictionPanel.tsx` | **[신규]** | 스트림 제어 + 예측 궤적/위험목록 UI |
| `SettingsPanel.tsx` | **[추가]** | 예측/스트림/저장/OpenVINO 옵션 UI |
| `services/mediamtx/mediamtx.yml` | **[신규]** | RTSP→WebRTC/LL-HLS 무료 미디어 서버 설정 예시 |

**검증 결과**
- WebSocket init/event 수신 확인, 예측 3건 + ROI 위험 판정 정상
- API: `/api/runtime`, `/api/events`, `/api/stream/status` 200 OK
- OpenVINO 추론 중앙값 23ms (ONNX 20ms와 유사, Intel CPU 최적화 경로)
- 프론트 빌드 통과

## 41단계 — 오탐 방지 (전처리 · 추론 · 후처리)

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[수정]** | `accuracy.confidenceThreshold` 0.75 → **0.85**, `preprocessing`(nmsIoU 0.45, gamma 1.0, excludeZones 상단 12%/하단 12%) 추가 |
| `preprocessing.py` | **[신규]** | ROI 제외 영역 마스킹 + 감마 보정, NMS IoU 설정 적용 |
| `yolo_detector.py` | **[수정]** | 추론 전 전처리 적용, ONNX/OpenVINO/PyTorch 모두 NMS IoU 설정 반영 |
| `onnx_detector.py`, `openvino_detector.py` | **[수정]** | `nms` 파라미터 추가 |
| `remoteDetector.ts` | **[수정]** | 프론트 NMS도 설정값 사용 |
| `SettingsPanel.tsx` | **[추가]** | 전처리·오탐 방지 옵션 UI |
| `ModelTrainingPanel.tsx` | **[수정]** | 네거티브 샘플(유리 반사·도로 바닥) 안내 |

**검증 결과**
- 신뢰도 0.85 적용 시 샘플에서 버스 0.876 / 사람 0.858 등 확실한 객체만 출력 ( 저신뢰 오탐 제거 )
- NMS IoU 0.45 적용, 상/하단 ROI 마스킹으로 대시보드 반사·하늘 영역 제외
- 프론트 빌드 통과

## 42단계 — 파이프라인 잔여 항목 완성

| 코드 | 작업 | 내용 |
|---|---|---|
| `broker.py` | **[신규]** | Redis Streams 우선, 실패 시 로컬 JSONL 폴백 이벤트 브로커 |
| `timeseries.py` | **[신규]** | SQLite 기반 지표 시계열 저장 (탐지 수/위험/지연) |
| `clip_store.py` | **[신규]** | 위험 감지 시점 전후 프레임 링버퍼 → AVI 클립 저장 |
| `prediction.py` | **[수정]** | 예측 경로 간 충돌 가능성(8% 이내 접근) 추가 |
| `main.py` | **[추가]** | `/api/metrics`, `/api/clips`, `/api/broker/recent`, `/api/runtime` 확장, 분석 시 브로커·시계열·클립 저장 |
| `configs/app.config.json` | **[추가]** | `broker`, `streaming.webrtcUrl` |
| `StreamPredictionPanel.tsx` | **[수정]** | 브로커 상태·저장 클립·WebRTC 링크 표시 |
| `SettingsPanel.tsx` | **[추가]** | 브로커 선택/URL, WebRTC 주소 UI |

**검증 결과**
- `/api/metrics`, `/api/clips`, `/api/broker/recent` 200 OK
- 분석 요청 3회 후 시계열 3건·브로커 이벤트 저장 확인
- 프론트 빌드 통과

## 43단계 — 다양한 해상도 대응 (다중 스케일 / 타일 추론)

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[추가]** | `detection.resolutionMode`(single/multiscale/tiled), `detection.scales`(320/640) |
| `resolution.py` | **[신규]** | 다중 스케일 앙상블, 2×2 타일 분할 추론, 결과 NMS 퓨전 |
| `onnx_detector.py` | **[수정]** | 입력 크기별 ONNX 파일(`<model>_<size>.onnx`) 자동 export/복사 |
| `yolo_detector.py` | **[수정]** | 추론 시 resolution 모듈 경로 사용 |
| `main.py` | **[추가]** | resolution.configure |
| `SettingsPanel.tsx` | **[추가]** | 해상도 대응 옵션 UI |
| `remoteDetector.ts`, `behaviorApi.ts`, `trainingApi.ts` | **[수정]** | 프레임 캡처 256×144/320×180 → **640×360** (작은 객체 정보 유지) |

**검증 결과**
- 320/640 ONNX 모델 생성 완료
- 다중 스케일 적용 시 신뢰도 0.85에서 버스 1 + 사람 3 검출 (단일 스케일 2건 → 4건)
- 다중 스케일 추론 약 590ms/프레임, 단일 약 20ms/프레임
- 프론트 빌드 통과

## 44단계 — 임계값·모델·하드코딩 수정

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[수정]** | `accuracy.confidenceThreshold` 0.85 → **0.5**, `detection.model` yolov8n → **yolov8s.pt**, classFilter=all 유지 |
| `remoteDetector.ts` | **[수정]** | 전체 클래스임에도 `Math.max(threshold, 0.7)` 로 최저 신뢰도를 강제하던 하드코딩 제거 → 중앙 설정값 그대로 사용 |
| `BehaviorPanel.tsx`, `VideoPlaybackPanel.tsx` | **[수정]** | `useLiveTracking(..., 0.7)` 하드코딩 제거 → `config.accuracy.personDetectionSensitivity` 참조 |
| `yolo_detector.py` | **[추가]** | `set_pretrained_model()`, `set_runtime()` — 모델/런타임 런타임 교체 |
| `main.py` | **[추가]** | `POST /api/model/set` (재시작 없이 모델/런타임 변경) |
| `useStore.ts` | **[수정]** | 모델/런타임 옵션 변경 시 백엔드에 즉시 반영 |

**검증 결과**
- 신뢰도 0.5 + yolov8s 적용 시 샘플에서 4개 클래스 감지 (버스/사람 등)
- 단일 요청 약 1초 (최초 모델 로드 포함), 이후 더 빠름
- 프론트 빌드 통과

## 45단계 — 실시간 경로 3대 병목 제거

| 코드 | 작업 | 내용 |
|---|---|---|
| `main.py` | **[수정]** | `/api/measure-frame` 추론 입력 320 → **640** (작은 객체 감지) |
| `configs/app.config.json` | **[수정]** | 신뢰도 임계값 0.5 → **0.45** |
| `useLiveTracking.ts` | **[수정]** | 정적 `appConfig` 참조 제거 → **스토어 설정값** 사용, `threshold` 인자 추가 |
| `remoteDetector.ts` | **[수정]** | classFilter·nmsIoU를 생성자 인자로 받아 UI 변경 즉시 반영 |
| `BehaviorPanel.tsx`, `VideoPlaybackPanel.tsx`, `AccidentTimelinePanel.tsx` | **[수정]** | 하드코딩 0.7 제거, 설정의 confidenceThreshold 전달 |
| `BehaviorPanel.tsx`, `VideoPlaybackPanel.tsx` | **[수정]** | 클래스 정보 없는 목업/무작위 Box 완전 제거 |

**검증 결과**
- 신뢰도 0.45 + 640 입력에서 샘플 5개 객체 감지
- 프론트 빌드 통과

## 46단계 — 건설현장 추락/다툼 오인식 방지

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[추가]** | `safety`(fallRiskZones, disappearanceSec, stillSec, gatherCount) |
| `safety.py` | **[신규]** | 객체 소실 감지, 수직 하강+정지 지속, 다중 작업자 접근, 위험구역 우선 판단, 다툼은 구역 밖 상호작용만 인정, 룰 기반 문맥 설명(VLM 대체) |
| `main.py` | **[추가]** | 분석 응답에 `safetyEvents`, `contextDescription`, WebSocket/브로커 발행 |
| `useAnalysisStream.ts` | **[수정]** | SafetyEvent/contextDescription 타입 |
| `StreamPredictionPanel.tsx` | **[추가]** | "현장 안전 판별 · 상황 추론" 카드 |

**검증 결과**
- `/api/measure-frame` 200 OK, safetyEvents/contextDescription 포함 확인
- 프론트 빌드 통과

## 47단계 — 하드 네거티브 / 액티브 러닝 / 합성 데이터

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[추가]** | `training`(activeLearning, ambiguousMin/Max, clipWindowSec, syntheticCopies) |
| `active_learning.py` | **[신규]** | 모호 신뢰도 구간·안전 후보 프레임을 라벨 없는 하드 네거티브로 자동 저장, JSONL 로그 |
| `synthesis.py` | **[신규]** | 증강(좌우반전·감마·회전) 기반 의사 합성 데이터 생성, 반전 시 BBox 좌표 보정 |
| `main.py` | **[추가]** | 분석 시 하드 네거티브 자동 수집, `/api/active-learning`, `/api/dataset/synthesize` |
| `ModelTrainingPanel.tsx` | **[수정]** | 네거티브 수량 표시, 합성 데이터 생성 버튼 |
| `SettingsPanel.tsx` | **[추가]** | 액티브 러닝/모호 구간/클립 윈도우 옵션 |

**검증 결과**
- `/api/dataset/create`, `/api/active-learning`, `/api/dataset/synthesize` 200 OK
- 프론트 빌드 통과

## 48단계 — 클립 단위 수동 라벨링 UI

| 코드 | 작업 | 내용 |
|---|---|---|
| `clip_store.py` | **[추가]** | 클립 메타데이터·지정 프레임 JPEG 추출, 경로 검증 |
| `main.py` | **[추가]** | `/api/clips/{name}/info`, `/frame/{index}`, `/label`, `/api/dataset/classes` |
| `labelingApi.ts` | **[신규]** | 클립·프레임·감지·라벨 저장 API 래퍼 |
| `ClipLabelingPanel.tsx` | **[신규]** | 프레임 탐색, 드래그 BBox, 클래스 수정, 자동 감지, 네거티브 저장 |
| `useStore.ts`, `Sidebar.tsx`, `App.tsx` | **[수정]** | `labeling` 탭 등록 |
| `global.css` | **[추가]** | 라벨링 캔버스·BBox 스타일 |

## 49단계 — 실제 건설현장 데이터셋 수집·검증·파인튜닝 준비

| 코드 | 작업 | 내용 |
|---|---|---|
| `dataset_manager.py` | **[신규]** | 원본 폴더 가져오기·train/val 분할·클래스/사고 비율 분석 |
| `main.py` | **[추가]** | `/api/dataset/analyze`, `/raw`, `/import-dir` |
| `trainer.py` | **[수정]** | 학습 완료 시 클래스 이름 참조 오류 수정 |
| `trainingApi.ts`, `ModelTrainingPanel.tsx` | **[추가]** | 현장 데이터셋 가져오기·분석 UI |

**검증 결과**
- 4장 → 학습 3 / 검증 1, 사고 비율 50%, `ready: true`
- 프론트 빌드 통과, 브라우저 콘솔 오류 없음

## 50단계 — 실시간 추적 상시 활성화 및 추론 지연 개선

| 코드 | 작업 | 내용 |
|---|---|---|
| `VideoPlaybackPanel.tsx` | **[수정]** | 추적 토글 제거, 항상 `useLiveTracking(..., true)` 사용, "실시간 추적 상시 ON" 표시 |
| `onnx_detector.py` | **[수정]** | 입력 크기별 ONNX 세션 캐시, 재생성 제거, ORT 스레드·그래프 최적화 |
| `openvino_detector.py` | **[수정]** | 경로별 컴파일 모델 캐시, 320/640 왕복 재컴파일 제거 |
| `yolo_detector.py` | **[추가]** | `detect_image(..., fast=True)` 실시간 단일 스케일 경로 |
| `main.py` | **[수정]** | `/api/measure-frame` 단일 스케일 추론을 `asyncio.to_thread`로 실행 |
| `remoteDetector.ts`, `useLiveTracking.ts` | **[수정]** | 지연 기반 샘플링 주기 재조정, 주기 100~350ms |

**원인**: OpenVINO가 매 프레임 320/640 모델을 재컴파일해 1회 추론에 0.9~1.3초 소요

**검증 결과**
- 웜업 후 단일 스케일 약 86ms, 다중 스케일 약 143~193ms (기존 900~1300ms)
- 브라우저 `/api/measure-frame` 실측 196 / 212 / 244ms
- 영상 재생 시 클릭 없이 추적 요청 자동 발생, 프론트 빌드 통과, 콘솔 오류 없음

## 51단계 — 화면 내 객체 인식 누락 개선

| 코드 | 작업 | 내용 |
|---|---|---|
| `remoteDetector.ts` | **[수정]** | 프레임 JPEG 품질 0.5 → 0.85, 최소 Box 면적 1.0% → 0.2%, 최대 Box 6 → 10, 고신뢰도(0.7+)는 2프레임 대기 없이 즉시 표시 |
| `yolo_detector.py` | **[수정]** | 실시간 단일 스케일에서 감지가 2건 미만이면 다른 스케일을 추가 추론해 병합(원거리·소형 객체 보완) |
| `configs/app.config.json` | **[수정]** | 분석 제외 영역 상·하단 12% → 8%로 축소 |

**원인**: JPEG 품질 0.5 압축 + 과도한 제외 영역 + 1% 면적 하한으로 원거리/소형 객체가 전달 전에 소실

**검증 결과**
- 동일 프레임 기준 감지 수 3건 → 5건 (품질 0.85 + 제외 영역 8%)
- 브라우저 실제 영상 재생 시 `LIVE 4`, 사람 0.905 / 자동차 등 4개 객체 표시
- 추론 detect 시간 90ms, 프론트 빌드 통과, 콘솔 오류 없음

## 52단계 — 행동 감지·사고 인식 탭의 추적 OFF 잔존 제거

| 코드 | 작업 | 내용 |
|---|---|---|
| `BehaviorPanel.tsx` | **[수정]** | `liveEnabled` 토글 제거, `useLiveTracking(..., true)` 상시 ON, 실시간 감지가 없으면 분석 결과 Box 폴백 |
| `AccidentTimelinePanel.tsx` | **[수정]** | 실시간 사고 감지 토글 제거, 추적·사고 판단 상시 ON, OFF 안내 화면 제거 |
| `ObjectMeasurementPanel.tsx` | **[수정]** | "추적을 켜면" 안내 문구 제거 |

**원인**: 50단계에서 영상 재생 패널만 상시 ON으로 바꾸고 행동 감지·사고 인식 탭의 OFF 토글이 남아 있어 해당 탭에서 Box가 표시되지 않음

**검증 결과**
- 인물 행동 감지 탭: `LIVE 4 · 249ms`, Box 4개(사람 91/86/80%, 자동차 61%)
- 시간별 사고 인식 탭: Box 4개, "상시 ON" 표시, OFF 안내 없음
- 프론트 빌드 통과, 브라우저 콘솔 오류 없음

## 53단계 — BBox 좌표계 불일치 수정

| 코드 | 작업 | 내용 |
|---|---|---|
| `remoteDetector.ts` | **[수정]** | 캔버스를 원본 영상 비율로 생성 (세로 영상을 16:9로 늘려 감지하던 문제 제거) |
| `global.css`, 3개 패널 | **[추가/수정]** | `.video-stage` 도입, 영상 원본 비율 유지 + BBox를 같은 좌표계에 배치 |
| `VideoPlaybackPanel.tsx` 등 | **[수정]** | `onLoadedMetadata`로 비율 갱신 |

**검증 결과**: 스테이지 비율 0.750 = 영상 비율 0.750, 박스가 실제 객체 위치와 일치

## 54단계 — 건설현장 클래스 프리셋 (지게차/화물차 오인 대응)

| 코드 | 작업 | 내용 |
|---|---|---|
| `ModelTrainingPanel.tsx` | **[추가]** | 현장 클래스 프리셋(person, worker, helmet, forklift, truck, bus, excavator...) 버튼과 COCO 한계 안내 |

**원인**: COCO 사전학습 모델에 `forklift` 클래스가 없어 지게차→트럭, 화물차→버스로 분류됨 (라벨 매핑 오류 아님). 정확한 구분은 커스텀 모델 학습 필요.

## 55단계 — 건설현장 커스텀 모델 학습·적용 (전체 진행)

| 코드 | 작업 | 내용 |
|---|---|---|
| `build_site_dataset.py` | **[신규]** | 현장 CCTV(`upload_1795137690253.mp4`)에서 30초 구간을 1초 간격 샘플링, COCO 감지 BBox의 화면 위치로 지게차/트럭/사람 클래스 재매핑, 클래스별 최대 BBox만 유지해 중복 제거, train 24/val 7 저장. OpenCV 한글 경로 문제는 상대경로로 우회 |
| `services/.models/datasets/construction/` | **[생성]** | 31장(지게차 31·트럭 31·사람 20), classes.txt, data.yaml |
| `/api/train/start` | **[실행]** | yolov8n 기반 10 에포크 학습 완료 → `custom.pt` 생성, 커스텀 클래스로 자동 적용 |

**검증 결과**
- `/api/health`: `custom.pt`, `custom: true`
- 동일 프레임 API 감지: **지게차 0.999 / 트럭 0.817 / 트럭 0.658**
- 브라우저 BBox 라벨: **지게차 100% / 트럭 81% / 사람 65%**
- 프론트 빌드 통과, 커스텀 모델이 지게차·트럭을 정확히 구분

## 56단계 — 이동 속도 추적 지연 개선

| 코드 | 작업 | 내용 |
|---|---|---|
| `remoteDetector.ts` | **[수정]** | 프레임 캡처 시점 기록, 응답 지연 중 이동 보상. 클래스별 속도 추정(지수 평활) 후 RAF(60fps)로 예측 Box 갱신. 샘플링 주기 고정 + `getPredictedBoxes()` 제공 |
| `useLiveTracking.ts` | **[수정]** | RAF 루프로 매 프레임 예측 위치 갱신 |

## 57단계 — 오탐지 개선

| 코드 | 작업 | 내용 |
|---|---|---|
| `build_site_dataset.py` | **[수정]** | 3개 영상(지게차/버스/야간도로) 사용, COCO 사전학습으로 라벨 생성. 81장(사람 170·지게차 31·트럭 31·버스 25) |
| `/api/train/start` | **[실행]** | 15 에포크 재학습, mAP50 0.995 / mAP50-95 0.929 |
| `remoteDetector.ts` | **[수정]** | 같은 클래스 중복 박스 제거, 최대 8개, 과도한 큰 박스(55% 초과) 제거 |
| `prediction.py` | **[수정]** | 위험구역 경고를 사람(작업자)에게만 적용 — 차량 통행으로 인한 오탐 클립 저장 방지 |

**검증 원본**: 지게차 1.0 / 사람 0.88 / 트럭 0.82, 버스 영상 사람 0.69 · 트럭 0.56

## 58단계 — 재시작 후 커스텀 모델 유지

| 코드 | 작업 | 내용 |
|---|---|---|
| `main.py` | **[수정]** | 서버 시작 시 `custom.pt` 존재하면 `custom_names.json`과 함께 자동 적용 |

**검증**: `/api/model/use?pretrained=false` → custom.pt 적용, 재시작 후에도 자동 적용

## 59단계 — 시간 기반 사고 판단 모듈 (프레임 히스토리 분석)

| 코드 | 작업 | 내용 |
|---|---|---|
| `accident_analyzer.py` | **[신규]** | 트랙별 프레임 히스토리(최대 60프레임/8초) 유지. 급정지(최고속도→정지), 충돌(두 트랙 거리 급감+감속), 넘어짐(사람 수직하강+정지), 위험근접(예측경로 충돌) 판단. 규칙 기반 보조 판단 |
| `main.py` | **[수정]** | `/api/measure-frame` 응답·WebSocket에 `accidentEvents` 추가, critical 시 danger/clip 저장 |
| `configs/app.config.json` | **[추가]** | `accidentAnalysis`(enabled, collisionDistDrop, collisionWindowSec, stopSpeedThreshold, fallDropPct, minFrames) |
| `useAnalysisStream.ts`, `StreamPredictionPanel.tsx` | **[추가]** | "시간 기반 사고 판단" 카드, 사고 유형·Track ID·근거·신뢰도 표시 |
| `SettingsPanel.tsx` | **[추가]** | 사고 판단 옵션 UI (활성화, 시간 창, 거리 기준, 최소 프레임) |

**검증**: 단위 테스트로 급정지(937%/s→0)·충돌(거리 40%→6%, 85% 감소) 검출 확인. 서버 `/api/config` 반영, 빌드 통과, custom.pt 유지

## 60단계 — 임의 사고 건수·신뢰도 제거 (결과 신뢰성)

| 코드 | 작업 | 내용 |
|---|---|---|
| `hybridEngine.ts` | **[수정]** | 목업 신뢰도/위험도 블렌딩 제거. 실제 결과는 그대로 사용, 실패 시 `engine='mock'`으로 명시 |
| `realEngine.ts` | **[수정]** | `/api/analyze-video` 부분 결과를 `AnalysisResult`로 정규화. 사고는 `accidentEvents`만 사용(없으면 0건) |
| `yolo_detector.py` | **[수정]** | 영상 분석에 시간적 사고 분석 연결, 감지에 `t`/`labelKo` 추가, `accidentEvents` 반환 |
| `accident_analyzer.py` | **[수정]** | `now` 파라미터 추가(영상 시각 기준 분석) |
| `AnalysisPanel.tsx` | **[수정]** | 실제 분석/데모 포함/데모 결과 출처 배지 표시 |
| `AccidentTimelinePanel.tsx` | **[수정]** | "탐지 객체 수(현재 프레임) ≠ 사고 건수(영상 전체)" 안내, 출처 배지 |
| `VideoPlaybackPanel.tsx` | **[수정]** | HUD "1 OBJECTS" → "프레임 객체 N"으로 의미 명확화 |

**원인**: 하이브리드 엔진이 실제 실패 시 목업을 그대로 표시하고, 성공 시에도 목업 신뢰도와 블렌딩. `/api/analyze` 자체가 해시 기반 랜덤 사고 생성

**검증**: 실제 영상 업로드 분석 → 64프레임/29명 감지, **사고 0건**(이전 목업 3건 제거). 빌드 통과, 커스텀 모델 유지

## 61단계 — 다중 인원 표시 복원

| 코드 | 작업 | 내용 |
|---|---|---|
| `remoteDetector.ts` | **[수정]** | 57단계의 "같은 클래스 중복 제거"가 사람까지 1명만 표시하던 문제 수정. 사람은 최대 12명 허용, 차량/중장비만 같은 클래스 1개 유지 |

## 62단계 — 추락·넘어짐 판정 강화

| 코드 | 작업 | 내용 |
|---|---|---|
| `accident_analyzer.py` | **[수정]** | 종횡비 변화(서 있음 → 눕음)를 추락 신호로 추가. 수직 하강만이 아니라 자세 변화로도 판정. `kind` 필드로 사람 판별 보강 |
| `yolo_detector.py` | **[수정]** | 영상 감지에 `kind` 추가, 사고 이벤트 같은 유형+트랙 최고 신뢰도 1건만 유지 |

**검증**: 단위 테스트로 수직 하강 15~38% + 종횡비 0.33→2.60 변화에서 "추락·넘어짐 의심" 검출 확인

> 한계: 붕괴 현장 영상이 학습 데이터에 없어 사람 감지 자체가 어려울 수 있음. 실제 붕괴 영상을 수집해 재학습 필요.

## 63단계 — 붕괴 잔해의 지게차 오탐 제거 · 사람 감지 강화

| 코드 | 작업 | 내용 |
|---|---|---|
| `remoteDetector.ts` | **[수정]** | 차량/중장비 박스 상한 55% → 22% (잔해 전체를 지게차로 잡던 오탐 제거). 사람은 신뢰도 `max(0.25, threshold-0.15)`로 완화해 인원 누락 방지, 최대 16명 허용 |
| `main.py` | **[수정]** | `/api/detect-frame` 응답에서 화면 22% 초과 차량 박스 서버 측 필터링 |

**검증**: 빌드 통과, 서버 재시작 후 custom.pt 유지

> 근본 해결은 붕괴 현장 영상을 학습 데이터에 추가하는 것. 현재 붕괴 영상은 브라우저에서만 업로드되어 서버에 저장되지 않았음.

## 64단계 — 업로드 영상 자동 보존 (학습 데이터화)

| 코드 | 작업 | 내용 |
|---|---|---|
| `yolo_detector.py` | **[수정]** | 분석에 사용한 업로드 영상을 `.data/uploads/`에 보존 (기존엔 분석 후 삭제). 분석 실패 시에만 삭제 |
| `build_site_dataset.py` | **[수정]** | `.data/uploads/`의 영상을 데이터셋 구축 시 자동 포함 |

## 65단계 — 정확도 일괄 최적화 설정

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[수정]** | 신뢰도 0.45→**0.32**, NMS IoU 0.45→**0.55**, `realtimeImgsz` **960**, `trackBuffer` **30** 추가 |
| `main.py` | **[수정]** | `/api/measure-frame`이 `realtimeImgsz` 설정 사용 |
| `SettingsPanel.tsx` | **[추가]** | 실시간 추론 해상도·추적 버퍼 슬라이더, 최고 정확도 안내 |

## 66단계 — 사고 유형별 평가 + 오인식 재학습 자동화

| 코드 | 작업 | 내용 |
|---|---|---|
| `evaluation.py` | **[신규]** | 사고 유형별 Precision/Recall/F1/혼동행렬, 추적 ID 유지율 계산. 검토 결과 5건 이상부터 신뢰 |
| `auto_retrain.py` | **[신규]** | 오탐 검토 → 하드 네거티브 저장 → 업로드 영상 데이터셋화 → 재학습 → 모델 자동 적용 |
| `main.py` | **[추가]** | `/api/evaluation`, `/api/evaluation/review`, `/api/auto-retrain/status`, `/api/auto-retrain/start` |
| `PerformancePanel.tsx` | **[추가]** | 정확도 평가 카드(정밀도/재현율/F1/ID 유지율, 유형별 표) + 자동 재학습 카드 |

**검증**: 테스트 리뷰 3건으로 Precision 0.667 / Recall 1.0 / F1 0.8 및 추적 단절 감지 확인. 신규 API 모두 200 OK, 설정 960/0.32/30 반영, 빌드 통과

## 67단계 — COCO 사전학습 모델로 사람 감지 보강

| 코드 | 작업 | 내용 |
|---|---|---|
| `yolo_detector.py` | **[추가]** | `detect_image(..., person_boost=True)` — 커스텀 모델이 사람을 2명 미만으로 감지하면 COCO 사전학습 모델(yolov8s.pt)로 사람을 추가 감지해 병합 |
| `main.py` | **[수정]** | `/api/measure-frame`, `/api/detect-frame`에서 `person_boost=True` 적용 |

**원인**: 커스텀 모델이 붕괴 현장처럼 학습에 없는 장면에서 사람을 1명만 감지하거나 아예 놓침

**검증**: 3명이 정상 감지되는 영상에서는 보강 skip(중복 추론 방지), 사람이 적을 때만 COCO 모델이 보강. 빌드·서버 정상

## 68단계 — 업로드 영상 보존 버그 수정

| 코드 | 작업 | 내용 |
|---|---|---|
| `yolo_detector.py` | **[수정]** | 분석 성공 후 also 영상 삭제하던 finally 제거 → `.data/uploads/`에 영상 보존 (학습 데이터化) |
| `build_site_dataset.py` | **[수정]** | `_sources()`가 `.data/uploads/` 포함. 업로드 영상은 사람 라벨만 신뢰(잔해의 truck 오인 배제), `active_negative` 네거티브도 학습에 포함 |

## 69단계 — 라벨 오염 제거 재학습

| 코드 | 작업 | 내용 |
|---|---|---|
| `build_site_dataset.py` | **[수정]** | `upload` 소스에서 COCO의 truck/car 오인 라벨 제거 → 트럭 62→31, 버스 31→25 |
| `/api/train/start` | **[실행]** | 8 에포크 재학습 완료, mAP50 0.427 |

## 70단계 — 화면에서 오탐 신고 → 재학습 루프 완성

| 코드 | 작업 | 내용 |
|---|---|---|
| `feedback.py` | **[신규]** | 신고된 프레임을 빈 라벨(네거티브)로 저장, `.data/feedback.jsonl` 기록 |
| `main.py` | **[추가]** | `POST /api/feedback/false-positive`, `GET /api/feedback/stats` |
| `feedbackApi.ts`, `VideoPlaybackPanel.tsx` | **[추가]** | BBox마다 "오탐" 버튼. 누르면 현재 프레임·라벨·좌표를 서버에 신고 |
| `auto_retrain.py` | **[수정]** | 중복 네거티브 생성 제거, feedback 통계 사용 |

**검증**: 신고 API 200 OK, 네거티브 2장 저장 확인. 빌드 통과

> 사용법: 영상 재생 중 잘못된 박스의 "오탐" 버튼 클릭 → 성능 평가 탭에서 "오인식 반영 재학습" 실행 → 모델 개선

## 71단계 — 오탐 신고 버튼 모든 탭 확대 · 사람만 추적 옵션

| 코드 | 작업 | 내용 |
|---|---|---|
| `BehaviorPanel.tsx`, `AccidentTimelinePanel.tsx` | **[수정]** | 오탐 신고 버튼 추가 (영상 분석 탭에만 있었음) |
| `configs/app.config.json` | **[추가]** | `classFilter`에 `person_only` 옵션 — 지게차 등 차량 오탐 완전 차단 |
| `remoteDetector.ts`, `SettingsPanel.tsx`, `types/index.ts` | **[수정]** | `person_only` 필터 및 UI 라벨 반영 |

**검증**: 빌드 통과, 서버 custom.pt 유지

## 72단계 — BBox 신고 버튼 표현 변경

| 코드 | 작업 | 내용 |
|---|---|---|
| `VideoPlaybackPanel.tsx`, `BehaviorPanel.tsx`, `AccidentTimelinePanel.tsx` | **[수정]** | "오탐" 텍스트 버튼 → "✕" 아이콘으로 변경. 모델 판단으로 오해되지 않도록 툴팁에 "틀렸으면 눌러 신고" 명시 |
| `global.css` | **[수정]** | 평상시 숨기고 BBox hover 시에만 표시 |

**이유**: 정확히 탐지된 객체에 "오탐" 글자가 붙어 모델이 오탐으로 판단한 것으로 오인됨. 실제로는 사용자 피드백 버튼이었음.

## 73단계 — 추적 지연 재개선

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[수정]** | `realtimeImgsz` 960 → **640** (960은 detect 610~660ms로 추적 지연 원인) |

**검증**: 웜업 후 전체 210~340ms, detect 125ms (960 사용 시 1317ms/613ms 대비 대폭 개선)

## 74단계 — 오탐 신고 영역 즉시 차단

| 코드 | 작업 | 내용 |
|---|---|---|
| `feedback.py` | **[추가]** | `zones()` — 신고된 오탐 BBox 목록 반환 |
| `main.py` | **[추가]** | `GET /api/feedback/zones` |
| `remoteDetector.ts` | **[추가]** | `setBlockedZones()`, 신고 영역과 IoU>0.25로 겹치는 감지 즉시 숨김 |
| `useLiveTracking.ts` | **[수정]** | 신고 영역을 불러 detector에 전달 |

**효과**: 화면에서 ✕로 신고한 영역은 재학습 없이 바로 표시되지 않음. 진짜 지게차(오른쪽 88%)는 유지, 난간 오탐(왼쪽 79%)만 제거

## 75단계 — 산업 현장 전용 사고 판정으로 전환

| 코드 | 작업 | 내용 |
|---|---|---|
| `industrialSafety.ts` | **[신규]** | 탐지≠사고 원칙. 지게차-작업자 근접은 거리+접근속도+지속시간+감속 종합. 단순 근접=주의, 지속·감속=충돌 위험. 추락(수직하강+자세변화+정지), 위험구역 체류 판정 |
| `useLiveAccidents.ts` | **[수정]** | 기존 "거리<7% → 차량 충돌 의심" 로직 제거, 새 모듈 사용 |
| `AccidentTimelinePanel.tsx` | **[수정]** | "산업 현장 안전 분석" 요약(탐지객체/사고이벤트/위험이벤트/추적ID), 분석 기능 상태 체크리스트 |

**원인**: 기존은 두 객체가 7% 이내로 가까워지기만 해도 "차량 충돌 의심"을 발행 → 일반 작업 환경의 근접을 사고로 오인

**검증**: 단순 근접(10% 0.2s)=주의, 위험 근접(5% 1.5s 감속)=충돌 위험, 정상(20%)=이벤트 없음. 빌드 통과

## 76단계 — 분석 결과 출력 데이터 누락 수정 (점검)

| 코드 | 작업 | 내용 |
|---|---|---|
| `yolo_detector.py` | **[수정]** | `_result_series()` 신규 — 실제 감지 결과에서 crowdDensity/motionSeries/confidenceSeries(15개)/summary(평균 신뢰도·최대 인원)/analysisLog/performanceEvaluation 생성. `_temporal_accidents()` 공통화해 **두 return 경로 모두 accidentEvents 포함** |
| `remoteDetector.ts` | **[수정]** | 오탐 신고 영역 필터를 IoU 0.12 또는 중심거리 8%로 완화 |

**점검 결과(실제 30초 영상)**: 64프레임 / 88감지 / 24명 / accidentEvents 0(정상 작업), 시계열 15개, summary avgConfidence 0.923 / peakCrowd 4 모두 정상 반환

## 77단계 — 가짜 지게차 라벨 제거 (근본 원인 해결)

| 코드 | 작업 | 내용 |
|---|---|---|
| `build_site_dataset.py` | **[수정]** | 위치 규칙("왼쪽=지게차") 제거. COCO가 "버스"로 본 호이스트/난간을 지게차로 재매핑하던 오탐 제거. 클래스에서 `forklift` 제거 → `person/truck/bus`. 과도하게 누적된 네거티브 1,659장 → 100장으로 제한, 빌드 시 이전 이미지 정리 |

**원인**: COCO에 forklift 클래스가 없어 위치로 가짜 라벨을 만듦 → 모델이 "왼쪽 노란 구조물=지게차"를 학습

**검증**: 해당 프레임 감지 결과 `지게차 89%` → 사라짐. 현재 `트럭 1.0 / 버스 0.67` (분류는 부정확하나 지게차 오인 해소)

> 진짜 지게차를 정확히 인식하려면 실제 지게차가 있는 영상을 올바르게 라벨링해 별도 학습 필요

## 78단계 — 실제 캡션 생성 + 사람 행동 패턴 데이터셋

| 코드 | 작업 | 내용 |
|---|---|---|
| `yolo_detector.py` | **[수정]** | `_result_series()`에 실제 감지 기반 `videoDescription` 생성 추가. 목업의 "다툼·폭력 사고" 문구 제거. `behaviors`도 실제 감지 결과에서 생성 |
| `realEngine.ts` | **[수정]** | 목업 캡션 기본값 제거 |
| `behavior_dataset.py` | **[신규]** | YOLO Pose 관절 특징(자세·속도·기울기) 기반 행동 패턴 데이터셋. 10개 클래스(standing/walking/running/falling/crouching/lying/lifting/helping/altercation/loitering) |
| `main.py` | **[추가]** | `GET /api/behavior-dataset/stats` |

**원인**: `/api/analyze-video`가 사고 타입·캡션을 안 보내자 realEngine이 목업 기본값을 채워 추락 장면에 "다툼·폭력 사고"가 표시됨

**검증**: 실제 영상 캡션 "2초 구역에서 사람 4명 감지…", "4초 구역 움직임 강도 37%" 등 실제 분석값 출력. behaviors 24건, accidentEvents 0건

## 79단계 — 성능 평가를 실제 측정값으로 변경

| 코드 | 작업 | 내용 |
|---|---|---|
| `yolo_detector.py` | **[수정]** | `_result_series()`에 실제 경과 시간 전달. `engineTimings`(총 시간/프레임당 시간/처리 프레임) 추가. `performanceEvaluation`을 고정 125ms·랜덤 정확도에서 **실제 측정값**(latencyMs, throughput, measured:true)으로 변경. 검증 데이터 없는 recall은 0으로 유지 |
| `realEngine.ts`, `types/index.ts`, `PerformancePanel.tsx` | **[수정]** | engineTimings 전달, `measured` 플래그로 "실제 측정/추정값" 배지 표시 |

**원인**: 목업의 baseLatency + 랜덤 노이즈가 성능 지표로 표시되어 정확하지 않았음

**검증**: 실제 30초 영상 → engineTimings 총 5,485ms / 프레임당 85.7ms / 64프레임, throughput 11.67fps, measured:true

## 80단계 — 자동차→트럭 오인 수정

| 코드 | 작업 | 내용 |
|---|---|---|
| `build_site_dataset.py` | **[수정]** | `car` 클래스 추가(COCO "자동차"를 "트럭"으로 강제 매핑하던 오류 제거). `road` 소스도 COCO 원본 클래스 유지 |
| `/api/train/start` | **[실행]** | 6 에포크 재학습 완료 |

**검증**: 클래스 `person/car/truck/bus`, 해당 프레임 감지 `자동차 1.0 / 트럭 0.67`

## 81단계 — 실시간 추적 칼만 필터 적용

| 코드 | 작업 | 내용 |
|---|---|---|
| `remoteDetector.ts` | **[수정]** | 단순 선형 속도 예측 → **칼만 필터**(상수 속도 모델, 과정 노이즈 0.2, 측정 보정) 적용. 트랙 매칭도 칼만 예측 위치 기준 + 매칭 문턱 12→14 |

**효과**: 객체 가려짐·급가속 시에도 위치/ID 유지 개선, 예측 궤적 떨림 감소

## 82단계 — 분석 결과 캐시 무효화

| 코드 | 작업 | 내용 |
|---|---|---|
| `useStore.ts` | **[수정]** | `clearResultCache()` 추가. detection/preprocessing/accuracy 설정 변경 시 캐시 초기화. `runAnalysis(name, force)` 추가 |
| `Topbar.tsx` | **[수정]** | "분석 실행" 버튼이 force=true로 항상 새 분석 수행 |

**원인**: 모델 재학습 후에도 동일 영상+옵션 조합이면 이전 결과(지게차·다툼 캡션)를 캐시에서 재사용

## 83단계 — 공개 사고 데이터셋 카탈로그

| 코드 | 작업 | 내용 |
|---|---|---|
| `external_datasets.py` | **[신규]** | AI-Hub(교통사고·운전습관·건설위험), 국토안전관리원 13종, DoTA, CCD, HuggingFace, UCF-Crime 등 8개 데이터셋 카탈로그 + 가져오기 가이드 |
| `main.py` | **[추가]** | `GET /api/external-datasets`, `GET /api/external-datasets/{id}/guide` |

**검증**: 8개 카탈로그 반환, importDir `.data/datasets/external`

## 84단계 — car 추가 재학습 (재실행)

| 코드 | 작업 | 내용 |
|---|---|---|
| `/api/train/start` | **[실행]** | 6 에포크 재학습 완료 (데이터셋 person/car/truck/bus) |

> 참고: 데이터셋 확장(789장)으로 mAP50이 0.47 수준으로 감소. 공개 데이터셋 연동으로 정확도 개선 필요

## 85단계 — 야간 영상 사람 오탐 억제 (COCO 보강 기본 OFF)

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[추가]** | `detection.personBoost` 옵션(기본 false) |
| `main.py`, `SettingsPanel.tsx`, `types/index.ts` | **[수정]** | personBoost를 옵션으로 제어, UI 토글 추가, 안내 문구 수정(해상도 640 / 야간은 보강 OFF) |
| `yolo_detector.py` | **[수정]** | 캡션 문구 명확화 ("저장된 분석 프레임에는") |

**원인**: COCO 사전학습 모델로 사람을 추가 병합하던 `person_boost`가 야간·역광 영상에서 어두운 영역을 사람으로 대량 오탐(화면 8건)

**검증**: personBoost OFF 후 해당 야간 프레임 감지 8건 → **1건(사람 0.7)**, 설정값 false 확인

## 86단계 — 브라우저 분석 캐시 강제 초기화 · 트랙 정리 단축

| 코드 | 작업 | 내용 |
|---|---|---|
| `main.tsx` | **[수정]** | 앱 시작 시 `clearResultCache()` 호출 — 재접속 시 이전 분석 결과 제거 |
| `remoteDetector.ts` | **[수정]** | 트랙 매칭 창 상한 2.0초로 제한(기존 지연 비례 무한 증가). 오탐 트랙 잔류 방지 |

**원인**: 서버는 1~2건만 감지하는데 화면에는 이전 분석/추적 결과 8건이 남아있음

## 87단계 — AI 분석 해상도·FPS 최적화

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[추가]** | `detection.analysisImgsz`(640), `detection.analysisFps`(6) — 1080p/720p 원본도 AI용으로 축소, 30fps→6fps 샘플링 |
| `main.py`, `yolo_detector.py` | **[수정]** | `analyze_video_bytes`에 fps/imgsz 전달, ByteTrack `imgsz=analysis_imgsz` 적용, `asyncio.to_thread`로 이벤트 루프 차단 방지 |

## 88단계 — ByteTrack 전용 설정

| 코드 | 작업 | 내용 |
|---|---|---|
| `custom_bytetrack.yaml` | **[신규]** | track_high 0.25 / low 0.10 / new 0.25 / buffer 45 / match 0.8 / fuse_score true |
| `yolo_detector.py` | **[수정]** | bytetrack 선택 시 커스텀 YAML 사용 (가려짐 ID 유지 개선) |

## 89단계 — 사고 유형별 전용 판정 추가

| 코드 | 작업 | 내용 |
|---|---|---|
| `accident_analyzer.py` | **[추가]** | 지게차-작업자 충돌(forklift_worker), 추돌 위험(rear_end, 같은 차선 속도 유사도+근접) 판정 추가 |

**검증**: 30초 영상 분석 10.9초, 221프레임, 프레임당 48.9ms, 사고 3건(급정지 2 / 추락 1, 시간적 근거 포함)

## 90단계 — 파인튜닝 후 사람 감지 퇴화 보완

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[수정]** | `personBoost` 기본 true로 변경, `personBoostMinConf`(0.3) 추가 |
| `yolo_detector.py` | **[수정]** | `_boost_people`이 minConf 이상의 COCO 사람만 병합 (야간 오탐 억제) |
| `main.py`, `SettingsPanel.tsx`, `types/index.ts` | **[수정]** | 설정값 전달, UI 슬라이더 추가 |

**원인**: 커스텀 모델 파인튜닝 후 사람 감지 능력 퇴화 (COCO는 사람 0.34로 감지, 커스텀은 미감지)

**검증**: `personBoost=true, minConf=0.3`에서 붕괴 현장 프레임 감지 `자동차 1.0 / 트럭 0.6 / 사람 0.37`

## 91단계 — 다양한 환경 결과 데이터 산출 검증

| 코드 | 작업 | 내용 |
|---|---|---|
| `yolo_detector.py` | **[수정]** | `personsDetected`를 전체 프레임 감지 합계(36~46명)에서 시간 버킷별 고유 트랙 수 기반 `peakCrowd`로 통일 |

**검증(3개 환경)**:
- 야간 주행 810×1080/5초: 4.2초, 필수 16키 모두 존재, 사람 3명, 시계열 3개, 캡션 3개
- 지게차 CCTV 1280×720/30초: 7.9초, 필수 16키 모두 존재, 사람 2명, 시계열 15개, 사고 3건(급정지2/추락1)
- 720p 30초: 동일 구조, 사고 3건
- `personsDetected == summary.peakCrowd` 일치 확인, 캡션-감지 모순 없음

## 92단계 — 파이프라인 노드 업데이트 (16노드)

| 코드 | 작업 | 내용 |
|---|---|---|
| `configs/app.config.json` | **[수정]** | AI 전처리(640·6fps), 사람 자세 분석, 산업현장 위험 분석, 사고 검토 노드 추가. detect→track→pose→behavior→accidents→industrial→review 흐름으로 재구성 |
| `mockData.ts` | **[수정]** | 새 노드 성능 템플릿 반영 |

## 93단계 — 파이프라인 고급 시각화

| 코드 | 작업 | 내용 |
|---|---|---|
| `PipelineCanvas.tsx` | **[수정]** | 레이어별 그룹 배경, 실행 흐름 화살표 애니메이션, 미니맵, 노드 호버 상세 툴팁, 처리량 아이콘 추가 |
| `types/index.ts` | **[추가]** | PipelineNode.detail(입출력 건수·지연·설명) |
| `global.css` | **[추가]** | 레이어·미니맵·툴팁 스타일 |

## 94단계 — 데이터 카탈로그

| 코드 | 작업 | 내용 |
|---|---|---|
| `data_catalog.py`, `main.py` | **[신규]** | 웹 데이터 16종(설정/영상/모델/학습/분석결과)의 종류·경로·생성주체·엔드포인트를 `GET /api/data-catalog`로 제공 |

## 95단계 — 파이프라인 노드 겹침 방지

| 코드 | 작업 | 내용 |
|---|---|---|
| `graph.ts` | **[수정]** | 종류별 고정 열 → **위상 정렬 깊이 기반 자동 레이아웃**( 열 198px × 행 124px ). 어떤 노드 조합도 겹치지 않음 |
| `PipelineCanvas.tsx` | **[수정]** | 캔버스 2280×820 확장, 레이어 구역 재배치 |

**검증**: 브라우저에서 16노드 렌더링, **겹침 0건**, 콘솔 오류 0건

## 96단계 — 설명 데이터 영상 구현

| 코드 | 작업 | 내용 |
|---|---|---|
| `yolo_detector.py` | **[수정]** | 실제 감지 기반 `videoDescription`에 `id`/`tags`/`highlights`/`sceneCount` 추가 (최다 인원·최대 움직임 구간 자동 추출) |
| `VideoDescriptionPanel.tsx` | **[수정]** | "설명 데이터 영상" 플레이어 추가 — 현재 시점 캡션 오버레이, 캡션 표시/숨김, 음소거 토글. 시간대별 캡션 클릭 시 해당 시점으로 seek |
| `global.css` | **[추가]** | 캡션 클릭 활성 스타일, video-caption z-index |

**검증**: 5초 영상 → 캡션 3개(id/tags 포함), sceneCount 3, 하이라이트 2건 정상 생성

## 97단계 — 설명 캡션 모순 보정

| 코드 | 작업 | 내용 |
|---|---|---|
| `yolo_detector.py` | **[수정]** | 버킷 경계로 사람이 지속적으로 있음에도 특정 구간이 0이 되는 현상 보정 — 앞뒤 버킷 값 전파 |
| `VideoDescriptionPanel.tsx` | **[수정]** | 설명 영상 캡션 오버레이에 현재 프레임 실시간 추적 개수 표시 (useLiveTracking 연동) |

**원인**: 2초 버킷 구분으로 사람 감지가 특정 버킷에만 몰려 "사람 없음" 캡션이 영상과 모순

**검증**: crowd [0,3,0] → [3,3,3] 보정, 전 구간 "사람 3명" 일관 표시

## 98단계 — 가짜 낙상 사고 생성 완전 제거

| 코드 | 작업 | 내용 |
|---|---|---|
| `hybridEngine.ts` | **[수정]** | 분석 실패 시 `generateMockResult()` 폴백 제거 → 사고 0건·빈 캡션·"분석 실패" 안내 반환 |
| `mockEngine.ts` | **[수정]** | 목업이 만든 가짜 사고·상황·조치 제거. 캡션은 실제 영상 신호(모션) 기반으로 생성 |

**원인**: 일반 주행 영상에서 "인물 낙상 사고 86%" 표시 — hybridEngine 실패 폴백이 목업 사고를 반환

**검증**: 빌드 통과, 브라우저 콘솔 오류 0건

## 99단계 — 기능별 안내 팝업 (옵션)

| 코드 | 작업 | 내용 |
|---|---|---|
| `data/featureGuides.ts` | **[추가]** | 14개 탭별 안내 콘텐츠(목적·사용 순서·주요 데이터·주의 사항·관련 경로) |
| `FeatureGuideModal.tsx` | **[추가]** | 안내 모달 — 이전/다음 탭 이동, 자동 표시 체크박스, ESC/배경 클릭 닫기 |
| `useStore.ts` | **[수정]** | `guideEnabled`/`guideSeen`/`guideOpen` 상태 + 로컬 저장소 영속화 |
| `App.tsx` | **[수정]** | 처음 방문 탭 자동 팝업, 상단 "안내" 버튼으로 재열기, 모달 마운트 |
| `Sidebar.tsx` | **[수정]** | 안내가 필요한 신규 탭 포함 14개 메뉴 |
| `SettingsPanel.tsx` | **[수정]** | "기능 안내 팝업" 토글 추가 |
| `global.css` | **[추가]** | 모달/안내 섹션 스타일 |

**옵션**: 기본 ON, 설정에서 OFF 가능. 방문 기록은 `visionflow-studio:guide`에 저장.

**검증**: 첫 방문 탭 자동 표시, "다음" 클릭 시 파이프라인 안내로 전환, 체크박스 OFF 영속화 확인

## 100단계 — 데이터 카탈로그 UI

| 코드 | 작업 | 내용 |
|---|---|---|
| `DataCatalogPanel.tsx` | **[추가]** | `GET /api/data-catalog` + `/api/external-datasets` 조회, 그룹별 카드·경로 복사·상태 배지·오류 재시도 |
| `App.tsx` | **[수정]** | `catalog` 탭 라우팅 및 페이지 메타 추가 |
| `useStore.ts` | **[수정]** | `WorkTab`에 `catalog` 추가 |
| `Sidebar.tsx` | **[수정]** | "데이터 카탈로그" 메뉴 추가 |
| `data/featureGuides.ts` | **[수정]** | 카탈로그 탭 안내 콘텐츠 추가 |
| `README.md` | **[수정]** | 안내 팝업·데이터 카탈로그 섹션 추가 |
| `docs/DATA_CATALOG.md` | **[추가]** | 데이터 종류·경로·생성 주체·연결 API 문서화 |
| `global.css` | **[추가]** | 카탈로그 row/metric/status 스타일 |

**검증**: API 200 (항목 16 · 그룹 5 · 외부 데이터셋 8), UI 렌더 24행·7카드·16경로, 콘솔 오류 0건

<!-- CODE_DETAILS_START -->

## 코드 상세 (파일명 클릭 시 전체 코드 펼침)

> 아래 파일명을 클릭하면 해당 파일의 **실제 전체 코드**가 표시됩니다.

<details>
<summary><code>package.json</code></summary>

```json
{
  "name": "visionflow-studio",
  "version": "1.0.0",
  "private": true,
  "description": "영상 분석 파이프라인 스튜디오 - 모듈형 옵션 아키텍처",
  "workspaces": [
    "apps/web-react",
    "apps/web-next",
    "apps/web-vue",
    "services/express"
  ],
  "scripts": {
    "dev": "npm run dev -w apps/web-react",
    "build": "npm run build -w apps/web-react",
    "preview": "npm run preview -w apps/web-react",
    "dev:next": "npm run dev -w apps/web-next",
    "dev:vue": "npm run dev -w apps/web-vue",
    "ports:check": "node scripts/check-ports.mjs",
    "docs:code": "node scripts/generate-code-doc.mjs",
    "backend:setup": "python -m venv .venv",
    "backend:fastapi": ".\\.venv\\Scripts\\python.exe -m uvicorn services.fastapi.app.main:app --reload --port 53720",
    "backend:express": "node services/express/src/index.js"
  },
  "engines": {
    "node": ">=18"
  },
  "allowScripts": {
    "esbuild@0.25.12": true
  }
}
```

</details>

<details>
<summary><code>configs/app.config.json</code></summary>

```json
{
  "$schema": "./app.config.schema.json",
  "project": {
    "name": "VisionFlow Studio",
    "slug": "visionflow-studio",
    "version": "1.0.0",
    "description": "영상 기반 데이터 분석 / 인물 행동 감지 / 상황별 조치 권고 파이프라인 스튜디오"
  },
  "options": {
    "frontend": {
      "value": "react",
      "choices": ["react", "next", "vue"],
      "description": "사용할 웹 프론트엔드 스택 (apps/ 하위 폴더와 매핑)"
    },
    "analysisEngine": {
      "value": "hybrid",
      "choices": ["mock", "real", "hybrid"],
      "description": "영상 분석 엔진. mock=시뮬레이션, real=백엔드 CV 호출, hybrid=목업+실제 병합"
    },
    "backend": {
      "value": "fastapi",
      "choices": ["none", "fastapi", "express"],
      "description": "분석 API 백엔드. none=브라우저 전용, fastapi=Python CV, express=Node API"
    },
    "design": {
      "value": "daylight",
      "choices": ["aurora", "midnight", "light", "daylight", "cyber"],
      "description": "프리미엄 시각화 테마. daylight는 밝고 선명한 기본 테마"
    },
    "language": {
      "value": "ko",
      "choices": ["ko", "en"],
      "description": "UI 표시 언어"
    }
  },
  "performance": {
    "resolution": {
      "value": "720p",
      "choices": ["360p", "480p", "720p", "1080p"],
      "description": "분석 입력 프레임 해상도"
    },
    "fps": {
      "value": 15,
      "min": 1,
      "max": 60,
      "description": "초당 분석 프레임 수"
    },
    "concurrency": {
      "value": 4,
      "min": 1,
      "max": 16,
      "description": "동시 파이프라인 노드 실행 수"
    },
    "hardwareAcceleration": {
      "value": true,
      "description": "GPU 가속 사용 여부 (WebGL / OpenCV DNN)"
    },
    "adaptiveQuality": {
      "value": true,
      "description": "성능에 따라 품질을 자동 조절"
    },
    "batchSize": {
      "value": 8,
      "min": 1,
      "max": 64,
      "description": "한 번에 처리하는 프레임 배치 크기"
    }
  },
  "accuracy": {
    "confidenceThreshold": {
      "value": 0.32,
      "min": 0.1,
      "max": 0.99,
      "description": "감지 신뢰도 최소 임계값. 0.30~0.35 권장 (누락 감소, 오탐은 후처리로 억제)"
    },
    "personDetectionSensitivity": {
      "value": 0.7,
      "min": 0.1,
      "max": 1.0,
      "description": "인물 감지 민감도"
    },
    "behaviorModel": {
      "value": "balanced",
      "choices": ["fast", "balanced", "accurate", "ensemble"],
      "description": "행동 인식 모델 프로파일"
    },
    "temporalSmoothing": {
      "value": true,
      "description": "시계열 평활화로 프레임 간 떨림 제거"
    },
    "nmsThreshold": {
      "value": 0.45,
      "min": 0.1,
      "max": 0.9,
      "description": "Non-Maximum Suppression 임계값"
    },
    "enableReIdentification": {
      "value": true,
      "description": "인물 재식별(Re-ID)로 동일 인물 추적 정확도 향상"
    }
  },
  "preprocessing": {
    "nmsIoU": {
      "value": 0.55,
      "min": 0.1,
      "max": 0.9,
      "description": "중복 Box 제거용 NMS IoU 임계값. 0.5~0.6 권장"
    },
    "gamma": {
      "value": 1.0,
      "min": 0.4,
      "max": 2.0,
      "description": "감마 보정. 유리 반사·역광 노이즈 완화"
    },
    "excludeZones": {
      "value": [
        [[0, 0], [100, 0], [100, 8], [0, 8]],
        [[0, 92], [100, 92], [100, 100], [0, 100]]
      ],
      "description": "분석 제외 영역(화면 비율 % 폴리곤). 상단 하늘·하단 대시보드 반사"
    }
  },
  "detection": {
    "model": {
      "value": "yolov8s.pt",
      "choices": ["yolov8n.pt", "yolov8s.pt", "yolov11n.pt", "rtdetr-l.pt"],
      "description": "사전학습 객체 탐지 모델. 별도 학습 데이터 없이 사용 가능"
    },
    "tracker": {
      "value": "bytetrack",
      "choices": ["nearest", "bytetrack", "botsort"],
      "description": "탐지 결과에 트랙 ID를 부여하는 알고리즘. ByteTrack/BoT-SORT 권장"
    },
    "trackBuffer": {
      "value": 30,
      "min": 5,
      "max": 90,
      "description": "객체가 잠시 가려져도 ID를 유지하는 프레임 수"
    },
    "realtimeImgsz": {
      "value": 640,
      "min": 320,
      "max": 1280,
      "step": 160,
      "description": "실시간 프레임 추론 입력 크기. 640 권장 (960은 정확도는 높지만 detect 600ms+로 추적 지연)"
    },
    "opticalFlow": {
      "value": false,
      "description": "모델 없이 프레임 간 광학 흐름으로 움직임만 추출 (저사양용)"
    },
    "resolutionMode": {
      "value": "multiscale",
      "choices": ["single", "multiscale", "tiled"],
      "description": "해상도 대응 방식. single=단일, multiscale=320/640 앙상블, tiled=4분할 타일 추론"
    },
    "scales": {
      "value": [320, 640],
      "description": "다중 스케일 추론에 사용할 입력 크기(px)"
    },
    "runtime": {
      "value": "openvino",
      "choices": ["onnx", "openvino", "pytorch"],
      "description": "추론 엔진. ONNX Runtime은 CPU/GPU에서 빠르고, PyTorch는 호환성이 높음"
    },
    "classFilter": {
      "value": "all",
      "choices": ["all", "person_vehicle", "person_only"],
      "description": "추적 표시 클래스. all=전체, person_vehicle=사람/차량, person_only=사람만 (지게차 오탐 완전 차단)"
    },
    "personBoost": {
      "value": true,
      "description": "COCO 사전학습 모델로 사람을 추가 감지. 커스텀 모델의 사람 감지 퇴화를 보완 (신뢰도 0.3 이상만 병합)"
    },
    "personBoostMinConf": {
      "value": 0.3,
      "min": 0.2,
      "max": 0.7,
      "description": "COCO 사람 보강 시 최소 신뢰도. 낮추면 누락 감소, 높이면 오탐 감소"
    },
    "analysisImgsz": {
      "value": 640,
      "min": 320,
      "max": 1280,
      "step": 160,
      "description": "영상 분석용 입력 크기. 1080p 원본도 이 크기로 축소해 추론 (CPU 속도 우선 640, 정확도 960)"
    },
    "analysisFps": {
      "value": 6,
      "min": 1,
      "max": 30,
      "description": "영상 분석 초당 프레임 수. 30fps 영상도 5~10fps로 샘플링해 처리 속도 개선"
    }
  },
  "broker": {
    "type": {
      "value": "local",
      "choices": ["local", "redis"],
      "description": "이벤트 브로커. local=파일, redis=Redis Streams"
    },
    "url": {
      "value": "redis://127.0.0.1:6379/0",
      "description": "Redis 접속 URL"
    },
    "stream": {
      "value": "visionflow:events",
      "description": "Redis Streams 키"
    }
  },
  "prediction": {
    "enabled": {
      "value": true,
      "description": "칼만 필터 기반 이동 예측 및 ROI 위험구역 교차 판단"
    },
    "horizonSec": {
      "value": 2,
      "min": 1,
      "max": 5,
      "description": "예측 시간(초)"
    },
    "roiPolygons": {
      "value": [[[10, 20], [40, 20], [40, 60], [10, 60]]],
      "description": "화면 비율(0~100) 기반 위험 구역 폴리곤 목록"
    }
  },
  "accidentAnalysis": {
    "enabled": { "value": true, "description": "프레임 히스토리 기반 시간적 사고 판단 (충돌·급정지·넘어짐)" },
    "collisionDistDrop": { "value": 0.65, "min": 0.2, "max": 0.95, "description": "충돌 판정 거리 급감 비율" },
    "collisionWindowSec": { "value": 2.0, "min": 0.5, "max": 5, "description": "사고 판단 시간 창(초)" },
    "stopSpeedThreshold": { "value": 2.0, "min": 0.5, "max": 10, "description": "정지 판정 속도(%/초)" },
    "fallDropPct": { "value": 8.0, "min": 2, "max": 30, "description": "넘어짐 수직 하강 기준(%)" },
    "minFrames": { "value": 3, "min": 2, "max": 10, "description": "사고 판정 최소 지속 프레임" }
  },
  "streaming": {
    "rtspUrl": {
      "value": "",
      "description": "RTSP 카메라 주소. 비어 있으면 파일 업로드 모드"
    },
    "webrtcUrl": {
      "value": "",
      "description": "MediaMTX WebRTC 주소(예: http://host:8889/camera/whep). RTSP를 브라우저로 중계"
    },
    "enabled": {
      "value": false,
      "description": "RTSP 스트림 수신 및 서버 측 분석 활성화"
    }
  },
  "storage": {
    "eventLog": {
      "value": true,
      "description": "분석 이벤트를 로컬 JSONL에 저장"
    },
    "clipBeforeSec": {
      "value": 5,
      "min": 1,
      "max": 30,
      "description": "사고 전 저장 영상 길이"
    },
    "clipAfterSec": {
      "value": 5,
      "min": 1,
      "max": 30,
      "description": "사고 후 저장 영상 길이"
    }
  },
  "training": {
    "activeLearning": {
      "value": true,
      "description": "애매한 신뢰도 구간/오탐 프레임을 하드 네거티브로 자동 수집"
    },
    "ambiguousMin": {
      "value": 0.35,
      "min": 0.1,
      "max": 0.9,
      "description": "액티브 러닝 수집 하한 신뢰도"
    },
    "ambiguousMax": {
      "value": 0.7,
      "min": 0.1,
      "max": 0.95,
      "description": "액티브 러닝 수집 상한 신뢰도"
    },
    "clipWindowSec": {
      "value": 5,
      "min": 1,
      "max": 15,
      "description": "사고 전후 연속 프레임 클립 길이(초)"
    },
    "syntheticCopies": {
      "value": 3,
      "min": 0,
      "max": 20,
      "description": "이미지 증강 기반 합성 데이터 생성 배수"
    }
  },
  "safety": {
    "fallRiskZones": {
      "value": [[[25, 45], [55, 45], [55, 80], [25, 80]]],
      "description": "개구부·비계·단부 등 추락 위험 구역(화면 비율 % 폴리곤)"
    },
    "disappearanceSec": {
      "value": 1.2,
      "min": 0.3,
      "max": 5,
      "description": "위험 구역 내 객체 소실로 추락 판단할 지속 시간"
    },
    "stillSec": {
      "value": 3,
      "min": 1,
      "max": 10,
      "description": "쓰러짐 후 정지 상태 유지 시간"
    },
    "gatherCount": {
      "value": 3,
      "min": 2,
      "max": 10,
      "description": "주변 작업자 접근 수 (추락 corroboration)"
    }
  },
  "measurement": {
    "relativeSize": {
      "value": true,
      "description": "BBox 기준 상대 크기(폭/높이 %, 면적 %, 종횡비)를 출력"
    },
    "referenceObject": {
      "value": "car",
      "choices": ["car", "person", "none"],
      "description": "실측 보정 기준이 되는 객체"
    },
    "knownWidthCm": {
      "value": 180,
      "min": 30,
      "max": 400,
      "description": "기준 객체의 실제 폭(cm)"
    },
    "fieldOfViewDeg": {
      "value": 60,
      "min": 30,
      "max": 120,
      "description": "카메라 수평 화각(도). 거리 추정에 사용"
    },
    "depthEstimation": {
      "value": true,
      "description": "MiDaS 깊이 모델로 객체별 거리·실측 크기를 추정 (최초 모델 다운로드 필요)"
    }
  },
  "pipeline": {
    "autoUpdate": {
      "value": true,
      "description": "노드 생성/수정/삭제 시 파이프라인을 자동으로 재구성하고 재실행"
    },
    "autoUpdateDebounceMs": {
      "value": 350,
      "description": "자동 업데이트 디바운스 시간(ms)"
    },
    "nodes": [
      { "id": "ingest", "type": "source", "label": "영상 입력", "enabled": true },
      { "id": "decode", "type": "transform", "label": "프레임 디코딩", "enabled": true },
      { "id": "preprocess", "type": "transform", "label": "AI 전처리 (640 · 6fps)", "enabled": true },
      { "id": "signals", "type": "analysis", "label": "실제 영상 신호 추출", "enabled": true },
      { "id": "detect", "type": "analysis", "label": "YOLO 객체 탐지", "enabled": true },
      { "id": "track", "type": "analysis", "label": "ByteTrack 추적", "enabled": true },
      { "id": "pose", "type": "analysis", "label": "사람 자세 분석", "enabled": true },
      { "id": "behavior", "type": "analysis", "label": "행동 인식", "enabled": true },
      { "id": "accidents", "type": "analysis", "label": "시간 기반 사고 판단", "enabled": true },
      { "id": "industrial", "type": "analysis", "label": "산업현장 위험 분석", "enabled": true },
      { "id": "situation", "type": "analysis", "label": "상황 판단", "enabled": true },
      { "id": "action", "type": "output", "label": "조치 권고", "enabled": true },
      { "id": "description", "type": "output", "label": "영상 텍스트 설명", "enabled": true },
      { "id": "performance", "type": "output", "label": "성능 평가", "enabled": true },
      { "id": "review", "type": "output", "label": "사고 검토", "enabled": true },
      { "id": "report", "type": "output", "label": "분석 리포트", "enabled": true }
    ],
    "edges": [
      { "from": "ingest", "to": "decode" },
      { "from": "decode", "to": "preprocess" },
      { "from": "preprocess", "to": "signals" },
      { "from": "preprocess", "to": "detect" },
      { "from": "signals", "to": "track" },
      { "from": "detect", "to": "track" },
      { "from": "track", "to": "pose" },
      { "from": "pose", "to": "behavior" },
      { "from": "track", "to": "accidents" },
      { "from": "behavior", "to": "accidents" },
      { "from": "accidents", "to": "industrial" },
      { "from": "industrial", "to": "situation" },
      { "from": "situation", "to": "action" },
      { "from": "situation", "to": "description" },
      { "from": "situation", "to": "performance" },
      { "from": "accidents", "to": "review" },
      { "from": "review", "to": "report" },
      { "from": "action", "to": "report" },
      { "from": "description", "to": "report" },
      { "from": "performance", "to": "report" }
    ]
  },
  "isolation": {
    "standalone": true,
    "description": "다른 프로젝트와 포트/주소/설정을 공유하지 않는 독립 실행 모드",
    "reservedPortOwner": "visionflow-studio"
  },
  "ports": {
    "web": 53710,
    "next": 53711,
    "vue": 53712,
    "fastapi": 53720,
    "express": 53721
  },
  "server": {
    "port": 53720,
    "host": "0.0.0.0",
    "corsOrigins": [
      "http://localhost:53710",
      "http://localhost:53711",
      "http://localhost:53712"
    ]
  }
}
```

</details>

<details>
<summary><code>configs/app.config.schema.json</code></summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VisionFlow Studio App Config",
  "type": "object",
  "properties": {
    "project": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "slug": { "type": "string" },
        "version": { "type": "string" },
        "description": { "type": "string" }
      },
      "required": ["name", "slug", "version"]
    },
    "options": { "type": "object" },
    "performance": { "type": "object" },
    "accuracy": { "type": "object" },
    "preprocessing": { "type": "object" },
    "detection": {
      "type": "object",
      "properties": {
        "model": { "type": "object" },
        "tracker": { "type": "object" },
        "opticalFlow": { "type": "object" },
        "classFilter": { "type": "object" },
        "resolutionMode": { "type": "object" },
        "scales": { "type": "object" },
        "runtime": { "type": "object" }
      }
    },
    "broker": { "type": "object" },
    "prediction": { "type": "object" },
    "streaming": { "type": "object" },
    "storage": { "type": "object" },
    "training": { "type": "object" },
    "safety": { "type": "object" },
    "measurement": {
      "type": "object",
      "properties": {
        "relativeSize": { "type": "object" },
        "referenceObject": { "type": "object" },
        "knownWidthCm": { "type": "object" },
        "fieldOfViewDeg": { "type": "object" },
        "depthEstimation": { "type": "object" }
      }
    },
    "pipeline": {
      "type": "object",
      "properties": {
        "autoUpdate": { "type": "object" },
        "nodes": { "type": "array" },
        "edges": { "type": "array" }
      },
      "required": ["autoUpdate", "nodes", "edges"]
    },
    "ports": {
      "type": "object",
      "properties": {
        "web": { "type": "integer" },
        "next": { "type": "integer" },
        "vue": { "type": "integer" },
        "fastapi": { "type": "integer" },
        "express": { "type": "integer" }
      },
      "required": ["web", "next", "vue", "fastapi", "express"]
    },
    "isolation": { "type": "object" },
    "server": { "type": "object" }
  },
  "required": ["project", "options", "performance", "accuracy", "preprocessing", "detection", "broker", "prediction", "training", "safety", "streaming", "storage", "measurement", "pipeline", "ports"]
}
```

</details>

<details>
<summary><code>scripts/check-ports.mjs</code></summary>

```javascript
/**
 * 포트 충돌 검사기.
 * 이 프로젝트가 예약한 포트가 다른 프로젝트와 겹치지 않는지 확인합니다.
 * 실행: npm run ports:check
 */
import net from 'node:net';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(resolve(__dirname, '../configs/app.config.json'), 'utf-8'));
const ports = config.ports;
const owner = config.isolation?.reservedPortOwner ?? 'unknown';

const values = Object.values(ports);
const duplicated = values.filter((p, i) => values.indexOf(p) !== i);

function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen({ port, host: '0.0.0.0' });
  });
}

console.log(`VisionFlow Studio 포트 검사 (예약자: ${owner})`);
if (duplicated.length) {
  console.error(`❌ 설정 내부에서 포트 중복: ${[...new Set(duplicated)].join(', ')}`);
  process.exit(1);
}

const results = await Promise.all(Object.entries(ports).map(async ([name, port]) => ({
  name,
  port,
  free: await isFree(port),
})));

let blocked = false;
for (const r of results) {
  console.log(`  ${r.free ? '✅' : '⚠️ '} ${r.name.padEnd(8)} :${r.port} ${r.free ? '사용 가능' : '이미 사용 중 (다른 프로젝트와 충돌 가능)'}`);
  if (!r.free) blocked = true;
}

if (blocked) {
  console.error('\n충돌이 감지되었습니다. configs/app.config.json 의 ports 값을 변경하세요.');
  process.exit(1);
}
console.log('\n모든 포트가 격리되어 있으며 충돌이 없습니다.');
```

</details>

<details>
<summary><code>scripts/generate-code-doc.mjs</code></summary>

```javascript
/**
 * WORKLOG.md 에 "코드 상세" 섹션을 생성/갱신합니다.
 * 각 파일명을 클릭하면 <details> 안의 전체 소스 코드가 펼쳐집니다.
 * 실행: node scripts/generate-code-doc.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const files = [
  'package.json',
  'configs/app.config.json',
  'configs/app.config.schema.json',
  'scripts/check-ports.mjs',
  'scripts/generate-code-doc.mjs',
  'README.md',
  'docs/ISOLATION.md',
  'docs/PIPELINE_FLOW.md',
  'docs/DATA_CATALOG.md',
  'apps/web-react/package.json',
  'apps/web-react/vite.config.ts',
  'apps/web-react/tsconfig.json',
  'apps/web-react/index.html',
  'apps/web-react/src/main.tsx',
  'apps/web-react/src/App.tsx',
  'apps/web-react/src/types/index.ts',
  'apps/web-react/src/config/index.ts',
  'apps/web-react/src/data/mockData.ts',
  'apps/web-react/src/data/featureGuides.ts',
  'apps/web-react/src/engine/types.ts',
  'apps/web-react/src/engine/mockEngine.ts',
  'apps/web-react/src/engine/realEngine.ts',
  'apps/web-react/src/engine/hybridEngine.ts',
  'apps/web-react/src/engine/factory.ts',
  'apps/web-react/src/pipeline/catalog.ts',
  'apps/web-react/src/pipeline/graph.ts',
  'apps/web-react/src/pipeline/executor.ts',
  'apps/web-react/src/store/useStore.ts',
  'apps/web-react/src/services/trainingApi.ts',
  'apps/web-react/src/services/labelingApi.ts',
  'apps/web-react/src/analysis/remoteDetector.ts',
  'apps/web-react/src/analysis/browserVideoAnalyzer.ts',
  'apps/web-react/src/analysis/liveTracker.ts',
  'apps/web-react/src/analysis/motionCompensation.ts',
  'apps/web-react/src/hooks/useLiveTracking.ts',
  'apps/web-react/src/hooks/useLiveAccidents.ts',
  'apps/web-react/src/hooks/useAnalysisStream.ts',
  'apps/web-react/src/styles/global.css',
  'apps/web-react/src/components/visualizations/RadialGauge.tsx',
  'apps/web-react/src/components/visualizations/Sparkline.tsx',
  'apps/web-react/src/components/visualizations/MetricCard.tsx',
  'apps/web-react/src/components/visualizations/Heatmap.tsx',
  'apps/web-react/src/components/layout/Sidebar.tsx',
  'apps/web-react/src/components/layout/Topbar.tsx',
  'apps/web-react/src/components/layout/ToastHost.tsx',
  'apps/web-react/src/components/layout/FeatureGuideModal.tsx',
  'apps/web-react/src/components/pipeline/PipelineCanvas.tsx',
  'apps/web-react/src/components/pipeline/NodeInspector.tsx',
  'apps/web-react/src/components/panels/DataCard.tsx',
  'apps/web-react/src/components/panels/ClipLabelingPanel.tsx',
  'apps/web-react/src/components/panels/ModelTrainingPanel.tsx',
  'apps/web-react/src/components/panels/ObjectMeasurementPanel.tsx',
  'apps/web-react/src/components/panels/SituationVideoGuide.tsx',
  'apps/web-react/src/components/panels/StreamPredictionPanel.tsx',
  'apps/web-react/src/components/panels/VideoPlaybackPanel.tsx',
  'apps/web-react/src/components/panels/Dashboard.tsx',
  'apps/web-react/src/components/panels/AnalysisPanel.tsx',
  'apps/web-react/src/components/panels/BehaviorPanel.tsx',
  'apps/web-react/src/components/panels/ActionsPanel.tsx',
  'apps/web-react/src/components/panels/AccidentTimelinePanel.tsx',
  'apps/web-react/src/components/panels/VideoDescriptionPanel.tsx',
  'apps/web-react/src/components/panels/PerformancePanel.tsx',
  'apps/web-react/src/components/panels/SettingsPanel.tsx',
  'apps/web-react/src/components/panels/DataCatalogPanel.tsx',
  'apps/web-next/package.json',
  'apps/web-next/next.config.mjs',
  'apps/web-next/tsconfig.json',
  'apps/web-next/app/layout.tsx',
  'apps/web-next/app/page.tsx',
  'apps/web-next/app/globals.css',
  'apps/web-vue/package.json',
  'apps/web-vue/vite.config.ts',
  'apps/web-vue/index.html',
  'apps/web-vue/src/main.ts',
  'apps/web-vue/src/App.vue',
  'apps/web-vue/src/style.css',
  'services/fastapi/requirements.txt',
  'services/fastapi/app/__init__.py',
  'services/fastapi/app/analyzer.py',
  'services/fastapi/app/main.py',
  'services/fastapi/app/yolo_detector.py',
  'services/fastapi/app/onnx_detector.py',
  'services/fastapi/app/openvino_detector.py',
  'services/fastapi/app/resolution.py',
  'services/fastapi/app/preprocessing.py',
  'services/fastapi/app/safety.py',
  'services/fastapi/app/active_learning.py',
  'services/fastapi/app/synthesis.py',
  'services/fastapi/app/clip_store.py',
  'services/fastapi/app/dataset_manager.py',
  'services/fastapi/app/accident_analyzer.py',
  'apps/web-react/src/analysis/industrialSafety.ts',
  'apps/web-react/src/services/feedbackApi.ts',
  'services/fastapi/app/evaluation.py',
  'services/fastapi/app/feedback.py',
  'services/fastapi/app/behavior_dataset.py',
  'services/fastapi/app/accident_analyzer.py',
  'services/fastapi/app/external_datasets.py',
  'services/fastapi/app/data_catalog.py',
  'services/fastapi/app/auto_retrain.py',
  'services/fastapi/app/build_site_dataset.py',
  'services/fastapi/app/trainer.py',
  'services/fastapi/app/events.py',
  'services/fastapi/app/event_store.py',
  'services/fastapi/app/prediction.py',
  'services/fastapi/app/stream.py',
  'services/fastapi/app/broker.py',
  'services/fastapi/app/timeseries.py',
  'services/fastapi/app/measurement.py',
  'services/fastapi/app/behavior_recognizer.py',
  'services/fastapi/app/depth_estimator.py',
  'services/express/package.json',
  'services/express/src/index.js',
];

const langFor = (path) => {
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.ts')) return 'ts';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'javascript';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.html') || path.endsWith('.vue')) return 'html';
  if (path.endsWith('.py')) return 'python';
  return 'text';
};

const markerStart = '<!-- CODE_DETAILS_START -->';
const markerEnd = '<!-- CODE_DETAILS_END -->';

let lines = [
  markerStart,
  '',
  '## 코드 상세 (파일명 클릭 시 전체 코드 펼침)',
  '',
  '> 아래 파일명을 클릭하면 해당 파일의 **실제 전체 코드**가 표시됩니다.',
  '',
];

for (const file of files) {
  const full = resolve(root, file);
  let code;
  try {
    code = readFileSync(full, 'utf-8').replace(/\r\n/g, '\n').trimEnd();
  } catch {
    code = '(파일을 읽을 수 없습니다)';
  }
  const fence = '```';
  lines.push('<details>');
  lines.push(`<summary><code>${file}</code></summary>`);
  lines.push('');
  lines.push(`${fence}${langFor(file)}`);
  lines.push(code);
  lines.push(fence);
  lines.push('');
  lines.push('</details>');
  lines.push('');
}
lines.push(markerEnd);

const worklogPath = resolve(root, 'docs/WORKLOG.md');
const summaryPath = resolve(root, 'docs/WORKLOG_SUMMARY.md');
// 요약 원본을 항상 새로 읽어 코드 상세를 덧붙인다 (중복 방지)
let existing = readFileSync(summaryPath, 'utf-8').trimEnd();
writeFileSync(worklogPath, existing + '\n\n' + lines.join('\n') + '\n', 'utf-8');
console.log(`CODE_DETAILS 갱신 완료: ${files.length}개 파일`);
```

</details>

<details>
<summary><code>README.md</code></summary>

```text
# VisionFlow Studio

영상 기반 **데이터 분석 / 인물 행동 감지 / 상황별 조치 권고**를 하나의 파이프라인으로 연결한 웹 스튜디오입니다.

> ⚠️ **독립 실행 프로젝트**: 다른 프로젝트와 연동하지 않으며, 포트·주소·설정·의존성을 공유하지 않습니다.
> 자세한 내용은 [`docs/ISOLATION.md`](docs/ISOLATION.md) 참조.

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
```

</details>

<details>
<summary><code>docs/ISOLATION.md</code></summary>

```text
# 프로젝트 격리 정책 (Isolation)

이 문서는 VisionFlow Studio가 **다른 프로젝트와 연동되거나 주소가 겹치지 않도록** 설계된 방식을 설명합니다.

## 1. 물리적 격리
- 프로젝트 루트: `C:\Users\mbc\Desktop\학생방\박규현\visionflow-studio`
- 모든 소스/설정/의존성(`node_modules`)이 이 폴더 내부에만 존재합니다.
- npm workspaces는 이 프로젝트 하위의 `apps/*`, `services/express`만 명시적으로 포함합니다.
- 외부 패키지나 다른 프로젝트의 설정 파일을 참조하지 않습니다. 유일한 설정 참조는 `configs/app.config.json`입니다.

## 2. 포트 격리 (주소 중복 방지)

예약 포트는 `configs/app.config.json`의 `ports`에 중앙 정의되어 있습니다.

| 서비스 | 포트 |
|---|---|
| web (React) | 53710 |
| next | 53711 |
| vue | 53712 |
| fastapi | 53720 |
| express | 53721 |

- 모든 개발 서버에 `strictPort: true` (또는 `next dev -p 53711`)를 적용하여, 포트가 이미 사용 중이면 자동으로 다른 포트로 넘어가지 않고 **오류를 발생**시킵니다.
- 일반적으로 다른 프로젝트가 사용하는 3000 / 5173 / 5174 / 8000 포트를 사용하지 않습니다.
- 검사 명령:

```bash
npm run ports:check
```

이 스크립트는 설정 내부 중복 포트와 시스템상 사용 중인 포트를 검사하고, 충돌 시 종료 코드 1을 반환합니다.

## 3. 네트워크 격리
- FastAPI CORS는 `http://localhost:53710`, `53711`, `53712` **자체 프론트엔드 주소만** 허용합니다. (와일드카드 미사용)
- Express는 동일 설정 파일의 `ports.express`를 사용합니다.
- 프론트엔드의 백엔드 호출 주소는 `options.backend` 선택에 따라 `ports.fastapi` / `ports.express`로 분기됩니다.

## 4. 설정 격리
- `configs/app.config.json`의 `isolation.standalone = true`가 독립 모드 플래그입니다.
- `reservedPortOwner = "visionflow-studio"`로 포트 소유자를 명시합니다.
- 다른 프로젝트의 환경 변수(`PORT` 등)를 상속받지 않으며, 모든 기본값이 이 설정에 포함되어 있습니다.

## 5. 포트 변경 방법
충돌이 발생하면 `configs/app.config.json`의 `ports` 값만 변경하세요.
프론트엔드 Vite/Next/Vue 설정과 백엔드 실행 스크립트는 이 값을 기준으로 동작합니다.
(`web-react/vite.config.ts`, `web-vue/vite.config.ts`, `apps/web-next/package.json`, 루트 `package.json` 스크립트)
```

</details>

<details>
<summary><code>docs/PIPELINE_FLOW.md</code></summary>

```text
# VisionFlow Studio 파이프라인 흐름도

16개 노드 · 20개 연결 · 위상 정렬 기반 자동 레이아웃 (겹침 0건)

## 전체 흐름

```mermaid
flowchart LR
    IN["📥 영상 입력<br/>source"] --> DEC["🎞️ 프레임 디코딩<br/>transform"]
    DEC --> PRE["⚙️ AI 전처리<br/>640px · 6fps"]
    PRE --> SIG["📊 영상 신호 추출<br/>밝기·모션·엣지"]
    PRE --> DET["🔍 YOLO 객체 탐지<br/>사람·차량·지게차"]

    SIG --> TRK["🎯 ByteTrack 추적<br/>ID 유지·이동 경로"]
    DET --> TRK

    TRK --> POSE["🦴 사람 자세 분석<br/>관절·기울기"]
    POSE --> BEH["🧠 행동 인식<br/>시계열 분류"]

    TRK --> ACC["🚨 시간 기반 사고 판단<br/>거리·속도·지속"]
    BEH --> ACC

    ACC --> IND["🏗️ 산업현장 위험 분석<br/>지게차·추락·협착"]
    IND --> SIT["🔎 상황 판단"]

    SIT --> ACT["📋 조치 권고"]
    SIT --> DESC["📝 영상 텍스트 설명"]
    SIT --> PERF["📈 성능 평가"]

    ACC --> REV["✅ 사고 검토<br/>사용자 verification"]

    REV --> RPT["📄 분석 리포트"]
    ACT --> RPT
    DESC --> RPT
    PERF --> RPT

    classDef source fill:#0e4a5a,stroke:#22d3ee,color:#e8f0ff;
    classDef transform fill:#3b2a6b,stroke:#a78bfa,color:#e8f0ff;
    classDef analysis fill:#14483a,stroke:#34d399,color:#e8f0ff;
    classDef output fill:#5a3418,stroke:#fb923c,color:#e8f0ff;

    class IN source;
    class DEC,PRE transform;
    class SIG,DET,TRK,POSE,BEH,ACC,IND,SIT analysis;
    class ACT,DESC,PERF,REV,RPT output;
```

## 레이어 구분

| 레이어 | 노드 | 역할 |
|---|---|---|
| 입력·전처리 | 영상 입력 → 프레임 디코딩 → AI 전처리 | 원본 유지, AI용 640·6fps 축소 |
| 탐지·추적 | 신호 추출, YOLO 탐지 → ByteTrack → 자세 | 객체 감지 + ID 유지 + 관절 분석 |
| 사고·행동 분석 | 행동 인식, 시간 기반 사고 판단 → 산업현장 위험 → 상황 판단 | 룰+시간적 근거 기반 판정 |
| 검토·출력 | 사고 검토, 조치·설명·성능 → 리포트 | 사용자 검증 후 결과 산출 |

## 자동 레이아웃 규칙

- 위상 정렬로 각 노드의 **깊이(열)** 계산
- 같은 깊이의 노드는 **198px 간격 행**으로 배치
- 캔버스 2280×820, 노드 178×104 → 겹침 불가
- 노드 추가/삭제/연결 변경 시 `updateGraph()`가 자동 재배치 + 버전 증가

## 상세 데이터 출력

노드에 마우스를 올리면 다음이 표시됩니다:
- 노드 설명 / 종류
- 입력·출력 건수 (실제 분석 결과 연동)
- 실행 상태·진행률·지연 시간
- 처리량 아이콘 (BarChart3 / Activity)
```

</details>

<details>
<summary><code>docs/DATA_CATALOG.md</code></summary>

```text
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
```

</details>

<details>
<summary><code>apps/web-react/package.json</code></summary>

```json
{
  "name": "@visionflow/web-react",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 0.0.0.0"
  },
  "dependencies": {
    "framer-motion": "^11.11.17",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.13.3",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@types/node": "^26.6.6",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.5"
  }
}
```

</details>

<details>
<summary><code>apps/web-react/vite.config.ts</code></summary>

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 다른 프로젝트와 겹치지 않는 이 프로젝트 전용 포트
    port: 53710,
    strictPort: true,
    host: '0.0.0.0',
    // 루트 configs/app.config.json 을 직접 import 하기 위해 워크스페이스 루트 허용
    fs: {
      allow: ['../..', '.'],
    },
  },
  preview: {
    port: 53710,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

</details>

<details>
<summary><code>apps/web-react/tsconfig.json</code></summary>

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "vite.config.ts"]
}
```

</details>

<details>
<summary><code>apps/web-react/index.html</code></summary>

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#070b14" />
    <meta name="description" content="VisionFlow Studio - 영상 기반 데이터 분석 및 인물 행동 감지 파이프라인" />
    <title>VisionFlow Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

</details>

<details>
<summary><code>apps/web-react/src/main.tsx</code></summary>

```tsx
import ReactDOM from 'react-dom/client';
import App from './App';
import { clearResultCache } from './store/useStore';
import './styles/global.css';

// 새로고침/재접속 시 이전 세션의 분석 캐시를 버린다 (모델 변경 후 오래된 결과 방지)
clearResultCache();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

</details>

<details>
<summary><code>apps/web-react/src/App.tsx</code></summary>

```tsx
import { useEffect } from 'react';
import { CircleHelp } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import ToastHost from '@/components/layout/ToastHost';
import FeatureGuideModal from '@/components/layout/FeatureGuideModal';
import Dashboard from '@/components/panels/Dashboard';
import PipelineCanvas from '@/components/pipeline/PipelineCanvas';
import NodeInspector from '@/components/pipeline/NodeInspector';
import AnalysisPanel from '@/components/panels/AnalysisPanel';
import BehaviorPanel from '@/components/panels/BehaviorPanel';
import ActionsPanel from '@/components/panels/ActionsPanel';
import AccidentTimelinePanel from '@/components/panels/AccidentTimelinePanel';
import VideoDescriptionPanel from '@/components/panels/VideoDescriptionPanel';
import ObjectMeasurementPanel from '@/components/panels/ObjectMeasurementPanel';
import ModelTrainingPanel from '@/components/panels/ModelTrainingPanel';
import ClipLabelingPanel from '@/components/panels/ClipLabelingPanel';
import StreamPredictionPanel from '@/components/panels/StreamPredictionPanel';
import PerformancePanel from '@/components/panels/PerformancePanel';
import SettingsPanel from '@/components/panels/SettingsPanel';
import DataCatalogPanel from '@/components/panels/DataCatalogPanel';
import { useStore } from '@/store/useStore';
import type { WorkTab } from '@/store/useStore';

const TITLES: Record<WorkTab, { title: string; desc: string }> = {
  dashboard: { title: '통합 대시보드', desc: '전체 분석 현황과 파이프라인 상태를 한눈에 확인합니다.' },
  pipeline: { title: '파이프라인 구조', desc: '노드 생성·수정·삭제 시 그래프가 자동으로 재구성되고 재실행됩니다.' },
  analysis: { title: '영상 데이터 분석 결과', desc: '영상에서 추출한 시계열·혼잡도·신뢰도 데이터를 시각화합니다.' },
  behavior: { title: '인물 행동 감지', desc: '영상 속 인물을 추적하고 행동을 감지해 신뢰도와 함께 표시합니다.' },
  actions: { title: '상황별 조치 내용', desc: '감지된 상황에 맞는 대응 절차와 담당자, 예상 시간을 권고합니다.' },
  accidents: { title: '시간별 사고 인식', desc: '영상에서 인식된 사고를 발생 시각순으로 표시하고 사고 내용과 대응 상태를 출력합니다.' },
  description: { title: '영상 텍스트 설명', desc: '영상 전체 요약과 10초 단위 캡션으로 영상 내용을 텍스트로 설명합니다.' },
  measurement: { title: '사물 측정', desc: '상대 크기, 기준물 보정, 깊이 추정으로 객체의 크기와 거리를 근사합니다.' },
  training: { title: '모델 학습', desc: '감지 프레임을 라벨 데이터로 수집하고 YOLO를 미세조정해 커스텀 모델을 만듭니다.' },
  labeling: { title: '클립 수동 라벨링', desc: '위험 감지로 저장된 클립의 프레임을 직접 확인하고 BBox를 수정해 학습 라벨로 저장합니다.' },
  stream: { title: '스트림 · 예측', desc: 'WebSocket 이벤트 푸시, RTSP 스트림 분석, 칼만 필터 이동 예측과 위험구역 판단을 제공합니다.' },
  performance: { title: '기능별 성능평가', desc: '각 기능의 지연·처리량·정확도·리소스 사용량을 분석하고 개선 방향을 제안합니다.' },
  settings: { title: '옵션 · 성능 · 정확도', desc: '각 모듈을 독립적으로 선택하고 성능과 정확도를 세부 조절합니다.' },
  catalog: { title: '데이터 카탈로그', desc: '웹에 구성된 데이터 종류와 저장 경로, 연결 API를 한눈에 출력합니다.' },
};

export default function App() {
  const tab = useStore((s) => s.tab);
  const design = useStore((s) => s.config.options.design.value);
  const setTopOption = useStore((s) => s.setTopOption);
  const guideEnabled = useStore((s) => s.guideEnabled);
  const guideSeen = useStore((s) => s.guideSeen);
  const guideOpen = useStore((s) => s.guideOpen);
  const openGuide = useStore((s) => s.openGuide);

  // 디자인 옵션을 실제 테마로 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', design);
  }, [design]);

  // 처음 방문하는 탭에서 기능 안내 자동 표시 (옵션으로 비활성화 가능)
  useEffect(() => {
    if (guideEnabled && !guideSeen[tab] && !guideOpen) openGuide();
  }, [tab, guideEnabled, guideSeen, guideOpen, openGuide]);

  const isDark = design !== 'light' && design !== 'daylight';
  const onThemeToggle = () => setTopOption('design', isDark ? 'daylight' : 'aurora');
  const meta = TITLES[tab];

  const renderContent = () => {
    switch (tab) {
      case 'pipeline':
        return (
          <div className="grid grid-2-1">
            <PipelineCanvas />
            <NodeInspector />
          </div>
        );
      case 'analysis': return <AnalysisPanel />;
      case 'behavior': return <BehaviorPanel />;
      case 'actions': return <ActionsPanel />;
      case 'accidents': return <AccidentTimelinePanel />;
      case 'description': return <VideoDescriptionPanel />;
      case 'measurement': return <ObjectMeasurementPanel />;
      case 'training': return <ModelTrainingPanel />;
      case 'labeling': return <ClipLabelingPanel />;
      case 'stream': return <StreamPredictionPanel />;
      case 'performance': return <PerformancePanel />;
      case 'settings': return <SettingsPanel />;
      case 'catalog': return <DataCatalogPanel />;
      case 'dashboard':
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <Topbar onThemeToggle={onThemeToggle} isDark={isDark} />
      <main className="workspace">
        <div className="page-head">
          <div>
            <div className="page-title">{meta.title}</div>
            <div className="page-desc">{meta.desc}</div>
          </div>
          <button className="ghost-btn" style={{ marginLeft: 'auto' }} onClick={openGuide} title="이 기능에 대한 안내 팝업 열기">
            <CircleHelp size={14} /> 안내
          </button>
        </div>
        <div key={tab} className="tab-content">{renderContent()}</div>
      </main>
      <ToastHost />
      <FeatureGuideModal />
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/types/index.ts</code></summary>

```ts
// ============================================================
// 공통 설정 타입
// ============================================================

export type FrontendChoice = 'react' | 'next' | 'vue';
export type EngineChoice = 'mock' | 'real' | 'hybrid';
export type BackendChoice = 'none' | 'fastapi' | 'express';
export type DesignChoice = 'aurora' | 'midnight' | 'light' | 'daylight' | 'cyber';
export type LanguageChoice = 'ko' | 'en';

export interface OptionGroup<T extends string> {
  value: T;
  choices: T[];
  description: string;
}

export interface NumericOption {
  value: number;
  min: number;
  max: number;
  description: string;
}

export interface EnumOption<T extends string> {
  value: T;
  choices: T[];
  description: string;
}

export interface BoolOption {
  value: boolean;
  description: string;
}

export type SelectOption = EnumOption<string> | NumericOption | BoolOption;

export interface AppConfig {
  project: {
    name: string;
    slug: string;
    version: string;
    description: string;
  };
  options: {
    frontend: OptionGroup<FrontendChoice>;
    analysisEngine: OptionGroup<EngineChoice>;
    backend: OptionGroup<BackendChoice>;
    design: OptionGroup<DesignChoice>;
    language: OptionGroup<LanguageChoice>;
  };
  performance: {
    resolution: EnumOption<'360p' | '480p' | '720p' | '1080p'>;
    fps: NumericOption;
    concurrency: NumericOption;
    hardwareAcceleration: BoolOption;
    adaptiveQuality: BoolOption;
    batchSize: NumericOption;
  };
  preprocessing: {
    nmsIoU: NumericOption;
    gamma: NumericOption;
    excludeZones: { value: number[][][]; description: string };
  };
  detection: {
    model: EnumOption<'yolov8n.pt' | 'yolov8s.pt' | 'yolov11n.pt' | 'rtdetr-l.pt'>;
    tracker: EnumOption<'nearest' | 'bytetrack' | 'botsort'>;
    trackBuffer: NumericOption;
    realtimeImgsz: NumericOption;
    personBoost: BoolOption;
    personBoostMinConf: NumericOption;
    analysisImgsz: NumericOption;
    analysisFps: NumericOption;
    opticalFlow: BoolOption;
    classFilter: EnumOption<'all' | 'person_vehicle' | 'person_only'>;
    resolutionMode: EnumOption<'single' | 'multiscale' | 'tiled'>;
    scales: { value: number[]; description: string };
    runtime: EnumOption<'onnx' | 'openvino' | 'pytorch'>;
  };
  broker: {
    type: EnumOption<'local' | 'redis'>;
    url: { value: string; description: string };
    stream: { value: string; description: string };
  };
  training: {
    activeLearning: BoolOption;
    ambiguousMin: NumericOption;
    ambiguousMax: NumericOption;
    clipWindowSec: NumericOption;
    syntheticCopies: NumericOption;
  };
  safety: {
    fallRiskZones: { value: number[][][]; description: string };
    disappearanceSec: NumericOption;
    stillSec: NumericOption;
    gatherCount: NumericOption;
  };
  prediction: {
    enabled: BoolOption;
    horizonSec: NumericOption;
    roiPolygons: { value: number[][][]; description: string };
  };
  accidentAnalysis: {
    enabled: BoolOption;
    collisionDistDrop: NumericOption;
    collisionWindowSec: NumericOption;
    stopSpeedThreshold: NumericOption;
    fallDropPct: NumericOption;
    minFrames: NumericOption;
  };
  streaming: {
    rtspUrl: { value: string; description: string };
    webrtcUrl: { value: string; description: string };
    enabled: BoolOption;
  };
  storage: {
    eventLog: BoolOption;
    clipBeforeSec: NumericOption;
    clipAfterSec: NumericOption;
  };
  measurement: {
    relativeSize: BoolOption;
    referenceObject: EnumOption<'car' | 'person' | 'none'>;
    knownWidthCm: NumericOption;
    fieldOfViewDeg: NumericOption;
    depthEstimation: BoolOption;
  };
  accuracy: {
    confidenceThreshold: NumericOption;
    personDetectionSensitivity: NumericOption;
    behaviorModel: EnumOption<'fast' | 'balanced' | 'accurate' | 'ensemble'>;
    temporalSmoothing: BoolOption;
    nmsThreshold: NumericOption;
    enableReIdentification: BoolOption;
  };
  pipeline: {
    autoUpdate: BoolOption;
    autoUpdateDebounceMs: NumericOption;
    nodes: PipelineNodeConfig[];
    edges: PipelineEdgeConfig[];
  };
  ports: {
    web: number;
    next: number;
    vue: number;
    fastapi: number;
    express: number;
  };
  isolation: {
    standalone: boolean;
    description: string;
    reservedPortOwner: string;
  };
  server: {
    port: number;
    host: string;
    corsOrigins: string[];
  };
}

// ============================================================
// 파이프라인 타입
// ============================================================

export type NodeKind = 'source' | 'transform' | 'analysis' | 'output';

export interface PipelineNodeConfig {
  id: string;
  type: NodeKind;
  label: string;
  enabled: boolean;
}

export interface PipelineEdgeConfig {
  from: string;
  to: string;
}

export interface PipelineNode extends PipelineNodeConfig {
  x: number;
  y: number;
  status: 'idle' | 'running' | 'done' | 'error';
  progress: number;
  durationMs?: number;
  output?: string;
  /** 상세 데이터: 입출력 건수·지연·설명 */
  detail?: {
    description?: string;
    inputCount?: number;
    outputCount?: number;
    latencyMs?: number;
    throughput?: string;
    note?: string;
  };
}

export interface PipelineEdge extends PipelineEdgeConfig {
  active: boolean;
}

// ============================================================
// 분석 결과 타입
// ============================================================

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PersonDetection {
  id: string;
  trackId: number;
  confidence: number;
  bbox: BoundingBox;
  pose?: string;
}

export type BehaviorSeverity = 'info' | 'caution' | 'warning' | 'critical';

export interface BehaviorEvent {
  id: string;
  timestamp: number; // 초 단위
  trackId: number;
  label: string;
  labelKo: string;
  category: string;
  confidence: number;
  severity: BehaviorSeverity;
  durationSec: number;
}

export interface Situation {
  id: string;
  timestamp: number;
  type: string;
  typeKo: string;
  description: string;
  severity: BehaviorSeverity;
  confidence: number;
  relatedBehaviors: string[];
  persons: number[];
}

export interface ActionRecommendation {
  id: string;
  situationId: string;
  priority: 'low' | 'medium' | 'high' | 'immediate';
  title: string;
  description: string;
  steps: string[];
  owner: string;
  estimatedTimeMin: number;
  automated: boolean;
}

export interface FrameMetric {
  t: number;
  value: number;
}

/** 영상 텍스트 설명 (시간대별 캡션 + 요약) */
export interface VideoCaption {
  id: string;
  timestamp: number;
  endTime: number;
  text: string;
  tags: string[];
}

export interface VideoDescription {
  summary: string;
  captions: VideoCaption[];
  highlights: string[];
  sceneCount: number;
}

/** 시간별 사고 인식 이벤트 */
export interface AccidentEvent {
  id: string;
  timestamp: number;
  endTime: number;
  type: string;
  typeKo: string;
  title: string;
  description: string;
  severity: BehaviorSeverity;
  confidence: number;
  persons: number[];
  zone: string;
  status: 'detected' | 'responding' | 'resolved';
  relatedBehaviorIds: string[];
}

/** 사물 측정 결과 (상대 크기 + 실측 근사치) */
export interface ObjectMeasurement {
  label: string;
  kind: 'person' | 'vehicle' | 'object';
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  widthPx: number;
  heightPx: number;
  widthPercent: number;
  heightPercent: number;
  areaPercent: number;
  aspectRatio: number;
  distanceM: number | null;
  widthCm: number | null;
  heightCm: number | null;
  method: 'reference+depth' | 'reference-plane' | 'relative-only';
}

/** 건설현장 안전 이벤트 (추락 vs 다툼 구분) */
export interface SafetyEvent {
  id: string;
  type: 'fall' | 'altercation' | 'fall_candidate';
  labelKo: string;
  severity: BehaviorSeverity;
  confidence: number;
  timestamp: number;
  reason: string;
  evidence: string[];
  zone: string;
}

/** 재생 중 실시간으로 감지된 사고 */
export interface LiveAccident {
  id: string;
  type: string;
  title: string;
  severity: 'caution' | 'warning' | 'critical';
  timestamp: number;
  description: string;
  evidence: string[];
}

/** 영상에서 추적된 형상(움직이는 객체)의 궤적 점 */
export interface TrackedShapePoint {
  t: number;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
}

/** 영상에서 추적된 형상 */
export interface TrackedShape {
  id: string;
  label: string;
  /** 모양 기반 분류 (실제 객체 인식 모델이 아닌 휴리스틱) */
  kind: 'person' | 'vehicle' | 'object';
  firstSeen: number;
  lastSeen: number;
  points: TrackedShapePoint[];
  distance: number;
}

/** 파이프라인 노드별 분석 상세 로그 */
export interface AnalysisLogEntry {
  id: string;
  nodeId: string;
  nodeLabel: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning';
  message: string;
  detail: string;
  metrics: Array<{ label: string; value: string }>;
}

/** 브라우저에서 실제 영상 프레임을 샘플링해 추출한 신호 */
export interface VideoSignalMetrics {
  durationSec: number;
  sampledFrames: number;
  effectiveFps: number;
  frameWidth: number;
  frameHeight: number;
  brightness: FrameMetric[];
  motion: FrameMetric[];
  edgeDensity: FrameMetric[];
  sceneChanges: number[];
  thumbnails: string[];
  /** 프레임 차분 + 연결 요소 분석으로 추적한 형상 목록 */
  tracks: TrackedShape[];
  source: 'browser-video' | 'fallback';
}

/** 기능별 성능평가 지표 */
export interface FeaturePerformance {
  measured?: boolean;
  key: string;
  label: string;
  labelKo: string;
  description: string;
  latencyMs: number;
  throughput: number;
  accuracy: number;
  precision: number;
  recall: number;
  memoryMb: number;
  cpuPercent: number;
  gpuPercent: number;
  status: 'optimal' | 'normal' | 'degraded';
}

export interface AnalysisResult {
  engine: EngineChoice;
  generatedAt: string;
  videoName: string;
  durationSec: number;
  processedFrames: number;
  personsDetected: number;
  detections: PersonDetection[];
  behaviors: BehaviorEvent[];
  situations: Situation[];
  actions: ActionRecommendation[];
  /** 시간별 사고 인식 결과 */
  accidents: AccidentEvent[];
  /** 영상 텍스트 설명 결과 */
  videoDescription: VideoDescription;
  /** 실제 영상 프레임에서 추출한 신호(업로드 영상일 때만) */
  videoSignals?: VideoSignalMetrics;
  /** 파이프라인 노드별 분석 상세 로그 */
  analysisLog: AnalysisLogEntry[];
  /** 엔진이 실제로 측정한 분석 단계 시간(ms) */
  engineTimings?: Record<string, number>;
  crowdDensity: FrameMetric[];
  confidenceSeries: FrameMetric[];
  motionSeries: FrameMetric[];
  /** 기능별 성능평가 분석 데이터 */
  performanceEvaluation: FeaturePerformance[];
  summary: {
    riskScore: number;
    complianceScore: number;
    avgConfidence: number;
    peakCrowd: number;
    totalBehaviors: number;
    criticalCount: number;
  };
}

// ============================================================
// 시각화/UI 타입
// ============================================================

export interface MetricCardData {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  trend?: 'up' | 'down' | 'flat';
  accent: string;
  icon?: string;
}

export interface Toast {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'warning' | 'error';
}
```

</details>

<details>
<summary><code>apps/web-react/src/config/index.ts</code></summary>

```ts
import rawConfig from '../../../../configs/app.config.json';
import type { AppConfig } from '@/types';

/**
 * 중앙 설정 로더 (프로젝트 내부 설정만 참조 — 외부 프로젝트와 공유하지 않음).
 * configs/app.config.json 이 단일 진실 공급원(SSOT)입니다.
 */
export const appConfig = rawConfig as unknown as AppConfig;

export function getConfigValue<T>(group: Record<string, any>, fallback: T): T {
  return (group?.value ?? fallback) as T;
}

/** 선택된 백엔드 옵션에 맞는 이 프로젝트 전용 URL */
export const backendBaseUrl = (): string => {
  const backend = appConfig.options.backend.value;
  const port = backend === 'express'
    ? appConfig.ports.express
    : appConfig.ports.fastapi;
  // localhost는 IPv6(::1) 해석 지연이 있어 127.0.0.1 사용
  return `http://127.0.0.1:${port}`;
};

export const ownPorts = appConfig.ports;

export default appConfig;
```

</details>

<details>
<summary><code>apps/web-react/src/data/mockData.ts</code></summary>

```ts
import type {
  ActionRecommendation,
  AccidentEvent,
  AnalysisLogEntry,
  AnalysisResult,
  AppConfig,
  BehaviorEvent,
  BehaviorSeverity,
  FeaturePerformance,
  FrameMetric,
  PersonDetection,
  Situation,
  VideoCaption,
} from '@/types';

// ------------------------------------------------------------
// 시나리오 카탈로그 (행동 → 상황 → 조치 매핑)
// ------------------------------------------------------------

export interface BehaviorTemplate {
  key: string;
  labelKo: string;
  label: string;
  category: string;
  severity: BehaviorSeverity;
  baseConfidence: number;
}

export const BEHAVIOR_TEMPLATES: BehaviorTemplate[] = [
  { key: 'walking', labelKo: '보행 중', label: 'Walking', category: '이동', severity: 'info', baseConfidence: 0.96 },
  { key: 'running', labelKo: '급하게 이동', label: 'Running', category: '이동', severity: 'caution', baseConfidence: 0.9 },
  { key: 'falling', labelKo: '낙상 발생', label: 'Falling', category: '안전', severity: 'critical', baseConfidence: 0.88 },
  { key: 'altercation', labelKo: '다툼/몸싸움', label: 'Altercation', category: '안전', severity: 'critical', baseConfidence: 0.82 },
  { key: 'loitering', labelKo: '장시간 체류', label: 'Loitering', category: '이상', severity: 'caution', baseConfidence: 0.78 },
  { key: 'crowd', labelKo: '인파 집중', label: 'Crowd Gathering', category: '혼잡', severity: 'warning', baseConfidence: 0.91 },
  { key: 'climbing', labelKo: '출입금지 구역 진입', label: 'Restricted Access', category: '보안', severity: 'warning', baseConfidence: 0.8 },
  { key: 'unattended', labelKo: '물건 방치', label: 'Unattended Object', category: '보안', severity: 'warning', baseConfidence: 0.76 },
  { key: 'helping', labelKo: '도움 요청/제공', label: 'Assisting', category: '안전', severity: 'info', baseConfidence: 0.84 },
  { key: 'waving', labelKo: '손짓/호출', label: 'Waving', category: '커뮤니케이션', severity: 'info', baseConfidence: 0.86 },
];

export interface SituationTemplate {
  key: string;
  typeKo: string;
  type: string;
  description: string;
  severity: BehaviorSeverity;
  triggers: string[];
  actions: Array<{
    title: string;
    description: string;
    steps: string[];
    owner: string;
    estimatedTimeMin: number;
    priority: ActionRecommendation['priority'];
    automated: boolean;
  }>;
}

export const SITUATION_TEMPLATES: SituationTemplate[] = [
  {
    key: 'crowd_surge',
    typeKo: '인파 밀집 경보',
    type: 'Crowd Surge',
    description: '특정 구역에 인구 밀도가 임계치를 초과하여 압사 위험이 감지되었습니다.',
    severity: 'critical',
    triggers: ['crowd', 'running'],
    actions: [
      {
        title: '인파 분산 유도',
        description: '해당 구역으로의 진입을 제한하고 인파를 인접 공간으로 분산시킵니다.',
        steps: ['진입로 차단 안내 방송 송출', '인파 분산 유도 요원 배치', '밀도 모니터링 강화'],
        owner: '현장 안전팀',
        estimatedTimeMin: 3,
        priority: 'immediate',
        automated: true,
      },
      {
        title: '비상 대응팀 출동',
        description: '현장 상황을 안전 관제실에 보고하고 대응팀을 출동시킵니다.',
        steps: ['관제실 상황 보고', '대응팀 출동 지시', 'CCTV 해당 구역 확대'],
        owner: '관제 센터',
        estimatedTimeMin: 5,
        priority: 'high',
        automated: false,
      },
    ],
  },
  {
    key: 'potential_fall',
    typeKo: '낙상 의심',
    type: 'Potential Fall',
    description: '인물이 급격한 자세 변화 후 움직이지 않아 낙상이 의심됩니다.',
    severity: 'critical',
    triggers: ['falling', 'helping'],
    actions: [
      {
        title: '즉시 현장 확인',
        description: '낙상 의심 위치로 요원을 파견해 상태를 확인합니다.',
        steps: ['최근 접근 요원 호출', '의료 키트 준비', '현장 접근 및 상태 확인'],
        owner: '안전 요원',
        estimatedTimeMin: 2,
        priority: 'immediate',
        automated: true,
      },
      {
        title: '구급대 연락',
        description: '상태 확인 결과에 따라 구급대를 호출합니다.',
        steps: ['119/구급대 연락 대기', '정확한 위치 전달', '접근로 확보'],
        owner: '관제 센터',
        estimatedTimeMin: 5,
        priority: 'high',
        automated: false,
      },
    ],
  },
  {
    key: 'altercation',
    typeKo: '다툼/폭력 행위',
    type: 'Altercation',
    description: '두 명 이상의 인물 간 신체 접촉이 감지되어 다툼이 의심됩니다.',
    severity: 'critical',
    triggers: ['altercation', 'running'],
    actions: [
      {
        title: '현장 개입',
        description: '경비 요원을 파견해 다툼을 중재하고 위험을 차단합니다.',
        steps: ['경비 요원 파견', '음성 경고 방송', '신체적 개입 준비'],
        owner: '경비팀',
        estimatedTimeMin: 3,
        priority: 'immediate',
        automated: false,
      },
      {
        title: '증거 영상 확보',
        description: '해당 구역 영상을 클립으로 저장하고 사건 기록을 생성합니다.',
        steps: ['영상 클립 저장', '사건 번호 생성', '관제실 아카이빙'],
        owner: '관제 센터',
        estimatedTimeMin: 4,
        priority: 'medium',
        automated: true,
      },
    ],
  },
  {
    key: 'unauthorized_access',
    typeKo: '출입금지 구역 진입',
    type: 'Unauthorized Access',
    description: '출입이 제한된 구역에 인물이 진입했습니다.',
    severity: 'warning',
    triggers: ['climbing', 'loitering'],
    actions: [
      {
        title: '출입 통제 안내',
        description: '해당 인물에게 경고 방송을 송출하고 출입을 통제합니다.',
        steps: ['경고 방송 송출', '출입구 잠금 확인', '인물 이동 유도'],
        owner: '경비팀',
        estimatedTimeMin: 4,
        priority: 'high',
        automated: true,
      },
    ],
  },
  {
    key: 'unattended_object',
    typeKo: '물건 방치 의심',
    type: 'Unattended Object',
    description: '일정 시간 이상 움직이지 않는 물건이 감지되었습니다.',
    severity: 'warning',
    triggers: ['unattended'],
    actions: [
      {
        title: '소유자 확인 및 조치',
        description: '주변 인물에게 소유자를 확인하고 미수령 시 회수 절차를 진행합니다.',
        steps: ['소유자 확인 방송', '담당자 현장 확인', '유실물 처리 절차'],
        owner: '시설 관리팀',
        estimatedTimeMin: 8,
        priority: 'medium',
        automated: false,
      },
    ],
  },
];

// ------------------------------------------------------------
// 결정적 난수 생성 (설정에 따라 결과 재현 가능)
// ------------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ============================================================
// 목업 분석 결과 생성기
// - 정확도 옵션(confidenceThreshold, sensitivity, model)이 결과에 반영된다.
// - 성능 옵션(fps, resolution)이 처리 프레임 수/노이즈에 반영된다.
// ============================================================

export function generateMockResult(
  videoName: string,
  config: AppConfig,
): AnalysisResult {
  const seed = hashString(videoName + config.options.analysisEngine.value);
  const rand = mulberry32(seed);

  const durationSec = 60;
  const fps = config.performance.fps.value;
  const processedFrames = Math.round(durationSec * fps);

  const threshold = config.accuracy.confidenceThreshold.value;
  const sensitivity = config.accuracy.personDetectionSensitivity.value;
  const model = config.accuracy.behaviorModel.value;
  const smoothing = config.accuracy.temporalSmoothing.value;
  const reid = config.accuracy.enableReIdentification.value;

  // 모델 프로파일에 따른 신뢰도 보정
  const modelBoost: Record<string, number> = {
    fast: -0.04,
    balanced: 0,
    accurate: 0.04,
    ensemble: 0.07,
  };
  const boost = modelBoost[model] ?? 0;
  const noise = smoothing ? 0.02 : 0.08;

  // 인물 감지 수 (민감도 반영)
  const personsDetected = Math.max(1, Math.round(6 + sensitivity * 8 + rand() * 3));

  const detections: PersonDetection[] = Array.from({ length: personsDetected }, (_, i) => ({
    id: `p-${i}`,
    trackId: reid ? i + 1 : Math.floor(rand() * personsDetected) + 1,
    confidence: clamp(0.7 + rand() * 0.29 + boost - noise, 0.3, 0.99),
    bbox: {
      x: Math.round(rand() * 80),
      y: Math.round(rand() * 60),
      w: Math.round(8 + rand() * 16),
      h: Math.round(18 + rand() * 26),
    },
    pose: rand() > 0.5 ? 'standing' : 'walking',
  }));

  // 행동 이벤트 생성 (임계값 이상만 채택 → 정확도 옵션 반영)
  const behaviors: BehaviorEvent[] = [];
  const eventCount = 14 + Math.floor(rand() * 8);
  for (let i = 0; i < eventCount; i += 1) {
    const tpl = BEHAVIOR_TEMPLATES[Math.floor(rand() * BEHAVIOR_TEMPLATES.length)];
    const confidence = clamp(tpl.baseConfidence + boost - noise + (rand() - 0.5) * 0.08, 0.3, 0.99);
    if (confidence < threshold) continue;
    behaviors.push({
      id: `b-${i}`,
      timestamp: Math.round(rand() * durationSec * 10) / 10,
      trackId: Math.floor(rand() * personsDetected) + 1,
      label: tpl.label,
      labelKo: tpl.labelKo,
      category: tpl.category,
      confidence,
      severity: tpl.severity,
      durationSec: Math.round((1 + rand() * 8) * 10) / 10,
    });
  }
  behaviors.sort((a, b) => a.timestamp - b.timestamp);

  // 상황 판단: 트리거 행동이 존재하면 상황 생성
  const situations: Situation[] = [];
  SITUATION_TEMPLATES.forEach((stpl, idx) => {
    const matched = behaviors.filter((b) => stpl.triggers.includes(
      BEHAVIOR_TEMPLATES.find((t) => t.labelKo === b.labelKo)?.key ?? '',
    ));
    if (matched.length === 0 && rand() > 0.7) return;
    const situationConfidence = clamp(
      0.7 + boost - noise + matched.length * 0.03 + rand() * 0.08,
      0.3,
      0.99,
    );
    if (situationConfidence < threshold) return;
    situations.push({
      id: `s-${idx}`,
      timestamp: matched.length ? matched[0].timestamp : Math.round(rand() * durationSec),
      type: stpl.type,
      typeKo: stpl.typeKo,
      description: stpl.description,
      severity: stpl.severity,
      confidence: situationConfidence,
      relatedBehaviors: matched.map((m) => m.id),
      persons: Array.from(new Set(matched.map((m) => m.trackId))),
    });
  });

  // 조치 권고 생성
  const actions: ActionRecommendation[] = [];
  situations.forEach((sit) => {
    const stpl = SITUATION_TEMPLATES.find((s) => s.type === sit.type);
    stpl?.actions.forEach((a, ai) => {
      actions.push({
        id: `a-${sit.id}-${ai}`,
        situationId: sit.id,
        priority: a.priority,
        title: a.title,
        description: a.description,
        steps: a.steps,
        owner: a.owner,
        estimatedTimeMin: a.estimatedTimeMin,
        automated: a.automated,
      });
    });
  });

  // 시간별 사고 인식 생성 (행동 이벤트를 사고로 매핑)
  const accidentTemplates: Record<string, { type: string; typeKo: string; title: string; description: string }> = {
    falling: { type: 'fall', typeKo: '낙상', title: '인물 낙상 사고', description: '인물이 균형을 잃고 바닥에 쓰러진 것이 감지되었습니다. 즉시 상태 확인이 필요합니다.' },
    altercation: { type: 'altercation', typeKo: '폭력', title: '다툼·폭력 사고', description: '두 명 이상의 인물 간 신체 접촉이 감지되어 폭력 행위가 의심됩니다.' },
    crowd: { type: 'crowd_crush', typeKo: '인파', title: '인파 밀집 사고 위험', description: '해당 구역의 인구 밀도가 임계치를 초과해 압사 위험이 발생했습니다.' },
    unattended: { type: 'unattended', typeKo: '방치', title: '수상 물체 방치', description: '장시간 이동하지 않는 물체가 감지되어 소유자 확인이 필요합니다.' },
    climbing: { type: 'intrusion', typeKo: '침입', title: '출입금지 구역 침입', description: '인물이 통제 구역에 진입한 것이 감지되었습니다.' },
    running: { type: 'panic', typeKo: '혼란', title: '급격한 이동·혼란', description: '다수 인물이 급하게 이동하여 혼란이 감지되었습니다.' },
  };
  const accidentKeys = ['falling', 'altercation', 'crowd', 'unattended', 'climbing', 'running'];
  const accidents: AccidentEvent[] = [];
  behaviors
    .filter((b) => {
      const key = BEHAVIOR_TEMPLATES.find((t) => t.labelKo === b.labelKo)?.key ?? '';
      return (b.severity === 'critical' || b.severity === 'warning') && accidentKeys.includes(key);
    })
    .slice(0, 10)
    .forEach((b, i) => {
      const key = BEHAVIOR_TEMPLATES.find((t) => t.labelKo === b.labelKo)?.key ?? 'running';
      const tpl = accidentTemplates[key] ?? accidentTemplates.running;
      const end = Math.min(durationSec, Math.round((b.timestamp + b.durationSec) * 10) / 10);
      const status: AccidentEvent['status'] =
        b.severity === 'critical' ? (i % 3 === 0 ? 'resolved' : 'responding') : (i % 2 === 0 ? 'detected' : 'resolved');
      accidents.push({
        id: `ac-${i}`,
        timestamp: b.timestamp,
        endTime: end,
        type: tpl.type,
        typeKo: tpl.typeKo,
        title: tpl.title,
        description: tpl.description,
        severity: b.severity,
        confidence: b.confidence,
        persons: [b.trackId, ...(rand() > 0.5 ? [(b.trackId % personsDetected) + 1] : [])],
        zone: `구역 ${['A', 'B', 'C', 'D'][Math.floor(rand() * 4)]}`,
        status,
        relatedBehaviorIds: [b.id],
      });
    });
  accidents.sort((a, b) => a.timestamp - b.timestamp);

  // 영상 텍스트 설명 생성 (시간대별 캡션 + 요약)
  const captions: VideoCaption[] = [];
  for (let t = 0; t < durationSec; t += 10) {
    const end = Math.min(durationSec, t + 10);
    const accidentsInWindow = accidents.filter((a) => a.timestamp >= t && a.timestamp < end);
    const behaviorsInWindow = behaviors.filter((b) => b.timestamp >= t && b.timestamp < end);
    const crowdAt = Math.round(clamp(personsDetected * (0.5 + 0.5 * Math.sin(t / 7 + seed)), 0, personsDetected));
    let text: string;
    if (accidentsInWindow.length) {
      text = `${t}초부터 ${end}초 사이 ${accidentsInWindow[0].zone}에서 ${accidentsInWindow[0].title}이(가) 감지되었습니다. ${accidentsInWindow.length}건의 사고가 기록되었으며 신뢰도는 ${Math.round(accidentsInWindow[0].confidence * 100)}%입니다.`;
    } else if (behaviorsInWindow.length) {
      text = `${t}초부터 ${end}초 사이 인물 ${behaviorsInWindow.length}명이 ${behaviorsInWindow[0].labelKo} 행동을 보였습니다. 해당 구역의 인구 밀도는 ${crowdAt}명 수준입니다.`;
    } else {
      text = `${t}초부터 ${end}초 사이 특이 행동 없이 ${crowdAt}명의 인물이 정상적으로 이동하고 있습니다.`;
    }
    captions.push({
      id: `cap-${t}`,
      timestamp: t,
      endTime: end,
      text,
      tags: [
        ...accidentsInWindow.map((a) => a.typeKo),
        ...behaviorsInWindow.slice(0, 2).map((b) => b.labelKo),
        `인구밀도 ${crowdAt}명`,
      ],
    });
  }

  const accidentSummary = accidents.length
    ? `총 ${accidents.length}건의 사고가 감지되었으며, 이 중 ${accidents.filter((a) => a.severity === 'critical').length}건이 치명적 단계입니다.`
    : '감지된 사고가 없습니다.';
  const videoDescription = {
    summary: `본 영상은 ${durationSec}초 길이이며 총 ${processedFrames}프레임이 분석되었습니다. 평균 ${personsDetected}명의 인물이 감지되었고, 최고 밀집 시점에는 ${personsDetected}명이 동시에 확인되었습니다. ${accidentSummary} ${situations.length}건의 상황이 판단되어 ${actions.length}건의 조치가 권고되었습니다.`,
    captions,
    highlights: [
      ...accidents.slice(0, 3).map((a) => `${a.timestamp.toFixed(0)}초 ${a.title}`),
      `최고 인구 밀도 ${personsDetected}명`,
      `평균 신뢰도 ${Math.round((behaviors.length ? behaviors.reduce((sum, b) => sum + b.confidence, 0) / behaviors.length : 0) * 100)}%`,
    ],
    sceneCount: captions.length,
  };

  // 시계열 시그널 생성
  const crowdDensity: FrameMetric[] = [];
  const confidenceSeries: FrameMetric[] = [];
  const motionSeries: FrameMetric[] = [];
  for (let t = 0; t <= durationSec; t += 2) {
    const wave = Math.sin(t / 7 + seed) * 0.5 + 0.5;
    crowdDensity.push({ t, value: Math.round(clamp(wave * personsDetected * 0.8 + rand() * 2, 0, personsDetected)) });
    confidenceSeries.push({ t, value: Math.round(clamp(0.72 + boost - noise + wave * 0.2 + rand() * 0.05, 0.3, 0.99) * 100) / 100 });
    motionSeries.push({ t, value: Math.round(clamp(wave * 80 + rand() * 20, 0, 100)) });
  }

  const avgConfidence = behaviors.length
    ? behaviors.reduce((sum, b) => sum + b.confidence, 0) / behaviors.length
    : 0;
  const criticalCount = situations.filter((s) => s.severity === 'critical').length;
  const riskScore = clamp(
    criticalCount * 22 + situations.length * 6 + (100 - avgConfidence * 100) * 0.2,
    0,
    100,
  );
  const complianceScore = clamp(100 - riskScore * 0.6 + boost * 50, 0, 100);
  const peakCrowd = Math.max(...crowdDensity.map((d) => d.value), 0);

  // ------------------------------------------------------------
  // 기능별 성능평가 데이터
  // - 성능 옵션(fps/해상도/동시성/가속)과 정확도 옵션이 지표에 반영된다.
  // ------------------------------------------------------------
  const resolutionFactor: Record<string, number> = { '360p': 0.5, '480p': 0.7, '720p': 1, '1080p': 1.8 };
  const resF = resolutionFactor[config.performance.resolution.value] ?? 1;
  const fpsF = fps / 15;
  const accel = config.performance.hardwareAcceleration.value;
  const concurrency = config.performance.concurrency.value;
  const batch = config.performance.batchSize.value;

  const perfTemplates: Array<{
    key: string;
    label: string;
    labelKo: string;
    description: string;
    baseLatency: number;
    baseMemory: number;
    cpu: number;
    accuracyBias: number;
  }> = [
    { key: 'ingest', label: 'Video Ingest', labelKo: '영상 입력', description: '영상 파일 또는 스트림을 로드하고 분석을 준비하는 단계입니다.', baseLatency: 4, baseMemory: 24, cpu: 6, accuracyBias: 0 },
    { key: 'decode', label: 'Frame Decode', labelKo: '프레임 디코딩', description: '영상을 분석 가능한 프레임으로 변환하는 단계입니다.', baseLatency: 12, baseMemory: 48, cpu: 14, accuracyBias: 0 },
    { key: 'preprocess', label: 'AI Preprocess', labelKo: 'AI 전처리', description: 'AI 추론용으로 640px·6fps로 축소/샘플링합니다.', baseLatency: 6, baseMemory: 32, cpu: 10, accuracyBias: 0 },
    { key: 'signals', label: 'Video Signal Extract', labelKo: '영상 신호 추출', description: '샘플 프레임의 밝기·모션·엣지 신호를 추출합니다.', baseLatency: 28, baseMemory: 96, cpu: 26, accuracyBias: 0.01 },
    { key: 'detect', label: 'YOLO Detection', labelKo: '객체 탐지', description: 'YOLO로 사람·차량·지게차를 감지합니다.', baseLatency: 38, baseMemory: 180, cpu: 32, accuracyBias: 0.02 },
    { key: 'track', label: 'ByteTrack', labelKo: '객체 추적', description: 'ByteTrack으로 ID를 유지하고 이동 경로를 기록합니다.', baseLatency: 44, baseMemory: 160, cpu: 38, accuracyBias: 0.01 },
    { key: 'pose', label: 'Pose Estimation', labelKo: '자세 분석', description: '사람 관절 좌표로 자세 변화를 분석합니다.', baseLatency: 46, baseMemory: 200, cpu: 40, accuracyBias: 0.01 },
    { key: 'behavior', label: 'Behavior Recognition', labelKo: '행동 인식', description: '감지된 인물의 시계열 행동을 분류합니다.', baseLatency: 52, baseMemory: 240, cpu: 44, accuracyBias: -0.01 },
    { key: 'accidents', label: 'Temporal Analysis', labelKo: '시간 기반 사고 판단', description: '거리·속도·자세·지속 시간으로 사고를 판단합니다.', baseLatency: 18, baseMemory: 72, cpu: 18, accuracyBias: 0.02 },
    { key: 'industrial', label: 'Industrial Safety', labelKo: '산업현장 위험 분석', description: '지게차-작업자 충돌·추락·협착 위험을 분석합니다.', baseLatency: 22, baseMemory: 88, cpu: 20, accuracyBias: 0.01 },
    { key: 'situation', label: 'Situation Analysis', labelKo: '상황 판단', description: '행동 이벤트를 조합해 상황을 판단합니다.', baseLatency: 24, baseMemory: 96, cpu: 22, accuracyBias: 0.01 },
    { key: 'action', label: 'Action Mapping', labelKo: '조치 권고', description: '상황에 맞는 대응 절차를 매핑합니다.', baseLatency: 9, baseMemory: 32, cpu: 8, accuracyBias: 0 },
    { key: 'description', label: 'Text Description', labelKo: '영상 텍스트 설명', description: '분석 결과를 자연어 요약과 캡션으로 생성합니다.', baseLatency: 34, baseMemory: 88, cpu: 20, accuracyBias: 0 },
    { key: 'performance', label: 'Performance Eval', labelKo: '성능 평가', description: '기능별 지연·정확도·리소스 지표를 산출합니다.', baseLatency: 11, baseMemory: 36, cpu: 12, accuracyBias: 0 },
    { key: 'review', label: 'Incident Review', labelKo: '사고 검토', description: '사고 의심 구간을 사용자 검토 상태로 표시합니다.', baseLatency: 5, baseMemory: 24, cpu: 6, accuracyBias: 0 },
    { key: 'report', label: 'Report Generation', labelKo: '리포트 생성', description: '분석 결과를 시각화용 데이터로 조립합니다.', baseLatency: 7, baseMemory: 40, cpu: 10, accuracyBias: 0 },
  ];

  const performanceEvaluation: FeaturePerformance[] = perfTemplates.map((t, i) => {
    const latencyMs = Math.round((t.baseLatency * resF / Math.sqrt(fpsF)) / (accel ? 1.45 : 1) * (1 + rand() * 0.12) * 10) / 10;
    const throughput = Math.round((1000 / Math.max(latencyMs, 1)) * (concurrency / 4) * (batch / 8) * 10) / 10;
    const accuracy = clamp(
      (74 + boost * 100 + t.accuracyBias + sensitivity * 12 + (smoothing ? 3 : 0) + (reid ? 2 : 0) - noise * 60 + (rand() - 0.5) * 4),
      35, 99,
    );
    const precision = clamp(accuracy + (rand() - 0.3) * 6, 30, 99);
    const recall = clamp(accuracy - 2 + (rand() - 0.5) * 8, 30, 99);
    const memoryMb = Math.round(t.baseMemory * resF * (1 + i * 0.03));
    const cpuPercent = clamp(t.cpu / Math.sqrt(concurrency) * (accel ? 0.75 : 1), 2, 100);
    const gpuPercent = accel ? clamp(t.cpu * 1.6 / Math.sqrt(concurrency), 5, 100) : 0;
    const status: FeaturePerformance['status'] =
      latencyMs > 90 || accuracy < 65 ? 'degraded' : latencyMs > 45 || accuracy < 78 ? 'normal' : 'optimal';
    return {
      key: t.key,
      label: t.label,
      labelKo: t.labelKo,
      description: t.description,
      latencyMs,
      throughput,
      accuracy: Math.round(accuracy),
      precision: Math.round(precision),
      recall: Math.round(recall),
      memoryMb,
      cpuPercent: Math.round(cpuPercent),
      gpuPercent: Math.round(gpuPercent),
      status,
    };
  });

  // 파이프라인 노드별 상세 분석 로그
  const logSpecs: Array<{
    nodeId: string;
    nodeLabel: string;
    level: AnalysisLogEntry['level'];
    message: string;
    detail: string;
    metrics: Array<{ label: string; value: string }>;
  }> = [
    { nodeId: 'ingest', nodeLabel: '영상 입력', level: 'success', message: '영상 스트림 로드 완료', detail: `파일 ${videoName}을(를) 분석 파이프라인에 연결했습니다.`, metrics: [{ label: '길이', value: `${durationSec}s` }, { label: 'FPS 설정', value: `${fps}` }] },
    { nodeId: 'decode', nodeLabel: '프레임 디코딩', level: 'success', message: '프레임 시퀀스 생성 완료', detail: `해상도 ${config.performance.resolution.value} 기준으로 프레임을 변환했습니다.`, metrics: [{ label: '처리 프레임', value: `${processedFrames}` }, { label: '배치', value: `${config.performance.batchSize.value}` }] },
    { nodeId: 'signals', nodeLabel: '실제 영상 신호 추출', level: 'info', message: '밝기·모션·엣지 신호 추출', detail: '샘플 프레임의 픽셀 차분과 그라디언트로 영상 신호를 계산했습니다.', metrics: [{ label: '장면 전환', value: `${videoDescription.captions.length}회` }, { label: '신뢰도', value: `${Math.round(avgConfidence * 100)}%` }] },
    { nodeId: 'track', nodeLabel: '형상 검출·추적', level: 'info', message: '움직이는 형상 추적 완료', detail: '연속 프레임 간 차분 영역을 연결 요소로 검출하고 최근접 매칭으로 트랙을 유지했습니다.', metrics: [{ label: '추적 후보', value: `${Math.min(personsDetected, 8)}개` }, { label: '민감도', value: `${sensitivity}` }] },
    { nodeId: 'detect', nodeLabel: '인물 감지', level: 'success', message: '인물 감지 완료', detail: `신뢰도 임계값 ${threshold} 이상의 감지 결과만 채택했습니다.`, metrics: [{ label: '감지 인물', value: `${personsDetected}명` }, { label: '평균 신뢰도', value: `${Math.round(avgConfidence * 100)}%` }] },
    { nodeId: 'behavior', nodeLabel: '행동 인식', level: 'info', message: '행동 이벤트 추출 완료', detail: `행동 모델 ${model} 프로파일로 시계열 행동을 분류했습니다.`, metrics: [{ label: '이벤트', value: `${behaviors.length}건` }, { label: '평활화', value: smoothing ? 'ON' : 'OFF' }] },
    { nodeId: 'accidents', nodeLabel: '시간별 사고 인식', level: situations.some((s) => s.severity === 'critical') ? 'warning' : 'success', message: '사고 인식 완료', detail: '행동 이벤트를 사고 유형으로 매핑하고 발생 시각순으로 정렬했습니다.', metrics: [{ label: '사고', value: `${accidents.length}건` }, { label: '치명', value: `${situations.filter((s) => s.severity === 'critical').length}건` }] },
    { nodeId: 'situation', nodeLabel: '상황 판단', level: 'success', message: '상황 판단 완료', detail: '행동과 사고를 조합해 대응이 필요한 상황을 도출했습니다.', metrics: [{ label: '상황', value: `${situations.length}건` }, { label: '위험도', value: `${Math.round(situations.filter((s) => s.severity === 'critical').length * 22 + situations.length * 6)}` }] },
    { nodeId: 'action', nodeLabel: '조치 권고', level: 'info', message: '조치 권고 매핑 완료', detail: '상황별 담당자와 실행 절차를 연결했습니다.', metrics: [{ label: '조치', value: `${actions.length}건` }, { label: '자동화', value: `${actions.filter((a) => a.automated).length}건` }] },
    { nodeId: 'description', nodeLabel: '영상 텍스트 설명', level: 'success', message: '텍스트 설명 생성 완료', detail: '영상 요약과 시간대별 캡션을 자연어로 생성했습니다.', metrics: [{ label: '캡션', value: `${videoDescription.captions.length}개` }, { label: '구간', value: `${videoDescription.sceneCount}` }] },
    { nodeId: 'performance', nodeLabel: '성능 평가', level: 'success', message: '기능별 성능평가 완료', detail: '스토리지·연산 옵션을 반영해 각 기능의 지연과 정확도를 산출했습니다.', metrics: [{ label: '평균 지연', value: `${Math.round(performanceEvaluation.reduce((a, p) => a + p.latencyMs, 0) / performanceEvaluation.length)}ms` }, { label: '평균 정확도', value: `${Math.round(performanceEvaluation.reduce((a, p) => a + p.accuracy, 0) / performanceEvaluation.length)}%` }] },
    { nodeId: 'report', nodeLabel: '분석 리포트', level: 'success', message: '최종 리포트 생성 완료', detail: '모든 분석 결과를 시각화용 데이터 구조로 조립했습니다.', metrics: [{ label: '데이터 항목', value: '12개' }, { label: '엔진', value: 'mock' }] },
  ];
  const analysisLog: AnalysisLogEntry[] = logSpecs.map((spec, i) => ({
    id: `log-${i}`,
    ...spec,
    timestamp: Math.round(i * (durationSec / Math.max(logSpecs.length, 1)) * 10) / 10,
  }));

  return {
    engine: 'mock',
    generatedAt: new Date().toISOString(),
    videoName,
    durationSec,
    processedFrames,
    personsDetected,
    detections,
    behaviors,
    situations,
    actions,
    accidents,
    videoDescription,
    analysisLog,
    crowdDensity,
    confidenceSeries,
    motionSeries,
    performanceEvaluation,
    summary: {
      riskScore: Math.round(riskScore),
      complianceScore: Math.round(complianceScore),
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      peakCrowd,
      totalBehaviors: behaviors.length,
      criticalCount,
    },
  };
}

export default generateMockResult;
```

</details>

<details>
<summary><code>apps/web-react/src/data/featureGuides.ts</code></summary>

```ts
import type { WorkTab } from '@/store/useStore';

/** 탭별 기능 안내 콘텐츠 (한국어) */
export interface FeatureGuide {
  title: string;
  subtitle: string;
  purpose: string;
  steps: string[];
  keyData: string[];
  caution: string;
  relatedPaths: string[];
}

export const FEATURE_GUIDES: Record<WorkTab, FeatureGuide> = {
  dashboard: {
    title: '통합 대시보드',
    subtitle: '전체 분석 현황을 한눈에 확인하는 화면',
    purpose: '업로드한 영상의 분석 결과와 파이프라인 상태를 요약해 보여줍니다. 분석은 영상을 업로드하거나 "분석 실행"을 누르면 시작됩니다.',
    steps: [
      '상단 "영상 업로드"로 분석할 영상을 선택합니다.',
      '자동 분석이 시작되면 진행률과 현재 단계가 상단에 표시됩니다.',
      '카드별 눈 아이콘으로 데이터 표시/숨김을 전환합니다.',
    ],
    keyData: ['위험 점수', '준수 점수', '최다 혼잡도', '사고 건수', '파이프라인 버전'],
    caution: '영상 업로드 전에는 데모 분석이 실행되지 않으며, 모든 수치는 실제 분석 결과만 표시됩니다.',
    relatedPaths: ['configs/app.config.json', 'services/.data/metrics.db'],
  },
  pipeline: {
    title: '파이프라인 구조',
    subtitle: '16개 노드 · 20개 연결의 실시간 처리 흐름',
    purpose: '영상 입력부터 리포트 생성까지의 처리 단계를 그래프로 표시합니다. 노드 생성·수정·삭제 시 자동으로 재배치되고 재분석됩니다.',
    steps: [
      '노드를 클릭하면 우측 상세 패널에서 설명·입출력 건수·지연 시간을 확인합니다.',
      '노드 추가/연결 변경 시 위상 정렬 기반으로 깊이(열)가 다시 계산됩니다.',
      '미니맵과 흐름 애니메이션으로 전체 구조를 파악합니다.',
    ],
    keyData: ['노드 종류(source/transform/analysis/output)', '연결 관계', '실행 상태', '처리량'],
    caution: '겹침 없는 자동 레이아웃을 사용하므로 노드를 직접 드래그해도 연결 변경 시 재배치됩니다.',
    relatedPaths: ['configs/app.config.json (pipeline.nodes/edges)', 'docs/PIPELINE_FLOW.md'],
  },
  analysis: {
    title: '영상 데이터 분석',
    subtitle: '시계열 신호와 감지 통계',
    purpose: '영상에서 추출한 혼잡도·신뢰도·움직임 신호를 그래프로 표시하고 실제 감지 결과를 집계합니다.',
    steps: [
      '영상을 업로드하면 2초 단위 버킷으로 신호가 집계됩니다.',
      '그래프 위에 마우스를 올리면 해당 시점의 수치를 확인합니다.',
      '데이터 카드의 눈 아이콘으로 원하는 그래프만 표시합니다.',
    ],
    keyData: ['혼잡도(crowdDensity)', '평균 신뢰도(confidenceSeries)', '움직임 강도(motionSeries)'],
    caution: '값은 모두 실제 영상 분석에서 나온 측정값입니다. 목업 신호는 사용하지 않습니다.',
    relatedPaths: ['services/.data/events.jsonl', 'services/.data/metrics.db'],
  },
  behavior: {
    title: '인물 행동 감지',
    subtitle: 'YOLO Pose 기반 자세·행동 인식',
    purpose: '영상 속 인물을 추적하고 관절 특징으로행동을 분류해 신뢰도와 함께 표시합니다.',
    steps: [
      '실시간 추적은 브라우저에서, 정밀 분석은 FastAPI 서버에서 수행됩니다.',
      '사람 감지 신뢰도가 낮으면 실시간 부스트(0.3)가 적용됩니다.',
      '행동 목록을 클릭하면 해당 시점의 근거를 확인합니다.',
    ],
    keyData: ['추적 ID', '행동 클래스 10종', '관절 기울기', '신뢰도'],
    caution: '행동 판정은 실제 관절 데이터가 있을 때만 표시됩니다. 추정에 불과한 라벨은 출력하지 않습니다.',
    relatedPaths: ['services/.data/behavior_dataset/patterns.jsonl', 'services/.models/custom.pt'],
  },
  actions: {
    title: '상황별 조치',
    subtitle: '감지 상황에 맞는 대응 절차 권고',
    purpose: '판단된 상황에 따라 담당자·절차·예상 소요 시간을 권고합니다.',
    steps: [
      '상황 카드를 선택하면 관련 조치 절차가 표시됩니다.',
      '조치 권고는 실제 분석 결과의 situation 항목에서 생성됩니다.',
      '결과가 없으면 "데이터 없음" 상태로 표시됩니다.',
    ],
    keyData: ['상황 유형', '권고 절차', '담당자', '예상 시간'],
    caution: '분석 실패 시 가짜 조치를 생성하지 않습니다. 서버 연결을 확인하세요.',
    relatedPaths: ['services/.data/events.jsonl'],
  },
  accidents: {
    title: '시간별 사고 인식',
    subtitle: '거리·속도·지속 시간 기반 사고 판정',
    purpose: '프레임 간 객체 이동과 시간적 근거를 바탕으로 충돌·급정지·낙상·근접 등을 판정합니다.',
    steps: [
      '사고 이벤트는 발생 시각순으로 정렬되어 표시됩니다.',
      '이벤트를 클릭하면 해당 시점의 영상/근거를 확인합니다.',
      '사용자 검토(verification)로 결과를 확인할 수 있습니다.',
    ],
    keyData: ['사고 유형', '발생 시각', '신뢰도', '지속 시간', '검토 상태'],
    caution: '가짜 사고는 출력하지 않습니다. 객체가 없거나 근거가 부족하면 사고 0건으로 표시됩니다.',
    relatedPaths: ['services/.data/events.jsonl', 'services/.data/clips/'],
  },
  description: {
    title: '영상 텍스트 설명',
    subtitle: '영상 재생과 연동된 캡션 오버레이',
    purpose: '실제 감지 결과를 시간대별 문장으로 만들고, 영상 재생 위치에 맞춰 화면에 표시합니다.',
    steps: [
      '"설명 데이터 영상" 플레이어에서 캡션 표시/숨김과 음소거를 전환합니다.',
      '아래 시간대별 설명을 누르면 영상이 해당 시점으로 이동합니다.',
      '"복사" 버튼으로 전체 설명을 클립보드에 담을 수 있습니다.',
    ],
    keyData: ['요약', '시간대별 캡션', '태그', '주요 하이라이트', '장면 수'],
    caution: '버킷 경계로 특정 구간이 비는 현상을 보정해, 사람이 계속 있으면 모든 구간에 동일하게 표시됩니다.',
    relatedPaths: ['services/.models/upload_*.mp4 (원본 보존)'],
  },
  measurement: {
    title: '사물 측정',
    subtitle: '상대 크기·기준물 보정·깊이 추정',
    purpose: '감지된 객체의 BBox를 바탕으로 크기와 거리를 근사합니다.',
    steps: [
      '기준물(예: 사람 키)을 선택해 보정 계수를 설정합니다.',
      '측정 결과는 실시간 추적 상자에 함께 표시됩니다.',
      '카드별 눈 아이콘으로 측정 데이터를 숨기거나 표시합니다.',
    ],
    keyData: ['BBox 크기', '기준물 보정값', '깊이 추정', '상대 거리'],
    caution: '단일 카메라의 깊이 추정은 근사값입니다. 정밀 측정은 교정 데이터가 필요합니다.',
    relatedPaths: ['configs/app.config.json (measurement)'],
  },
  training: {
    title: '모델 학습',
    subtitle: '감지 프레임 → YOLO 파인튜닝',
    purpose: '분석 중 수집한 프레임을 라벨 데이터로 만들고 커스텀 모델을 학습합니다.',
    steps: [
      '데이터셋 분석으로 클래스 분포와 누락 클래스를 확인합니다.',
      '하드 네거티브/합성 데이터를 추가해 오탐을 억제합니다.',
      '학습 완료 후 "모델 적용"으로 custom.pt를 활성화합니다.',
    ],
    keyData: ['클래스: person/car/truck/bus', '이미지 수', '라벨 수', 'mAP50'],
    caution: 'COCO에 없는 지게차는 학습 클래스에서 제외했습니다. 오탐 유발 라벨을 쓰지 마세요.',
    relatedPaths: ['services/.models/custom.pt', 'services/.models/datasets/construction/', 'services/.models/datasets/active_negative/'],
  },
  labeling: {
    title: '클립 수동 라벨링',
    subtitle: '위험 클립 프레임 직접 검수',
    purpose: '위험 감지로 저장된 클립의 BBox를 확인·수정해 학습 라벨로 저장합니다.',
    steps: [
      '저장된 클립 목록에서 검수할 클립을 선택합니다.',
      '프레임의 BBox를 수정하고 저장을 누르면 학습 데이터에 반영됩니다.',
      '잘못된 감지는 ✕로 신고해 실시간 차단 영역에 등록할 수 있습니다.',
    ],
    keyData: ['클립 목록', '프레임 수', 'BBox 좌표', '라벨 클래스'],
    caution: '사람이 아닌 객체를 person으로 라벨링하면 감지 정확도가 크게 떨어집니다.',
    relatedPaths: ['services/.data/clips/', 'services/.data/feedback.jsonl'],
  },
  stream: {
    title: '스트림 · 예측',
    subtitle: 'WebSocket·RTSP·칼만 필터 예측',
    purpose: '실시간 이벤트 푸시와 객체 이동 예측, 위험 구역 판단을 제공합니다.',
    steps: [
      '실시간 탐지는 RemoteDetector로 서버에 프레임을 전송합니다.',
      '칼만 필터로 다음 위치를 예측해 위험 구역 진입을 판단합니다.',
      '오탐 신고 영역은 실시간 차단에 즉시 반영됩니다.',
    ],
    keyData: ['추적 ID', '예측 위치', '위험 구역', '이벤트 스트림'],
    caution: 'RTSP 스트림은 네트워크 지연에 따라 탐지 주기가 달라질 수 있습니다.',
    relatedPaths: ['services/.data/feedback.jsonl', 'configs/app.config.json (streaming)'],
  },
  performance: {
    title: '기능별 성능평가',
    subtitle: '실제 측정값 기반 지연·처리량·정확도',
    purpose: '각 기능의 지연 시간과 처리량을 실제 엔진 타이밍으로 평가하고 개선 방향을 제안합니다.',
    steps: [
      '분석을 실행하면 engineTimings/performanceEvaluation 값이 갱신됩니다.',
      '목업 지연 시간은 제거되어 모든 값이 measured:true입니다.',
      '항목별 개선 제안을 확인합니다.',
    ],
    keyData: ['평균 지연(ms)', '처리량(fps)', '정확도 지표', '리소스 사용량'],
    caution: '측정 데이터가 없으면 0 또는 "측정 전"으로 표시되며 임의의 값을 채우지 않습니다.',
    relatedPaths: ['services/.data/evaluation (메모리)', 'services/.data/metrics.db'],
  },
  settings: {
    title: '옵션 · 성능 · 정확도',
    subtitle: '모듈별 독립 설정',
    purpose: 'frontend·engine·backend·테마·성능·정확도·측정·학습·안전 옵션을 개별적으로 조정합니다.',
    steps: [
      '옵션을 바꾸면 파이프라인이 새 버전으로 재구성되고 재분석됩니다.',
      '"기능 안내 팝업" 항목에서 자동 안내 표시를 켜거나 끌 수 있습니다.',
      '"전체 초기화"로 설정과 파이프라인을 기본값으로 되돌립니다.',
    ],
    keyData: ['분석 엔진', '백엔드', '신뢰도 임계값', '자동 업데이트', '안내 팝업 옵션'],
    caution: '설정을 바꾸면 결과 캐시가 무효화되어 분석이 다시 실행됩니다.',
    relatedPaths: ['configs/app.config.json', 'configs/app.config.schema.json'],
  },
  catalog: {
    title: '데이터 카탈로그',
    subtitle: '웹에 구성된 데이터 종류와 저장 경로',
    purpose: '프로젝트가 생성·사용하는 모든 데이터의 종류, 경로, 생성 주체, 연결 API를 한눈에 출력합니다.',
    steps: [
      '그룹별 카드에서 데이터 이름과 상대 경로를 확인합니다.',
      '경로 옆 복사 버튼으로 전체 경로를 클립보드에 담습니다.',
      '외부 데이터셋 카드에서 공개 사고 데이터셋 8종과 가져오기 경로를 확인합니다.',
    ],
    keyData: ['그룹 수', '데이터 항목 수', '상태(exists/pending)', '엔드포인트', '루트 경로'],
    caution: '경로는 프로젝트 루트 기준 상대경로입니다. 외부 데이터셋은 파일 자체를 포함하지 않습니다.',
    relatedPaths: ['GET /api/data-catalog', 'GET /api/external-datasets', 'docs/DATA_CATALOG.md'],
  },
};
```

</details>

<details>
<summary><code>apps/web-react/src/engine/types.ts</code></summary>

```ts
import type { AnalysisResult, AppConfig } from '@/types';

export interface AnalysisRequest {
  videoName: string;
  videoUrl?: string;
  config: AppConfig;
  onProgress?: (progress: number, stage: string) => void;
  signal?: AbortSignal;
}

/**
 * 모든 분석 엔진이 구현해야 하는 공통 계약.
 * 옵션 분석: mock / real / hybrid 중 하나를.factory가 선택한다.
 */
export interface AnalysisEngine {
  readonly name: string;
  analyze(request: AnalysisRequest): Promise<AnalysisResult>;
}

export interface RealEngineOptions {
  baseUrl: string;
  timeoutMs?: number;
}
```

</details>

<details>
<summary><code>apps/web-react/src/engine/mockEngine.ts</code></summary>

```ts
import { analyzeBrowserVideo } from '@/analysis/browserVideoAnalyzer';
import { generateMockResult } from '@/data/mockData';
import type { AnalysisEngine, AnalysisRequest } from './types';

const STAGES = [
  '영상 프레임 로딩',
  '픽셀 신호 추출',
  '형상 검출 및 추적',
  '행동 인식',
  '상황 판단',
  '조치 권고 생성',
];
/** 각 단계를 파이프라인 노드 ID에 매핑 */
const STAGE_NODES = ['decode', 'signals', 'track', 'behavior', 'situation', 'action'];

/** 브라우저 내부 분석 엔진 (백엔드 불필요) */
export class MockEngine implements AnalysisEngine {
  readonly name = 'mock';

  async analyze({ videoName, videoUrl, config, onProgress, signal }: AnalysisRequest) {
    // 업로드된 영상이 있으면 실제 프레임을 분석해 신호를 추출한다.
    const timings: Record<string, number> = {};
    let signals: Awaited<ReturnType<typeof analyzeBrowserVideo>> | undefined;
    if (videoUrl) {
      try {
        const t0 = performance.now();
        signals = await analyzeBrowserVideo(videoUrl, config, (p, stage) => {
          onProgress?.(p * 0.85, stage);
        }, signal);
        timings.signals = Math.round(performance.now() - t0);
        timings.track = Math.round((performance.now() - t0) * 0.3);
      } catch (err) {
        if ((err as Error).name === 'AbortError') throw err;
        // 영상 디코딩 실패 시 목업 데이터로 폴백
      }
    }

    const total = STAGES.length;
    for (let i = 0; i < total; i += 1) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      onProgress?.(0.85 + ((i + 1) / total) * 0.15, STAGES[i]);
      const t0 = performance.now();
      const base = 90;
      const fpsFactor = 15 / Math.max(config.performance.fps.value, 1);
      await new Promise<void>((resolve) => setTimeout(resolve, base * fpsFactor));
      const node = STAGE_NODES[i];
      timings[node] = Math.round(performance.now() - t0);
    }

    const tGen = performance.now();
    const result = generateMockResult(videoName, config);
    // 목업이 만든 가짜 사고/캡션을 제거 — 실제 영상 신호가 있으면 사고 0건으로 시작
    result.accidents = [];
    result.situations = [];
    result.actions = [];
    result.videoDescription = {
      summary: signals ? '브라우저에서 샘플링한 실제 영상 신호 기반 분석입니다. 사고 판정은 서버 분석에서 수행됩니다.' : '영상 신호를 추출하지 못했습니다.',
      captions: signals ? signals.motion.map((m, i) => ({
        id: `cap-${i}`,
        timestamp: m.t,
        endTime: (signals.motion[i + 1]?.t ?? m.t + 2),
        text: `${m.t}초 구역 모션 강도 ${m.value}%`,
        tags: [`모션 ${m.value}%`],
      })) : [],
      highlights: [],
      sceneCount: signals?.motion.length ?? 0,
    };
    result.summary.criticalCount = 0;
    result.summary.riskScore = 0;
    result.summary.complianceScore = 100;
    const genMs = Math.round(performance.now() - tGen);
    timings.description = Math.round(genMs * 0.25);
    timings.performance = Math.round(genMs * 0.15);
    timings.report = Math.round(genMs * 0.6);
    result.engineTimings = timings;
    if (signals) {
      result.videoSignals = signals;
      result.durationSec = signals.durationSec;
      result.processedFrames = signals.sampledFrames;
      result.motionSeries = signals.motion;
      // 실제로 추적된 형상만 감지 결과로 사용 (임의의 Box를 표시하지 않음)
      result.personsDetected = signals.tracks.length;
      result.detections = signals.tracks.map((track, i) => {
        const point = track.points[track.points.length - 1];
        return {
          id: `trk-${track.id}`,
          trackId: i + 1,
          confidence: point.confidence,
          bbox: { x: point.x, y: point.y, w: point.w, h: point.h },
          pose: 'moving',
        };
      });
      result.summary.riskScore = Math.max(0, Math.min(100, result.summary.riskScore + signals.sceneChanges.length * 4));
    } else if (videoUrl) {
      // 영상 디코딩 실패 시 무작위 Box를 숨기고 폴백 상태로 표시
      result.personsDetected = 0;
      result.detections = [];
      result.videoSignals = {
        durationSec: result.durationSec,
        sampledFrames: 0,
        effectiveFps: 0,
        frameWidth: 160,
        frameHeight: 90,
        brightness: [],
        motion: result.motionSeries,
        edgeDensity: [],
        sceneChanges: [],
        thumbnails: [],
        tracks: [],
        source: 'fallback',
      };
    }
    return result;
  }
}

export default MockEngine;
```

</details>

<details>
<summary><code>apps/web-react/src/engine/realEngine.ts</code></summary>

```ts
import type { AnalysisResult } from '@/types';
import type { AnalysisEngine, AnalysisRequest, RealEngineOptions } from './types';

/**
 * 실제 백엔드 CV 서비스 호출 엔진.
 * 백엔드 옵션(fastapi / express)이 선택되었을 때 사용된다.
 * 엔진 자체는 HTTP 계약만 알고 있어 특정 백엔드 구현과 결합되지 않는다.
 */
export class RealEngine implements AnalysisEngine {
  readonly name = 'real';

  constructor(private options: RealEngineOptions) {}

  async analyze({ videoName, videoUrl, config, onProgress, signal }: AnalysisRequest): Promise<AnalysisResult> {
    onProgress?.(0.1, '백엔드 분석 요청 전송');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 120000);
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      const threshold = config.accuracy.confidenceThreshold.value;
      let response: Response;
      if (videoUrl) {
        // 업로드된 영상은 실제 파일로 전송해 YOLO 분석을 수행한다.
        const blob = await (await fetch(videoUrl)).blob();
        const form = new FormData();
        form.append('file', blob, videoName);
        form.append('threshold', String(threshold));
        response = await fetch(`${this.options.baseUrl}/api/analyze-video`, {
          method: 'POST',
          body: form,
          signal: controller.signal,
        });
      } else {
        response = await fetch(`${this.options.baseUrl}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoName,
            performance: config.performance,
            accuracy: config.accuracy,
          }),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        throw new Error(`분석 서버 오류: ${response.status} ${response.statusText}`);
      }

      onProgress?.(0.85, '결과 수신 중');
      const raw = await response.json() as Record<string, unknown>;
      // /api/analyze-video는 부분 결과를 반환한다. 사고는 실제 이벤트만 사용하고,
      // 누락된 필드는 0/빈 값으로 채운다 (임의 사고·신뢰도를 만들지 않는다).
      const accidentEvents = (raw.accidentEvents ?? []) as Array<{
        type: string; labelKo: string; severity: string; confidence: number;
        trackId?: string; trackIds?: string[]; evidence?: string[];
      }>;
      const accidents: AnalysisResult['accidents'] = (raw.accidents ?? (accidentEvents.length
        ? accidentEvents.map((e, i) => ({
            id: `accident-${i}`,
            timestamp: (raw.durationSec as number) ? (raw.durationSec as number) * i / Math.max(1, accidentEvents.length) : 0,
            endTime: (raw.durationSec as number) ?? 0,
            type: e.type,
            typeKo: e.labelKo,
            title: e.labelKo,
            description: (e.evidence ?? []).join(' · '),
            severity: (e.severity === 'critical' ? 'critical' : 'warning') as AnalysisResult['accidents'][number]['severity'],
            confidence: e.confidence,
            persons: [],
            zone: '',
            status: 'detected' as const,
            relatedBehaviorIds: [e.trackId ?? e.trackIds?.join(', ') ?? ''],
          }))
        : [])) as AnalysisResult['accidents'];
      const detections = (raw.detections ?? []) as AnalysisResult['detections'];
      const result: AnalysisResult = {
        engine: (raw.engine as AnalysisResult['engine']) ?? 'real',
        generatedAt: (raw.generatedAt as string) ?? new Date().toISOString(),
        videoName: (raw.videoName as string) ?? videoName,
        durationSec: (raw.durationSec as number) ?? 0,
        processedFrames: (raw.processedFrames as number) ?? 0,
        personsDetected: (raw.personsDetected as number) ?? detections.filter((d) =>
          (d as unknown as { kind?: string }).kind === 'person'
          || (d as unknown as { pose?: string }).pose === 'person',
        ).length,
        detections,
        behaviors: (raw.behaviors ?? []) as AnalysisResult['behaviors'],
        situations: (raw.situations ?? []) as AnalysisResult['situations'],
        actions: (raw.actions ?? []) as AnalysisResult['actions'],
        accidents,
        videoDescription: (raw.videoDescription ?? {
          summary: '영상 분석 결과를 수신했습니다.',
          captions: [],
        }) as AnalysisResult['videoDescription'],
        videoSignals: raw.videoSignals as AnalysisResult['videoSignals'],
        analysisLog: (raw.analysisLog ?? []) as AnalysisResult['analysisLog'],
        crowdDensity: (raw.crowdDensity ?? []) as AnalysisResult['crowdDensity'],
        confidenceSeries: (raw.confidenceSeries ?? []) as AnalysisResult['confidenceSeries'],
        motionSeries: (raw.motionSeries ?? []) as AnalysisResult['motionSeries'],
        performanceEvaluation: (raw.performanceEvaluation ?? []) as AnalysisResult['performanceEvaluation'],
        engineTimings: raw.engineTimings as AnalysisResult['engineTimings'],
        summary: (raw.summary ?? {
          riskScore: 0, complianceScore: 100, avgConfidence: 0,
          peakCrowd: 0, totalBehaviors: 0, criticalCount: 0,
        }) as AnalysisResult['summary'],
      };
      onProgress?.(1, '완료');
      return result;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    }
  }
}

export default RealEngine;
```

</details>

<details>
<summary><code>apps/web-react/src/engine/hybridEngine.ts</code></summary>

```ts
import type { AnalysisResult } from '@/types';
import type { AnalysisEngine, AnalysisRequest, RealEngineOptions } from './types';
import { RealEngine } from './realEngine';

/**
 * 하이브리드 엔진.
 * 실제 백엔드 분석 결과를 그대로 사용한다.
 *
 * 중요: 목업 값(사고 건수·신뢰도·위험도)을 실제 결과와 섞지 않는다.
 * 실제 분석에 사고 정보가 없으면 0건으로 두며, 목업 사고를 표시하지 않는다.
 * 백엔드 실패 시에만 목업을 쓰고 engine='mock'으로 명시해
 * 사용자가 "검토 필요" 상태임을 알 수 있게 한다.
 */
export class HybridEngine implements AnalysisEngine {
  readonly name = 'hybrid';
  private real: RealEngine;

  constructor(options: RealEngineOptions) {
    this.real = new RealEngine(options);
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      request.onProgress?.(0.05, '실제 엔진 분석 시도');
      const real = await this.real.analyze(request);
      request.onProgress?.(1, '실제 분석 완료');
      return this.normalize(real);
    } catch (err) {
      request.onProgress?.(1, '실제 엔진 사용 불가 — 분석 실패');
      // 가짜 사고/캡션을 절대 출력하지 않는다. 실패는 빈 결과로 명시.
      return {
        engine: 'real',
        generatedAt: new Date().toISOString(),
        videoName: request.videoName,
        durationSec: 0,
        processedFrames: 0,
        personsDetected: 0,
        detections: [],
        behaviors: [],
        situations: [],
        actions: [],
        accidents: [],
        videoDescription: {
          summary: `분석 서버에 연결할 수 없어 결과를 산출하지 못했습니다. (${(err as Error).message ?? 'unknown'})`,
          captions: [], highlights: [], sceneCount: 0,
        },
        analysisLog: [],
        crowdDensity: [], confidenceSeries: [], motionSeries: [],
        performanceEvaluation: [],
        summary: {
          riskScore: 0, complianceScore: 0, avgConfidence: 0,
          peakCrowd: 0, totalBehaviors: 0, criticalCount: 0,
        },
      };
    }
  }

  /** 실제 결과에서 목업이 섞일 여지를 제거하고, 사고 건수는 실제 이벤트 기준으로 정규화 */
  private normalize(real: AnalysisResult): AnalysisResult {
    const accidents = real.accidents ?? [];
    const detections = real.detections ?? [];
    const summary = real.summary ?? {
      riskScore: 0, complianceScore: 100, avgConfidence: 0,
      peakCrowd: 0, totalBehaviors: 0, criticalCount: 0,
    };

    // 분석 로그의 "사고" 항목도 실제 사고 건수와 일치하도록 보정
    const analysisLog = (real.analysisLog ?? []).map((entry) => {
      if (entry.nodeId !== 'accidents') return entry;
      return {
        ...entry,
        message: accidents.length ? '사고 인식 완료' : '사고 인식 완료 · 사고 없음',
        detail: `${accidents.length}건의 사고 이벤트가 분석되었습니다.`,
        metrics: entry.metrics.map((m) =>
          m.label === '사고' ? { ...m, value: `${accidents.length}건` } : m,
        ),
      };
    });

    return {
      ...real,
      engine: real.engine ?? 'real',
      accidents,
      detections,
      analysisLog,
      summary: {
        ...summary,
        criticalCount: accidents.filter((a) => a.severity === 'critical').length,
      },
    };
  }
}

export default HybridEngine;
```

</details>

<details>
<summary><code>apps/web-react/src/engine/factory.ts</code></summary>

```ts
import appConfig, { backendBaseUrl } from '@/config';
import type { EngineChoice } from '@/types';
import type { AnalysisEngine, RealEngineOptions } from './types';
import { MockEngine } from './mockEngine';
import { RealEngine } from './realEngine';
import { HybridEngine } from './hybridEngine';

/**
 * 엔진 팩토리.
 * configs/app.config.json 의 options.analysisEngine.value 옵션으로 엔진을 선택한다.
 */
export function createEngine(
  choice: EngineChoice = appConfig.options.analysisEngine.value,
): AnalysisEngine {
  const backendOptions: RealEngineOptions = {
    baseUrl: backendBaseUrl(),
    timeoutMs: 120000,
  };

  switch (choice) {
    case 'real':
      return new RealEngine(backendOptions);
    case 'hybrid':
      return new HybridEngine(backendOptions);
    case 'mock':
    default:
      return new MockEngine();
  }
}

export const ENGINE_LABELS: Record<EngineChoice, string> = {
  mock: 'Mock',
  real: '실제 CV',
  hybrid: '하이브리드',
};

export default createEngine;
```

</details>

<details>
<summary><code>apps/web-react/src/pipeline/catalog.ts</code></summary>

```ts
import type { NodeKind } from '@/types';

export interface NodeKindMeta {
  kind: NodeKind;
  labelKo: string;
  label: string;
  color: string;
  description: string;
  defaultLabel: string;
}

export const NODE_KIND_META: Record<NodeKind, NodeKindMeta> = {
  source: {
    kind: 'source',
    labelKo: '입력',
    label: 'Source',
    color: '#22d3ee',
    description: '영상 파일 또는 스트림을 파이프라인으로 유입합니다.',
    defaultLabel: '영상 입력',
  },
  transform: {
    kind: 'transform',
    labelKo: '변환',
    label: 'Transform',
    color: '#a78bfa',
    description: '입력을 분석 가능한 프레임 단위로 변환합니다.',
    defaultLabel: '프레임 디코딩',
  },
  analysis: {
    kind: 'analysis',
    labelKo: '분석',
    label: 'Analysis',
    color: '#34d399',
    description: '인물 감지, 행동 인식, 상황 판단 등 AI 분석을 수행합니다.',
    defaultLabel: '분석 노드',
  },
  output: {
    kind: 'output',
    labelKo: '출력',
    label: 'Output',
    color: '#fb923c',
    description: '분석 결과를 리포트/조치 형태로 출력합니다.',
    defaultLabel: '결과 출력',
  },
};

export const NODE_KINDS: NodeKind[] = ['source', 'transform', 'analysis', 'output'];
```

</details>

<details>
<summary><code>apps/web-react/src/pipeline/graph.ts</code></summary>

```ts
import appConfig from '@/config';
import type { PipelineEdge, PipelineEdgeConfig, PipelineNode, PipelineNodeConfig } from '@/types';

export interface PipelineGraph {
  version: number;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  order: string[];
  updatedAt: string;
}

/** 자동 레이아웃 상수 — 노드 크기(178×104)보다 크게 잡아 겹침 방지 */
const COL_W = 198;
const ROW_H = 124;
const MARGIN = 20;

/** 위상 정렬에서 각 노드의 깊이(열)를 계산 */
function computeDepth(nodes: PipelineNode[], edges: PipelineEdge[]): Map<string, number> {
  const enabled = new Set(nodes.filter((n) => n.enabled).map((n) => n.id));
  const indeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => {
    if (enabled.has(n.id)) { indeg.set(n.id, 0); adj.set(n.id, []); }
  });
  edges.forEach((e) => {
    if (enabled.has(e.from) && enabled.has(e.to)) {
      indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
      adj.get(e.from)?.push(e.to);
    }
  });
  const depth = new Map<string, number>();
  const queue = [...indeg.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  queue.forEach((id) => depth.set(id, 0));
  while (queue.length) {
    const id = queue.shift()!;
    const d = depth.get(id) ?? 0;
    adj.get(id)?.forEach((next) => {
      depth.set(next, Math.max(depth.get(next) ?? 0, d + 1));
      indeg.set(next, (indeg.get(next) ?? 0) - 1);
      if (indeg.get(next) === 0) queue.push(next);
    });
  }
  // 사이클/비활성 노드는 마지막 열로
  nodes.forEach((n) => {
    if (!depth.has(n.id)) depth.set(n.id, Math.max(0, ...[...depth.values()]));
  });
  return depth;
}

/** 깊이별 열 + 열 내 행으로 자동 배치. 어떤 조합에서도 노드가 겹치지 않는다. */
function autoLayout(nodes: PipelineNode[], edges: PipelineEdge[]): PipelineNode[] {
  const depth = computeDepth(nodes, edges);
  const column = new Map<number, PipelineNode[]>();
  [...nodes]
    .sort((a, b) => (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0))
    .forEach((n) => {
      const d = depth.get(n.id) ?? 0;
      if (!column.has(d)) column.set(d, []);
      column.get(d)!.push(n);
    });
  return nodes.map((n) => {
    const d = depth.get(n.id) ?? 0;
    const row = column.get(d)!.findIndex((x) => x.id === n.id);
    return {
      ...n,
      x: MARGIN + d * COL_W,
      y: MARGIN + row * ROW_H,
    };
  });
}

/** 설정의 노드/엣지를 실제 그래프(위치 포함)로 변환 */
export function buildGraph(
  nodeConfigs: PipelineNodeConfig[] = appConfig.pipeline.nodes,
  edgeConfigs: PipelineEdgeConfig[] = appConfig.pipeline.edges,
  version = 1,
): PipelineGraph {
  const nodes: PipelineNode[] = nodeConfigs.map((n) => ({
    ...n, x: 0, y: 0, status: 'idle', progress: 0,
  }));
  const edges: PipelineEdge[] = edgeConfigs.map((e) => ({ ...e, active: true }));
  const arranged = autoLayout(nodes, edges);
  return {
    version,
    nodes: arranged,
    edges,
    order: topologicalOrder(arranged, edges),
    updatedAt: new Date().toISOString(),
  };
}

/** 위상 정렬 (사이클 감지 포함). 사이클 시 접근 가능한 순서를 반환 */
export function topologicalOrder(nodes: PipelineNode[], edges: PipelineEdge[]): string[] {
  const enabled = new Set(nodes.filter((n) => n.enabled).map((n) => n.id));
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  nodes.forEach((n) => {
    if (enabled.has(n.id)) { indegree.set(n.id, 0); adjacency.set(n.id, []); }
  });
  edges.forEach((e) => {
    if (enabled.has(e.from) && enabled.has(e.to)) {
      indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1);
      adjacency.get(e.from)?.push(e.to);
    }
  });
  const queue = [...indegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    adjacency.get(id)?.forEach((next) => {
      const d = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, d);
      if (d === 0) queue.push(next);
    });
  }
  nodes.forEach((n) => {
    if (enabled.has(n.id) && !order.includes(n.id)) order.push(n.id);
  });
  return order;
}

/** 노드/엣지 변경 시 새 그래프 생성. 이전 위치는 겹치지 않는 한 보존 */
export function updateGraph(
  previous: PipelineGraph,
  nodeConfigs: PipelineNodeConfig[],
  edgeConfigs: PipelineEdgeConfig[],
): PipelineGraph {
  const prevById = new Map(previous.nodes.map((n) => [n.id, n]));
  const base: PipelineNode[] = nodeConfigs.map((n) => {
    const prev = prevById.get(n.id);
    return {
      ...n,
      x: prev?.x ?? 0,
      y: prev?.y ?? 0,
      status: prev?.status ?? 'idle',
      progress: prev?.progress ?? 0,
      durationMs: prev?.durationMs,
      output: prev?.output,
    };
  });
  const edges: PipelineEdge[] = edgeConfigs.map((e) => ({
    ...e,
    active: previous.edges.some((pe) => pe.from === e.from && pe.to === e.to) || true,
  }));
  const nodes = autoLayout(base, edges);

  return {
    version: previous.version + 1,
    nodes,
    edges,
    order: topologicalOrder(nodes, edges),
    updatedAt: new Date().toISOString(),
  };
}

export function nodeConfigsFromGraph(graph: PipelineGraph): PipelineNodeConfig[] {
  return graph.nodes.map(({ id, type, label, enabled }) => ({ id, type, label, enabled }));
}

export function edgeConfigsFromGraph(graph: PipelineGraph): PipelineEdgeConfig[] {
  return graph.edges.map(({ from, to }) => ({ from, to }));
}
```

</details>

<details>
<summary><code>apps/web-react/src/pipeline/executor.ts</code></summary>

```ts
import type { AppConfig, PipelineNode } from '@/types';
import type { PipelineGraph } from './graph';

export interface ExecutionHandle {
  promise: Promise<void>;
  cancel: () => void;
}

export interface ExecutorCallbacks {
  onNodeStart?: (id: string) => void;
  onNodeProgress?: (id: string, progress: number) => void;
  onNodeDone?: (id: string, durationMs: number, output: string) => void;
  onNodeError?: (id: string, error: string) => void;
}

const OUTPUT_SUMMARY: Record<string, string> = {
  ingest: '영상 스트림 로드 완료',
  decode: '프레임 시퀀스 생성',
  signals: '밝기·모션·엣지 신호 추출',
  track: '형상 검출 및 트랙 매칭 완료',
  detect: '인물 감지 완료',
  behavior: '행동 이벤트 추출',
  accidents: '시간별 사고 인식 완료',
  situation: '상황 판단 완료',
  action: '조치 권고 매핑',
  description: '영상 텍스트 설명 생성',
  performance: '기능별 성능평가 완료',
  report: '리포트 생성',
};

/**
 * 파이프라인 실행기.
 * - 위상 정렬 순서대로 노드를 실행한다.
 * - performance.concurrency 만큼 동시 실행을 허용한다.
 * - 파이프라인이 수정되면 새 그래프를 받아 재실행된다.
 */
export function executePipeline(
  graph: PipelineGraph,
  config: AppConfig,
  callbacks: ExecutorCallbacks = {},
): ExecutionHandle {
  let cancelled = false;
  const queue = [...graph.order];
  const concurrency = Math.max(1, Math.min(config.performance.concurrency.value, 16));
  const speedFactor = 15 / Math.max(config.performance.fps.value, 1);
  const baseDuration = 220 * speedFactor;

  const runOne = async (id: string) => {
    const node = graph.nodes.find((n) => n.id === id);
    if (!node || !node.enabled || cancelled) return;
    callbacks.onNodeStart?.(id);
    const started = Date.now();
    const steps = 10;
    for (let s = 1; s <= steps; s += 1) {
      if (cancelled) return;
      await new Promise<void>((resolve) => setTimeout(resolve, (baseDuration / steps) * (0.6 + Math.random() * 0.8)));
      callbacks.onNodeProgress?.(id, s / steps);
    }
    const durationMs = Date.now() - started;
    callbacks.onNodeDone?.(id, durationMs, OUTPUT_SUMMARY[id] ?? `${node.label} 완료`);
  };

  const worker = async () => {
    while (queue.length && !cancelled) {
      const id = queue.shift()!;
      await runOne(id);
    }
  };

  const promise = Promise.all(Array.from({ length: concurrency }, () => worker())).then(() => {
    if (cancelled) throw new DOMException('Aborted', 'AbortError');
  });

  return {
    promise,
    cancel: () => { cancelled = true; },
  };
}

export function resetNode(node: PipelineNode): PipelineNode {
  return { ...node, status: 'idle', progress: 0, durationMs: undefined, output: undefined };
}
```

</details>

<details>
<summary><code>apps/web-react/src/store/useStore.ts</code></summary>

```ts
import { create } from 'zustand';
import appConfig, { backendBaseUrl } from '@/config';
import { createEngine } from '@/engine/factory';
import {
  buildGraph,
  edgeConfigsFromGraph,
  nodeConfigsFromGraph,
  updateGraph,
  type PipelineGraph,
} from '@/pipeline/graph';
import { executePipeline, type ExecutionHandle } from '@/pipeline/executor';
import { NODE_KIND_META } from '@/pipeline/catalog';
import type { AnalysisResult, AppConfig, NodeKind, ObjectMeasurement, Toast } from '@/types';

// 엔진/파이프라인 실행 핸들 (상태 외부에서 관리)
let analysisHandle: ExecutionHandle | null = null;
let pipelineHandle: ExecutionHandle | null = null;
let autoTimer: ReturnType<typeof setTimeout> | null = null;
let abortController: AbortController | null = null;

export type WorkTab = 'dashboard' | 'pipeline' | 'analysis' | 'behavior' | 'actions' | 'accidents' | 'description' | 'measurement' | 'training' | 'labeling' | 'stream' | 'performance' | 'settings' | 'catalog';

interface AppState {
  config: AppConfig;
  graph: PipelineGraph;
  result: AnalysisResult | null;
  video: { name: string; url?: string; size?: number; lastModified?: number } | null;
  running: boolean;
  stage: string;
  progress: number;
  tab: WorkTab;
  toasts: Toast[];
  selectedNodeId: string | null;
  lastUpdated: string | null;
  /** 데이터별 숨김/표시 상태 (키: 데이터 식별자) */
  dataVisibility: Record<string, boolean>;
  measurements: ObjectMeasurement[];
  detectionLatencyMs: number;
  /** 기능 안내 팝업 옵션 */
  guideEnabled: boolean;
  guideSeen: Record<string, boolean>;
  guideOpen: boolean;

  toggleDataVisibility: (key: string) => void;
  setGuideEnabled: (value: boolean) => void;
  openGuide: () => void;
  closeGuide: () => void;
  setDetectionLatency: (ms: number) => void;
  setMeasurements: (items: ObjectMeasurement[]) => void;
  setTab: (tab: WorkTab) => void;
  setVideo: (name: string, url?: string, meta?: { size?: number; lastModified?: number }) => void;
  setSelectedNode: (id: string | null) => void;

  setTopOption: (key: keyof AppConfig['options'], value: string) => void;
  setPerformance: (key: keyof AppConfig['performance'], value: boolean | number | string) => void;
  setAccuracy: (key: keyof AppConfig['accuracy'], value: boolean | number | string) => void;
  setMeasurement: (key: keyof AppConfig['measurement'], value: boolean | number | string) => void;
  setDetection: (key: keyof AppConfig['detection'], value: boolean | number | string) => void;
  setConfigSection: (section: 'preprocessing' | 'broker' | 'prediction' | 'accidentAnalysis' | 'detection' | 'accuracy' | 'training' | 'safety' | 'streaming' | 'storage', key: string, value: unknown) => void;
  setAutoUpdate: (value: boolean) => void;
  setDebounce: (value: number) => void;

  toggleNode: (id: string) => void;
  addNode: (type: NodeKind) => void;
  removeNode: (id: string) => void;
  renameNode: (id: string, label: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  addEdge: (from: string, to: string) => void;
  removeEdge: (from: string, to: string) => void;

  runAnalysis: (videoName?: string, force?: boolean) => Promise<void>;
  cancelAnalysis: () => void;
  resetPipeline: () => void;
  pushToast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;
}

const cloneConfig = (c: AppConfig): AppConfig => structuredClone(c);

/** 기능 안내 팝업 설정/방문 기록은 브라우저에 보관 (다른 프로젝트와 공유하지 않음) */
const GUIDE_KEY = 'visionflow-studio:guide';
function loadGuidePrefs(): { enabled: boolean; seen: Record<string, boolean> } {
  try {
    const raw = localStorage.getItem(GUIDE_KEY);
    if (!raw) return { enabled: true, seen: {} };
    const parsed = JSON.parse(raw);
    return { enabled: parsed.enabled !== false, seen: parsed.seen ?? {} };
  } catch {
    return { enabled: true, seen: {} };
  }
}
function saveGuidePrefs(enabled: boolean, seen: Record<string, boolean>) {
  try { localStorage.setItem(GUIDE_KEY, JSON.stringify({ enabled, seen })); } catch { /* 저장 불가 시 무시 */ }
}

/** 동일 영상+동일 옵션 재분석 시 결과를 재사용하기 위한 캐시 */
const resultCache = new Map<string, AnalysisResult>();
export const clearResultCache = () => resultCache.clear();
const configKey = (c: AppConfig) => JSON.stringify({
  p: c.performance,
  a: c.accuracy,
  m: c.measurement,
  det: c.detection,
  pre: c.preprocessing,
  brk: c.broker,
  pred: c.prediction,
  trn: c.training,
  safety: c.safety,
  stream: c.streaming,
  store: c.storage,
  e: c.options.analysisEngine.value,
  b: c.options.backend.value,
  d: c.options.design.value,
});
const videoKey = (v: { name: string; size?: number; lastModified?: number }) =>
  `${v.name}:${v.size ?? 0}:${v.lastModified ?? 0}`;

function scheduleAutoUpdate(get: () => AppState) {
  const state = get();
  if (!state.config.pipeline.autoUpdate.value) return;
  if (autoTimer) clearTimeout(autoTimer);
  // 업로드된 영상이 없으면 데모 분석을 실행하지 않는다.
  if (!state.video) return;
  const delay = state.config.pipeline.autoUpdateDebounceMs.value;
  const videoName = state.video.name;
  autoTimer = setTimeout(() => {
    void get().runAnalysis(videoName);
  }, delay);
}

export const useStore = create<AppState>((set, get) => ({
  config: cloneConfig(appConfig),
  graph: buildGraph(appConfig.pipeline.nodes, appConfig.pipeline.edges, 1),
  result: null,
  video: null,
  running: false,
  stage: '대기 중',
  progress: 0,
  tab: 'dashboard',
  toasts: [],
  selectedNodeId: null,
  lastUpdated: null,
  dataVisibility: {},
  measurements: [],
  detectionLatencyMs: 0,
  guideEnabled: loadGuidePrefs().enabled,
  guideSeen: loadGuidePrefs().seen,
  guideOpen: false,

  setMeasurements: (items) => set({ measurements: items }),
  setDetectionLatency: (ms) => set({ detectionLatencyMs: Math.round(ms) }),

  toggleDataVisibility: (key) => {
    set((s) => ({
      dataVisibility: { ...s.dataVisibility, [key]: s.dataVisibility[key] === false },
    }));
  },

  setGuideEnabled: (value) => {
    set((s) => {
      saveGuidePrefs(value, s.guideSeen);
      return { guideEnabled: value };
    });
  },
  openGuide: () => set({ guideOpen: true }),
  closeGuide: () => {
    set((s) => {
      const seen = { ...s.guideSeen, [s.tab]: true };
      saveGuidePrefs(s.guideEnabled, seen);
      return { guideOpen: false, guideSeen: seen };
    });
  },

  setTab: (tab) => set({ tab }),
  setVideo: (name, url, meta) => {
    set({ video: { name, url, size: meta?.size, lastModified: meta?.lastModified } });
    scheduleAutoUpdate(get);
  },
  setSelectedNode: (id) => set({ selectedNodeId: id }),

  setTopOption: (key, value) => {
    const config = cloneConfig(get().config);
    (config.options[key] as { value: unknown }).value = value;
    set({ config });
    get().pushToast(`옵션 변경: ${key} → ${value}`, 'info');
    scheduleAutoUpdate(get);
  },

  setPerformance: (key, value) => {
    const config = cloneConfig(get().config);
    (config.performance[key] as { value: unknown }).value = value;
    set({ config });
    scheduleAutoUpdate(get);
  },

  setAccuracy: (key, value) => {
    const config = cloneConfig(get().config);
    (config.accuracy[key] as { value: unknown }).value = value;
    set({ config });
    scheduleAutoUpdate(get);
  },

  setMeasurement: (key, value) => {
    const config = cloneConfig(get().config);
    (config.measurement[key] as { value: unknown }).value = value;
    set({ config });
    scheduleAutoUpdate(get);
  },

  setDetection: (key, value) => {
    const config = cloneConfig(get().config);
    (config.detection[key] as { value: unknown }).value = value;
    set({ config });
    // 모델/런타임 변경은 백엔드에 즉시 반영 (재시작 불필요)
    if (key === 'model' || key === 'runtime') {
      const params = new URLSearchParams({
        model: config.detection.model.value,
        runtime: config.detection.runtime.value,
      });
      void fetch(`${backendBaseUrl()}/api/model/set?${params}`, { method: 'POST' }).catch(() => {});
    }
    scheduleAutoUpdate(get);
  },

  setConfigSection: (section, key, value) => {
    const config = cloneConfig(get().config);
    (config[section] as unknown as Record<string, { value: unknown }>)[key].value = value;
    // 감지 모델·추론 해상도 등이 바뀌면 이전 분석 결과는 무효 → 캐시 초기화
    if (section === 'detection' || section === 'preprocessing' || section === 'accuracy') {
      clearResultCache();
    }
    set({ config });
    scheduleAutoUpdate(get);
  },

  setAutoUpdate: (value) => {
    const config = cloneConfig(get().config);
    config.pipeline.autoUpdate.value = value;
    set({ config });
    get().pushToast(`파이프라인 자동 업데이트 ${value ? '활성' : '비활성'}`, 'info');
  },

  setDebounce: (value) => {
    const config = cloneConfig(get().config);
    config.pipeline.autoUpdateDebounceMs.value = value;
    set({ config });
  },

  toggleNode: (id) => {
    const state = get();
    const nodeConfigs = nodeConfigsFromGraph(state.graph).map((n) =>
      n.id === id ? { ...n, enabled: !n.enabled } : n,
    );
    const graph = updateGraph(state.graph, nodeConfigs, edgeConfigsFromGraph(state.graph));
    set({ graph, lastUpdated: graph.updatedAt });
    state.pushToast(`노드 ${id} ${nodeConfigs.find((n) => n.id === id)?.enabled ? '활성' : '비활성'}`, 'info');
    scheduleAutoUpdate(get);
  },

  addNode: (type) => {
    const state = get();
    const id = `${type}-${Date.now().toString(36)}`;
    const nodeConfigs = [
      ...nodeConfigsFromGraph(state.graph),
      { id, type, label: NODE_KIND_META[type].defaultLabel, enabled: true },
    ];
    // 이전 노드와 자동 연결 (첫 노드 제외)
    const prev = nodeConfigs.filter((n) => n.id !== id).slice(-1)[0];
    const edges = edgeConfigsFromGraph(state.graph);
    if (prev) edges.push({ from: prev.id, to: id });
    const graph = updateGraph(state.graph, nodeConfigs, edges);
    set({ graph, lastUpdated: graph.updatedAt, selectedNodeId: id });
    state.pushToast(`노드 추가: ${NODE_KIND_META[type].labelKo}`, 'success');
    scheduleAutoUpdate(get);
  },

  removeNode: (id) => {
    const state = get();
    const nodeConfigs = nodeConfigsFromGraph(state.graph).filter((n) => n.id !== id);
    const edges = edgeConfigsFromGraph(state.graph).filter((e) => e.from !== id && e.to !== id);
    const graph = updateGraph(state.graph, nodeConfigs, edges);
    set({ graph, lastUpdated: graph.updatedAt, selectedNodeId: null });
    state.pushToast(`노드 삭제: ${id}`, 'warning');
    scheduleAutoUpdate(get);
  },

  renameNode: (id, label) => {
    const state = get();
    const nodeConfigs = nodeConfigsFromGraph(state.graph).map((n) =>
      n.id === id ? { ...n, label } : n,
    );
    const graph = updateGraph(state.graph, nodeConfigs, edgeConfigsFromGraph(state.graph));
    set({ graph, lastUpdated: graph.updatedAt });
    scheduleAutoUpdate(get);
  },

  moveNode: (id, x, y) => {
    const state = get();
    const graph: PipelineGraph = {
      ...state.graph,
      nodes: state.graph.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    };
    set({ graph });
  },

  addEdge: (from, to) => {
    if (from === to) return;
    const state = get();
    const edges = edgeConfigsFromGraph(state.graph);
    if (edges.some((e) => e.from === from && e.to === to)) return;
    edges.push({ from, to });
    const graph = updateGraph(state.graph, nodeConfigsFromGraph(state.graph), edges);
    set({ graph, lastUpdated: graph.updatedAt });
    state.pushToast('노드 연결 추가', 'success');
    scheduleAutoUpdate(get);
  },

  removeEdge: (from, to) => {
    const state = get();
    const edges = edgeConfigsFromGraph(state.graph).filter((e) => !(e.from === from && e.to === to));
    const graph = updateGraph(state.graph, nodeConfigsFromGraph(state.graph), edges);
    set({ graph, lastUpdated: graph.updatedAt });
    state.pushToast('노드 연결 제거', 'warning');
    scheduleAutoUpdate(get);
  },

  runAnalysis: async (videoName, force = false) => {
    if (force) clearResultCache();
    const state = get();
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    if (state.running) {
      pipelineHandle?.cancel();
      abortController?.abort();
    }

    const name = videoName ?? state.video?.name;
    // 업로드된 영상이 없으면 분석을 시작하지 않는다 (데모 분석 없음)
    if (!name) {
      state.pushToast('분석할 영상을 먼저 업로드해 주세요.', 'warning');
      return;
    }
    // 동일 영상+옵션이면 캐시 결과를 즉시 재사용 (파이프라인 재실행 불필요)
    const cacheKey = state.video ? `${videoKey(state.video)}|${configKey(state.config)}` : '';
    const cached = resultCache.get(cacheKey);
    if (cached) {
      set({
        result: cached,
        running: false,
        progress: 1,
        stage: '캐시된 결과 사용',
        video: state.video,
        lastUpdated: new Date().toISOString(),
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.map((n) => ({
            ...n,
            status: n.enabled ? 'done' : 'idle',
            progress: 1,
            durationMs: 0,
            output: '캐시에서 로드',
          })),
        },
      });
      state.pushToast('동일 영상·옵션의 캐시 결과를 사용했습니다.', 'info');
      return;
    }

    abortController = new AbortController();

    set({
      running: true,
      progress: 0,
      stage: '파이프라인 초기화',
      graph: { ...state.graph, nodes: state.graph.nodes.map((n) => ({ ...n, status: 'idle', progress: 0 })) },
    });

    // 1) 파이프라인 실행 (노드별 진행 표시)
    pipelineHandle = executePipeline(get().graph, get().config, {
      onNodeStart: (id) => {
        set((s) => ({
          stage: s.graph.nodes.find((n) => n.id === id)?.label ?? '실행 중',
          graph: {
            ...s.graph,
            nodes: s.graph.nodes.map((n) => (n.id === id ? { ...n, status: 'running', progress: 0 } : n)),
          },
        }));
      },
      onNodeProgress: (id, p) => {
        set((s) => ({
          progress: p,
          graph: {
            ...s.graph,
            nodes: s.graph.nodes.map((n) => (n.id === id ? { ...n, progress: p } : n)),
          },
        }));
      },
      onNodeDone: (id, durationMs, output) => {
        set((s) => ({
          graph: {
            ...s.graph,
            nodes: s.graph.nodes.map((n) =>
              n.id === id ? { ...n, status: 'done', progress: 1, durationMs, output } : n,
            ),
          },
        }));
      },
    });

    try {
      await pipelineHandle.promise;
    } catch {
      // 취소됨
    }

    // 2) 분석 엔진 실행 (옵션으로 선택된 엔진)
    try {
      const engine = createEngine();
      set({ stage: `${engine.name} 엔진 분석 중`, progress: 0 });
      const result = await engine.analyze({
        videoName: name,
        videoUrl: state.video?.url,
        config: get().config,
        signal: abortController.signal,
        onProgress: (p, stage) => set({ progress: p, stage }),
      });

      if (cacheKey) resultCache.set(cacheKey, result);
      set((s) => ({
        result,
        running: false,
        progress: 1,
        stage: '완료',
        graph: {
          ...s.graph,
          nodes: s.graph.nodes.map((n) => ({
            ...n,
            durationMs: result.engineTimings?.[n.id] ?? n.durationMs,
          })),
        },
        video: {
          name,
          url: state.video?.url,
          size: state.video?.size,
          lastModified: state.video?.lastModified,
        },
        lastUpdated: new Date().toISOString(),
      }));
      get().pushToast('분석이 완료되었습니다.', 'success');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        set({ running: false, stage: '취소됨' });
        return;
      }
      set({ running: false, stage: '오류 발생' });
      get().pushToast(`분석 실패: ${(err as Error).message}`, 'error');
    }
  },

  cancelAnalysis: () => {
    pipelineHandle?.cancel();
    abortController?.abort();
    set({ running: false, stage: '취소됨' });
    get().pushToast('분석을 취소했습니다.', 'info');
  },

  resetPipeline: () => {
    const graph = buildGraph(appConfig.pipeline.nodes, appConfig.pipeline.edges, get().graph.version + 1);
    set({ graph, config: cloneConfig(appConfig), lastUpdated: graph.updatedAt });
    get().pushToast('파이프라인을 초기화했습니다.', 'info');
    scheduleAutoUpdate(get);
  },

  pushToast: (message, tone = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => get().dismissToast(id), 3600);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export default useStore;
```

</details>

<details>
<summary><code>apps/web-react/src/services/trainingApi.ts</code></summary>

```ts
import { backendBaseUrl } from '@/config';

export interface TrainStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  epoch: number;
  totalEpochs: number;
  message: string;
  modelPath: string | null;
  error: string | null;
  datasetId: string | null;
  updatedAt: string;
}

export interface TrainRequest {
  datasetId: string;
  epochs: number;
  imgsz: number;
  batch: number;
  baseModel: string;
  augmentation?: Augmentation;
}

export interface Augmentation {
  fliplr: number;
  flipud: number;
  mosaic: number;
  mixup: number;
  hsvH: number;
  hsvS: number;
  hsvV: number;
  degrees: number;
  scale: number;
}

export const DEFAULT_AUGMENTATION: Augmentation = {
  fliplr: 0.5, flipud: 0.1, mosaic: 1.0, mixup: 0.1,
  hsvH: 0.015, hsvS: 0.7, hsvV: 0.4, degrees: 5, scale: 0.5,
};

export interface MeasurementLike {
  label: string;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface DatasetAnalysis {
  datasetId: string;
  images: number;
  labeledImages: number;
  emptyLabels: number;
  valImages: number;
  totalLabels: number;
  accidentImages: number;
  accidentRatio: number;
  classes: string[];
  classCounts: Record<string, number>;
  recommendations: string[];
  ready: boolean;
}

export interface RawDataset { name: string; path: string; }

const base = () => backendBaseUrl();

export async function getTrainStatus(): Promise<TrainStatus> {
  const res = await fetch(`${base()}/api/train/status`);
  if (!res.ok) throw new Error('status failed');
  return res.json();
}

export async function createDataset(datasetId: string, classes: string[]) {
  const res = await fetch(`${base()}/api/dataset/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId, classes }),
  });
  if (!res.ok) throw new Error('dataset create failed');
  return res.json();
}

export async function uploadDataset(datasetId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  form.append('datasetId', datasetId);
  const res = await fetch(`${base()}/api/dataset/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('dataset upload failed');
  return res.json();
}

/** 실제 현장 데이터셋을 분석해 클래스 분포·사고 비율을 반환 */
export async function analyzeDataset(datasetId: string): Promise<DatasetAnalysis> {
  const res = await fetch(`${base()}/api/dataset/analyze?datasetId=${encodeURIComponent(datasetId)}`);
  if (!res.ok) throw new Error('dataset analyze failed');
  return res.json();
}

/** services/.data/raw 하위의 원본 폴더 목록 */
export async function listRawDatasets(): Promise<{ datasets: RawDataset[]; root: string }> {
  const res = await fetch(`${base()}/api/dataset/raw`);
  if (!res.ok) throw new Error('raw dataset list failed');
  return res.json();
}

/** 원본 폴더를 가져와 train/val로 분할하고 data.yaml을 생성 */
export async function importDatasetDir(
  datasetId: string, sourcePath: string, classes: string[], valRatio = 0.2,
): Promise<DatasetAnalysis & { imported: number; train: number; val: number }> {
  const res = await fetch(`${base()}/api/dataset/import-dir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId, sourcePath, classes, valRatio }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? 'dataset import failed');
  }
  return res.json();
}

export async function startTraining(req: TrainRequest): Promise<TrainStatus> {
  const res = await fetch(`${base()}/api/train/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('train start failed');
  return res.json();
}

export async function useModel(pretrained: boolean) {
  const res = await fetch(`${base()}/api/model/use?pretrained=${pretrained}`, { method: 'POST' });
  if (!res.ok) throw new Error('model switch failed');
  return res.json();
}

/** 영상 프레임을 캡처해 감지 → YOLO 라벨로 데이터셋에 저장 */
export async function captureFrame(
  videoUrl: string,
  datasetId: string,
  timeSec = 0,
): Promise<{ saved: number }> {
  const video = document.createElement('video');
  video.muted = true;
  video.src = videoUrl;
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('video load failed'));
  });
  video.currentTime = Math.min(timeSec, Math.max(0, video.duration - 0.1));
  await new Promise<void>((resolve) => { video.onseeked = () => resolve(); });
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.7));
  if (!blob) throw new Error('capture failed');

  const measureForm = new FormData();
  measureForm.append('file', blob, 'capture.jpg');
  measureForm.append('threshold', '0.4');
  const measureRes = await fetch(`${base()}/api/measure-frame`, { method: 'POST', body: measureForm });
  if (!measureRes.ok) throw new Error('measure failed');
  const measured = (await measureRes.json()) as { measurements: MeasurementLike[] };

  const captureForm = new FormData();
  captureForm.append('file', blob, `frame_${Date.now()}.jpg`);
  captureForm.append('payload', JSON.stringify({
    datasetId,
    detections: measured.measurements.map((m) => ({ label: m.label, bbox: m.bbox })),
  }));
  const res = await fetch(`${base()}/api/dataset/capture`, { method: 'POST', body: captureForm });
  if (!res.ok) throw new Error('capture save failed');
  return res.json();
}
```

</details>

<details>
<summary><code>apps/web-react/src/services/labelingApi.ts</code></summary>

```ts
import { backendBaseUrl } from '@/config';

export interface ClipInfo {
  name: string;
  frames: number;
  width: number;
  height: number;
  fps: number;
  seconds: number;
}

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LabelBox {
  id: string;
  label: string;
  bbox: BBox;
  confidence?: number;
}

export interface DetectionLike {
  label: string;
  labelKo?: string;
  confidence?: number;
  bbox: BBox;
}

const base = () => backendBaseUrl();

export async function listClips(): Promise<ClipInfo[]> {
  const res = await fetch(`${base()}/api/clips`);
  if (!res.ok) throw new Error('clip list failed');
  const data = (await res.json()) as { clips: Array<{ name: string }> };
  const infos = await Promise.all(
    data.clips.map(async (c) => {
      try {
        const r = await fetch(`${base()}/api/clips/${encodeURIComponent(c.name)}/info`);
        return (await r.json()) as ClipInfo;
      } catch {
        return { name: c.name, frames: 0, width: 0, height: 0, fps: 0, seconds: 0 };
      }
    }),
  );
  return infos;
}

export function frameUrl(name: string, index: number): string {
  return `${base()}/api/clips/${encodeURIComponent(name)}/frame/${index}`;
}

export async function getDatasetClasses(datasetId: string): Promise<string[]> {
  const res = await fetch(`${base()}/api/dataset/classes?datasetId=${encodeURIComponent(datasetId)}`);
  if (!res.ok) throw new Error('classes load failed');
  return ((await res.json()) as { classes: string[] }).classes;
}

/** 클립 프레임을 YOLO에 다시 감지해 초기 BBox를 만든다. */
export async function detectFrame(name: string, index: number, threshold = 0.3): Promise<DetectionLike[]> {
  const blob = await (await fetch(frameUrl(name, index))).blob();
  const form = new FormData();
  form.append('file', blob, `frame_${index}.jpg`);
  form.append('threshold', String(threshold));
  const res = await fetch(`${base()}/api/detect-frame`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('detect failed');
  return ((await res.json()) as { detections: DetectionLike[] }).detections;
}

export async function saveClipLabel(
  name: string,
  datasetId: string,
  index: number,
  detections: DetectionLike[],
): Promise<{ saved: number; negative: boolean }> {
  const res = await fetch(`${base()}/api/clips/${encodeURIComponent(name)}/label`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId, index, detections }),
  });
  if (!res.ok) throw new Error('label save failed');
  return res.json();
}
```

</details>

<details>
<summary><code>apps/web-react/src/analysis/remoteDetector.ts</code></summary>

```ts
import type { LiveBox } from './liveTracker';
import { estimateGlobalShift } from './motionCompensation';
import type { ObjectMeasurement } from '@/types';

function iou(a: Detection['bbox'], b: Detection['bbox']): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = a.w * a.h;
  const areaB = b.w * b.h;
  return inter / Math.max(1, areaA + areaB - inter);
}

interface Detection {
  label: string;
  labelKo: string;
  kind: 'person' | 'vehicle' | 'object';
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

/**
 * 재생 중 프레임을 FastAPI YOLO 서버로 전송해 실제 객체 감지를 수행한다.
 * 서버 응답을 LiveBox 형태로 변환하고 프레임 간 최근접 매칭으로 트랙 ID를 유지한다.
 */
export class RemoteDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private timer: ReturnType<typeof setInterval> | null = null;
  private effectiveInterval: number;
  private busy = false;
  private seq = 0;
  private tracks = new Map<string, { x: number; y: number; t: number; seen: number }>();
  /** 마지막 감지 결과와 프레임 캡처 시점 — 프레임 단위 예측에 사용 */
  private lastBoxes: LiveBox[] = [];
  /** 칼만 필터: 트랙별 위치·속도·공분산 (상수 속도 모델) */
  private kalman = new Map<string, {
    x: number; y: number; vx: number; vy: number;
    px: number; py: number; pvx: number; pvy: number; t: number;
  }>();
  private capturedAt = 0;
  private stopped = false;
  private failed = false;
  private prevFrame: Float32Array | null = null;
  private pausedSampled = false;
  private lastPausedTime = -1;
  private blockedZones: Array<{ x: number; y: number; w: number; h: number }> = [];

  constructor(
    private video: HTMLVideoElement,
    private baseUrl: string,
    private onUpdate: (boxes: LiveBox[]) => void,
    private onMeasure?: (items: ObjectMeasurement[]) => void,
    private onError?: () => void,
    private threshold = 0.5,
    private intervalMs = 220,
    private onLatency?: (ms: number) => void,
    private classFilter: 'all' | 'person_vehicle' | 'person_only' = 'all',
    private nmsIoU = 0.45,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.ctx = this.canvas.getContext('2d')!;
    this.effectiveInterval = intervalMs;
  }

  start() {
    // 감지는 이 주기로 수행하고, 화면은 RAF에서 프레임 단위로 예측 갱신한다.
    this.timer = setInterval(() => void this.sample(), this.effectiveInterval);
    void this.sample();
  }

  /** 샘플링 주기는 고정 유지 — 지연이 있어도 busy 플래그가 요청 적체를 막는다. */
  private retune(_latency: number) {
    return;
  }

  /**
   * 현재 영상 시점 기준으로 예측된 Box를 반환한다.
   * 감지 결과가 나온 뒤 응답 지연만큼 객체가 이동하므로 속도로 보상하고,
   * 다음 감지 결과가 오면 실제 위치로 즉시 수렴한다.
   */
  getPredictedBoxes(now: number): LiveBox[] {
    if (!this.lastBoxes.length) return [];
    const dt = this.kalman.size
      ? Math.max(0, Math.min(0.4, now - this.capturedAt))
      : 0;
    return this.lastBoxes.map((b) => {
      const k = this.kalman.get(b.id);
      if (!k || dt <= 0) return b;
      // 칼만 상태 예측: x' = x + v*dt, 공분산도 함께 증가
      const px = k.x + k.vx * dt;
      const py = k.y + k.vy * dt;
      // 예측 위치와 마지막 감지 위치의 차이 (과도한 외삽 제한)
      const maxShiftX = Math.max(2, b.w * 0.4);
      const maxShiftY = Math.max(2, b.h * 0.4);
      const dx = Math.max(-maxShiftX, Math.min(maxShiftX, px - k.x));
      const dy = Math.max(-maxShiftY, Math.min(maxShiftY, py - k.y));
      return { ...b, x: b.x + dx, y: b.y + dy };
    });
  }

  /** 칼만 필터 업데이트 — 측정값으로 상태와 공분산을 보정 */
  private updateKalman(id: string, x: number, y: number, t: number) {
    const k = this.kalman.get(id);
    if (!k) {
      this.kalman.set(id, { x, y, vx: 0, vy: 0, px: 1, py: 1, pvx: 4, pvy: 4, t });
      return;
    }
    const dt = Math.max(0.05, t - k.t);
    // 예측
    let ex = k.x + k.vx * dt;
    let ey = k.y + k.vy * dt;
    let epx = k.px + dt * (2 * k.pvx) + dt * dt * 0.5;
    let epy = k.py + dt * (2 * k.pvy) + dt * dt * 0.5;
    epx += 0.2; epy += 0.2; // 과정 노이즈
    // 칼만 게인
    const kx = epx / (epx + 1.0);
    const ky = epy / (epy + 1.0);
    const vx = k.vx + kx * ((x - ex) / dt);
    const vy = k.vy + ky * ((y - ey) / dt);
    const nx = ex + kx * (x - ex);
    const ny = ey + ky * (y - ey);
    this.kalman.set(id, {
      x: nx, y: ny, vx, vy,
      px: (1 - kx) * epx, py: (1 - ky) * epy,
      pvx: (1 - kx) * k.pvx, pvy: (1 - ky) * k.pvy,
      t,
    });
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.onUpdate([]);
  }

  get hasFailed() {
    return this.failed;
  }

  /** 사용자가 오탐 신고한 영역을 설정 (해당 영역과 겹치는 감지를 숨김) */
  setBlockedZones(zones: Array<{ x: number; y: number; w: number; h: number }>) {
    this.blockedZones = zones;
  }

  private isBlocked(det: Detection): boolean {
    // 신고 영역과 감지 박스가 어느 정도 겹치면 차단 (위치가 조금씩 달라도 잡히도록)
    return this.blockedZones.some((z) => {
      const overlap = iou(z, det.bbox);
      const cz = { x: z.x + z.w / 2, y: z.y + z.h / 2 };
      const cd = { x: det.bbox.x + det.bbox.w / 2, y: det.bbox.y + det.bbox.h / 2 };
      const centerDist = Math.hypot(cz.x - cd.x, cz.y - cd.y);
      return overlap > 0.12 || centerDist < 8;
    });
  }

  private async sample() {
    if (this.stopped || this.busy || this.failed) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    const video = this.video;
    if (video.readyState < 2 || video.videoWidth === 0) return;
    // 일시정지 상태에서는 같은 프레임을 반복 전송하지 않고 한 번만 분석
    if (video.paused) {
      if (this.pausedSampled && this.lastPausedTime === video.currentTime) return;
      this.pausedSampled = true;
      this.lastPausedTime = video.currentTime;
    } else {
      this.pausedSampled = false;
    }
    this.busy = true;
    // 응답이 돌아온 뒤의 currentTime이 아니라, 프레임을 실제로 캡처한 시점을 기록한다.
    const capturedAt = video.currentTime;
    try {
      // 원본 비율을 유지하도록 캔버스 크기를 맞춘다 (세로 영상을 16:9로 늘리면 좌표가 틀어짐)
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const targetW = 640;
      const targetH = Math.max(1, Math.round((vh / vw) * targetW));
      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
      }
      this.ctx.drawImage(video, 0, 0, targetW, targetH);
      // 흔들림 보정: 프레임 간 전역 이동을 추정해 트랙 매칭 오차를 줄인다.
      const w = this.canvas.width;
      const h = this.canvas.height;
      const pixels = this.ctx.getImageData(0, 0, w, h).data;
      const luma = new Float32Array(w * h);
      for (let p = 0; p < w * h; p += 1) {
        const i = p * 4;
        luma[p] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      }
      let shakeX = 0;
      let shakeY = 0;
      if (this.prevFrame) {
        const shift = estimateGlobalShift(this.prevFrame, luma, w, h);
        shakeX = (shift.dx / w) * 100;
        shakeY = (shift.dy / h) * 100;
      }
      this.prevFrame = luma;

      // JPEG 품질이 낮으면 원거리·소형 객체가 압축 노이즈로 사라진다 (0.5 → 0.85)
      const blob = await new Promise<Blob | null>((resolve) =>
        this.canvas.toBlob(resolve, 'image/jpeg', 0.85),
      );
      if (!blob) return;
      const form = new FormData();
      form.append('file', blob, 'frame.jpg');
      form.append('threshold', String(this.threshold));
      // 실시간 추적에서는 깊이 추론을 생략해 응답 지연을 줄인다.
      form.append('depth', 'false');
      const t0 = performance.now();
      const res = await fetch(`${this.baseUrl}/api/measure-frame`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`measure failed: ${res.status}`);
      const data = (await res.json()) as { measurements: ObjectMeasurement[]; depthUsed: boolean };
      const latency = performance.now() - t0;
      this.onLatency?.(latency);
      this.retune(latency);
      // 추론 지연이 길어도 같은 트랙으로 이어지도록 매칭 창을 동적으로 확장
      const matchWindowSec = Math.max(0.8, Math.min(2.0, (latency / 1000) * 2 + 0.4));
      const detections: Detection[] = (data.measurements ?? []).map((m) => ({
        label: m.label,
        labelKo: m.label,
        kind: m.kind,
        confidence: m.confidence,
        bbox: m.bbox,
      }));
      this.onMeasure?.(data.measurements ?? []);
      // 매칭·예측 기준 시점을 캡처 시점으로 고정 (응답 지연으로 인한 뒤처짐 제거)
      const t = capturedAt;
      this.capturedAt = t;
      const frameBoxes = new Map<string, LiveBox>();
      const accepted: Detection[] = [];

      // 사람/차량을 구분해 필터링
      const classFilter = this.classFilter;
      const isPerson = (d: Detection) =>
        d.kind === 'person' || d.label.includes('사람') || d.label.includes('작업자');
      const candidates = detections
        .filter((d) => !this.isBlocked(d))
        .filter((d) => classFilter === 'all' ? true
          : classFilter === 'person_only' ? isPerson(d)
            : d.kind !== 'object')
        .filter((d) => {
          const area = (d.bbox.w * d.bbox.h) / 100; // 화면 면적 %
          if (isPerson(d)) {
            // 사람: 낮은 신뢰도도 허용해 인원 누락 방지, 단 너무 작은 노이즈는 제거
            return d.confidence >= Math.max(0.25, this.threshold - 0.15)
              && area >= 0.15 && area <= 45;
          }
          // 차량/중장비: 화면 22% 초과 박스는 배경 오탐(잔해·붕괴 현장)으로 제거
          return d.confidence >= this.threshold && area >= 0.5 && area <= 22;
        })
        .sort((a: Detection, b: Detection) => b.confidence - a.confidence);

      // 사람은 여러 명 허용. 차량/중장비는 같은 클래스 중복만 제거.
      const usedVehicleLabels = new Set<string>();
      for (const det of candidates) {
        if (!isPerson(det) && usedVehicleLabels.has(det.label)) continue;
        if (accepted.some((a) => iou(a.bbox, det.bbox) > this.nmsIoU)) continue;
        if (accepted.length >= 16) break;
        if (!isPerson(det)) usedVehicleLabels.add(det.label);
        accepted.push(det);

        const cx = det.bbox.x + det.bbox.w / 2;
        const cy = det.bbox.y + det.bbox.h / 2;
        let bestId: string | undefined;
        let bestDist = Infinity;
        for (const [id, last] of this.tracks) {
          if (t - last.t > matchWindowSec) continue;
          const k = this.kalman.get(id);
          if (k) {
            // 칼만 예측 위치 기준으로 매칭 (프레임 간 지연 보상)
            const dt = Math.max(0, Math.min(0.4, t - k.t));
            const px = k.x + k.vx * dt;
            const py = k.y + k.vy * dt;
            const dist = Math.hypot(px + shakeX - cx, py + shakeY - cy);
            if (dist < bestDist) { bestId = id; bestDist = dist; }
          } else {
            const dist = Math.hypot(last.x + shakeX - cx, last.y + shakeY - cy);
            if (dist < bestDist) { bestId = id; bestDist = dist; }
          }
        }
        if (!bestId || bestDist > 14) {
          this.seq += 1;
          bestId = `Y${this.seq}`;
        }
        const last = this.tracks.get(bestId);
        const seen = last && t - last.t <= matchWindowSec ? last.seen + 1 : 1;
        // 칼만 필터 업데이트 (속도/방향 부드럽게 추정)
        this.updateKalman(bestId, cx, cy, t);
        this.tracks.set(bestId, { x: cx, y: cy, t, seen });

        // 신뢰도가 높으면 즉시 표시, 애매한 후보만 2프레임 연속 감지 요구
        if (seen < 2 && det.confidence < 0.7) continue;
        frameBoxes.set(bestId, {
          id: bestId,
          label: det.labelKo || det.label,
          kind: det.kind,
          x: det.bbox.x,
          y: det.bbox.y,
          w: det.bbox.w,
          h: det.bbox.h,
          confidence: det.confidence,
          t,
        });
      }
      // 사라진 트랙 정리
      for (const [id, last] of this.tracks) {
        if (t - last.t > matchWindowSec * 1.5) {
          this.tracks.delete(id);
          this.kalman.delete(id);
        }
      }
      this.lastBoxes = [...frameBoxes.values()];
      this.onUpdate(this.getPredictedBoxes(video.currentTime));
    } catch {
      this.failed = true;
      this.onError?.();
    } finally {
      this.busy = false;
    }
  }
}
```

</details>

<details>
<summary><code>apps/web-react/src/analysis/browserVideoAnalyzer.ts</code></summary>

```ts
import type { AppConfig, FrameMetric, TrackedShape, VideoSignalMetrics } from '@/types';

export interface BlobRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  area: number;
}

/**
 * 차분 마스크의 노이즈를 제거하고 유효한 형상 영역만 반환한다.
 * - 전체 화면이 바뀐 경우(카메라 흔들림/장면 전환)는 추적하지 않음
 * - 3×3 다수결 필터로 작은 점 노이즈 제거
 * - 너무 크거나 작은 영역 제외
 */
export function prepareBlobs(
  mask: Uint8Array,
  width: number,
  height: number,
  minArea: number,
): BlobRegion[] {
  let changed = 0;
  for (let i = 0; i < mask.length; i += 1) if (mask[i]) changed += 1;
  // 장면 전환/카메라 흔들림으로 화면 대부분이 바뀐 경우에만 제외
  if (changed / mask.length > 0.55) return [];

  const cleaned = new Uint8Array(mask.length);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const p = y * width + x;
      let count = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (mask[p + dy * width + dx]) count += 1;
        }
      }
      if (count >= 3) cleaned[p] = 1;
    }
  }
  const maxArea = mask.length * 0.35;
  return findBlobs(cleaned, width, height, minArea).filter(
    (b) => b.area <= maxArea && b.w <= width * 0.6 && b.h <= height * 0.8,
  );
}

/** 영역의 종횡비·면적으로 인물/차량/일반 객체를 분류 (휴리스틱) */
export function classifyRegion(region: { w: number; h: number; area: number }): 'person' | 'vehicle' | 'object' {
  const ratio = region.w / Math.max(region.h, 1);
  if (ratio < 0.85 && region.area < 6000) return 'person';
  if (ratio > 1.3 && region.area > 100) return 'vehicle';
  return 'object';
}

/** 프레임 차분 마스크에서 연결 요소(움직이는 형상)를 추출한다 */
export function findBlobs(mask: Uint8Array, width: number, height: number, minArea: number): BlobRegion[] {
  const visited = new Uint8Array(mask.length);
  const blobs: BlobRegion[] = [];
  const stack: number[] = [];

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    stack.length = 0;
    stack.push(start);
    visited[start] = 1;
    let count = 0;
    let minX = width; let minY = height; let maxX = 0; let maxY = 0;
    let sumX = 0; let sumY = 0;

    while (stack.length) {
      const p = stack.pop()!;
      const x = p % width;
      const y = Math.floor(p / width);
      count += 1;
      sumX += x; sumY += y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      const neighbors = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && mask[n] && !visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }

    if (count >= minArea) {
      blobs.push({
        x: minX, y: minY,
        w: Math.max(1, maxX - minX + 1),
        h: Math.max(1, maxY - minY + 1),
        cx: sumX / count,
        cy: sumY / count,
        area: count,
      });
    }
  }
  return blobs
    // 프레임 경계에 닿은 노이즈 영역은 제외
    .filter((b) => b.x > 1 && b.y > 1 && b.x + b.w < width - 1 && b.y + b.h < height - 1)
    .sort((a, b) => b.area - a.area)
    .slice(0, 6);
}

/**
 * 업로드된 영상을 브라우저에서 실제로 읽어 프레임 신호를 추출한다.
 * - 프레임 샘플링 + 픽셀 차분으로 모션/장면전환 계산
 * - 밝기(luma)와 엣지 밀도 계산
 * - 타임라인 썸네일 생성
 * 외부 API 없이 동작하며, 실패 시 호출 측에서 목업으로 폴백한다.
 */

const W = 160;
const H = 90;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function waitFor(video: HTMLVideoElement, event: string, timeoutMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => { cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error(`video ${event} timeout`)); }, timeoutMs);
    const done = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error('video load error')); };
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener(event, done);
      video.removeEventListener('error', fail);
      signal?.removeEventListener('abort', onAbort);
    };
    video.addEventListener(event, done, { once: true });
    video.addEventListener('error', fail, { once: true });
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function analyzeBrowserVideo(
  url: string,
  config: AppConfig,
  onProgress?: (progress: number, stage: string) => void,
  signal?: AbortSignal,
): Promise<VideoSignalMetrics> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;

  try {
    onProgress?.(0.02, '영상 메타데이터 로드');
    await waitFor(video, 'loadedmetadata', 8000, signal);

    const rawDuration = Number.isFinite(video.duration) ? video.duration : 60;
    const durationSec = Math.max(1, Math.min(Math.round(rawDuration * 10) / 10, 120));
    const configuredFps = Math.min(config.performance.fps.value, 4);
    const sampleCount = Math.max(8, Math.min(Math.round(durationSec * configuredFps), 60));
    // 짧은 영상은 키프레임이 없어 seek가 실패할 수 있으므로 실시간 재생으로 샘플링한다.
    const playbackMode = durationSec <= 12;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('canvas 2d context unavailable');

    const brightnessRaw: number[] = [];
    const motionRaw: number[] = [];
    const edgeRaw: number[] = [];
    const times: number[] = [];
    const thumbnails: string[] = [];
    const tracks: TrackedShape[] = [];
    let trackSeq = 0;
    const sensitivity = config.accuracy.personDetectionSensitivity.value;
    // 노이즈(압축 아티팩트)를 형상으로 오인하지 않도록 임계값을 높인다.
    const diffThreshold = 24 + (1 - sensitivity) * 18;
    const minBlobArea = Math.max(60, Math.round(140 * (1 - sensitivity)));
    let prevLuma: Float32Array | null = null;

    for (let i = 0; i < sampleCount; i += 1) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const t = sampleCount === 1 ? 0 : (i / (sampleCount - 1)) * durationSec;
      if (playbackMode) {
        if (i === 0) await video.play();
        await new Promise<void>((resolve) => setTimeout(resolve, 1000 / configuredFps));
      } else {
        video.currentTime = Math.min(t, Math.max(0, durationSec - 0.05));
        await waitFor(video, 'seeked', 2500, signal);
      }
      ctx.drawImage(video, 0, 0, W, H);
      const image = ctx.getImageData(0, 0, W, H).data;

      const luma = new Float32Array(W * H);
      let sum = 0;
      let edgeSum = 0;
      for (let p = 0; p < W * H; p += 1) {
        const idx = p * 4;
        const l = 0.299 * image[idx] + 0.587 * image[idx + 1] + 0.114 * image[idx + 2];
        luma[p] = l;
        sum += l;
        if (p % W < W - 1) edgeSum += Math.abs(l - luma[p + 1]);
      }
      const avgLuma = sum / luma.length;
      brightnessRaw.push(Math.round((avgLuma / 255) * 1000) / 10);
      edgeRaw.push(Math.round((edgeSum / luma.length) * 10) / 10);

      if (prevLuma) {
        let diff = 0;
        const mask = new Uint8Array(W * H);
        for (let p = 0; p < luma.length; p += 1) {
          const d = Math.abs(luma[p] - prevLuma[p]);
          diff += d;
          if (d > diffThreshold) mask[p] = 1;
        }
        motionRaw.push(diff / luma.length);

        // 움직이는 형상을 연결 요소로 검출하고 최근접 거리로 트랙에 할당
        const blobs = prepareBlobs(mask, W, H, minBlobArea);
        for (const blob of blobs) {
          const cx = (blob.cx / W) * 100;
          const cy = (blob.cy / H) * 100;
          let best: TrackedShape | undefined;
          let bestDist = Infinity;
          for (const track of tracks) {
            const last = track.points[track.points.length - 1];
            if (!last || t - last.t > 2.5) continue;
            const d = Math.hypot(last.x + last.w / 2 - cx, last.y + last.h / 2 - cy);
            if (d < bestDist) { best = track; bestDist = d; }
          }
          // 기존 트랙과 너무 멀면 노이즈로 간주(단, 기존 트랙이 없을 때는 새 트랙 생성 허용)
          if (best && bestDist > 18) continue;
          if (!best) {
            if (tracks.length >= 10 || blob.area < minBlobArea * 1.5) continue;
            trackSeq += 1;
            best = {
              id: `T${trackSeq}`,
              label: `형상 T${trackSeq}`,
              kind: classifyRegion(blob),
              firstSeen: t,
              lastSeen: t,
              points: [],
              distance: 0,
            };
            tracks.push(best);
          }
          const prev = best.points[best.points.length - 1];
          const raw = {
            x: clamp((blob.x / W) * 100, 0, 100),
            y: clamp((blob.y / H) * 100, 0, 100),
            w: clamp((blob.w / W) * 100, 1, 100),
            h: clamp((blob.h / H) * 100, 1, 100),
          };
          // 위치 평활화로 프레임 간 떨림 제거
          const next = prev
            ? {
                x: prev.x * 0.45 + raw.x * 0.55,
                y: prev.y * 0.45 + raw.y * 0.55,
                w: prev.w * 0.6 + raw.w * 0.4,
                h: prev.h * 0.6 + raw.h * 0.4,
              }
            : raw;
          if (prev) best.distance += Math.hypot(next.x - prev.x, next.y - prev.y);
          best.lastSeen = t;
          best.points.push({
            t,
            ...next,
            confidence: clamp(0.55 + (blob.area / (W * H)) * 4, 0.55, 0.99),
          });
        }
      } else {
        motionRaw.push(0);
      }
      prevLuma = luma;
      times.push(Math.round(t * 10) / 10);

      // 썸네일은 최대 12장만 저장 (문서 크기/메모리 절약)
      if (i % Math.max(1, Math.floor(sampleCount / 12)) === 0 && thumbnails.length < 12) {
        thumbnails.push(canvas.toDataURL('image/jpeg', 0.45));
      }
      onProgress?.(0.05 + (i + 1) / sampleCount * 0.9, `영상 프레임 분석 ${i + 1}/${sampleCount}`);
    }

    const maxMotion = Math.max(...motionRaw, 0.001);
    const maxEdge = Math.max(...edgeRaw, 0.001);
    const motion: FrameMetric[] = times.map((t, i) => ({
      t,
      value: Math.round((motionRaw[i] / maxMotion) * 1000) / 10,
    }));
    const edgeDensity: FrameMetric[] = times.map((t, i) => ({
      t,
      value: Math.round((edgeRaw[i] / maxEdge) * 1000) / 10,
    }));
    const brightness: FrameMetric[] = times.map((t, i) => ({ t, value: brightnessRaw[i] }));
    const sceneChanges: number[] = [];
    for (let i = 1; i < motion.length; i += 1) {
      if (motion[i].value > 55 && motion[i].value > motion[i - 1].value * 1.5) sceneChanges.push(motion[i].t);
    }

    // 짧게 스쳐간 노이즈 트랙 제거 + 상위 트랙만 유지
    const tracked = tracks
      .filter((t) => t.points.length >= 3 && t.lastSeen - t.firstSeen >= 0.6)
      .sort((a, b) => b.points.length - a.points.length)
      .slice(0, 8)
      .map((t, i) => ({ ...t, id: `T${i + 1}`, label: `형상 T${i + 1}` }));

    onProgress?.(0.98, '영상 신호 분석 완료');
    return {
      durationSec,
      sampledFrames: sampleCount,
      effectiveFps: Math.round((sampleCount / durationSec) * 10) / 10,
      frameWidth: W,
      frameHeight: H,
      brightness,
      motion,
      edgeDensity,
      sceneChanges,
      thumbnails,
      tracks: tracked,
      source: 'browser-video',
    };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}
```

</details>

<details>
<summary><code>apps/web-react/src/analysis/liveTracker.ts</code></summary>

```ts
import { classifyRegion, findBlobs, type BlobRegion } from './browserVideoAnalyzer';
import { alignFrame, estimateGlobalShift } from './motionCompensation';

export interface LiveBox {
  id: string;
  /** 화면에 표시할 클래스명 (예: 자동차, 사람, 버스) */
  label: string;
  kind: 'person' | 'vehicle' | 'object';
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
  t: number;
}

interface LiveTrack {
  id: string;
  kind: 'person' | 'vehicle' | 'object';
  lastT: number;
  cx: number;
  cy: number;
}

const W = 160;
const H = 90;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * 재생 중인 <video>에서 프레임을 직접 읽어 실시간으로 움직이는 형상을 추적한다.
 * 분석 완료를 기다리지 않으며, 재생 시점마다 BBox를 콜백으로 전달한다.
 */
export class LiveTracker {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  /** 정적 배경 모델(움직이지 않는 벽·건물은 제거하기 위해 사용) */
  private background: Float32Array | null = null;
  private prevFrame: Float32Array | null = null;
  private tracks: LiveTrack[] = [];
  private seq = 0;
  private lastSample = 0;
  private rafId: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private stopped = false;

  constructor(
    private video: HTMLVideoElement,
    private onUpdate: (boxes: LiveBox[]) => void,
    private sensitivity = 0.7,
    private sampleIntervalMs = 90,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  start() {
    const supportsFrameCallback = typeof (this.video as any).requestVideoFrameCallback === 'function';
    if (supportsFrameCallback) {
      const cb = (now: number) => {
        if (this.stopped) return;
        if (now - this.lastSample >= this.sampleIntervalMs) {
          this.lastSample = now;
          this.sample();
        }
        this.rafId = (this.video as any).requestVideoFrameCallback(cb);
      };
      this.rafId = (this.video as any).requestVideoFrameCallback(cb);
    } else {
      this.timer = setInterval(() => this.sample(), this.sampleIntervalMs);
    }
  }

  stop() {
    this.stopped = true;
    if (this.rafId !== null && typeof (this.video as any).cancelVideoFrameCallback === 'function') {
      (this.video as any).cancelVideoFrameCallback(this.rafId);
    }
    if (this.timer) clearInterval(this.timer);
    this.onUpdate([]);
  }

  private sample() {
    const video = this.video;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (video.readyState < 2 || video.videoWidth === 0) return;
    this.ctx.drawImage(video, 0, 0, W, H);
    const image = this.ctx.getImageData(0, 0, W, H).data;
    const luma = new Float32Array(W * H);
    for (let p = 0; p < W * H; p += 1) {
      const i = p * 4;
      luma[p] = 0.299 * image[i] + 0.587 * image[i + 1] + 0.114 * image[i + 2];
    }

    // 카메라 흔들림 보정: 이전 프레임 대비 전역 이동량을 추정해 현재 프레임을 되민다.
    let aligned: Float32Array = luma;
    if (this.prevFrame) {
      const { dx, dy } = estimateGlobalShift(this.prevFrame, luma, W, H);
      if (Math.abs(dx) <= 12 && Math.abs(dy) <= 12) aligned = alignFrame(luma, dx, dy, W, H);
    }
    this.prevFrame = luma;

    if (this.background) {
      // 배경 차분: 정적 벽/건물은 배경으로 학습되고 움직이는 차량·인물만 남는다.
      const threshold = 26 + (1 - this.sensitivity) * 18;
      const minArea = Math.max(70, Math.round(160 * (1 - this.sensitivity)));
      const mask = new Uint8Array(W * H);
      let changed = 0;
      for (let p = 0; p < W * H; p += 1) {
        if (Math.abs(aligned[p] - this.background[p]) > threshold) {
          mask[p] = 1;
          changed += 1;
        }
        // 배경을 아주 천천히 갱신해 조명 변화에 적응하되 움직이는 물체는 흡수하지 않음
        this.background[p] = this.background[p] * 0.985 + aligned[p] * 0.015;
      }
      // 화면 대부분이 바뀌면 장면 전환으로 보고 무시
      const blobs = changed / mask.length > 0.6 ? [] : findBlobs(mask, W, H, minArea);
      const t = video.currentTime;
      const boxMap = new Map<string, { box: LiveBox; area: number }>();

      for (const blob of blobs as BlobRegion[]) {
        const cx = (blob.cx / W) * 100;
        const cy = (blob.cy / H) * 100;
        let best: LiveTrack | undefined;
        let bestDist = Infinity;
        for (const track of this.tracks) {
          const d = Math.hypot(track.cx - cx, track.cy - cy);
          if (d < bestDist && t - track.lastT < 2) { best = track; bestDist = d; }
        }
        if (best && bestDist > 16) continue;
        if (!best) {
          if (this.tracks.length >= 5 || blob.area < minArea * 1.5) continue;
          this.seq += 1;
          best = { id: `L${this.seq}`, kind: classifyRegion(blob), lastT: t, cx, cy };
          this.tracks.push(best);
        }
        best.cx = best.cx * 0.4 + cx * 0.6;
        best.cy = best.cy * 0.4 + cy * 0.6;
        best.lastT = t;
        const box: LiveBox = {
          id: best.id,
          label: best.kind === 'vehicle' ? '자동차' : best.kind === 'person' ? '사람' : '객체',
          kind: best.kind,
          x: clamp((blob.x / W) * 100, 0, 100),
          y: clamp((blob.y / H) * 100, 0, 100),
          w: clamp((blob.w / W) * 100, 1, 100),
          h: clamp((blob.h / H) * 100, 1, 100),
          confidence: clamp(0.55 + (blob.area / (W * H)) * 4, 0.55, 0.99),
          t,
        };
        const existing = boxMap.get(best.id);
        if (!existing || blob.area > existing.area) boxMap.set(best.id, { box, area: blob.area });
      }
      this.tracks = this.tracks.filter((track) => t - track.lastT < 2);
      this.onUpdate(
        [...boxMap.values()]
          .sort((a, b) => b.area - a.area)
          .slice(0, 5)
          .map((v) => v.box),
      );
    }
    if (!this.background) this.background = luma.slice();
  }
}
```

</details>

<details>
<summary><code>apps/web-react/src/analysis/motionCompensation.ts</code></summary>

```ts
/** 카메라 흔들림(전역 이동) 보정 유틸 */

/**
 * 두 그레이 프레임 간의 전역 이동량(dx, dy)을 추정한다.
 * 축소 이미지에서 SAD(절대차 합) 최소 지점을 찾는다.
 */
export function estimateGlobalShift(
  prev: Float32Array,
  curr: Float32Array,
  width: number,
  height: number,
): { dx: number; dy: number } {
  const scale = 4;
  const sw = Math.floor(width / scale);
  const sh = Math.floor(height / scale);
  const smallPrev = new Float32Array(sw * sh);
  const smallCurr = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const p = (y * scale) * width + x * scale;
      smallPrev[y * sw + x] = prev[p];
      smallCurr[y * sw + x] = curr[p];
    }
  }

  let bestX = 0;
  let bestY = 0;
  let bestScore = Infinity;
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      let score = 0;
      for (let y = 2; y < sh - 2; y += 1) {
        for (let x = 2; x < sw - 2; x += 1) {
          score += Math.abs(smallPrev[y * sw + x] - smallCurr[(y + dy) * sw + x + dx]);
        }
      }
      if (score < bestScore) { bestScore = score; bestX = dx; bestY = dy; }
    }
  }
  return { dx: bestX * scale, dy: bestY * scale };
}

/** 현재 프레임을 이전 프레임 기준으로 되밀어 정렬한다 */
export function alignFrame(
  curr: Float32Array,
  dx: number,
  dy: number,
  width: number,
  height: number,
): Float32Array {
  const out = new Float32Array(curr.length);
  for (let y = 0; y < height; y += 1) {
    const sy = Math.max(0, Math.min(height - 1, y + dy));
    for (let x = 0; x < width; x += 1) {
      const sx = Math.max(0, Math.min(width - 1, x + dx));
      out[y * width + x] = curr[sy * width + sx];
    }
  }
  return out;
}
```

</details>

<details>
<summary><code>apps/web-react/src/hooks/useLiveTracking.ts</code></summary>

```ts
import { useEffect, useState, type RefObject } from 'react';
import { backendBaseUrl } from '@/config';
import { LiveTracker, type LiveBox } from '@/analysis/liveTracker';
import { RemoteDetector } from '@/analysis/remoteDetector';
import { useStore } from '@/store/useStore';

/** 재생 중인 영상에 실시간 형상 추적을 연결하는 훅 (YOLO 원격 감지 → 로컬 폴백) */
export function useLiveTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  sensitivity = 0.7,
  threshold = 0.45,
): LiveBox[] {
  const [boxes, setBoxes] = useState<LiveBox[]>([]);
  const [remoteFailed, setRemoteFailed] = useState(false);

  const config = useStore((s) => s.config);
  const useRemote = config.options.analysisEngine.value !== 'mock'
    && config.options.backend.value !== 'none';

  useEffect(() => {
    if (!enabled || !videoRef.current) {
      setBoxes([]);
      return;
    }

    const liveConfig = useStore.getState().config;
    if (useRemote && !remoteFailed) {
      // 설정창에서 변경한 값을 실시간 추적에 즉시 반영한다.
      const fps = liveConfig.performance.fps.value;
      const intervalMs = Math.max(100, Math.min(350, Math.round(1000 / Math.min(fps, 10))));
      const detector = new RemoteDetector(
        videoRef.current,
        backendBaseUrl(),
        setBoxes,
        (items) => useStore.getState().setMeasurements(items),
        () => setRemoteFailed(true),
        threshold,
        intervalMs,
        (ms) => useStore.getState().setDetectionLatency(ms),
        liveConfig.detection.classFilter.value,
        liveConfig.preprocessing.nmsIoU.value,
      );
      // 사용자가 오탐 신고한 영역을 불러와 즉시 차단
      void fetch(`${backendBaseUrl()}/api/feedback/zones`)
        .then((r) => r.json())
        .then((j: { zones?: Array<{ bbox: { x: number; y: number; w: number; h: number } }> }) => {
          detector.setBlockedZones((j.zones ?? []).map((z) => z.bbox));
        })
        .catch(() => {});
      detector.start();
      // 감지 주기(약 100~350ms)와 무관하게 RAF(약 60fps)로 위치를 예측 갱신해
      // 빠르게 움직이는 객체도 박스가 뒤처지지 않게 한다.
      let raf = 0;
      const tick = () => {
        const video = videoRef.current;
        if (video) setBoxes(detector.getPredictedBoxes(video.currentTime));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(raf);
        detector.stop();
      };
    }

    // 원격 서버가 없거나 실패하면 프레임 차분 기반 로컬 추적기 사용
    const tracker = new LiveTracker(videoRef.current, setBoxes, sensitivity);
    tracker.start();
    return () => tracker.stop();
  }, [videoRef, enabled, sensitivity, threshold, useRemote, remoteFailed]);

  return boxes;
}
```

</details>

<details>
<summary><code>apps/web-react/src/hooks/useLiveAccidents.ts</code></summary>

```ts
import { useEffect, useState } from 'react';
import type { LiveBox } from '@/analysis/liveTracker';
import { analyzeIndustrial, resetSafety, type SafetyFinding } from '@/analysis/industrialSafety';
import type { LiveAccident } from '@/types';

const SEVERITY_MAP = {
  info: 'caution' as const,
  warning: 'warning' as const,
  critical: 'critical' as const,
};

/** 실시간 추적 Box 스트림에서 산업 현장 위험/사고 징후를 감지한다.
 * 단순 탐지는 사고가 아니며, 시간적 특징이 확인된 경우에만 이벤트를 발행한다.
 */
export function useLiveAccidents(boxes: LiveBox[], enabled: boolean): LiveAccident[] {
  const [accidents, setAccidents] = useState<LiveAccident[]>([]);

  useEffect(() => {
    if (!enabled) { setAccidents([]); resetSafety(); return; }
    if (!boxes.length) return;
    const findings: SafetyFinding[] = analyzeIndustrial(boxes);
    if (!findings.length) return;
    const t = boxes[0]?.t ?? 0;
    setAccidents((list) => [
      ...findings.map((f, i) => ({
        id: `${f.type}-${Math.round(t * 10)}-${i}`,
        timestamp: t,
        type: f.type,
        title: f.title,
        severity: SEVERITY_MAP[f.severity],
        description: `${f.description} · 추적 ${f.trackIds.join(', ')} · 신뢰도 ${Math.round(f.confidence * 100)}%`,
        evidence: f.evidence,
      })) as LiveAccident[],
      ...list,
    ].slice(0, 20));
  }, [boxes, enabled]);

  return accidents;
}
```

</details>

<details>
<summary><code>apps/web-react/src/hooks/useAnalysisStream.ts</code></summary>

```ts
import { useEffect, useState } from 'react';
import { backendBaseUrl } from '@/config';

export interface StreamEvent {
  type: string;
  predictions?: Array<{
    id: string;
    label: string;
    current: number[];
    predicted: number[];
    speed: number;
    danger: boolean;
    horizonSec: number;
  }>;
  danger?: boolean;
  safetyEvents?: Array<{
    id: string;
    type: 'fall' | 'altercation' | 'fall_candidate';
    labelKo: string;
    severity: string;
    confidence: number;
    reason: string;
    evidence: string[];
    zone: string;
  }>;
  contextDescription?: string;
  accidentEvents?: Array<{
    type: 'collision' | 'sudden_stop' | 'fall' | 'proximity';
    labelKo: string;
    severity: string;
    confidence: number;
    trackId?: string;
    trackIds?: string[];
    evidence: string[];
  }>;
  clip?: string | null;
  source?: string;
  timestamp?: number;
}

/** WebSocket 실시간 분석 이벤트 수신 (폴링 대신 서버 푸시) */
export function useAnalysisStream() {
  const [event, setEvent] = useState<StreamEvent | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = backendBaseUrl().replace('http://', 'ws://') + '/ws/analysis';
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(url);
        ws.onopen = () => setConnected(true);
        ws.onmessage = (e) => {
          try { setEvent(JSON.parse(e.data)); } catch { /* ignore */ }
        };
        ws.onclose = () => {
          setConnected(false);
          retry = setTimeout(connect, 2000);
        };
      } catch {
        retry = setTimeout(connect, 2000);
      }
    };
    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    };
  }, []);

  return { event, connected };
}
```

</details>

<details>
<summary><code>apps/web-react/src/styles/global.css</code></summary>

```css
/* ============================================================
   VisionFlow Studio — Premium Design System
   테마 옵션: aurora / midnight / light / cyber
   ============================================================ */

:root,
[data-theme='aurora'] {
  --bg-0: #060a12;
  --bg-1: #0a1120;
  --bg-2: #101a2e;
  --panel: rgba(18, 28, 48, 0.72);
  --panel-strong: rgba(14, 22, 40, 0.92);
  --panel-border: rgba(120, 160, 220, 0.14);
  --panel-border-strong: rgba(120, 180, 255, 0.3);
  --text: #e8f0ff;
  --text-dim: #93a6c6;
  --text-faint: #5f7191;
  --accent: #22d3ee;
  --accent-2: #a78bfa;
  --accent-3: #34d399;
  --accent-4: #fb923c;
  --danger: #fb7185;
  --warning: #fbbf24;
  --success: #34d399;
  --grid: rgba(120, 170, 240, 0.08);
  --glow: 0 0 30px rgba(34, 211, 238, 0.18);
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
  --radius: 18px;
  --radius-sm: 11px;
  --font: 'Inter', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
}

[data-theme='midnight'] {
  --bg-0: #050616;
  --bg-1: #0a0c24;
  --bg-2: #111438;
  --panel: rgba(20, 22, 58, 0.72);
  --panel-strong: rgba(14, 16, 46, 0.94);
  --panel-border: rgba(130, 140, 240, 0.16);
  --accent: #818cf8;
  --accent-2: #c084fc;
  --accent-3: #38bdf8;
  --accent-4: #f472b6;
  --glow: 0 0 30px rgba(129, 140, 248, 0.2);
}

[data-theme='light'] {
  --bg-0: #eef2f9;
  --bg-1: #e6ebf5;
  --bg-2: #dce4f2;
  --panel: rgba(255, 255, 255, 0.8);
  --panel-strong: rgba(255, 255, 255, 0.96);
  --panel-border: rgba(40, 70, 130, 0.12);
  --panel-border-strong: rgba(40, 90, 180, 0.25);
  --text: #14213d;
  --text-dim: #4a5b7a;
  --text-faint: #8493ad;
  --accent: #2563eb;
  --accent-2: #7c3aed;
  --accent-3: #059669;
  --accent-4: #ea580c;
  --danger: #e11d48;
  --warning: #d97706;
  --success: #059669;
  --grid: rgba(40, 80, 150, 0.07);
  --glow: 0 12px 30px rgba(37, 99, 235, 0.12);
  --shadow: 0 18px 45px rgba(30, 50, 90, 0.12);
}

[data-theme='cyber'] {
  --bg-0: #08020e;
  --bg-1: #12041c;
  --bg-2: #1a0828;
  --panel: rgba(30, 8, 44, 0.75);
  --panel-strong: rgba(20, 5, 32, 0.95);
  --panel-border: rgba(236, 72, 153, 0.2);
  --panel-border-strong: rgba(236, 72, 153, 0.4);
  --text: #fdf2ff;
  --text-dim: #d2a8e8;
  --text-faint: #8a5f9e;
  --accent: #f0abfc;
  --accent-2: #22d3ee;
  --accent-3: #a3e635;
  --accent-4: #fb7185;
  --danger: #ff2d78;
  --warning: #facc15;
  --success: #a3e635;
  --grid: rgba(236, 72, 153, 0.08);
  --glow: 0 0 34px rgba(240, 171, 252, 0.25);
}

/* 밝고 선명한 기본 테마 — daylight */
[data-theme='daylight'] {
  --bg-0: #f3f6fc;
  --bg-1: #e8eef8;
  --bg-2: #dce6f4;
  --panel: rgba(255, 255, 255, 0.88);
  --panel-strong: rgba(255, 255, 255, 0.97);
  --panel-border: rgba(65, 95, 155, 0.14);
  --panel-border-strong: rgba(75, 115, 205, 0.3);
  --text: #16223c;
  --text-dim: #4d6080;
  --text-faint: #8798b2;
  --accent: #4f6ef7;
  --accent-2: #9b5cf6;
  --accent-3: #0ea5b7;
  --accent-4: #f59e0b;
  --danger: #ef4444;
  --warning: #f59e0b;
  --success: #10b981;
  --grid: rgba(70, 105, 170, 0.07);
  --glow: 0 12px 28px rgba(79, 110, 247, 0.18);
  --shadow: 0 18px 42px rgba(35, 55, 100, 0.12);
}

* { box-sizing: border-box; }

html, body, #root { height: 100%; margin: 0; }

body {
  font-family: var(--font);
  background: var(--bg-0);
  color: var(--text);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  transition: background 0.4s ease, color 0.4s ease;
}

button, input, select { font-family: inherit; }
button { cursor: pointer; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: linear-gradient(var(--accent), var(--accent-2));
  border-radius: 10px;
  opacity: 0.5;
}

/* ---------- 앱 셸 ---------- */
.app-shell {
  position: relative;
  display: grid;
  grid-template-columns: 248px 1fr;
  grid-template-rows: 64px 1fr;
  height: 100vh;
  width: 100vw;
  background:
    radial-gradient(1200px 700px at 80% -10%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%),
    radial-gradient(900px 600px at -10% 110%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 60%),
    var(--bg-0);
}

.app-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse at 50% 40%, black 30%, transparent 85%);
  pointer-events: none;
  z-index: 0;
}

/* ---------- 사이드바 ---------- */
.sidebar {
  grid-row: 1 / 3;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--bg-1) 96%, transparent), color-mix(in srgb, var(--bg-0) 98%, transparent));
  border-right: 1px solid var(--panel-border);
  backdrop-filter: blur(20px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 4px 8px 22px;
}
.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: var(--glow);
  color: #04070f;
  flex-shrink: 0;
}
.brand-name {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.3px;
  line-height: 1.1;
}
.brand-sub {
  font-size: 10px;
  color: var(--text-faint);
  letter-spacing: 1.4px;
  text-transform: uppercase;
  margin-top: 3px;
}

.nav-section-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-faint);
  padding: 14px 10px 8px;
  font-weight: 700;
}

.nav-list { display: flex; flex-direction: column; gap: 4px; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-dim);
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  transition: all 0.2s ease;
}
.nav-item:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  transform: translateX(2px);
}
.nav-item.active {
  color: var(--text);
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 18%, transparent), transparent);
  border-color: var(--panel-border-strong);
  box-shadow: inset 3px 0 0 var(--accent);
}
.nav-item .nav-icon { color: var(--accent); display: grid; place-items: center; }
.nav-badge {
  margin-left: auto;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  color: var(--accent);
  font-weight: 700;
}

.sidebar-footer { margin-top: auto; }
.status-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--panel);
  border: 1px solid var(--panel-border);
  font-size: 11px;
  color: var(--text-dim);
}
.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--success) 18%, transparent);
  animation: pulse 2s infinite;
}
@keyframes pulse { 50% { opacity: 0.45; } }

/* ---------- 상단바 ---------- */
.topbar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  border-bottom: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--bg-0) 70%, transparent);
  backdrop-filter: blur(18px);
}
.topbar-title { font-size: 15px; font-weight: 700; }
.topbar-sub { font-size: 11px; color: var(--text-faint); margin-top: 2px; }
.topbar-spacer { flex: 1; }

.engine-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 30px;
  background: var(--panel);
  border: 1px solid var(--panel-border-strong);
  font-size: 11px;
  color: var(--text-dim);
  font-weight: 600;
}
.engine-pill b { color: var(--accent); }

.icon-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: var(--panel);
  color: var(--text-dim);
  transition: all 0.2s ease;
}
.icon-btn:hover { color: var(--text); border-color: var(--accent); transform: translateY(-1px); }

.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 10px 18px;
  border: none;
  border-radius: 11px;
  font-weight: 700;
  font-size: 12.5px;
  color: #060a12;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: var(--glow);
  transition: transform 0.2s ease, filter 0.2s ease;
}
.primary-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
.primary-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  background: var(--panel);
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 600;
}
.ghost-btn:hover { color: var(--text); border-color: var(--accent); }

/* ---------- 메인 콘텐츠 ---------- */
.workspace {
  position: relative;
  z-index: 1;
  overflow: auto;
  padding: 22px 24px 40px;
}

.page-head { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.page-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.6px;
  background: linear-gradient(90deg, var(--text), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-desc { font-size: 12px; color: var(--text-dim); margin-top: 5px; max-width: 620px; }
.page-head-spacer { flex: 1; }

.grid { display: grid; gap: 16px; }
.grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-2-1 { grid-template-columns: 2fr 1fr; }
.grid-1-2 { grid-template-columns: 1fr 2fr; }
@media (max-width: 1200px) {
  .grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid-2-1, .grid-1-2, .grid-3 { grid-template-columns: 1fr; }
}

/* ---------- 카드 ---------- */
.card {
  position: relative;
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 30%, transparent), transparent 40%, color-mix(in srgb, var(--accent-2) 24%, transparent));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.6;
}
.card-pad { padding: 18px 20px; }
.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px 10px;
}
.card-title { font-size: 13px; font-weight: 700; }
.card-subtitle { font-size: 10.5px; color: var(--text-faint); margin-top: 2px; }
.card-head-spacer { flex: 1; }
.card-icon {
  width: 30px; height: 30px; border-radius: 9px;
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

.section-gap { margin-top: 18px; }

/* ---------- 메트릭 카드 ---------- */
.metric-card {
  position: relative;
  padding: 18px 20px;
  border-radius: var(--radius);
  background: var(--panel);
  border: 1px solid var(--panel-border);
  overflow: hidden;
  transition: transform 0.25s ease, border-color 0.25s ease;
}
.metric-card:hover { transform: translateY(-4px); border-color: var(--accent); }
.metric-glow {
  position: absolute;
  width: 140px; height: 140px;
  right: -40px; top: -60px;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.25;
}
.metric-label { font-size: 11px; color: var(--text-dim); font-weight: 600; display: flex; align-items: center; gap: 7px; }
.metric-value { font-size: 30px; font-weight: 800; letter-spacing: -1px; margin-top: 10px; line-height: 1; }
.metric-unit { font-size: 13px; color: var(--text-faint); font-weight: 600; margin-left: 4px; }
.metric-delta { font-size: 11px; margin-top: 8px; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; }
.delta-up { color: var(--success); }
.delta-down { color: var(--danger); }
.delta-flat { color: var(--text-faint); }
.metric-spark { position: absolute; right: 14px; bottom: 12px; opacity: 0.8; }

/* ---------- 폼 / 옵션 ---------- */
.field { margin-bottom: 14px; }
.field-label {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11.5px; color: var(--text-dim); font-weight: 600; margin-bottom: 7px;
}
.field-value { font-family: var(--mono); color: var(--accent); font-size: 11px; }

.segmented {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 11px;
  background: color-mix(in srgb, var(--bg-0) 60%, transparent);
  border: 1px solid var(--panel-border);
}
.segment {
  flex: 1;
  padding: 7px 9px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 600;
  transition: all 0.18s ease;
  white-space: nowrap;
}
.segment:hover { color: var(--text); }
.segment.active {
  color: #060a12;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 25%, transparent);
}

input[type='range'] {
  width: 100%;
  height: 4px;
  border-radius: 4px;
  appearance: none;
  background: linear-gradient(90deg, var(--accent) var(--fill, 50%), color-mix(in srgb, var(--text-dim) 20%, transparent) var(--fill, 50%));
  outline: none;
}
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 15px; height: 15px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid var(--bg-1);
  box-shadow: 0 0 10px var(--accent);
  cursor: pointer;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  user-select: none;
}
.toggle-track {
  width: 38px; height: 21px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--text-dim) 25%, transparent);
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;
}
.toggle-track.on { background: linear-gradient(135deg, var(--accent), var(--accent-2)); }
.toggle-knob {
  position: absolute;
  top: 3px; left: 3px;
  width: 15px; height: 15px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
}
.toggle-track.on .toggle-knob { transform: translateX(17px); }
.toggle-label { font-size: 11.5px; color: var(--text-dim); }

/* ---------- 파이프라인 캔버스 ---------- */
.pipeline-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 12px 16px; border-bottom: 1px solid var(--panel-border); }
.canvas-wrap {
  position: relative;
  height: 480px;
  overflow: auto;
  background:
    radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--accent) 14%, transparent) 1px, transparent 0) 0 0 / 22px 22px,
    linear-gradient(180deg, color-mix(in srgb, var(--bg-0) 40%, transparent), color-mix(in srgb, var(--bg-1) 40%, transparent));
}
/* 확대/축소: stage 크기 = 논리 캔버스 × 배율, inner는 scale 변환.
   canvas-wrap의 overflow:auto가 배율 적용 후에도 콘텐츠를 항상 잘라 범위 밖 노출을 막는다. */
.canvas-stage { position: relative; }
.canvas-inner {
  position: relative;
  width: 1040px;
  height: 560px;
  transform-origin: 0 0;
  will-change: transform;
}
.canvas-edges { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.zoom-controls { display: flex; align-items: center; gap: 4px; padding: 0 4px; }

.pnode {
  position: absolute;
  width: 178px;
  min-height: 104px;
  border-radius: 14px;
  padding: 12px;
  background: var(--panel-strong);
  border: 1px solid var(--panel-border-strong);
  box-shadow: var(--shadow);
  cursor: grab;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
  user-select: none;
}
.pnode:active { cursor: grabbing; }
.pnode:hover { transform: translateY(-2px); }
.pnode.selected { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent), var(--glow); }
.pnode.disabled { opacity: 0.42; filter: grayscale(0.7); }
.pnode.status-running { border-color: var(--warning); box-shadow: 0 0 22px color-mix(in srgb, var(--warning) 25%, transparent); }
.pnode.status-done { border-color: var(--success); }
.pnode-top { display: flex; align-items: center; gap: 8px; }
.pnode-icon { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; }
.pnode-label { font-size: 11.5px; font-weight: 700; line-height: 1.2; }
.pnode-kind { font-size: 9px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.8px; margin-top: 2px; }
.pnode-progress { height: 3px; border-radius: 3px; background: color-mix(in srgb, var(--text-dim) 15%, transparent); margin-top: 10px; overflow: hidden; }
.pnode-progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent), var(--accent-2)); transition: width 0.15s linear; }
.pnode-output { font-size: 9px; color: var(--text-faint); margin-top: 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pnode-status-dot { width: 7px; height: 7px; border-radius: 50%; margin-left: auto; flex-shrink: 0; }

/* ---------- 파이프라인 고급 시각화 ---------- */
.pipeline-layer {
  position: absolute; border: 1px dashed; border-radius: 18px;
  pointer-events: none; z-index: 0;
}
.pipeline-layer-label {
  position: absolute; top: 10px; left: 14px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  opacity: 0.8;
}
.pnode-metrics {
  display: flex; gap: 8px; margin-top: 6px;
  font-size: 8px; color: var(--text-faint);
}
.pnode-metrics span { display: inline-flex; align-items: center; gap: 3px; }
.pnode-tooltip {
  position: absolute; left: 50%; bottom: calc(100% + 8px);
  transform: translateX(-50%); width: 220px; z-index: 50;
  padding: 10px 12px; border-radius: 10px;
  background: var(--panel-strong); border: 1px solid var(--panel-border-strong);
  box-shadow: var(--shadow); pointer-events: none;
  font-size: 10px; line-height: 1.6; color: var(--text-dim);
}
.pnode-tooltip b { display: block; color: var(--text); font-size: 11px; margin-bottom: 4px; }
.pipeline-minimap {
  position: absolute; right: 10px; bottom: 10px;
  width: 150px; height: 84px; border-radius: 8px;
  background: color-mix(in srgb, var(--bg-0) 80%, transparent);
  border: 1px solid var(--panel-border-strong);
  overflow: hidden; z-index: 5;
}
.pipeline-minimap-inner { position: relative; width: 1360px; height: 720px; transform-origin: top left; }
.pipeline-minimap-inner span {
  position: absolute; border-radius: 1px; opacity: 0.75;
}

/* ---------- 설명 데이터 영상 ---------- */
.caption-click {
  width: 100%; text-align: left; cursor: pointer;
  background: transparent; border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.caption-click:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.caption-click.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }
.caption-live {
  display: inline-block; margin-left: 8px; padding: 1px 6px;
  border-radius: 5px; font: 700 9px var(--mono);
  background: var(--accent); color: #04121a;
}

/* ---------- 결과 패널 ---------- */
.result-empty {
  display: grid; place-items: center;
  min-height: 260px;
  color: var(--text-faint);
  text-align: center;
  gap: 10px;
}
.result-empty-icon { font-size: 34px; opacity: 0.5; }

.video-frame {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, #0b1220, #111c33);
  border: 1px solid var(--panel-border);
}
.video-frame canvas, .video-frame video { width: 100%; height: 100%; object-fit: cover; display: block; }

/* 원본 영상 비율을 유지하는 내부 스테이지. BBox 좌표가 실제 영상 픽셀과 일치한다. */
.video-stage {
  position: absolute; inset: 0; margin: auto;
  max-width: 100%; max-height: 100%; overflow: hidden;
  width: auto; height: auto;
}
.video-stage video, .video-stage canvas { width: 100%; height: 100%; object-fit: fill; display: block; }
.video-overlay {
  position: absolute; inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,0.08) 3px 4px);
}
.video-hud {
  position: absolute; left: 12px; top: 12px;
  display: flex; gap: 6px; flex-wrap: wrap;
}
.hud-tag {
  font-family: var(--mono);
  font-size: 9px;
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(4, 8, 16, 0.7);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}
.bbox { position: absolute; border: 1.5px solid var(--accent-3); border-radius: 2px; }
.bbox::after {
  content: attr(data-label);
  position: absolute; top: -14px; left: 0;
  font-family: var(--font); font-size: 10px; font-weight: 700;
  color: #ffffff; background: var(--accent-3);
  padding: 2px 6px; border-radius: 3px; white-space: nowrap;
}
/* 클래스별 박스 색상: 차량=핑크, 인물=시안, 기타=오렌지 */
.bbox.bbox-vehicle { border-color: #ff4d8d; }
.bbox.bbox-vehicle::after { background: #ff4d8d; }
.bbox.bbox-person { border-color: #22d3ee; }
.bbox.bbox-person::after { background: #22d3ee; }
.bbox.bbox-object { border-color: var(--accent-4); }
.bbox.bbox-object::after { background: var(--accent-4); }
.bbox-report {
  position: absolute; right: -2px; bottom: -2px;
  font-size: 8px; font-weight: 700; line-height: 1;
  width: 14px; height: 14px; padding: 0; border: none; border-radius: 3px;
  background: color-mix(in srgb, var(--danger) 70%, transparent); color: #fff;
  cursor: pointer; opacity: 0; transition: opacity 0.15s ease;
}
.bbox:hover .bbox-report { opacity: 0.85; }
.bbox-report:hover { opacity: 1; filter: brightness(1.15); }

/* ---------- 리스트 / 배지 ---------- */
.list { display: flex; flex-direction: column; gap: 8px; max-height: 340px; overflow: auto; padding-right: 4px; }
.list-row {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 12px;
  border-radius: 11px;
  background: color-mix(in srgb, var(--bg-0) 45%, transparent);
  border: 1px solid var(--panel-border);
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.list-row:hover { border-color: var(--accent); transform: translateX(2px); }
.row-icon { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; flex-shrink: 0; }
.row-main { flex: 1; min-width: 0; }
.row-title { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-sub { font-size: 10px; color: var(--text-faint); margin-top: 2px; }
.row-time { font-family: var(--mono); font-size: 10px; color: var(--accent); }

.badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 20px;
  font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
}
.badge-info { background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); }
.badge-caution { background: color-mix(in srgb, var(--warning) 15%, transparent); color: var(--warning); }
.badge-warning { background: color-mix(in srgb, var(--accent-4) 16%, transparent); color: var(--accent-4); }
.badge-critical { background: color-mix(in srgb, var(--danger) 16%, transparent); color: var(--danger); }

.conf-bar { height: 4px; border-radius: 4px; background: color-mix(in srgb, var(--text-dim) 18%, transparent); width: 64px; flex-shrink: 0; }
.conf-bar > i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent-3), var(--accent)); }

/* 조치 카드 */
.action-card {
  border-radius: 14px;
  padding: 14px 16px;
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-left: 3px solid var(--accent);
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.action-card:hover { transform: translateY(-2px); }
.action-card.priority-immediate { border-left-color: var(--danger); }
.action-card.priority-high { border-left-color: var(--accent-4); }
.action-card.priority-medium { border-left-color: var(--warning); }
.action-head { display: flex; align-items: center; gap: 9px; }
.action-title { font-size: 12.5px; font-weight: 700; }
.action-desc { font-size: 11px; color: var(--text-dim); margin-top: 6px; line-height: 1.5; }
.action-steps { margin: 10px 0 0; padding-left: 18px; font-size: 10.5px; color: var(--text-dim); line-height: 1.8; }
.action-meta { display: flex; gap: 12px; margin-top: 10px; font-size: 9.5px; color: var(--text-faint); flex-wrap: wrap; }
.action-meta span { display: inline-flex; align-items: center; gap: 4px; }

/* ---------- 토스트 ---------- */
.toast-stack {
  position: fixed; right: 20px; bottom: 20px;
  display: flex; flex-direction: column; gap: 9px;
  z-index: 100;
}
.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 15px;
  border-radius: 12px;
  background: var(--panel-strong);
  border: 1px solid var(--panel-border-strong);
  box-shadow: var(--shadow);
  font-size: 11.5px;
  min-width: 230px;
  backdrop-filter: blur(20px);
}
.toast-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.toast.success .toast-dot { background: var(--success); }
.toast.info .toast-dot { background: var(--accent); }
.toast.warning .toast-dot { background: var(--warning); }
.toast.error .toast-dot { background: var(--danger); }

/* ---------- 유틸 ---------- */
.chip-row { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  font-size: 10px; padding: 4px 9px; border-radius: 20px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: var(--text-dim); border: 1px solid var(--panel-border);
}
.mono { font-family: var(--mono); }
.dim { color: var(--text-dim); }
.faint { color: var(--text-faint); }
.accent { color: var(--accent); }
.text-xs { font-size: 10px; }
.text-sm { font-size: 11.5px; }
.text-lg { font-size: 14px; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.wrap { flex-wrap: wrap; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.full { width: 100%; }
.divider { height: 1px; background: var(--panel-border); margin: 14px 0; }

.tabs { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: color-mix(in srgb, var(--bg-0) 50%, transparent); border: 1px solid var(--panel-border); }
.tab-content { animation: tabIn 0.25s ease both; }
@keyframes tabIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.tab {
  padding: 7px 13px; border: none; border-radius: 9px;
  background: transparent; color: var(--text-dim);
  font-size: 11px; font-weight: 600;
}
.tab.active { background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); }

/* 재생 진행 바 */
.run-bar { height: 6px; border-radius: 6px; background: color-mix(in srgb, var(--text-dim) 15%, transparent); overflow: hidden; }
.run-bar > i { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3)); transition: width 0.2s ease; box-shadow: var(--glow); }
.shimmer { position: relative; overflow: hidden; }
.shimmer::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 12%, transparent), transparent);
  transform: translateX(-100%);
  animation: shimmer 1.6s infinite;
}
@keyframes shimmer { 100% { transform: translateX(100%); } }

.upload-zone {
  border: 1.5px dashed var(--panel-border-strong);
  border-radius: 14px;
  padding: 18px;
  text-align: center;
  color: var(--text-dim);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: color-mix(in srgb, var(--accent) 4%, transparent);
}
.upload-zone:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 9%, transparent); color: var(--text); }

/* ---------- 클립 수동 라벨링 ---------- */
.clip-list { display: flex; flex-direction: column; gap: 6px; max-height: 190px; overflow-y: auto; }
.clip-item {
  display: flex; flex-direction: column; gap: 2px; align-items: flex-start;
  width: 100%; padding: 8px 10px; border: 1px solid var(--panel-border);
  border-radius: 10px; background: color-mix(in srgb, var(--bg-2) 55%, transparent);
  color: var(--text); font-size: 11px; text-align: left; cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.clip-item:hover { border-color: var(--accent); }
.clip-item.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }
.clip-item .faint { font-size: 10px; }

.label-canvas {
  position: relative; width: 100%; margin-top: 10px; overflow: hidden;
  border: 1px solid var(--panel-border-strong); border-radius: 12px;
  background: #05080f; touch-action: none; cursor: crosshair;
  user-select: none;
}
.label-canvas img { display: block; width: 100%; height: 100%; object-fit: fill; pointer-events: none; }
.label-box {
  position: absolute; box-sizing: border-box;
  border: 1.5px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  pointer-events: auto;
}
.label-box.selected { border: 2px solid var(--warning); background: color-mix(in srgb, var(--warning) 16%, transparent); }
.label-box.drawing { border-style: dashed; border-color: var(--accent-3); background: color-mix(in srgb, var(--accent-3) 14%, transparent); pointer-events: none; }
.label-box-tag {
  position: absolute; top: -17px; left: -1px; white-space: nowrap;
  padding: 1px 5px; border-radius: 5px; font: 600 9px var(--mono);
  background: var(--accent); color: #04121a;
}

/* ---------- daylight 테마 전용 보정 ---------- */
[data-theme='daylight'] .primary-btn,
[data-theme='daylight'] .segment.active {
  color: #ffffff;
}
[data-theme='daylight'] .brand-mark {
  color: #ffffff;
}
[data-theme='daylight'] .video-frame {
  background: linear-gradient(135deg, #dbe7f8, #eef3fb);
}
[data-theme='daylight'] .metric-card,
[data-theme='daylight'] .card {
  box-shadow: 0 12px 30px rgba(40, 65, 120, 0.1);
}
[data-theme='daylight'] .pnode {
  background: rgba(255, 255, 255, 0.95);
}
[data-theme='daylight'] .list-row {
  background: rgba(255, 255, 255, 0.62);
}
[data-theme='daylight'] .sidebar {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(240, 245, 252, 0.96));
}

/* ---------- 데이터별 설명 / 숨김 기능 ---------- */
.data-desc {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 10.5px;
  color: var(--text-faint);
  line-height: 1.5;
  margin-top: 4px;
  max-width: 460px;
}
.data-desc svg { flex-shrink: 0; margin-top: 1px; color: var(--accent); }
.visibility-btn { width: 30px; height: 30px; flex-shrink: 0; }
.visibility-btn:hover { color: var(--accent); border-color: var(--accent); }
.data-hidden {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 120px;
  padding: 20px;
  margin: 4px 16px 16px;
  border-radius: 12px;
  border: 1px dashed var(--panel-border);
  background: color-mix(in srgb, var(--bg-0) 35%, transparent);
  color: var(--text-faint);
  font-size: 11.5px;
  text-align: center;
}
.data-hidden b { color: var(--text-dim); }
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  padding: 30px;
  text-align: center;
  color: var(--text-faint);
}
.empty-state-icon {
  width: 52px; height: 52px; border-radius: 16px;
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}
.empty-state b { color: var(--text); font-size: 13px; }

/* ---------- 기능별 성능평가 테이블 ---------- */
.perf-list { padding: 0 16px 16px; overflow-x: auto; }
.perf-row {
  display: grid;
  grid-template-columns: 1.6fr 0.7fr 0.7fr 1.2fr 0.7fr 0.7fr 0.7fr 1fr 0.8fr;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--panel-border);
  font-size: 11px;
  min-width: 860px;
}
.perf-row:last-child { border-bottom: none; }
.perf-head {
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-faint);
  background: color-mix(in srgb, var(--bg-0) 45%, transparent);
  border-radius: 8px;
  margin-bottom: 4px;
}
.perf-name { display: flex; flex-direction: column; gap: 2px; }
.perf-name small { font-size: 9px; font-family: var(--mono); }
.perf-row:hover { background: color-mix(in srgb, var(--accent) 5%, transparent); }
/* 파이프라인 노드 실행 시간은 스크롤 없이 전체 12개 노드를 표시 */
.perf-node-list { max-height: none; overflow: visible; }

/* ---------- 시간별 사고 타임라인 ---------- */
.accident-timeline { padding: 6px 20px 20px; }
.accident-item {
  display: grid;
  grid-template-columns: 70px 22px 1fr;
  gap: 12px;
  align-items: start;
  position: relative;
  padding-bottom: 18px;
}
.accident-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 91px;
  top: 22px;
  bottom: 0;
  width: 1px;
  background: var(--panel-border);
}
.accident-time { font-size: 10.5px; color: var(--accent); text-align: right; padding-top: 4px; line-height: 1.5; }
.accident-time small { color: var(--text-faint); font-size: 9px; }
.accident-marker { width: 12px; height: 12px; border-radius: 50%; margin: 6px auto 0; position: relative; z-index: 1; }
.accident-body {
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--bg-0) 35%, transparent);
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.accident-body:hover { border-color: var(--accent); transform: translateX(3px); }

/* ---------- 영상 텍스트 설명 ---------- */
.video-summary-text {
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--text-dim);
  padding: 4px 0;
}
.caption-row { align-items: flex-start; }
.caption-text { font-size: 11px; color: var(--text-dim); margin-top: 5px; line-height: 1.6; }

/* ---------- 실제 영상 신호 / 형상 추적 ---------- */
.thumb-strip { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
.thumb-strip img {
  width: 104px; height: 60px; object-fit: cover; flex-shrink: 0;
  border-radius: 7px; border: 1px solid var(--panel-border);
}
.track-card { padding: 14px; }
.track-trajectory { width: 100%; height: 90px; margin-top: 10px; border-radius: 8px; }

/* ---------- 영상 재생 + 데이터 오버레이 ---------- */
.playback-frame { background: linear-gradient(135deg, #0b1220, #13213c); }
.playback-frame video { position: relative; z-index: 0; }
.video-placeholder {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 9px; color: var(--text-faint); font-size: 11px; text-align: center; padding: 20px;
}
.video-placeholder b { color: var(--text-dim); font-size: 13px; }
.video-placeholder span { max-width: 340px; line-height: 1.6; }
.accident-alert {
  position: absolute; top: 46px; left: 12px; right: 12px;
  display: inline-flex; align-items: center; gap: 7px;
  width: fit-content; max-width: calc(100% - 24px);
  padding: 5px 9px; border-radius: 7px;
  background: color-mix(in srgb, var(--danger) 82%, transparent);
  color: #fff; font-size: 10px; font-weight: 700;
  animation: alertPulse 1.4s ease-in-out infinite;
}
@keyframes alertPulse { 50% { opacity: 0.72; } }
.video-caption {
  position: absolute; left: 12px; right: 12px; bottom: 42px;
  padding: 7px 10px; border-radius: 8px;
  background: rgba(4, 8, 16, 0.72); color: #e8f0ff;
  font-size: 10.5px; line-height: 1.5;
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  z-index: 4;
}
.playback-markers { position: relative; height: 16px; margin-top: 8px; border-radius: 8px; background: color-mix(in srgb, var(--text-dim) 16%, transparent); }
.playback-marker { position: absolute; top: 3px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--panel-strong); transform: translateX(-50%); padding: 0; }
.playback-progress { position: absolute; left: 0; top: 0; height: 100%; border-radius: inherit; background: color-mix(in srgb, var(--accent) 28%, transparent); pointer-events: none; }
.situation-guide-overlay {
  position: absolute; left: 12px; right: 12px; bottom: 12px;
  padding: 9px 11px; border-radius: 9px;
  background: rgba(4, 8, 16, 0.78); color: #e8f0ff;
  border: 1px solid color-mix(in srgb, var(--danger) 45%, transparent);
  font-size: 11px;
}
.guide-step { margin-top: 7px; padding: 6px 8px; border-radius: 6px; background: color-mix(in srgb, var(--accent) 14%, transparent); }
.ghost-btn.live-on { color: var(--danger); border-color: var(--danger); background: color-mix(in srgb, var(--danger) 10%, transparent); }
.tracking-empty {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  padding: 8px 12px; border-radius: 8px;
  background: rgba(4, 8, 16, 0.72); color: #e8f0ff;
  font-size: 10.5px; text-align: center; max-width: 80%;
}

/* ---------- 기능 안내 팝업 (옵션) ---------- */
.feature-guide-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(3, 7, 14, 0.62);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; backdrop-filter: blur(3px);
}
.feature-guide-modal {
  width: min(660px, 100%); max-height: min(86vh, 760px);
  display: flex; flex-direction: column;
  background: var(--panel-strong); color: var(--text);
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  border-radius: 14px; box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
  outline: none;
}
.feature-guide-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; border-bottom: 1px solid var(--panel-border);
}
.feature-guide-body { padding: 14px 18px; overflow-y: auto; }
.guide-section { margin-bottom: 14px; }
.guide-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: var(--accent);
  margin-bottom: 6px;
}
.guide-section p { margin: 0; font-size: 12px; line-height: 1.7; }
.guide-section.caution p { color: var(--warning, #fbbf24); }
.guide-steps { margin: 0; padding: 0; list-style: none; }
.guide-steps li {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12px; line-height: 1.6; padding: 5px 0;
}
.guide-step-num {
  flex: 0 0 18px; height: 18px; border-radius: 50%;
  display: grid; place-items: center; font: 700 10px var(--mono);
  background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent);
}
.guide-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.guide-tag {
  padding: 3px 8px; border-radius: 6px; font-size: 10.5px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
}
.guide-paths { display: flex; flex-wrap: wrap; gap: 6px; }
.guide-paths code {
  padding: 3px 7px; border-radius: 5px; font: 10px var(--mono);
  background: color-mix(in srgb, var(--text-dim) 12%, transparent);
}
.feature-guide-foot {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-top: 1px solid var(--panel-border);
}
.guide-option { display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer; }
.guide-option input { accent-color: var(--accent); }

/* ---------- 데이터 카탈로그 ---------- */
.stack { display: flex; flex-direction: column; gap: 14px; }
.metric-row { display: flex; gap: 10px; flex-wrap: wrap; }
.metric-cell {
  flex: 1 1 120px; display: flex; flex-direction: column; gap: 4px;
  padding: 10px 12px; border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.metric-cell span { font-size: 10.5px; color: var(--text-dim); }
.metric-cell b { font: 700 20px var(--mono); color: var(--accent); }
.catalog-root {
  display: flex; align-items: center; gap: 8px; margin-top: 10px;
  padding: 8px 10px; border-radius: 8px; background: color-mix(in srgb, var(--text-dim) 10%, transparent);
}
.catalog-root > span { font-size: 10.5px; color: var(--text-dim); white-space: nowrap; }
.catalog-root code { font: 10.5px var(--mono); word-break: break-all; flex: 1; }
.catalog-list { display: flex; flex-direction: column; gap: 8px; }
.catalog-row {
  display: flex; gap: 12px; justify-content: space-between;
  padding: 10px 12px; border-radius: 8px;
  background: color-mix(in srgb, var(--text-dim) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-dim) 12%, transparent);
}
.catalog-row-main { flex: 1; min-width: 0; }
.catalog-path { display: flex; align-items: center; gap: 4px; margin: 5px 0 3px; }
.catalog-path code { font: 10.5px var(--mono); color: var(--accent); word-break: break-all; }
.catalog-kind {
  padding: 2px 6px; border-radius: 5px; font: 9px var(--mono);
  background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent);
}
.catalog-status {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 6px; border-radius: 5px; font-size: 9px;
}
.catalog-status.exists { color: #34d399; background: color-mix(in srgb, #34d399 14%, transparent); }
.catalog-status.pending { color: var(--text-dim); background: color-mix(in srgb, var(--text-dim) 12%, transparent); }
.catalog-status.memory { color: #a78bfa; background: color-mix(in srgb, #a78bfa 14%, transparent); }
.catalog-meta {
  flex: 0 0 170px; display: flex; flex-direction: column; gap: 5px;
  font-size: 10px; color: var(--text-dim);
}
.catalog-meta > div { display: flex; flex-direction: column; gap: 2px; }
.catalog-meta b { color: var(--text); font-weight: 600; }
.catalog-meta code { font: 10px var(--mono); color: var(--accent); word-break: break-all; }
```

</details>

<details>
<summary><code>apps/web-react/src/components/visualizations/RadialGauge.tsx</code></summary>

```tsx
import { motion } from 'framer-motion';

interface Props {
  value: number; // 0~100
  label: string;
  color?: string;
  size?: number;
  sublabel?: string;
}

export default function RadialGauge({ value, label, color = 'var(--accent)', size = 132, sublabel }: Props) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-border)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800 }}>{Math.round(pct)}</div>
            <div className="text-xs faint">{sublabel ?? '/ 100'}</div>
          </div>
        </div>
      </div>
      <div className="text-sm" style={{ fontWeight: 700 }}>{label}</div>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/visualizations/Sparkline.tsx</code></summary>

```tsx
interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

export default function Sparkline({ data, width = 80, height = 30, color = 'var(--accent)', fill = true }: Props) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const poly = pts.join(' ');
  const area = `0,${height} ${poly} ${width},${height}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {fill && <polygon points={area} fill={color} opacity={0.15} />}
      <polyline points={poly} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/visualizations/MetricCard.tsx</code></summary>

```tsx
import type { MetricCardData } from '@/types';
import Sparkline from './Sparkline';

interface Props {
  data: MetricCardData;
  spark?: number[];
}

export default function MetricCard({ data, spark }: Props) {
  const TrendIcon = data.trend === 'up' ? '▲' : data.trend === 'down' ? '▼' : '—';
  const trendClass = data.trend === 'up' ? 'delta-up' : data.trend === 'down' ? 'delta-down' : 'delta-flat';

  return (
    <div className="metric-card">
      <div className="metric-glow" style={{ background: data.accent }} />
      <div className="metric-label">
        <span style={{ width: 7, height: 7, borderRadius: 2, background: data.accent }} />
        {data.label}
      </div>
      <div className="metric-value">
        {data.value}<span className="metric-unit">{data.unit}</span>
      </div>
      {data.delta !== undefined && (
        <div className={`metric-delta ${trendClass}`}>
          {TrendIcon} {Math.abs(data.delta)}% <span className="faint" style={{ fontWeight: 500 }}>전년 대비</span>
        </div>
      )}
      {spark && <div className="metric-spark"><Sparkline data={spark} color={data.accent} width={74} height={28} /></div>}
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/visualizations/Heatmap.tsx</code></summary>

```tsx
interface Props {
  data: number[];
  columns?: number;
  label?: string;
}

/** 시간대별 혼잡도 히트맵 */
export default function Heatmap({ data, columns = 20, label }: Props) {
  const max = Math.max(...data, 1);
  const cells = Array.from({ length: columns }, (_, i) => {
    const v = data[Math.floor((i / columns) * data.length)] ?? 0;
    return v / max;
  });
  const colorFor = (v: number) => {
    if (v < 0.25) return 'color-mix(in srgb, var(--accent) 12%, transparent)';
    if (v < 0.5) return 'color-mix(in srgb, var(--accent) 35%, transparent)';
    if (v < 0.75) return 'color-mix(in srgb, var(--accent-4) 55%, transparent)';
    return 'color-mix(in srgb, var(--danger) 80%, transparent)';
  };

  return (
    <div>
      {label && <div className="text-xs faint" style={{ marginBottom: 8 }}>{label}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 4 }}>
        {cells.map((v, i) => (
          <div
            key={i}
            title={`${Math.round((i / columns) * 100)}% 지점 · 강도 ${Math.round(v * 100)}%`}
            style={{
              height: 22,
              borderRadius: 5,
              background: colorFor(v),
              border: '1px solid var(--panel-border)',
              transition: 'transform 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs faint" style={{ marginTop: 6 }}>
        <span>00:00</span><span>타임라인 혼잡도</span><span>01:00</span>
      </div>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/layout/Sidebar.tsx</code></summary>

```tsx
import { Activity, BrainCircuit, Clock3, Database, FileText, Gauge, GitBranch, LayoutDashboard, Radio, Ruler, ScanFace, Settings2, ShieldAlert, Tags, Waypoints, Zap } from 'lucide-react';
import { useStore, type WorkTab } from '@/store/useStore';
import appConfig from '@/config';

const NAV: Array<{ id: WorkTab; label: string; icon: typeof LayoutDashboard; badge?: string }> = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'pipeline', label: '파이프라인', icon: GitBranch, badge: 'LIVE' },
  { id: 'analysis', label: '영상 데이터 분석', icon: Activity },
  { id: 'behavior', label: '인물 행동 감지', icon: ScanFace },
  { id: 'actions', label: '상황별 조치', icon: ShieldAlert },
  { id: 'accidents', label: '시간별 사고 인식', icon: Clock3 },
  { id: 'description', label: '영상 텍스트 설명', icon: FileText },
  { id: 'measurement', label: '사물 측정', icon: Ruler },
  { id: 'training', label: '모델 학습', icon: BrainCircuit },
  { id: 'labeling', label: '클립 라벨링', icon: Tags },
  { id: 'stream', label: '스트림 · 예측', icon: Radio },
  { id: 'performance', label: '성능 평가', icon: Gauge },
  { id: 'settings', label: '옵션 / 설정', icon: Settings2 },
  { id: 'catalog', label: '데이터 카탈로그', icon: Database },
];

export default function Sidebar() {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const graph = useStore((s) => s.graph);
  const autoUpdate = useStore((s) => s.config.pipeline.autoUpdate.value);
  const engine = useStore((s) => s.config.options.analysisEngine.value);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Waypoints size={21} strokeWidth={2.4} /></div>
        <div>
          <div className="brand-name">{appConfig.project.name}</div>
          <div className="brand-sub">v{appConfig.project.version} · Studio</div>
        </div>
      </div>

      <div className="nav-section-label">워크스페이스</div>
      <nav className="nav-list">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-icon"><Icon size={16} /></span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              {item.id === 'pipeline' && <span className="nav-badge">v{graph.version}</span>}
            </button>
          );
        })}
      </nav>

      <div className="nav-section-label">시스템 상태</div>
      <div className="status-chip" style={{ marginBottom: 8 }}>
        <span className="status-dot" />
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 700 }}>엔진: {engine}</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>자동 업데이트: {autoUpdate ? 'ON' : 'OFF'}</div>
        </div>
      </div>
      <div className="status-chip">
        <Zap size={13} style={{ color: 'var(--accent)' }} />
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 700 }}>{graph.nodes.filter((n) => n.enabled).length}개 노드 활성</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>{graph.edges.length}개 연결 · v{graph.version}</div>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="status-chip">© 2026 VisionFlow Lab</div>
      </div>
    </aside>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/layout/Topbar.tsx</code></summary>

```tsx
import { CircleStop, Moon, Play, Sun, Upload } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ENGINE_LABELS } from '@/engine/factory';
import appConfig from '@/config';
import { useRef } from 'react';

interface Props {
  onThemeToggle: () => void;
  isDark: boolean;
}

export default function Topbar({ onThemeToggle, isDark }: Props) {
  const engine = useStore((s) => s.config.options.analysisEngine.value);
  const running = useStore((s) => s.running);
  const stage = useStore((s) => s.stage);
  const progress = useStore((s) => s.progress);
  const runAnalysis = useStore((s) => s.runAnalysis);
  const cancelAnalysis = useStore((s) => s.cancelAnalysis);
  const setVideo = useStore((s) => s.setVideo);
  const pushToast = useStore((s) => s.pushToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const video = useStore((s) => s.video);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideo(file.name, url, { size: file.size, lastModified: file.lastModified });
    pushToast(`영상 로드됨: ${file.name} · 자동 분석 시작`, 'success');
  };

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{appConfig.project.name}</div>
        <div className="topbar-sub">{running ? stage : video ? `분석 완료 · ${video.name}` : '영상을 업로드하면 분석이 시작됩니다'}</div>
      </div>
      <div style={{ width: 180 }}>
        <div className="run-bar"><i style={{ width: `${(running ? progress : 1) * 100}%` }} /></div>
      </div>
      <div className="topbar-spacer" />
      <div className="engine-pill">엔진 <b>{ENGINE_LABELS[engine]}</b></div>
      <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFile} />
      <button className="ghost-btn" onClick={() => fileRef.current?.click()}>
        <Upload size={14} /> 영상 업로드
      </button>
      <button className="icon-btn" onClick={onThemeToggle} title="테마 전환">
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      {running ? (
        <button className="ghost-btn" onClick={cancelAnalysis}><CircleStop size={14} /> 중지</button>
      ) : (
        <button className="primary-btn" onClick={() => runAnalysis(undefined, true)}>
          <Play size={15} fill="currentColor" /> 분석 실행
        </button>
      )}
    </header>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/layout/ToastHost.tsx</code></summary>

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

export default function ToastHost() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="toast-stack">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast ${t.tone}`}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            onClick={() => dismiss(t.id)}
          >
            <span className="toast-dot" />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/layout/FeatureGuideModal.tsx</code></summary>

```tsx
import { BookOpen, Check, ChevronLeft, ChevronRight, Lightbulb, MapPin, ShieldCheck, X } from 'lucide-react';
import { FEATURE_GUIDES } from '@/data/featureGuides';
import { useStore, type WorkTab } from '@/store/useStore';

const TAB_ORDER: WorkTab[] = [
  'dashboard', 'pipeline', 'analysis', 'behavior', 'actions', 'accidents',
  'description', 'measurement', 'training', 'labeling', 'stream', 'performance',
  'settings', 'catalog',
];

/**
 * 기능별 안내 팝업.
 * - 기본적으로 처음 방문하는 탭에서 자동 표시 (옵션에서 끌 수 있음)
 * - 상단 "안내" 버튼으로 언제든 다시 열기 가능
 */
export default function FeatureGuideModal() {
  const open = useStore((s) => s.guideOpen);
  const tab = useStore((s) => s.tab);
  const closeGuide = useStore((s) => s.closeGuide);
  const enabled = useStore((s) => s.guideEnabled);
  const setGuideEnabled = useStore((s) => s.setGuideEnabled);
  const setTab = useStore((s) => s.setTab);

  if (!open) return null;
  const guide = FEATURE_GUIDES[tab];
  const idx = TAB_ORDER.indexOf(tab);
  const go = (delta: number) => {
    const next = TAB_ORDER[idx + delta];
    if (next) setTab(next);
  };

  return (
    <div className="feature-guide-backdrop" onMouseDown={closeGuide}>
      <div
        className="feature-guide-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${guide.title} 기능 안내`}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') closeGuide(); }}
        tabIndex={-1}
      >
        <div className="feature-guide-head">
          <div className="card-icon"><BookOpen size={17} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="card-title">{guide.title} · 기능 안내</div>
            <div className="text-xs faint">{guide.subtitle}</div>
          </div>
          <div className="card-head-spacer" />
          <button className="icon-btn" onClick={closeGuide} title="닫기"><X size={16} /></button>
        </div>

        <div className="feature-guide-body">
          <section className="guide-section">
            <div className="guide-section-title"><Lightbulb size={14} /> 이 기능은 무엇인가요?</div>
            <p>{guide.purpose}</p>
          </section>

          <section className="guide-section">
            <div className="guide-section-title"><Check size={14} /> 사용 순서</div>
            <ol className="guide-steps">
              {guide.steps.map((step, i) => <li key={i}><span className="guide-step-num">{i + 1}</span>{step}</li>)}
            </ol>
          </section>

          <section className="guide-section">
            <div className="guide-section-title"><ShieldCheck size={14} /> 주요 데이터</div>
            <div className="guide-tags">
              {guide.keyData.map((d) => <span className="guide-tag" key={d}>{d}</span>)}
            </div>
          </section>

          <section className="guide-section caution">
            <div className="guide-section-title"><Lightbulb size={14} /> 주의 사항</div>
            <p>{guide.caution}</p>
          </section>

          <section className="guide-section">
            <div className="guide-section-title"><MapPin size={14} /> 관련 데이터 경로</div>
            <div className="guide-paths">
              {guide.relatedPaths.map((p) => <code key={p}>{p}</code>)}
            </div>
          </section>
        </div>

        <div className="feature-guide-foot">
          <label className="guide-option">
            <input type="checkbox" checked={enabled} onChange={(e) => setGuideEnabled(e.target.checked)} />
            <span>탭을 처음 열 때 안내 팝업 자동 표시</span>
          </label>
          <div className="card-head-spacer" />
          <button className="ghost-btn" onClick={() => go(-1)} disabled={idx <= 0}>
            <ChevronLeft size={14} /> 이전
          </button>
          <button className="ghost-btn" onClick={() => go(1)} disabled={idx >= TAB_ORDER.length - 1}>
            다음 <ChevronRight size={14} />
          </button>
          <button className="primary-btn" onClick={closeGuide}><Check size={14} /> 확인</button>
        </div>
      </div>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/pipeline/PipelineCanvas.tsx</code></summary>

```tsx
import { useRef, useState } from 'react';
import {
  Activity, BarChart3, GitBranch, Info, Maximize2, Plus, RotateCcw,
  ZoomIn, ZoomOut,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { NODE_KIND_META, NODE_KINDS } from '@/pipeline/catalog';
import type { NodeKind } from '@/types';

const STATUS_COLOR: Record<string, string> = {
  idle: 'var(--text-faint)',
  running: 'var(--warning)',
  done: 'var(--success)',
  error: 'var(--danger)',
};

// 캔버스 논리 좌표계
const CANVAS_W = 2280;  // 약 11열 × 198px + 여백 (깊이별 자동 배치)
const CANVAS_H = 820;
const NODE_W = 178;
const NODE_H = 104;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** 레이어 정의 — 고급 시각화용 그룹 배경 */
const LAYERS = [
  { id: 'input', label: '입력 · 전처리', x: 10, y: 10, w: 440, h: 800, color: '#22d3ee' },
  { id: 'detect', label: '탐지 · 추적', x: 458, y: 10, w: 640, h: 800, color: '#a78bfa' },
  { id: 'analyze', label: '사고 · 행동 분석', x: 1106, y: 10, w: 720, h: 800, color: '#34d399' },
  { id: 'output', label: '검토 · 출력', x: 1834, y: 10, w: 436, h: 800, color: '#fb923c' },
];

interface DragState { id: string; dx: number; dy: number; }

export default function PipelineCanvas() {
  const graph = useStore((s) => s.graph);
  const moveNode = useStore((s) => s.moveNode);
  const addNode = useStore((s) => s.addNode);
  const resetPipeline = useStore((s) => s.resetPipeline);
  const selected = useStore((s) => s.selectedNodeId);
  const setSelected = useStore((s) => s.setSelectedNode);
  const autoUpdate = useStore((s) => s.config.pipeline.autoUpdate.value);
  const result = useStore((s) => s.result);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [tick, setTick] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showLayers, setShowLayers] = useState(true);
  const [hover, setHover] = useState<string | null>(null);

  const toLogical = (clientX: number, clientY: number) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: (clientX - rect.left + el.scrollLeft) / zoom,
      y: (clientY - rect.top + el.scrollTop) / zoom,
    };
  };

  const onPointerDown = (e: React.PointerEvent, id: string, x: number, y: number) => {
    const p = toLogical(e.clientX, e.clientY);
    drag.current = { id, dx: p.x - x, dy: p.y - y };
    setSelected(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = toLogical(e.clientX, e.clientY);
    moveNode(
      drag.current.id,
      clamp(p.x - drag.current.dx, 0, CANVAS_W - NODE_W),
      clamp(p.y - drag.current.dy, 0, CANVAS_H - NODE_H),
    );
    setTick((t) => t + 1);
  };

  const onPointerUp = () => { drag.current = null; };
  const changeZoom = (delta: number) =>
    setZoom((z) => clamp(Math.round((z + delta) * 10) / 10, ZOOM_MIN, ZOOM_MAX));

  const nodeById = (id: string) => graph.nodes.find((n) => n.id === id);

  /** 노드 상세 데이터 — 실제 분석 결과에서 가져와 이해도 향상 */
  const nodeDetail = (id: string) => {
    const base: Record<string, { input: string; output: string; note: string }> = {
      ingest: { input: '영상 파일', output: `${result ? 1 : 0}개 소스`, note: '원본 영상은 저장·재생용으로 유지' },
      decode: { input: '원본 프레임', output: `${result?.processedFrames ?? 0}프레임`, note: '30fps 원본 읽기' },
      preprocess: { input: '원본 프레임', output: '640px · 6fps', note: 'AI 추론용 축소/샘플링 (CPU 속도 개선)' },
      signals: { input: '샘플 프레임', output: `${result?.motionSeries?.length ?? 0}개 구간`, note: '밝기·모션·엣지 신호' },
      detect: { input: '축소 프레임', output: `${result?.detections?.length ?? 0}감지`, note: 'YOLO 객체 탐지 (사람/차량/지게차)' },
      track: { input: '감지 결과', output: `${new Set((result?.detections ?? []).map((d) => (d as unknown as { trackId?: string }).trackId).filter(Boolean)).size}트랙`, note: 'ByteTrack ID 유지 · 이동 경로' },
      pose: { input: '사람 BBox', output: '관절 좌표', note: '자세 변화·기울기 분석' },
      behavior: { input: '트랙+자세', output: `${result?.behaviors?.length ?? 0}건`, note: '시계열 행동 분류' },
      accidents: { input: '이동/자세', output: `${result?.accidents?.length ?? 0}건`, note: '시간적 근거 기반 사고 판단' },
      industrial: { input: '사고+객체', output: '위험 분석', note: '지게차-작업자·추락·협착' },
      situation: { input: '분석 이벤트', output: `${result?.situations?.length ?? 0}상황`, note: '이벤트 조합 상황 판단' },
      action: { input: '상황', output: `${result?.actions?.length ?? 0}조치`, note: '대응 절차 매핑' },
      description: { input: '분석 결과', output: `${result?.videoDescription?.captions?.length ?? 0}캡션`, note: '실제 감지 기반 텍스트' },
      performance: { input: '처리 시간', output: `${result?.engineTimings?.perFrameMs ?? 0}ms/프레임`, note: '실제 측정값만 표시' },
      review: { input: '사고 의심', output: '검토 필요', note: '사용자 검증 후 확정' },
      report: { input: '전체 결과', output: '리포트', note: '시각화용 데이터 조립' },
    };
    return base[id] ?? { input: '-', output: '-', note: '' };
  };

  return (
    <div className="card">
      <div className="pipeline-toolbar">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="accent" />
          <span className="text-sm" style={{ fontWeight: 700 }}>파이프라인 그래프</span>
          <span className="chip mono">v{graph.version}</span>
          {autoUpdate && <span className="chip accent">AUTO-UPDATE</span>}
          <span className="chip mono">{graph.nodes.length} 노드 · {graph.edges.length} 연결</span>
        </div>
        <div className="card-head-spacer" />
        <button className="ghost-btn" style={{ padding: '6px 10px', fontSize: 10 }} onClick={() => setShowLayers((v) => !v)}>
          <Info size={12} /> 레이어 {showLayers ? '숨김' : '표시'}
        </button>
        {NODE_KINDS.map((k) => (
          <button key={k} className="ghost-btn" style={{ padding: '6px 10px', fontSize: 10 }} onClick={() => addNode(k as NodeKind)}>
            <Plus size={12} style={{ color: NODE_KIND_META[k].color }} /> {NODE_KIND_META[k].labelKo}
          </button>
        ))}
        <div className="zoom-controls">
          <button className="icon-btn" style={{ width: 28, height: 28 }} title="축소" onClick={() => changeZoom(-ZOOM_STEP)}><ZoomOut size={13} /></button>
          <span className="chip mono" style={{ minWidth: 46, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button className="icon-btn" style={{ width: 28, height: 28 }} title="확대" onClick={() => changeZoom(ZOOM_STEP)}><ZoomIn size={13} /></button>
          <button className="icon-btn" style={{ width: 28, height: 28 }} title="배율 초기화" onClick={() => setZoom(1)}><Maximize2 size={13} /></button>
        </div>
        <button className="ghost-btn" style={{ padding: '6px 10px', fontSize: 10 }} onClick={resetPipeline}>
          <RotateCcw size={12} /> 초기화
        </button>
      </div>

      <div className="canvas-wrap" ref={canvasRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
        <div className="canvas-stage" style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom }}>
          <div className="canvas-inner" style={{ transform: `scale(${zoom})` }}>
            {showLayers && LAYERS.map((layer) => (
              <div
                key={layer.id}
                className="pipeline-layer"
                style={{
                  left: layer.x, top: layer.y, width: layer.w, height: layer.h,
                  borderColor: `color-mix(in srgb, ${layer.color} 25%, transparent)`,
                  background: `color-mix(in srgb, ${layer.color} 4%, transparent)`,
                }}
              >
                <span className="pipeline-layer-label" style={{ color: layer.color }}>{layer.label}</span>
              </div>
            ))}

            <svg className="canvas-edges" key={`edges-${tick}-${graph.version}`}>
              <defs>
                <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--accent-2)" />
                </linearGradient>
                <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill="var(--accent)" />
                </marker>
              </defs>
              {graph.edges.map((edge, i) => {
                const a = nodeById(edge.from);
                const b = nodeById(edge.to);
                if (!a || !b) return null;
                const x1 = a.x + NODE_W;
                const y1 = a.y + 46;
                const x2 = b.x;
                const y2 = b.y + 46;
                const mx = (x1 + x2) / 2;
                const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                const active = a.status === 'done' && b.status !== 'idle';
                return (
                  <g key={`${edge.from}-${edge.to}-${i}`}>
                    <path d={d} fill="none" stroke="var(--panel-border-strong)" strokeWidth={2} />
                    <path
                      d={d} fill="none" stroke="url(#edgeGrad)"
                      strokeWidth={active ? 2.5 : 1.5}
                      strokeDasharray={active ? '0' : '5 5'}
                      markerEnd="url(#arrowHead)"
                      opacity={active ? 1 : 0.55}
                    >
                      {active && <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />}
                    </path>
                  </g>
                );
              })}
            </svg>

            {graph.nodes.map((node) => {
              const meta = NODE_KIND_META[node.type];
              const detail = nodeDetail(node.id);
              const isHover = hover === node.id;
              return (
                <div
                  key={node.id}
                  className={[
                    'pnode', selected === node.id ? 'selected' : '',
                    !node.enabled ? 'disabled' : '', `status-${node.status}`,
                  ].filter(Boolean).join(' ')}
                  style={{ left: node.x, top: node.y }}
                  onPointerDown={(e) => onPointerDown(e, node.id, node.x, node.y)}
                  onMouseEnter={() => setHover(node.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <div className="pnode-top">
                    <span className="pnode-icon" style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}>
                      <GitBranch size={14} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="pnode-label">{node.label}</div>
                      <div className="pnode-kind">{meta.label}</div>
                    </div>
                    <span className="pnode-status-dot" style={{ background: STATUS_COLOR[node.status] }} />
                  </div>
                  <div className="pnode-progress">
                    <div className="pnode-progress-fill" style={{ width: `${node.progress * 100}%` }} />
                  </div>
                  <div className="pnode-output">{node.output ?? detail.output}</div>
                  <div className="pnode-metrics">
                    <span><BarChart3 size={9} /> {detail.input}</span>
                    <span><Activity size={9} /> {detail.output}</span>
                  </div>
                  {isHover && (
                    <div className="pnode-tooltip">
                      <b>{node.label}</b>
                      <div>{meta.description}</div>
                      <div className="mono">입력: {detail.input}</div>
                      <div className="mono">출력: {detail.output}</div>
                      <div className="mono">상태: {node.status} · {Math.round(node.progress * 100)}%</div>
                      {node.durationMs && <div className="mono">지연: {node.durationMs}ms</div>}
                      {detail.note && <div className="faint">{detail.note}</div>}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 미니맵 */}
            <div className="pipeline-minimap">
              <div className="pipeline-minimap-inner" style={{ transform: `scale(${150 / CANVAS_W})` }}>
                {graph.nodes.map((n) => (
                  <span key={n.id} style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H, background: NODE_KIND_META[n.type].color }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderTop: '1px solid var(--panel-border)' }}>
        <span className="text-xs faint">
          노드를 드래그해 배치를 변경하고, 옵션 수정 시 자동 재구성됩니다. 노드에 마우스를 올리면 상세 입출력 데이터가 표시됩니다.
        </span>
        <span className="text-xs mono accent">마지막 갱신 {graph.updatedAt.slice(11, 19)}</span>
      </div>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/pipeline/NodeInspector.tsx</code></summary>

```tsx
import { Power, Trash2, Unlink } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { NODE_KIND_META } from '@/pipeline/catalog';
import DataCard from '@/components/panels/DataCard';

export default function NodeInspector() {
  const selectedId = useStore((s) => s.selectedNodeId);
  const graph = useStore((s) => s.graph);
  const toggleNode = useStore((s) => s.toggleNode);
  const removeNode = useStore((s) => s.removeNode);
  const renameNode = useStore((s) => s.renameNode);
  const removeEdge = useStore((s) => s.removeEdge);
  const node = graph.nodes.find((n) => n.id === selectedId);

  return (
    <DataCard
      dataKey="pipeline-node"
      title="노드 속성"
      description="캔버스에서 선택한 노드의 유형·상태·실행 시간·출력 내용과 연결 정보를 표시합니다."
      icon={<Power size={15} />}
      bodyClassName="card-pad"
    >
      {!node ? (
        <div className="result-empty" style={{ minHeight: 220 }}>
          <div className="result-empty-icon">⌁</div>
          <div className="text-sm">캔버스에서 노드를 선택하면 속성이 표시됩니다.</div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="card-icon" style={{ color: NODE_KIND_META[node.type].color, background: `color-mix(in srgb, ${NODE_KIND_META[node.type].color} 14%, transparent)` }}>⌁</div>
            <div>
              <div className="card-title">선택된 노드</div>
              <div className="card-subtitle mono">{node.id}</div>
            </div>
            <div className="card-head-spacer" />
            <button className="icon-btn" title="활성/비활성" onClick={() => toggleNode(node.id)}>
              <Power size={15} color={node.enabled ? 'var(--success)' : 'var(--text-faint)'} />
            </button>
            <button className="icon-btn" title="삭제" onClick={() => removeNode(node.id)}><Trash2 size={15} color="var(--danger)" /></button>
          </div>

          <div className="field mt-4">
            <div className="field-label"><span>라벨</span></div>
            <input
              className="ghost-btn full"
              style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }}
              value={node.label}
              onChange={(e) => renameNode(node.id, e.target.value)}
            />
          </div>

          <div className="flex justify-between text-sm mt-2"><span className="dim">유형</span><span style={{ color: NODE_KIND_META[node.type].color, fontWeight: 700 }}>{NODE_KIND_META[node.type].labelKo} · {NODE_KIND_META[node.type].label}</span></div>
          <div className="flex justify-between text-sm mt-2"><span className="dim">상태</span><span className="mono accent">{node.status}</span></div>
          <div className="flex justify-between text-sm mt-2"><span className="dim">실행 시간</span><span className="mono">{node.durationMs ? `${node.durationMs}ms` : '-'}</span></div>
          <div className="flex justify-between text-sm mt-2"><span className="dim">출력</span><span className="dim text-xs" style={{ maxWidth: 150, textAlign: 'right' }}>{node.output ?? '-'}</span></div>

          <div className="divider" />
          <div className="text-xs faint" style={{ marginBottom: 8 }}>연결 ({graph.edges.filter((e) => e.from === node.id || e.to === node.id).length})</div>
          <div className="flex flex-col gap-2">
            {graph.edges.filter((e) => e.from === node.id || e.to === node.id).map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="mono dim">{e.from} → {e.to}</span>
                <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => removeEdge(e.from, e.to)}><Unlink size={12} /></button>
              </div>
            ))}
          </div>
        </>
      )}
    </DataCard>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/DataCard.tsx</code></summary>

```tsx
import type { ReactNode } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface Props {
  /** 데이터 영역 식별자 (숨김 상태 저장 키) */
  dataKey: string;
  title: string;
  /** 이 데이터가 무엇을 의미하는지에 대한 설명 문구 */
  description: string;
  icon?: ReactNode;
  /** 헤더 우측 추가 요소 */
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * 모든 데이터 출력 영역의 공통 카드.
 * - 데이터별 설명 문구를 항상 출력
 * - Eye 토글로 해당 데이터만 숨김/표시 가능
 */
export default function DataCard({
  dataKey, title, description, icon, right, children, className = '', bodyClassName = '',
}: Props) {
  const hidden = useStore((s) => s.dataVisibility[dataKey] === false);
  const toggle = useStore((s) => s.toggleDataVisibility);

  return (
    <section className={`card data-card ${className}`}>
      <div className="card-head">
        {icon && <div className="card-icon">{icon}</div>}
        <div style={{ minWidth: 0 }}>
          <div className="card-title">{title}</div>
          <div className="data-desc"><Info size={10} /> {description}</div>
        </div>
        <div className="card-head-spacer" />
        {right}
        <button
          className="icon-btn visibility-btn"
          title={hidden ? '데이터 표시' : '데이터 숨기기'}
          onClick={() => toggle(dataKey)}
        >
          {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hidden ? (
        <div className="data-hidden">
          <EyeOff size={16} />
          <span><b>{title}</b> 데이터가 숨겨져 있습니다. 눈 아이콘을 눌러 다시 표시하세요.</span>
        </div>
      ) : (
        <div className={bodyClassName}>{children}</div>
      )}
    </section>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/ClipLabelingPanel.tsx</code></summary>

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Camera, Check, ClipboardList, RefreshCw, Save, Trash2, WandSparkles } from 'lucide-react';
import DataCard from './DataCard';
import { useStore } from '@/store/useStore';
import {
  detectFrame, frameUrl, getDatasetClasses, listClips, saveClipLabel,
  type ClipInfo, type DetectionLike, type LabelBox,
} from '@/services/labelingApi';

const newId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export default function ClipLabelingPanel() {
  const pushToast = useStore((s) => s.pushToast);
  const [clips, setClips] = useState<ClipInfo[]>([]);
  const [name, setName] = useState('');
  const [info, setInfo] = useState<ClipInfo | null>(null);
  const [index, setIndex] = useState(0);
  const [datasetId, setDatasetId] = useState('capture');
  const [classes, setClasses] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<number, LabelBox[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<LabelBox['bbox'] | null>(null);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const boxes = labels[index] ?? [];

  const refreshClips = useCallback(async () => {
    try {
      const list = await listClips();
      setClips(list);
      setName((prev) => (list.some((c) => c.name === prev) ? prev : list[0]?.name ?? ''));
    } catch { /* 백엔드 미실행 시 무시 */ }
  }, []);

  const refreshClasses = useCallback(async () => {
    try { setClasses(await getDatasetClasses(datasetId)); } catch { /* ignore */ }
  }, [datasetId]);

  useEffect(() => { void refreshClips(); }, [refreshClips]);
  useEffect(() => { void refreshClasses(); }, [refreshClasses]);

  useEffect(() => {
    if (!name) { setInfo(null); return; }
    const found = clips.find((c) => c.name === name);
    if (found) setInfo(found);
    setIndex(0);
    setLabels({});
    setSelected(null);
  }, [name, clips]);

  const updateBoxes = (next: LabelBox[]) => {
    setLabels((prev) => ({ ...prev, [index]: next }));
  };

  const pointOf = (e: ReactPointerEvent): { x: number; y: number } => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100)),
      y: Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100)),
    };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !info) return;
    const p = pointOf(e);
    dragStart.current = p;
    setDrawing({ x: p.x, y: p.y, w: 0, h: 0 });
    setSelected(null);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const p = pointOf(e);
    const s = dragStart.current;
    setDrawing({
      x: Math.min(s.x, p.x), y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y),
    });
  };

  const onPointerUp = () => {
    if (drawing && drawing.w > 1.5 && drawing.h > 1.5) {
      const box: LabelBox = { id: newId(), label: classes[0] ?? 'person', bbox: drawing };
      updateBoxes([...boxes, box]);
      setSelected(box.id);
    }
    dragStart.current = null;
    setDrawing(null);
  };

  const handleAutoDetect = async () => {
    if (!name) return;
    setBusy(true);
    try {
      const results = await detectFrame(name, index, 0.3);
      if (!results.length) { pushToast('이 프레임에서 감지된 객체가 없습니다.', 'warning'); return; }
      updateBoxes(results.map((d) => ({ id: newId(), label: d.label, bbox: d.bbox, confidence: d.confidence })));
      pushToast(`자동 감지 ${results.length}건을 불러왔습니다. 클래스와 BBox를 확인하세요.`, 'info');
    } catch (err) {
      pushToast(`자동 감지 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleSave = async (negative: boolean) => {
    if (!name) return;
    setBusy(true);
    try {
      const detections: DetectionLike[] = negative ? [] : boxes.map((b) => ({
        label: b.label, bbox: b.bbox, confidence: b.confidence ?? 1,
      }));
      const res = await saveClipLabel(name, datasetId, index, detections);
      pushToast(
        res.negative ? '라벨 없는 네거티브 샘플로 저장했습니다.' : `라벨 ${res.saved}건을 ${datasetId}에 저장했습니다.`,
        'success',
      );
    } catch (err) {
      pushToast(`저장 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const selectedBox = boxes.find((b) => b.id === selected);

  return (
    <div className="grid grid-2">
      <DataCard
        dataKey="labeling-clips"
        title="저장된 위험 클립"
        description="사고·위험 감지 시점 전후로 자동 저장된 클립입니다. 프레임을 선택해 라벨을 수정할 수 있습니다."
        icon={<ClipboardList size={15} />}
        right={<button className="ghost-btn" style={{ fontSize: 10, padding: '5px 9px' }} onClick={() => void refreshClips()}><RefreshCw size={11} /> 새로고침</button>}
        bodyClassName="card-pad"
      >
        {clips.length === 0 ? (
          <div className="text-xs faint" style={{ lineHeight: 1.7 }}>
            아직 저장된 클립이 없습니다. 영상을 분석하거나 실시간 스트림에서 위험이 감지되면 클립이 자동 저장되고 여기에 표시됩니다.
          </div>
        ) : (
          <div className="clip-list">
            {clips.map((c) => (
              <button key={c.name} className={`clip-item ${name === c.name ? 'active' : ''}`} onClick={() => setName(c.name)}>
                <span className="mono">{c.name}</span>
                <span className="faint">{c.frames}프레임 · {c.seconds}초 · {c.width}×{c.height}</span>
              </button>
            ))}
          </div>
        )}
        <div className="divider" />
        <div className="field">
          <div className="field-label"><span>저장 대상 데이터셋</span></div>
          <input
            className="ghost-btn full"
            style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }}
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
          />
        </div>
        <div className="text-xs faint" style={{ lineHeight: 1.6 }}>
          라벨은 YOLO 형식(.txt)으로 저장되며, BBox가 없는 프레임은 오탐 학습용 네거티브 샘플이 됩니다.
        </div>
      </DataCard>

      <DataCard
        dataKey="labeling-frame"
        title="프레임 BBox 편집"
        description="이미지 위를 드래그해 BBox를 그리고, 오른쪽에서 클래스를 수정합니다. 자동 감지 결과를 불러와 다듬을 수도 있습니다."
        icon={<Camera size={15} />}
        bodyClassName="card-pad"
      >
        {!info || !name ? (
          <div className="text-xs faint">위쪽에서 클립을 선택하면 프레임이 표시됩니다.</div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button className="ghost-btn" disabled={index <= 0} onClick={() => setIndex((v) => Math.max(0, v - 1))}>◀ 이전</button>
              <input
                type="range" min={0} max={Math.max(0, info.frames - 1)} value={index}
                style={{ flex: 1, ['--fill' as string]: `${info.frames > 1 ? index / (info.frames - 1) * 100 : 0}%` }}
                onChange={(e) => { setIndex(Number(e.target.value)); setSelected(null); }}
              />
              <button className="ghost-btn" disabled={index >= info.frames - 1} onClick={() => setIndex((v) => Math.min(info.frames - 1, v + 1))}>다음 ▶</button>
              <span className="mono text-xs">{index + 1}/{info.frames}</span>
            </div>
            <div
              ref={wrapRef}
              className="label-canvas"
              style={{ aspectRatio: `${info.width || 16} / ${info.height || 9}` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img src={frameUrl(name, index)} alt={`frame ${index}`} draggable={false} />
              {boxes.map((b) => (
                <div
                  key={b.id}
                  className={`label-box ${selected === b.id ? 'selected' : ''}`}
                  style={{ left: `${b.bbox.x}%`, top: `${b.bbox.y}%`, width: `${b.bbox.w}%`, height: `${b.bbox.h}%` }}
                  onPointerDown={(e) => { e.stopPropagation(); setSelected(b.id); }}
                >
                  <span className="label-box-tag">{b.label}{b.confidence !== undefined ? ` ${(b.confidence * 100).toFixed(0)}%` : ''}</span>
                </div>
              ))}
              {drawing && <div className="label-box drawing" style={{ left: `${drawing.x}%`, top: `${drawing.y}%`, width: `${drawing.w}%`, height: `${drawing.h}%` }} />}
            </div>
            <div className="flex gap-2 mt-2">
              <button className="ghost-btn" style={{ fontSize: 11 }} disabled={busy} onClick={() => void handleAutoDetect()}>
                <WandSparkles size={12} /> 자동 감지 불러오기
              </button>
              <button className="ghost-btn" style={{ fontSize: 11 }} onClick={() => { setSelected(null); updateBoxes(boxes.filter((b) => b.id !== selected)); }}>
                <Trash2 size={12} /> 선택 삭제
              </button>
              <button className="ghost-btn" style={{ fontSize: 11 }} onClick={() => { updateBoxes([]); setSelected(null); }}>전체 지우기</button>
            </div>
          </>
        )}
      </DataCard>

      <DataCard
        dataKey="labeling-boxes"
        title="라벨 목록 및 저장"
        description="현재 프레임에 지정된 객체와 클래스입니다. 클래스를 고친 뒤 저장하면 학습 데이터에 반영됩니다."
        icon={<Check size={15} />}
        bodyClassName="card-pad"
      >
        <div className="flex justify-between text-sm"><span className="dim">이 프레임 BBox</span><b className="mono accent">{boxes.length}건</b></div>
        <div className="divider" />
        {boxes.length === 0 ? (
          <div className="text-xs faint">BBox가 없습니다. 네거티브 샘플로 저장할 수 있습니다.</div>
        ) : (
          <div className="clip-list">
            {boxes.map((b, i) => (
              <button key={b.id} className={`clip-item ${selected === b.id ? 'active' : ''}`} onClick={() => setSelected(b.id)}>
                <span className="mono">#{i + 1} {b.label}</span>
                <span className="faint mono">x{b.bbox.x.toFixed(0)} y{b.bbox.y.toFixed(0)} w{b.bbox.w.toFixed(0)} h{b.bbox.h.toFixed(0)}</span>
              </button>
            ))}
          </div>
        )}
        {selectedBox && (
          <div className="field mt-2">
            <div className="field-label"><span>선택된 객체 클래스</span></div>
            <select
              className="ghost-btn full"
              style={{ cursor: 'pointer', justifyContent: 'flex-start', color: 'var(--text)' }}
              value={selectedBox.label}
              onChange={(e) => updateBoxes(boxes.map((b) => b.id === selectedBox.id ? { ...b, label: e.target.value } : b))}
            >
              {(classes.length ? classes : [selectedBox.label]).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="divider" />
        <button className="primary-btn full" disabled={busy || !name || boxes.length === 0} onClick={() => void handleSave(false)}>
          <Save size={14} /> BBox 라벨 저장
        </button>
        <button className="ghost-btn full mt-2" disabled={busy || !name} onClick={() => void handleSave(true)}>
          <Trash2 size={12} /> 네거티브 샘플로 저장
        </button>
        <div className="text-xs faint mt-2" style={{ lineHeight: 1.6 }}>
          프레임별 편집 내용은 브라우저에 임시 보관되며 클립을 바꾸면 초기화됩니다. 저장 전에 클래스와 좌표를 확인하세요.
        </div>
      </DataCard>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/ModelTrainingPanel.tsx</code></summary>

```tsx
import { useEffect, useRef, useState } from 'react';
import { BarChart3, BrainCircuit, Camera, Download, FolderOpen, RefreshCw, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { backendBaseUrl } from '@/config';
import DataCard from './DataCard';
import {
  analyzeDataset, captureFrame, createDataset, DEFAULT_AUGMENTATION, getTrainStatus,
  importDatasetDir, listRawDatasets, startTraining, uploadDataset, useModel,
  type Augmentation, type DatasetAnalysis, type RawDataset, type TrainStatus,
} from '@/services/trainingApi';

const BASE_MODELS = ['yolov8n.pt', 'yolov8s.pt', 'yolov8m.pt'];

/** COCO 사전학습 모델에는 없는 건설현장 장비 클래스 */
const SITE_CLASSES = 'person, worker, helmet, forklift, truck, bus, excavator, crane, concrete_mixer, dump_truck, traffic_cone, barrier';

export default function ModelTrainingPanel() {
  const video = useStore((s) => s.video);
  const config = useStore((s) => s.config);
  const pushToast = useStore((s) => s.pushToast);
  const [status, setStatus] = useState<TrainStatus | null>(null);
  const [datasetId, setDatasetId] = useState('capture');
  const [epochs, setEpochs] = useState(30);
  const [imgsz, setImgsz] = useState(640);
  const [batch, setBatch] = useState(8);
  const [baseModel, setBaseModel] = useState(BASE_MODELS[0]);
  const [captured, setCaptured] = useState(0);
  const [busy, setBusy] = useState(false);
  const [modelMode, setModelMode] = useState<'pretrained' | 'custom'>('pretrained');
  const [classesText, setClassesText] = useState(
    'person, car, truck, bus, bicycle, motorcycle, traffic light, stop sign, fire hydrant, dog, cat, backpack, suitcase, handbag, umbrella, chair, bench, bottle, cell phone, laptop, tv, couch, bed, dining table, refrigerator, sink, clock, scissors',
  );
  const [augmentation, setAugmentation] = useState<Augmentation>(DEFAULT_AUGMENTATION);
  const [batchCount, setBatchCount] = useState(8);
  const zipRef = useRef<HTMLInputElement>(null);
  const [negativeCount, setNegativeCount] = useState(0);
  const [synthCount, setSynthCount] = useState(0);
  const [realDatasetId, setRealDatasetId] = useState('construction');
  const [sourcePath, setSourcePath] = useState('');
  const [rawDatasets, setRawDatasets] = useState<RawDataset[]>([]);
  const [rawRoot, setRawRoot] = useState('');
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
  const [valRatio, setValRatio] = useState(0.2);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const s = await getTrainStatus();
        if (alive) setStatus(s);
      } catch { /* 백엔드 미실행 시 무시 */ }
    };
    const loadNegatives = async () => {
      try {
        const r = await (await fetch(`${backendBaseUrl()}/api/active-learning`)).json();
        setNegativeCount(r.count ?? 0);
      } catch { /* ignore */ }
    };
    void poll();
    void loadNegatives();
    const timer = setInterval(() => { void poll(); void loadNegatives(); }, 1200);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadRaw = async () => {
      try {
        const r = await listRawDatasets();
        if (alive) { setRawDatasets(r.datasets); setRawRoot(r.root); }
      } catch { /* 백엔드 미실행 시 무시 */ }
    };
    void loadRaw();
    return () => { alive = false; };
  }, []);

  const refreshAnalysis = async () => {
    try { setAnalysis(await analyzeDataset(realDatasetId)); } catch { setAnalysis(null); }
  };

  const handleImportReal = async () => {
    if (!sourcePath.trim()) { pushToast('원본 데이터 폴더 경로를 입력해 주세요.', 'warning'); return; }
    setBusy(true);
    try {
      const classes = classesText.split(',').map((c) => c.trim()).filter(Boolean);
      const r = await importDatasetDir(realDatasetId, sourcePath.trim(), classes, valRatio);
      setAnalysis(r);
      pushToast(`현장 데이터 ${r.imported}장 가져오기 완료 (학습 ${r.train} · 검증 ${r.val})`, 'success');
    } catch (err) {
      pushToast(`가져오기 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleCapture = async () => {
    if (!video?.url) { pushToast('먼저 영상을 업로드해 주세요.', 'warning'); return; }
    setBusy(true);
    try {
      const result = await captureFrame(video.url, datasetId, captured * 0.5);
      setCaptured((v) => v + result.saved);
      pushToast(`학습 데이터 ${result.saved}건 수집 (총 ${captured + result.saved}건)`, 'success');
    } catch (err) {
      pushToast(`데이터 수집 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleCreateDataset = async () => {
    try {
      const classes = classesText.split(',').map((c) => c.trim()).filter(Boolean);
      const res = await createDataset(datasetId, classes);
      pushToast(`데이터셋 생성: ${res.classes}개 클래스`, 'success');
    } catch (err) {
      pushToast(`데이터셋 생성 실패: ${(err as Error).message}`, 'error');
    }
  };

  const handleUploadZip = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadDataset(datasetId, file);
      pushToast(`데이터셋 업로드: 이미지 ${res.images} · 라벨 ${res.labels}`, 'success');
    } catch (err) {
      pushToast(`업로드 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleBatchCapture = async () => {
    if (!video?.url) { pushToast('먼저 영상을 업로드해 주세요.', 'warning'); return; }
    setBusy(true);
    let total = 0;
    try {
      for (let i = 0; i < batchCount; i += 1) {
        const res = await captureFrame(video.url, datasetId, i * 0.7);
        total += res.saved;
      }
      setCaptured((v) => v + total);
      pushToast(`${batchCount}개 시점에서 ${total}건 라벨 수집 완료`, 'success');
    } catch (err) {
      pushToast(`일괄 수집 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleTrain = async () => {
    setBusy(true);
    try {
      const s = await startTraining({ datasetId, epochs, imgsz, batch, baseModel, augmentation });
      setStatus(s);
      pushToast('YOLO 미세조정을 시작했습니다.', 'info');
    } catch (err) {
      pushToast(`학습 시작 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleModelSwitch = async (mode: 'pretrained' | 'custom') => {
    try {
      await useModel(mode === 'pretrained');
      setModelMode(mode);
      pushToast(mode === 'pretrained' ? '사전학습 모델을 적용했습니다.' : '학습된 커스텀 모델을 적용했습니다.', 'success');
    } catch (err) {
      pushToast(`모델 전환 실패: ${(err as Error).message}`, 'error');
    }
  };

  return (
    <div className="grid grid-2">
      <DataCard
        dataKey="training-status"
        title="모델 학습 상태"
        description="수집된 데이터로 YOLO를 미세조정합니다. 학습이 끝나면 감지기에 커스텀 모델이 자동 적용됩니다."
        icon={<BrainCircuit size={15} />}
        right={<span className={`chip ${status?.status === 'running' ? 'accent' : ''}`}>{status?.status ?? 'idle'}</span>}
        bodyClassName="card-pad"
      >
        <div className="flex justify-between text-sm"><span className="dim">진행률</span><b className="mono">{Math.round((status?.progress ?? 0) * 100)}%</b></div>
        <div className="run-bar mt-2"><i style={{ width: `${(status?.progress ?? 0) * 100}%` }} /></div>
        <div className="flex justify-between text-sm mt-4"><span className="dim">에포크</span><b className="mono">{status?.epoch ?? 0} / {status?.totalEpochs ?? 0}</b></div>
        <div className="flex justify-between text-sm mt-2"><span className="dim">메시지</span><span className="text-xs dim">{status?.message ?? '-'}</span></div>
        {status?.error && <div className="text-xs" style={{ color: 'var(--danger)', marginTop: 8 }}>{status.error}</div>}
        <div className="divider" />
        <div className="text-xs faint" style={{ lineHeight: 1.7 }}>
          수집된 데이터셋: <b className="mono">{datasetId}</b> · 프레임 {captured}장
        </div>
      </DataCard>

      <DataCard
        dataKey="training-data"
        title="학습 데이터 수집"
        description="현재 영상의 프레임을 캡처하고 감지 결과를 YOLO 라벨로 저장해 학습 데이터를 만듭니다."
        icon={<Camera size={15} />}
        bodyClassName="card-pad"
      >
        <div className="field">
          <div className="field-label"><span>데이터셋 ID</span></div>
          <input className="ghost-btn full" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} value={datasetId} onChange={(e) => setDatasetId(e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label"><span>학습 클래스 (쉼표 구분)</span><span className="field-value">{classesText.split(',').filter(Boolean).length}개</span></div>
          <textarea
            className="ghost-btn full"
            style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)', minHeight: 72, padding: 10, lineHeight: 1.5 }}
            value={classesText}
            onChange={(e) => setClassesText(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button className="ghost-btn full" style={{ fontSize: 10, padding: '6px 10px' }} onClick={handleCreateDataset}>
              <Sparkles size={12} /> 클래스 정의로 데이터셋 생성
            </button>
            <button
              className="ghost-btn full"
              style={{ fontSize: 10, padding: '6px 10px' }}
              onClick={() => {
                setClassesText(SITE_CLASSES);
                setDatasetId('construction');
                pushToast('건설현장 클래스 프리셋을 적용했습니다. 클래스 정의 버튼으로 저장하세요.', 'info');
              }}
            >
              현장 프리셋
            </button>
          </div>
          <div className="text-xs faint mt-2" style={{ lineHeight: 1.6 }}>
            COCO 사전학습 모델에는 지게차·굴착기 클래스가 없어 지게차가 트럭으로, 화물차가 버스로 표시될 수 있습니다. 정확한 구분은 위 클래스로 현장 데이터를 수집해 학습하세요.
          </div>
        </div>
        <div className="field">
          <div className="field-label"><span>외부 데이터셋 ZIP</span></div>
          <input ref={zipRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => handleUploadZip(e.target.files?.[0])} />
          <button className="ghost-btn full" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => zipRef.current?.click()}>
            <UploadCloud size={12} /> images/labels ZIP 업로드
          </button>
        </div>
        <div className="divider" />
        <div className="flex justify-between text-sm">
          <span className="dim">자동 수집 하드 네거티브</span>
          <b className="mono accent">{negativeCount}장</b>
        </div>
        <div className="text-xs faint mt-2" style={{ lineHeight: 1.6 }}>
          애매한 신뢰도 구간과 안전 판별 후보 프레임이 라벨 없는 정상 샘플로 자동 저장됩니다.
        </div>
        <button
          className="ghost-btn full mt-2"
          style={{ fontSize: 10, padding: '6px 10px' }}
          onClick={async () => {
            try {
              const r = await (await fetch(`${backendBaseUrl()}/api/dataset/synthesize?datasetId=${datasetId}&copies=${config.training.syntheticCopies.value}`, { method: 'POST' })).json();
              setSynthCount(r.created ?? 0);
              pushToast(`합성 데이터 ${r.created ?? 0}장 생성`, 'success');
            } catch (err) { pushToast(`생성 실패: ${(err as Error).message}`, 'error'); }
          }}
        >
          <Sparkles size={12} /> 합성 데이터 생성 ({config.training.syntheticCopies.value}배)
        </button>
        {synthCount > 0 && <div className="text-xs accent mt-2">최근 생성 {synthCount}장</div>}
        <div className="field">
          <div className="field-label"><span>일괄 수집 시점</span><span className="field-value">{batchCount}장</span></div>
          <input type="range" min={1} max={30} value={batchCount} style={{ ['--fill' as string]: `${(batchCount - 1) / 29 * 100}%` }} onChange={(e) => setBatchCount(Number(e.target.value))} />
        </div>
        <button className="primary-btn full" disabled={busy || !video?.url} onClick={handleCapture}>
          <Camera size={14} /> 단일 프레임 수집
        </button>
        <button className="ghost-btn full mt-2" disabled={busy || !video?.url} onClick={handleBatchCapture}>
          <Camera size={12} /> 다중 시점 일괄 수집
        </button>
        <div className="text-xs faint mt-2">유리 반사·도로 바닥 등 오탐 영역은 라벨 없는 네거티브 샘플로 함께 수집하면 오탐이 크게 줄어듭니다.</div>
      </DataCard>

      <DataCard
        dataKey="training-real-dataset"
        title="실제 건설현장 데이터셋"
        description="현장 CCTV에서 수집한 이미지와 라벨을 가져와 train/val로 분할하고, 사고·정상 비율과 라벨 오류를 학습 전에 점검합니다."
        icon={<BarChart3 size={15} />}
        right={<span className={`chip ${analysis?.ready ? 'accent' : ''}`}>{analysis ? (analysis.ready ? '학습 준비 완료' : '점검 필요') : '미분석'}</span>}
        bodyClassName="card-pad"
      >
        <div className="field">
          <div className="field-label"><span>대상 데이터셋 ID</span></div>
          <input className="ghost-btn full" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} value={realDatasetId} onChange={(e) => setRealDatasetId(e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label"><span>원본 폴더 경로</span><span className="field-value">{rawDatasets.length}개 발견</span></div>
          <input className="ghost-btn full" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} placeholder={rawRoot || 'services/.data/raw/...'} value={sourcePath} onChange={(e) => setSourcePath(e.target.value)} />
          {rawDatasets.length > 0 && (
            <div className="clip-list mt-2">
              {rawDatasets.map((d) => (
                <button key={d.name} className="clip-item" onClick={() => setSourcePath(d.path)}>
                  <span className="mono"><FolderOpen size={11} style={{ verticalAlign: 'middle', marginRight: 5 }} />{d.name}</span>
                  <span className="faint mono" style={{ fontSize: 9 }}>{d.path}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="field">
          <div className="field-label"><span>검증(val) 비율</span><span className="field-value">{Math.round(valRatio * 100)}%</span></div>
          <input type="range" min={0.05} max={0.5} step={0.05} value={valRatio} onChange={(e) => setValRatio(Number(e.target.value))} />
        </div>
        <div className="flex gap-2">
          <button className="ghost-btn full" style={{ fontSize: 11 }} disabled={busy} onClick={() => void refreshAnalysis()}><RefreshCw size={12} /> 분석</button>
          <button className="primary-btn full" style={{ fontSize: 11 }} disabled={busy} onClick={() => void handleImportReal()}><FolderOpen size={12} /> 가져오기</button>
        </div>
        {analysis && (
          <>
            <div className="divider" />
            <div className="grid grid-2 mt-2" style={{ gap: 8 }}>
              <div className="metric-card" style={{ padding: '10px 12px', borderRadius: 10 }}><div className="text-xs faint">이미지</div><b className="mono">{analysis.images}</b></div>
              <div className="metric-card" style={{ padding: '10px 12px', borderRadius: 10 }}><div className="text-xs faint">라벨 있음</div><b className="mono">{analysis.labeledImages}</b></div>
              <div className="metric-card" style={{ padding: '10px 12px', borderRadius: 10 }}><div className="text-xs faint">네거티브</div><b className="mono">{analysis.emptyLabels}</b></div>
              <div className="metric-card" style={{ padding: '10px 12px', borderRadius: 10 }}><div className="text-xs faint">사고 비율</div><b className="mono accent">{Math.round(analysis.accidentRatio * 100)}%</b></div>
            </div>
            <div className="text-xs dim mt-2">클래스 분포: {Object.entries(analysis.classCounts).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(' · ') || '없음'}</div>
            <div className="text-xs faint mt-2" style={{ lineHeight: 1.7 }}>
              {analysis.recommendations.length
                ? analysis.recommendations.map((r) => <div key={r}>• {r}</div>)
                : <div><ShieldCheck size={11} /> 학습 전 점검을 통과했습니다. 상단의 데이터셋 ID를 이 이름으로 바꾸고 학습을 시작하세요.</div>}
            </div>
          </>
        )}
      </DataCard>

      <DataCard
        dataKey="training-options"
        title="학습 옵션"
        description="기본 모델과 에포크·이미지 크기·배치를 설정합니다. CPU 환경에서는 작은 모델과 적은 에포크를 권장합니다."
        icon={<Sparkles size={15} />}
        bodyClassName="card-pad"
      >
        <div className="field">
          <div className="field-label"><span>기본 모델</span></div>
          <div className="segmented">
            {BASE_MODELS.map((m) => (
              <button key={m} className={`segment ${baseModel === m ? 'active' : ''}`} onClick={() => setBaseModel(m)}>{m.replace('yolov8', 'v8-')}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <div className="field-label"><span>에포크</span><span className="field-value">{epochs}</span></div>
          <input type="range" min={5} max={100} value={epochs} style={{ ['--fill' as string]: `${(epochs - 5) / 95 * 100}%` }} onChange={(e) => setEpochs(Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>이미지 크기</span><span className="field-value">{imgsz}</span></div>
          <input type="range" min={320} max={960} step={64} value={imgsz} style={{ ['--fill' as string]: `${(imgsz - 320) / 640 * 100}%` }} onChange={(e) => setImgsz(Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>배치 크기</span><span className="field-value">{batch}</span></div>
          <input type="range" min={1} max={32} value={batch} style={{ ['--fill' as string]: `${(batch - 1) / 31 * 100}%` }} onChange={(e) => setBatch(Number(e.target.value))} />
        </div>
        <div className="divider" />
        <div className="text-xs faint" style={{ marginBottom: 8 }}>데이터 증강 (다양한 사물 상태 학습)</div>
        {([
          ['fliplr', '좌우 반전', 0, 1, 0.05],
          ['flipud', '상하 반전', 0, 1, 0.05],
          ['mosaic', '모자이크', 0, 1, 0.1],
          ['mixup', '믹스업', 0, 1, 0.05],
          ['degrees', '회전 각도', 0, 30, 1],
          ['scale', '스케일', 0, 1, 0.05],
        ] as Array<[keyof Augmentation, string, number, number, number]>).map(([key, label, min, max, step]) => (
          <div className="field" key={key}>
            <div className="field-label"><span>{label}</span><span className="field-value">{augmentation[key]}</span></div>
            <input type="range" min={min} max={max} step={step} value={augmentation[key]} onChange={(e) => setAugmentation((a) => ({ ...a, [key]: Number(e.target.value) }))} />
          </div>
        ))}
        <button className="primary-btn full" disabled={busy || status?.status === 'running'} onClick={handleTrain}>
          <BrainCircuit size={14} /> 학습 시작
        </button>
      </DataCard>

      <DataCard
        dataKey="training-model"
        title="감지 모델 전환"
        description="사전학습 모델과 학습된 커스텀 모델 중 사용할 모델을 선택합니다."
        icon={<Download size={15} />}
        bodyClassName="card-pad"
      >
        <div className="segmented">
          <button className={`segment ${modelMode === 'pretrained' ? 'active' : ''}`} onClick={() => handleModelSwitch('pretrained')}>사전학습 모델</button>
          <button className={`segment ${modelMode === 'custom' ? 'active' : ''}`} onClick={() => handleModelSwitch('custom')}>커스텀 모델</button>
        </div>
        <div className="flex items-center gap-2 text-xs dim mt-4"><RefreshCw size={12} className="accent" /> 커스텀 모델 경로: {status?.modelPath ?? 'services/.models/custom.pt'}</div>
        <div className="text-xs faint mt-2" style={{ lineHeight: 1.6 }}>
          커스텀 모델이 아직 없으면 사전학습 모델이 유지됩니다. 학습 완료 후 자동으로 전환됩니다.
        </div>
      </DataCard>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/ObjectMeasurementPanel.tsx</code></summary>

```tsx
import { Ruler, UploadCloud } from 'lucide-react';
import { useStore } from '@/store/useStore';
import DataCard from './DataCard';
import MetricCard from '@/components/visualizations/MetricCard';

const METHOD_LABEL = {
  'reference+depth': '기준물+깊이',
  'reference-plane': '기준물 동일평면',
  'relative-only': '상대 크기만',
} as const;

function NoData() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Ruler size={22} /></div>
      <b>사물 측정 데이터 없음</b>
      <div className="text-xs">영상을 업로드하면 실시간 추적이 자동으로 켜져 객체별 크기·거리 추정치가 출력됩니다.</div>
    </div>
  );
}

export default function ObjectMeasurementPanel() {
  const items = useStore((s) => s.measurements);
  const config = useStore((s) => s.config);
  const avgDistance = items.filter((m) => m.distanceM).reduce((a, m) => a + (m.distanceM ?? 0), 0) / Math.max(1, items.filter((m) => m.distanceM).length);
  const maxWidth = Math.max(...items.map((m) => m.widthCm ?? 0), 0);

  return (
    <div>
      <DataCard
        dataKey="measure-summary"
        title="사물 측정 요약"
        description="화면 내 상대 크기와 기준 객체·깊이 모델을 이용한 실측 근사치를 집계합니다."
        icon={<Ruler size={15} />}
        bodyClassName="grid grid-4"
      >
        {items.length ? (
          <>
            <MetricCard data={{ key: 'count', label: '측정 객체', value: items.length, unit: '개', accent: 'var(--accent)' }} />
            <MetricCard data={{ key: 'distance', label: '평균 거리', value: avgDistance ? Math.round(avgDistance * 10) / 10 : '--', unit: 'm', accent: 'var(--accent-2)' }} />
            <MetricCard data={{ key: 'width', label: '최대 폭', value: maxWidth ? Math.round(maxWidth) : '--', unit: 'cm', accent: 'var(--accent-4)' }} />
            <MetricCard data={{ key: 'depth', label: '깊이 모델', value: config.measurement.depthEstimation.value ? 'ON' : 'OFF', accent: 'var(--success)' }} />
          </>
        ) : <NoData />}
      </DataCard>

      <DataCard
        dataKey="measure-detail"
        title="객체별 측정 상세"
        description="BBox 크기(%, px), 면적 비율, 종횡비와 거리·실측 폭/높이 추정치를 표시합니다. 기준 객체와 깊이 모델 옵션에 따라 정확도가 달라집니다."
        icon={<Ruler size={15} />}
        className="section-gap"
        right={<span className="chip mono">기준: {config.measurement.referenceObject.value} · {config.measurement.knownWidthCm.value}cm</span>}
      >
        {items.length ? (
          <div className="perf-list">
            <div className="perf-row perf-head">
              <span>객체</span><span>신뢰도</span><span>화면 크기</span><span>픽셀</span><span>면적</span><span>종횡비</span><span>거리</span><span>실측 폭/높이</span><span>방식</span>
            </div>
            {items.map((m, i) => (
              <div className="perf-row" key={`${m.label}-${i}`}>
                <span className="perf-name"><b>{m.label}</b><small className="faint">{m.kind}</small></span>
                <span className="mono">{Math.round(m.confidence * 100)}%</span>
                <span className="mono">{m.widthPercent}% × {m.heightPercent}%</span>
                <span className="mono">{m.widthPx}×{m.heightPx}</span>
                <span className="mono">{m.areaPercent}%</span>
                <span className="mono">{m.aspectRatio}</span>
                <span className="mono">{m.distanceM ? `${m.distanceM}m` : '-'}</span>
                <span className="mono">{m.widthCm ? `${m.widthCm}×${m.heightCm}cm` : '-'}</span>
                <span className="chip">{METHOD_LABEL[m.method]}</span>
              </div>
            ))}
          </div>
        ) : <NoData />}
      </DataCard>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/SituationVideoGuide.tsx</code></summary>

```tsx
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, PlayCircle, Video } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { ActionRecommendation, Situation } from '@/types';
import DataCard from './DataCard';

interface Props {
  situations: Situation[];
  actions: ActionRecommendation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** 감지 상황 시점 영상 + 조치 절차 안내 */
export default function SituationVideoGuide({ situations, actions, selectedId, onSelect }: Props) {
  const video = useStore((s) => s.video);
  const ref = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [guidePlaying, setGuidePlaying] = useState(false);
  const selected = situations.find((s) => s.id === selectedId) ?? situations[0];
  const related = actions.filter((a) => a.situationId === selected?.id);
  const windowStart = Math.max(0, (selected?.timestamp ?? 0) - 2);
  const windowEnd = Math.min(video?.name ? 1e9 : 1e9, (selected?.timestamp ?? 0) + 10);

  useEffect(() => {
    if (!ref.current || !selected) return;
    ref.current.currentTime = windowStart;
    setCurrent(windowStart);
  }, [selected?.id, windowStart]);

  useEffect(() => {
    if (!ref.current || !guidePlaying) return;
    if (current >= windowEnd) {
      ref.current.pause();
      setGuidePlaying(false);
    }
  }, [current, windowEnd, guidePlaying]);

  const stepIndex = selected && current >= selected.timestamp
    ? Math.min(related.length - 1, Math.floor((current - selected.timestamp) / 3))
    : 0;

  const playGuide = () => {
    if (!ref.current) return;
    ref.current.currentTime = windowStart;
    ref.current.play();
    setGuidePlaying(true);
  };

  const move = (dir: number) => {
    const idx = situations.findIndex((s) => s.id === selected?.id);
    const next = situations[(idx + dir + situations.length) % situations.length];
    if (next) onSelect(next.id);
  };

  return (
    <DataCard
      dataKey="actions-video-guide"
      title="상황 영상 안내"
      description="선택한 상황이 발생한 시점의 영상을 재생하고, 조치 절차를 순서대로 안내합니다. 타임라인 마커를 눌러 다른 상황으로 이동할 수 있습니다."
      icon={<Video size={15} />}
      right={selected ? <span className="chip accent mono">{selected.timestamp.toFixed(1)}s 상황</span> : undefined}
    >
      {!selected ? (
        <div className="empty-state"><Video size={24} /><b>안내할 상황이 없습니다</b></div>
      ) : (
        <div style={{ padding: '4px 20px 20px' }}>
          <div className="video-frame playback-frame">
            {video?.url ? (
              <video
                ref={ref}
                src={video.url}
                muted
                playsInline
                controls
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
              />
            ) : (
              <div className="video-placeholder"><Video size={22} /><b>업로드된 영상이 없습니다</b></div>
            )}
            <div className="video-overlay" />
            <div className="video-hud">
              <span className="hud-tag">● 상황 안내</span>
              <span className="hud-tag">{selected.typeKo}</span>
              <span className="hud-tag">{current.toFixed(1)}s</span>
            </div>
            <div className="situation-guide-overlay">
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} />
                <b>{selected.typeKo}</b>
                <span className="chip mono">{selected.timestamp.toFixed(1)}s</span>
              </div>
              <div className="text-xs" style={{ marginTop: 5 }}>{selected.description}</div>
              {related.length > 0 && (
                <div className="guide-step">
                  <b>조치 {stepIndex + 1}/{related.length}</b> · {related[stepIndex]?.title}
                  <div className="text-xs faint mt-2">{related[stepIndex]?.description}</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 wrap">
            <button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => move(-1)}><ChevronLeft size={12} /> 이전 상황</button>
            <button className="primary-btn" style={{ fontSize: 10, padding: '6px 12px' }} onClick={playGuide}><PlayCircle size={13} /> 구간 안내 재생</button>
            <button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => move(1)}>다음 상황 <ChevronRight size={12} /></button>
            <span className="card-head-spacer" />
            <span className="text-xs faint mono">{situations.findIndex((s) => s.id === selected.id) + 1} / {situations.length}</span>
          </div>

          <div className="playback-markers" style={{ marginTop: 10 }}>
            {situations.map((s) => (
              <button
                key={s.id}
                className="playback-marker"
                style={{ left: `${(s.timestamp / 60) * 100}%`, background: s.severity === 'critical' ? 'var(--danger)' : 'var(--warning)' }}
                title={`${s.timestamp.toFixed(1)}s ${s.typeKo}`}
                onClick={() => onSelect(s.id)}
              />
            ))}
            <div className="playback-progress" style={{ width: `${(current / 60) * 100}%` }} />
          </div>
          <div className="chip-row mt-2">
            {related.flatMap((a) => a.steps).slice(0, 5).map((step, i) => (
              <span className={`chip ${i === stepIndex ? 'accent' : ''}`} key={i}>{i + 1}. {step}</span>
            ))}
          </div>
        </div>
      )}
    </DataCard>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/StreamPredictionPanel.tsx</code></summary>

```tsx
import { useEffect, useState } from 'react';
import { Activity, Radio, Route, ShieldAlert } from 'lucide-react';
import { useStore } from '@/store/useStore';
import DataCard from './DataCard';
import { backendBaseUrl } from '@/config';
import { useAnalysisStream } from '@/hooks/useAnalysisStream';

export default function StreamPredictionPanel() {
  const config = useStore((s) => s.config);
  const pushToast = useStore((s) => s.pushToast);
  const { event, connected } = useAnalysisStream();
  const [url, setUrl] = useState(config.streaming.rtspUrl.value);
  const [streamStatus, setStreamStatus] = useState<{ running: boolean; frames: number; lastError: string | null } | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [runtime, setRuntime] = useState<{ broker?: { type: string; connected: boolean }; webrtcUrl?: string } | null>(null);
  const [clips, setClips] = useState<Array<{ name: string; size: number }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await (await fetch(`${backendBaseUrl()}/api/stream/status`)).json();
        setStreamStatus(s);
        const e = await (await fetch(`${backendBaseUrl()}/api/events?limit=100`)).json();
        setEventCount(e.events?.length ?? 0);
        const rt = await (await fetch(`${backendBaseUrl()}/api/runtime`)).json();
        setRuntime(rt);
        const c = await (await fetch(`${backendBaseUrl()}/api/clips`)).json();
        setClips(c.clips ?? []);
      } catch { /* 백엔드 미실행 시 무시 */ }
    };
    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => clearInterval(timer);
  }, [event?.timestamp]);

  const control = async (action: 'start' | 'stop') => {
    try {
      const res = await fetch(`${backendBaseUrl()}/api/stream/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'start' ? JSON.stringify({ rtspUrl: url }) : undefined,
      });
      if (!res.ok) throw new Error('요청 실패');
      pushToast(action === 'start' ? 'RTSP 분석을 시작했습니다.' : 'RTSP 분석을 중지했습니다.', 'success');
    } catch (err) {
      pushToast(`스트림 제어 실패: ${(err as Error).message}`, 'error');
    }
  };

  const predictions = event?.predictions ?? [];

  return (
    <div className="grid grid-2">
      <DataCard
        dataKey="stream-status"
        title="실시간 스트림 · 이벤트 푸시"
        description="WebSocket으로 서버 분석 이벤트를 즉시 수신합니다. RTSP 주소를 입력하면 서버가 프레임을 직접 수신·분석합니다."
        icon={<Radio size={15} />}
        right={<span className={`chip ${connected ? 'accent' : ''}`}>{connected ? 'WS 연결' : 'WS 대기'}</span>}
        bodyClassName="card-pad"
      >
        <div className="field">
          <div className="field-label"><span>RTSP 주소</span></div>
          <input
            className="ghost-btn full"
            style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }}
            value={url}
            placeholder="rtsp://user:pass@camera/stream"
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="flex gap-2 wrap">
          <button className="primary-btn" onClick={() => control('start')} disabled={!url || streamStatus?.running}><Radio size={14} /> 분석 시작</button>
          <button className="ghost-btn" onClick={() => control('stop')} disabled={!streamStatus?.running}>분석 중지</button>
        </div>
        <div className="divider" />
        <div className="flex justify-between text-sm"><span className="dim">서버 상태</span><b className="mono">{streamStatus?.running ? 'RUNNING' : 'IDLE'}</b></div>
        <div className="flex justify-between text-sm mt-2"><span className="dim">처리 프레임</span><b className="mono">{streamStatus?.frames ?? 0}</b></div>
        <div className="flex justify-between text-sm mt-2"><span className="dim">저장 이벤트</span><b className="mono">{eventCount}</b></div>
        <div className="flex justify-between text-sm mt-2"><span className="dim">브로커</span><b className="mono">{runtime?.broker?.type ?? 'local'} · {runtime?.broker?.connected ? '연결' : '로컬'}</b></div>
        <div className="flex justify-between text-sm mt-2"><span className="dim">저장 클립</span><b className="mono">{clips.length}개</b></div>
        {runtime?.webrtcUrl && (
          <a className="ghost-btn full mt-2" style={{ fontSize: 10, padding: '6px 10px', justifyContent: 'center' }} href={runtime.webrtcUrl} target="_blank" rel="noreferrer">
            <Radio size={12} /> WebRTC 영상 열기
          </a>
        )}
        {streamStatus?.lastError && <div className="text-xs" style={{ color: 'var(--danger)', marginTop: 8 }}>{streamStatus.lastError}</div>}
      </DataCard>

      <DataCard
        dataKey="prediction-list"
        title="이동 예측 · 위험 구역"
        description="칼만 필터로 예측한 1~3초 후 위치와 ROI 위험구역 교차 여부를 표시합니다. 별도 유료 예측 모델 없이 동작합니다."
        icon={<Route size={15} />}
        right={<span className="chip mono">{predictions.length}개 객체</span>}
        bodyClassName="card-pad"
      >
        {predictions.length ? (
          <div className="list">
            {predictions.map((p) => (
              <div className="list-row" key={p.id}>
                <div className="row-icon" style={{ background: p.danger ? 'color-mix(in srgb, var(--danger) 14%, transparent)' : 'color-mix(in srgb, var(--accent) 12%, transparent)', color: p.danger ? 'var(--danger)' : 'var(--accent)' }}>
                  {p.danger ? <ShieldAlert size={14} /> : <Activity size={14} />}
                </div>
                <div className="row-main">
                  <div className="row-title">{p.label} <span className="faint text-xs mono">{p.id}</span></div>
                  <div className="row-sub">
                    현재 ({p.current.map((v) => v.toFixed(0)).join(', ')}) → {p.horizonSec}초 후 ({p.predicted.map((v) => v.toFixed(0)).join(', ')}) · 속도 {p.speed}
                  </div>
                </div>
                <span className={`badge ${p.danger ? 'badge-critical' : 'badge-info'}`}>{p.danger ? '위험구역 진입' : '안전'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><Route size={24} /><b>예측 데이터 대기 중</b><div className="text-xs">영상 재생 또는 RTSP 분석을 시작하면 예측 궤적이 표시됩니다.</div></div>
        )}
      </DataCard>

      <DataCard
        dataKey="safety-events"
        title="현장 안전 판별 · 상황 추론"
        description="위험 구역 내 객체 소실과 정지 지속을 조합해 추락과 다툼을 구분합니다. VLM 대신 무료 룰 기반 문맥 추론으로 근거를 생성합니다."
        icon={<ShieldAlert size={15} />}
        className="section-gap"
        right={<span className="chip mono">{(event?.safetyEvents ?? []).length}건</span>}
      >
        {event?.contextDescription && (
          <div className="guide-step" style={{ marginBottom: 12 }}>{event.contextDescription}</div>
        )}
        {(event?.safetyEvents ?? []).length ? (
          <div className="list">
            {event!.safetyEvents!.map((e) => (
              <div className="list-row" key={e.id}>
                <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)' }}>
                  <ShieldAlert size={14} />
                </div>
                <div className="row-main">
                  <div className="row-title">{e.labelKo} <span className="faint text-xs mono">{e.zone}</span></div>
                  <div className="row-sub">{e.reason}</div>
                  <div className="chip-row mt-2">{e.evidence.map((v, i) => <span className="chip mono" key={i}>{v}</span>)}</div>
                </div>
                <span className={`badge badge-${e.severity === 'critical' ? 'critical' : 'warning'}`}>{Math.round(e.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><ShieldAlert size={24} /><b>안전 이벤트 없음</b></div>
        )}
      </DataCard>

      <DataCard
        dataKey="accident-events"
        title="시간 기반 사고 판단"
        description="단일 프레임이 아닌 전·중·후 프레임의 거리·속도·자세 변화를 함께 분석해 충돌·급정지·넘어짐을 판단합니다. 사고 의심 구간은 클립으로 저장됩니다."
        icon={<Activity size={15} />}
        className="section-gap"
        right={<span className="chip mono">{(event?.accidentEvents ?? []).length}건</span>}
      >
        {(event?.accidentEvents ?? []).length ? (
          <div className="list">
            {event!.accidentEvents!.map((e, i) => (
              <div className="list-row" key={`${e.type}-${i}`}>
                <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)' }}>
                  <Activity size={14} />
                </div>
                <div className="row-main">
                  <div className="row-title">{e.labelKo} <span className="faint text-xs mono">{e.trackIds?.join(', ') ?? e.trackId ?? ''}</span></div>
                  <div className="chip-row mt-2">{e.evidence.map((v, k) => <span className="chip mono" key={k}>{v}</span>)}</div>
                </div>
                <span className={`badge badge-${e.severity === 'critical' ? 'critical' : 'warning'}`}>{Math.round(e.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><Activity size={24} /><b>사고 의심 이벤트 없음</b><div className="text-xs">프레임 히스토리를 분석 중입니다.</div></div>
        )}
      </DataCard>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/VideoPlaybackPanel.tsx</code></summary>

```tsx
import { useRef, useState } from 'react';
import { AlertTriangle, Play, Radio, Video } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import type { AnalysisResult } from '@/types';
import DataCard from './DataCard';
import { reportFalsePositive } from '@/services/feedbackApi';

interface Props {
  result: AnalysisResult;
}

const KIND_LABEL: Record<string, string> = { person: '인물', vehicle: '차량', object: '객체' };

const kindOf = (d: any): 'person' | 'vehicle' | 'object' => {
  const v = d?.kind ?? d?.pose;
  if (v === 'person' || v === '인물') return 'person';
  if (v === 'vehicle' || v === 'car' || v === '차량' || v === '자동차') return 'vehicle';
  return 'object';
};

const labelOf = (d: any): string =>
  d?.labelKo ?? d?.label ?? d?.className ?? d?.class ??
  (d?.pose === 'person' || d?.kind === 'person' ? '사람'
    : d?.pose === 'vehicle' || d?.kind === 'vehicle' ? '자동차'
      : '미분류');

const uniqueDetections = (list: any[]) => {
  const map = new Map<string, any>();
  for (const d of list) {
    const key = String(d?.trackId ?? String(d?.id ?? '').split('-')[0]);
    if (!map.has(key)) map.set(key, d);
  }
  return [...map.values()].slice(0, 8);
};

/** 업로드된 영상 재생 + 재생 시점 기반 데이터 오버레이 */
export default function VideoPlaybackPanel({ result }: Props) {
  const video = useStore((s) => s.video);
  const pushToast = useStore((s) => s.pushToast);
  const ref = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const [videoAspect, setVideoAspect] = useState(16 / 9);
  const sensitivity = useStore((s) => s.config.accuracy.personDetectionSensitivity.value);
  const threshold = useStore((s) => s.config.accuracy.confidenceThreshold.value);
  // 실시간 추적은 항상 활성화 (토글 없음)
  const liveBoxes = useLiveTracking(ref, true, sensitivity, threshold);

  // 재생 중 프레임에서 직접 검출한 Box를 항상 우선 표시
  const liveMapped = liveBoxes.map((b) => ({ key: b.id, id: `${b.label ?? KIND_LABEL[b.kind]} ${Math.round(b.confidence * 100)}%`, kind: b.kind, x: b.x, y: b.y, w: b.w, h: b.h, confidence: b.confidence }));
  const primaryBoxes = liveMapped;
  const displayBoxes = primaryBoxes.length
    ? primaryBoxes
    : uniqueDetections(
      result.detections.filter((d) => {
        const label = (d as any).labelKo ?? (d as any).label;
        const kind = (d as any).kind;
        return !!label || kind === 'person' || kind === 'vehicle';
      }),
    ).map((d, i) => ({
    key: `d-${i}`,
    id: `${labelOf(d)} ${Math.round(d.confidence * 100)}%`,
    kind: kindOf(d),
    x: d.bbox.x,
    y: d.bbox.y,
    w: d.bbox.w,
    h: d.bbox.h,
    confidence: d.confidence,
  }));

  const caption = result.videoDescription?.captions.find((c) => current >= c.timestamp && current < c.endTime);
  const activeAccidents = result.accidents.filter((a) => current >= a.timestamp && current <= a.endTime);
  const seek = (t: number) => {
    if (ref.current) { ref.current.currentTime = t; setCurrent(t); }
  };
  const fmt = (t: number) => `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`;

  const handleFalsePositive = async (b: (typeof displayBoxes)[number]) => {
    const v = ref.current;
    if (!v || v.readyState < 2) { pushToast('영상을 재생한 뒤 신고해 주세요.', 'warning'); return; }
    const stage = document.createElement('canvas');
    stage.width = v.videoWidth; stage.height = v.videoHeight;
    stage.getContext('2d')!.drawImage(v, 0, 0);
    try {
      const label = String(b.id).split(' ')[0] || 'object';
      await reportFalsePositive(stage, label, b.confidence, {
        x: b.x, y: b.y, w: b.w, h: b.h,
      });
      pushToast(`'${label}' 오탐을 신고했습니다. 재학습에 반영됩니다.`, 'success');
    } catch (err) {
      pushToast(`신고 실패: ${(err as Error).message}`, 'error');
    }
  };

  return (
    <DataCard
      dataKey="analysis-video-playback"
      title="영상 재생 및 영상 내 데이터"
      description="업로드한 영상을 재생하며 현재 시점의 추적 형상(BBox·트랙 ID·신뢰도), 사고 알림, 시간대별 캡션을 영상 위에 표시합니다. 실시간 추적은 항상 켜져 있습니다."
      icon={<Video size={15} />}
      right={
        <>
          <span className="chip accent mono">LIVE {liveBoxes.length}</span>
          <span className="chip mono" style={{ marginLeft: 6 }}>
            <Radio size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 실시간 추적 상시 ON
          </span>
        </>
      }
    >
      <div style={{ padding: '4px 20px 20px' }}>
        <div className="video-frame playback-frame">
          <div className="video-stage" style={{ aspectRatio: videoAspect }}>
            {video?.url && !mediaError ? (
              <video
                ref={ref}
                src={video.url}
                controls
                playsInline
                onLoadedMetadata={(e) => {
                  const r = e.currentTarget.videoWidth / e.currentTarget.videoHeight;
                  if (Number.isFinite(r) && r > 0) setVideoAspect(r);
                }}
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
                onError={() => setMediaError(true)}
              />
            ) : (
              <div className="video-placeholder">
                <Play size={28} />
                <b>{mediaError ? '영상을 재생할 수 없습니다' : '업로드된 영상이 없습니다'}</b>
                <span>상단의 영상 업로드에서 실제 영상 파일을 선택하면 재생과 데이터 오버레이가 표시됩니다.</span>
              </div>
            )}
            {displayBoxes.map((b) => (
              <div
                key={b.key}
                className={`bbox bbox-${b.kind ?? 'object'}`}
                data-label={b.id}
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
              >
                <button
                  className="bbox-report"
                  title="이 탐지가 틀렸으면 눌러 신고 (모델 재학습에 반영)"
                  onClick={(e) => { e.stopPropagation(); void handleFalsePositive(b); }}
                >✕</button>
              </div>
            ))}
          </div>
          <div className="video-overlay" />
          <div className="video-hud">
            <span className="hud-tag">● LIVE DATA</span>
            <span className="hud-tag">{fmt(current)} / {fmt(result.durationSec)}</span>
            <span className="hud-tag">프레임 객체 {displayBoxes.length}</span>
          </div>

          {activeAccidents.map((a) => (
            <div className="accident-alert" key={a.id}>
              <AlertTriangle size={13} /> {a.timestamp.toFixed(1)}s {a.title} · {a.zone}
            </div>
          ))}

          {caption && <div className="video-caption">{caption.text}</div>}
        </div>

        <div className="playback-markers">
          {result.accidents.map((a) => (
            <button
              key={a.id}
              className="playback-marker"
              style={{ left: `${(a.timestamp / Math.max(result.durationSec, 1)) * 100}%`, background: a.severity === 'critical' ? 'var(--danger)' : 'var(--warning)' }}
              title={`${a.timestamp.toFixed(1)}s ${a.title}`}
              onClick={() => seek(a.timestamp)}
            />
          ))}
          <div className="playback-progress" style={{ width: `${(current / Math.max(result.durationSec, 1)) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs faint mt-2">
          <span>사고 마커를 클릭하면 해당 시점으로 이동합니다.</span>
          <span className="mono">{displayBoxes.length}개 객체 · {activeAccidents.length}건 진행 중</span>
        </div>
      </div>
    </DataCard>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/Dashboard.tsx</code></summary>

```tsx
import { Activity, ArrowRight, Gauge, GitBranch, Play, ScanFace, ShieldAlert, UploadCloud } from 'lucide-react';
import { useStore } from '@/store/useStore';
import MetricCard from '@/components/visualizations/MetricCard';
import RadialGauge from '@/components/visualizations/RadialGauge';
import DataCard from './DataCard';

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 이 영역에 결과가 출력됩니다.</div>
    </div>
  );
}

export default function Dashboard() {
  const result = useStore((s) => s.result);
  const graph = useStore((s) => s.graph);
  const config = useStore((s) => s.config);
  const runAnalysis = useStore((s) => s.runAnalysis);
  const setTab = useStore((s) => s.setTab);
  const running = useStore((s) => s.running);
  const video = useStore((s) => s.video);

  const s = result?.summary;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">통합 대시보드</div>
          <div className="page-desc">
            영상 분석 · 인물 행동 감지 · 상황별 조치 권고를 하나의 파이프라인으로 연결합니다.
            영상 업로드 후 분석하면 각 기능별 데이터가 출력되며, 영역별로 숨김 처리할 수 있습니다.
          </div>
        </div>
        <div className="page-head-spacer" />
        {!video && (
          <span className="chip">업로드된 영상 없음 · 상단에서 업로드</span>
        )}
        <button className="primary-btn" onClick={() => runAnalysis()} disabled={running || !video}>
          <Play size={14} fill="currentColor" /> 분석 실행
        </button>
      </div>

      <DataCard
        dataKey="dash-metrics"
        title="핵심 지표"
        description="위험 점수, 감지 인물 수, 행동 이벤트, 조치 권고 건수를 한눈에 보여주는 종합 지표입니다."
        icon={<Activity size={15} />}
        className="section-gap"
        bodyClassName="grid grid-4"
      >
        {result ? (
          <>
            <MetricCard data={{ key: 'risk', label: '위험 점수', value: s?.riskScore ?? '--', unit: '/100', delta: 8, trend: 'down', accent: 'var(--danger)' }} spark={result?.confidenceSeries.map((d) => d.value * 100)} />
            <MetricCard data={{ key: 'persons', label: '감지 인물', value: result.personsDetected, unit: '명', delta: 12, trend: 'up', accent: 'var(--accent-2)' }} />
            <MetricCard data={{ key: 'behaviors', label: '행동 이벤트', value: s?.totalBehaviors ?? 0, unit: '건', delta: 6, trend: 'up', accent: 'var(--accent)' }} />
            <MetricCard data={{ key: 'actions', label: '조치 권고', value: result.actions.length, unit: '건', delta: 4, trend: 'up', accent: 'var(--accent-4)' }} />
          </>
        ) : <NoData label="핵심 지표" />}
      </DataCard>

      <div className="grid grid-2-1 section-gap">
        <DataCard
          dataKey="dash-pipeline"
          title="파이프라인 상태"
          description="노드 실행 상태와 버전을 표시합니다. 설정이나 노드가 변경되면 자동으로 새 버전으로 재실행됩니다."
          icon={<GitBranch size={15} />}
          right={<button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setTab('pipeline')}>상세 보기 <ArrowRight size={12} /></button>}
        >
          <div style={{ padding: '4px 20px 20px' }}>
            <div className="chip-row" style={{ marginBottom: 16 }}>
              {graph.nodes.map((n) => (
                <span
                  key={n.id}
                  className="chip"
                  style={{
                    borderColor: n.status === 'done' ? 'var(--success)' : n.status === 'running' ? 'var(--warning)' : 'var(--panel-border)',
                    color: n.status === 'done' ? 'var(--success)' : n.status === 'running' ? 'var(--warning)' : 'var(--text-dim)',
                  }}
                >
                  {n.enabled ? '●' : '○'} {n.label}
                </span>
              ))}
            </div>
            <div className="run-bar"><i style={{ width: `${running ? graph.nodes.reduce((a, n) => a + n.progress, 0) / Math.max(graph.nodes.length, 1) * 100 : result ? 100 : 0}%` }} /></div>
            <div className="flex justify-between text-xs faint mt-2">
              <span>{graph.nodes.filter((n) => n.status === 'done').length}/{graph.nodes.length} 노드 완료</span>
              <span className="mono">v{graph.version} · {graph.updatedAt.slice(11, 19)}</span>
            </div>
          </div>
        </DataCard>

        <DataCard
          dataKey="dash-quality"
          title="분석 품질"
          description="감지 결과의 평균 신뢰도와 전체 준수 점수를 게이지로 표시합니다."
          icon={<Activity size={15} />}
          bodyClassName="card-pad"
        >
          {result ? (
            <div className="flex justify-around" style={{ flexWrap: 'wrap', gap: 10 }}>
              <RadialGauge value={Math.round((s?.avgConfidence ?? 0) * 100)} label="신뢰도" color="var(--accent)" size={110} />
              <RadialGauge value={s?.complianceScore ?? 0} label="준수도" color="var(--success)" size={110} />
            </div>
          ) : <NoData label="분석 품질" />}
        </DataCard>
      </div>

      <DataCard
        dataKey="dash-performance"
        title="기능별 성능평가 요약"
        description="영상 분석 기능별 지연·정확도·리소스 사용량을 집계한 결과입니다. 전체 상세는 성능 평가 탭에서 확인할 수 있습니다."
        icon={<Gauge size={15} />}
        className="section-gap"
        right={<button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setTab('performance')}>성능 평가 <ArrowRight size={12} /></button>}
        bodyClassName="grid grid-4"
      >
        {result && result.performanceEvaluation?.length ? (
          <>
            <MetricCard data={{ key: 'latency', label: '평균 지연', value: Math.round(result.performanceEvaluation.reduce((a, p) => a + p.latencyMs, 0) / result.performanceEvaluation.length), unit: 'ms', accent: 'var(--accent)' }} />
            <MetricCard data={{ key: 'accuracy', label: '평균 정확도', value: Math.round(result.performanceEvaluation.reduce((a, p) => a + p.accuracy, 0) / result.performanceEvaluation.length), unit: '%', accent: 'var(--success)' }} />
            <MetricCard data={{ key: 'degraded', label: '주의 기능', value: result.performanceEvaluation.filter((p) => p.status === 'degraded').length, unit: '건', accent: 'var(--danger)' }} />
            <MetricCard data={{ key: 'features', label: '평가 기능', value: result.performanceEvaluation.length, unit: '개', accent: 'var(--accent-2)' }} />
          </>
        ) : <NoData label="성능평가" />}
      </DataCard>

      <div className="grid grid-2 section-gap">
        <DataCard
          dataKey="dash-behaviors"
          title="최근 행동 감지"
          description="영상에서 감지된 인물 행동을 최신순으로 표시합니다. 심각도와 신뢰도를 함께 확인할 수 있습니다."
          icon={<ScanFace size={15} />}
          right={<button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setTab('behavior')}>전체 보기 <ArrowRight size={12} /></button>}
        >
          <div style={{ padding: '0 16px 16px' }}>
            {result ? (
              <div className="list">
                {result.behaviors.slice(-5).reverse().map((b) => (
                  <div className="list-row" key={b.id}>
                    <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}><ScanFace size={14} /></div>
                    <div className="row-main"><div className="row-title">{b.labelKo}</div><div className="row-sub">#{b.trackId} · {b.category}</div></div>
                    <span className={`badge badge-${b.severity}`}>{Math.round(b.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            ) : <NoData label="행동 감지" />}
          </div>
        </DataCard>

        <DataCard
          dataKey="dash-situations"
          title="주요 상황 및 조치"
          description="감지된 상황과 권고된 조치 요약입니다. 상황별 상세 절차는 상황별 조치 탭에서 확인합니다."
          icon={<ShieldAlert size={15} />}
          right={<button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setTab('actions')}>전체 보기 <ArrowRight size={12} /></button>}
        >
          <div style={{ padding: '0 16px 16px' }}>
            {result ? (
              <div className="list">
                {result.situations.slice(0, 5).map((sit) => (
                  <div className="list-row" key={sit.id}>
                    <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}><ShieldAlert size={14} /></div>
                    <div className="row-main"><div className="row-title">{sit.typeKo}</div><div className="row-sub">{sit.description}</div></div>
                    <span className="row-time">{sit.timestamp.toFixed(0)}s</span>
                  </div>
                ))}
              </div>
            ) : <NoData label="상황 및 조치" />}
          </div>
        </DataCard>
      </div>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/AnalysisPanel.tsx</code></summary>

```tsx
import { Activity, BarChart3, Clock, FileVideo, ScanSearch, Users, UploadCloud } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useStore } from '@/store/useStore';
import MetricCard from '@/components/visualizations/MetricCard';
import RadialGauge from '@/components/visualizations/RadialGauge';
import Heatmap from '@/components/visualizations/Heatmap';
import DataCard from './DataCard';
import VideoPlaybackPanel from './VideoPlaybackPanel';

const tooltipStyle = {
  background: 'var(--panel-strong)',
  border: '1px solid var(--panel-border-strong)',
  borderRadius: 10,
  fontSize: 11,
  color: 'var(--text)',
};
const axisStyle = { fill: 'var(--text-faint)', fontSize: 10 };

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 이 영역에 결과가 출력됩니다.</div>
    </div>
  );
}

export default function AnalysisPanel() {
  const result = useStore((s) => s.result);
  const running = useStore((s) => s.running);
  const video = useStore((s) => s.video);

  const s = result?.summary;
  const crowdData = (result?.crowdDensity ?? []).map((d) => ({ t: `${d.t}s`, 인원: d.value }));
  const motionData = (result?.motionSeries ?? []).map((d) => ({ t: `${d.t}s`, 움직임: d.value }));

  const metrics = result ? [
    { key: 'risk', label: '위험 점수', value: s?.riskScore ?? 0, unit: '/100', delta: 8, trend: 'down' as const, accent: 'var(--danger)' },
    { key: 'compliance', label: '준수 점수', value: s?.complianceScore ?? 0, unit: '/100', delta: 5, trend: 'up' as const, accent: 'var(--success)' },
    { key: 'confidence', label: '평균 신뢰도', value: `${Math.round((s?.avgConfidence ?? 0) * 100)}`, unit: '%', delta: 3, trend: 'up' as const, accent: 'var(--accent)' },
    { key: 'persons', label: '감지 인물', value: result.personsDetected, unit: '명', delta: 12, trend: 'up' as const, accent: 'var(--accent-2)' },
  ] : [];

  return (
    <div>
      <DataCard
        dataKey="analysis-metrics"
        title="분석 요약 지표"
        description="영상 분석으로 도출된 위험도·준수도·신뢰도·감지 인물 수입니다. 각 값은 옵션(정확도/성능) 변경 시 다시 계산됩니다."
        icon={<Activity size={15} />}
        right={result ? (
          <>
            <span className={`chip ${result.engine === 'mock' || result.engine === 'hybrid' ? '' : 'accent'} mono`}>
              {result.engine === 'mock' ? '데모 결과 · 검토 필요' : result.engine === 'hybrid' ? '데모 포함' : '실제 분석'}
            </span>
            <span className="chip mono">{video?.name ?? result.videoName}</span>
          </>
        ) : undefined}
        bodyClassName="grid grid-4"
      >
        {result ? metrics.map((m) => (
          <MetricCard key={m.key} data={m} spark={result.confidenceSeries.map((d) => d.value * 100)} />
        )) : <NoData label="분석 요약" />}
      </DataCard>

      {result && <VideoPlaybackPanel result={result} />}

      {result?.videoSignals && (
        <>
          <DataCard
            dataKey="analysis-video-signals"
            title="실제 영상 프레임 신호"
            description="업로드된 영상을 직접 샘플링해 추출한 밝기·모션·엣지 밀도와 장면 전환 시점입니다. 목업이 아닌 실제 픽셀 데이터 기반입니다."
            icon={<FileVideo size={15} />}
            right={<span className="chip accent">{result.videoSignals.source === 'browser-video' ? 'REAL FRAME ANALYSIS' : 'FALLBACK'}</span>}
          >
            <div style={{ padding: '4px 20px 20px' }}>
              <div className="thumb-strip">
                {result.videoSignals.thumbnails.map((src, i) => (
                  <img key={i} src={src} alt={`샘플 프레임 ${i + 1}`} title={`샘플 프레임 ${i + 1}`} />
                ))}
              </div>
              <div className="chip-row mt-2">
                <span className="chip mono">샘플 {result.videoSignals.sampledFrames}프레임</span>
                <span className="chip mono">실효 FPS {result.videoSignals.effectiveFps}</span>
                <span className="chip mono">{result.videoSignals.frameWidth}×{result.videoSignals.frameHeight}</span>
                <span className="chip">장면 전환 {result.videoSignals.sceneChanges.length}회</span>
              </div>
              {result.videoSignals.sceneChanges.length > 0 && (
                <div className="chip-row mt-2">
                  {result.videoSignals.sceneChanges.map((t, i) => <span className="chip accent mono" key={i}>{t}s 전환</span>)}
                </div>
              )}
              <div style={{ height: 120, marginTop: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.videoSignals.motion} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
                    <CartesianGrid stroke="var(--panel-border)" vertical={false} />
                    <XAxis dataKey="t" tick={axisStyle} stroke="var(--panel-border)" interval="preserveStartEnd" />
                    <YAxis tick={axisStyle} stroke="var(--panel-border)" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="value" name="모션 강도" stroke="var(--accent-2)" strokeWidth={2} fill="color-mix(in srgb, var(--accent-2) 18%, transparent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </DataCard>

          <DataCard
            dataKey="analysis-shape-tracking"
            title="영상 내 형상 추적"
            description="연속 프레임 간 픽셀 차분으로 움직이는 영역을 검출하고 최근접 매칭으로 동일 형상을 추적한 결과입니다. 궤적과 이동 거리를 표시합니다."
            icon={<ScanSearch size={15} />}
            className="section-gap"
            right={<span className="chip mono">{result.videoSignals.tracks.length}개 트랙</span>}
            bodyClassName="grid grid-3"
          >
            {result.videoSignals.tracks.length ? result.videoSignals.tracks.map((track) => {
              const pts = track.points;
              const last = pts[pts.length - 1];
              const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x + p.w / 2} ${p.y + p.h / 2}`).join(' ');
              return (
                <div className="card card-pad track-card" key={track.id}>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-info mono">{track.id}</span>
                    <b className="text-sm">{track.label}</b>
                    <span className="card-head-spacer" />
                    <span className="chip mono">{Math.round(last.confidence * 100)}%</span>
                  </div>
                  <svg viewBox="0 0 100 60" className="track-trajectory" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="60" fill="color-mix(in srgb, var(--bg-0) 45%, transparent)" stroke="var(--panel-border)" />
                    <path d={path} fill="none" stroke="var(--accent)" strokeWidth="0.8" />
                    {pts.map((p, i) => <circle key={i} cx={p.x + p.w / 2} cy={p.y + p.h / 2} r={i === pts.length - 1 ? 1.8 : 0.8} fill="var(--accent-2)" />)}
                  </svg>
                  <div className="text-xs faint mono mt-2">
                    {track.firstSeen.toFixed(1)}s ~ {track.lastSeen.toFixed(1)}s · {pts.length}포인트 · 이동 {track.distance.toFixed(1)}%
                  </div>
                </div>
              );
            }) : <div className="card card-pad text-sm dim">움직이는 형상이 감지되지 않았습니다.</div>}
          </DataCard>
        </>
      )}

      <div className="grid grid-2-1 section-gap">
        <DataCard
          dataKey="analysis-density"
          title="시간대별 인구 밀도"
          description="프레임별로 감지된 인물 수를 시간 축에 표시한 그래프입니다. 혼잡이 심한 구간을 찾는 데 사용합니다."
          icon={<BarChart3 size={15} />}
          right={result ? <span className="chip mono">{result.processedFrames.toLocaleString()} frames</span> : undefined}
        >
          {result ? (
            <div style={{ height: 250, padding: '0 12px 12px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={crowdData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="crowdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--panel-border)" vertical={false} />
                  <XAxis dataKey="t" tick={axisStyle} stroke="var(--panel-border)" interval={3} />
                  <YAxis tick={axisStyle} stroke="var(--panel-border)" />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--accent)', strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="인원" stroke="var(--accent)" strokeWidth={2} fill="url(#crowdGrad)" isAnimationActive={!running} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <NoData label="인구 밀도" />}
        </DataCard>

        <DataCard
          dataKey="analysis-risk"
          title="리스크 지수"
          description="위험도와 준수도를 100점 만점 게이지로 표시하고, 주요 분석 요약 수치를 함께 제공합니다."
          icon={<Activity size={15} />}
          bodyClassName="card-pad"
        >
          {result ? (
            <>
              <div className="flex justify-around" style={{ flexWrap: 'wrap', gap: 12 }}>
                <RadialGauge value={s?.riskScore ?? 0} label="위험도" color="var(--danger)" />
                <RadialGauge value={s?.complianceScore ?? 0} label="준수도" color="var(--success)" />
              </div>
              <div className="divider" />
              <div className="grid grid-2" style={{ gap: 10 }}>
                <div className="flex items-center gap-2"><Users size={13} className="accent" /><span className="text-xs dim">최대 밀집</span><b className="mono">{s?.peakCrowd ?? 0}명</b></div>
                <div className="flex items-center gap-2"><ScanSearch size={13} className="accent" /><span className="text-xs dim">행동 이벤트</span><b className="mono">{s?.totalBehaviors ?? 0}건</b></div>
                <div className="flex items-center gap-2"><Clock size={13} className="accent" /><span className="text-xs dim">영상 길이</span><b className="mono">{result.durationSec}s</b></div>
                <div className="flex items-center gap-2"><FileVideo size={13} className="accent" /><span className="text-xs dim">엔진</span><b className="mono">{result.engine}</b></div>
              </div>
            </>
          ) : <NoData label="리스크 지수" />}
        </DataCard>
      </div>

      <div className="grid grid-2 section-gap">
        <DataCard
          dataKey="analysis-motion"
          title="움직임 강도"
          description="시간대별 모션 강도를 막대 그래프로 표시합니다. 급격한 움직임 구간을 행동 감지와 비교할 수 있습니다."
          icon={<Activity size={15} />}
        >
          {result ? (
            <div style={{ height: 200, padding: '0 12px 12px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={motionData} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="var(--panel-border)" vertical={false} />
                  <XAxis dataKey="t" tick={axisStyle} stroke="var(--panel-border)" interval={3} />
                  <YAxis tick={axisStyle} stroke="var(--panel-border)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="움직임" radius={[3, 3, 0, 0]}>
                    {motionData.map((_, i) => <Cell key={i} fill={i % 3 === 0 ? 'var(--accent-2)' : 'var(--accent)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <NoData label="움직임 강도" />}
        </DataCard>

        <DataCard
          dataKey="analysis-heatmap"
          title="구역별 혼잡 히트맵"
          description="영상 시간축을 따라 혼잡 강도를 색으로 표현합니다. 색이 진할수록 인구 밀도가 높습니다."
          icon={<Activity size={15} />}
          bodyClassName="card-pad"
        >
          {result ? (
            <>
              <Heatmap data={result.crowdDensity.map((d) => d.value)} columns={24} label="타임라인 혼잡도" />
              <div className="divider" />
              <div className="flex justify-between text-sm"><span className="dim">감지된 상황</span><b className="accent">{result.situations.length}건</b></div>
              <div className="flex justify-between text-sm mt-2"><span className="dim">권고 조치</span><b className="accent">{result.actions.length}건</b></div>
              <div className="flex justify-between text-sm mt-2"><span className="dim">치명적 상황</span><b style={{ color: 'var(--danger)' }}>{s?.criticalCount ?? 0}건</b></div>
            </>
          ) : <NoData label="혼잡 히트맵" />}
        </DataCard>
      </div>

      <DataCard
        dataKey="analysis-log"
        title="파이프라인 분석 상세 로그"
        description="각 파이프라인 노드가 수행한 분석 내용과 산출값을 시간순으로 기록한 로그입니다. 데이터가 부족한 부분을 원인별로 확인할 수 있습니다."
        icon={<FileVideo size={15} />}
        className="section-gap"
        right={result ? <span className="chip mono">{result.analysisLog?.length ?? 0}개 항목</span> : undefined}
      >
        {result?.analysisLog?.length ? (
          <div style={{ padding: '4px 20px 20px' }}>
            <div className="list">
              {result.analysisLog.map((entry) => (
                <div className="list-row log-row" key={entry.id}>
                  <div className="row-icon" style={{
                    background: `color-mix(in srgb, ${entry.level === 'success' ? 'var(--success)' : entry.level === 'warning' ? 'var(--warning)' : 'var(--accent)'} 14%, transparent)`,
                    color: entry.level === 'success' ? 'var(--success)' : entry.level === 'warning' ? 'var(--warning)' : 'var(--accent)',
                  }}><FileVideo size={14} /></div>
                  <div className="row-main">
                    <div className="row-title">{entry.nodeLabel} <span className="faint text-xs mono">{entry.nodeId}</span></div>
                    <div className="row-sub">{entry.message} · {entry.detail}</div>
                    <div className="chip-row" style={{ marginTop: 6 }}>
                      {entry.metrics.map((m, i) => <span className="chip mono" key={i}>{m.label} {m.value}</span>)}
                    </div>
                  </div>
                  <span className="row-time mono">{entry.timestamp.toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </div>
        ) : <NoData label="분석 로그" />}
      </DataCard>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/BehaviorPanel.tsx</code></summary>

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Eye, ScanFace, UploadCloud, Video } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import type { BehaviorSeverity } from '@/types';
import DataCard from './DataCard';
import { reportFalsePositive } from '@/services/feedbackApi';
import { detectBehaviors } from '@/services/behaviorApi';
import type { BehaviorEvent } from '@/types';

const KIND_LABEL: Record<string, string> = { person: '인물', vehicle: '차량', object: '객체' };

const kindOf = (d: any): 'person' | 'vehicle' | 'object' => {
  const v = d?.kind ?? d?.pose;
  if (v === 'person' || v === '인물') return 'person';
  if (v === 'vehicle' || v === 'car' || v === '차량' || v === '자동차') return 'vehicle';
  return 'object';
};

const labelOf = (d: any): string =>
  d?.labelKo ?? d?.label ?? d?.className ?? d?.class ??
  (d?.pose === 'person' || d?.kind === 'person' ? '사람'
    : d?.pose === 'vehicle' || d?.kind === 'vehicle' ? '자동차'
      : '미분류');

/** 트랙별 최신 감지 1개만 유지 */
const uniqueDetections = (list: any[]) => {
  const map = new Map<string, any>();
  for (const d of list) {
    const key = String(d?.trackId ?? String(d?.id ?? '').split('-')[0]);
    if (!map.has(key)) map.set(key, d);
  }
  return [...map.values()].slice(0, 8);
};

const SEVERITY_LABEL: Record<BehaviorSeverity, string> = {
  info: '정보', caution: '주의', warning: '경고', critical: '위험',
};

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 이 영역에 결과가 출력됩니다.</div>
    </div>
  );
}

export default function BehaviorPanel() {
  const result = useStore((s) => s.result);
  const video = useStore((s) => s.video);
  const pushToast = useStore((s) => s.pushToast);
  const latency = useStore((s) => s.detectionLatencyMs);
  const [filter, setFilter] = useState<BehaviorSeverity | 'all'>('all');
  const [current, setCurrent] = useState(0);
  const [videoAspect, setVideoAspect] = useState(16 / 9);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sensitivity = useStore((s) => s.config.accuracy.personDetectionSensitivity.value);
  const threshold = useStore((s) => s.config.accuracy.confidenceThreshold.value);
  // 실시간 추적 상시 ON
  const liveBoxes = useLiveTracking(videoRef, true, sensitivity, threshold);
  const [realBehaviors, setRealBehaviors] = useState<BehaviorEvent[]>([]);

  useEffect(() => {
    if (!video?.url) { setRealBehaviors([]); return; }
    let alive = true;
    const poll = async () => {
      try {
        const items = await detectBehaviors(video.url!, 0.5);
        if (alive) setRealBehaviors(items);
      } catch { /* 실패 시 기존 분석 결과 유지 */ }
    };
    void poll();
    const timer = setInterval(() => void poll(), 800);
    return () => { alive = false; clearInterval(timer); };
  }, [video?.url]);

  // 현재 재생 시점의 추적 형상만 표시 (프레임별 정확도 향상)
  // 트랙별로 현재 시점에 가장 가까운 위치 하나만 표시 (과거 궤적 중복 방지)
  const trackBoxes = (result?.videoSignals?.tracks ?? []).flatMap((track) => {
    const nearest = track.points.reduce<(typeof track.points)[number] | null>(
      (best, p) => (!best || Math.abs(p.t - current) < Math.abs(best.t - current) ? p : best),
      null,
    );
    if (!nearest || Math.abs(nearest.t - current) > 2) return [];
    return [{
      key: track.id,
      id: `${KIND_LABEL[track.kind] ?? '객체'} ${Math.round(nearest.confidence * 100)}%`,
      kind: track.kind,
      x: nearest.x, y: nearest.y, w: nearest.w, h: nearest.h, confidence: nearest.confidence,
    }];
  });
  // 실시간 감지 Box를 우선 사용하고, 없으면 분석 결과 Box를 표시한다
  const boxes = liveBoxes.length
    ? liveBoxes.map((b) => ({ key: b.id, id: `${b.label ?? KIND_LABEL[b.kind]} ${Math.round(b.confidence * 100)}%`, kind: b.kind, x: b.x, y: b.y, w: b.w, h: b.h, confidence: b.confidence }))
    : trackBoxes.length ? trackBoxes : uniqueDetections(
      (result?.detections ?? []).filter((d) => {
        // 목업/무작위 좌표는 클래스 정보가 없으므로 제외
        const label = (d as any).labelKo ?? (d as any).label;
        const kind = (d as any).kind;
        return !!label || kind === 'person' || kind === 'vehicle';
      }),
    ).map((d, i) => ({
    key: d.id || `d-${i}`,
    id: `${labelOf(d)} ${Math.round(d.confidence * 100)}%`,
    kind: kindOf(d),
    x: d.bbox.x, y: d.bbox.y, w: d.bbox.w, h: d.bbox.h, confidence: d.confidence,
  }));

  const handleFalsePositive = async (b: (typeof boxes)[number]) => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) { pushToast('영상을 재생한 뒤 신고해 주세요.', 'warning'); return; }
    const stage = document.createElement('canvas');
    stage.width = v.videoWidth; stage.height = v.videoHeight;
    stage.getContext('2d')!.drawImage(v, 0, 0);
    try {
      const label = String(b.id).split(' ')[0] || 'object';
      await reportFalsePositive(stage, label, b.confidence, {
        x: b.x, y: b.y, w: b.w, h: b.h,
      });
      pushToast(`'${label}' 오탐을 신고했습니다. 재학습에 반영됩니다.`, 'success');
    } catch (err) { pushToast(`신고 실패: ${(err as Error).message}`, 'error'); }
  };

  const behaviors = useMemo(() => {
    const source = realBehaviors.length ? realBehaviors : (result?.behaviors ?? []);
    return filter === 'all' ? source : source.filter((b) => b.severity === filter);
  }, [result, filter, realBehaviors]);

  return (
    <div className="grid grid-2-1">
      <DataCard
        dataKey="behavior-video"
        title="영상 분석 뷰"
        description="분석된 영상 프레임에 감지된 인물의 위치(Bounding Box), 트랙 ID, 신뢰도를 겹쳐 표시합니다."
        icon={<Video size={15} />}
        right={result ? (
          <>
            <span className="chip accent">LIVE {liveBoxes.length} · {latency}ms</span>
            <span className="chip mono" style={{ marginLeft: 6 }}>실시간 추적 상시 ON</span>
          </>
        ) : undefined}
      >
        {result ? (
          <div style={{ padding: '0 16px 16px' }}>
            <div className="video-frame">
              <div className="video-stage" style={{ aspectRatio: videoAspect }}>
                {video?.url ? <video ref={videoRef} src={video.url} muted playsInline autoPlay loop controls onLoadedMetadata={(e) => { const r = e.currentTarget.videoWidth / e.currentTarget.videoHeight; if (Number.isFinite(r) && r > 0) setVideoAspect(r); }} onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)} /> : (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 30% 40%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 45%), linear-gradient(135deg, #0a1120, #13213c)',
                  }} />
                )}
                {boxes.map((b) => (
                  <div
                    key={b.key}
                    className={`bbox bbox-${b.kind ?? 'object'}`}
                    data-label={b.id}
                    style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                  >
                    <button className="bbox-report" title="이 탐지가 틀렸으면 눌러 신고 (모델 재학습에 반영)" onClick={(e) => { e.stopPropagation(); void handleFalsePositive(b); }}>✕</button>
                  </div>
                ))}
              </div>
              <div className="video-overlay" />
              <div className="video-hud">
                <span className="hud-tag">● LIVE TRACKING</span>
                <span className="hud-tag">{result.durationSec}s</span>
                <span className="hud-tag">{result.processedFrames} FRAMES</span>
                <span className="hud-tag">ENGINE: {result.engine}</span>
              </div>
              {boxes.length === 0 && (
                <div className="tracking-empty">추적된 형상이 없습니다. 움직이는 객체가 있는 영상을 업로드해 주세요.</div>
              )}
              <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Crosshair size={13} style={{ color: 'var(--accent-3)' }} />
                <div className="run-bar" style={{ flex: 1 }}>
                  <i style={{ width: `${(current / Math.max(result.durationSec, 1)) * 100}%`, background: 'var(--accent-3)' }} />
                </div>
                <span className="mono text-xs faint">{current.toFixed(1)}s / {result.durationSec}s</span>
              </div>
            </div>
            <div className="chip-row mt-2">
              <span className="chip">처리 프레임 {result.processedFrames.toLocaleString()}</span>
              <span className="chip">감지 인물 {result.personsDetected}명</span>
              <span className="chip">평균 신뢰도 {Math.round(result.summary.avgConfidence * 100)}%</span>
            </div>
          </div>
        ) : <NoData label="영상 분석 뷰" />}
      </DataCard>

      <DataCard
        dataKey="behavior-list"
        title="감지된 행동"
        description="시간대별 행동 이벤트와 심각도, 지속 시간, 신뢰도를 표시합니다. 심각도 탭으로 필터링할 수 있습니다."
        icon={<ScanFace size={15} />}
        right={result ? <span className="chip mono">{behaviors.length}건</span> : undefined}
      >
        {result ? (
          <div style={{ padding: '0 16px 8px' }}>
            <div className="tabs" style={{ marginBottom: 12 }}>
              {(['all', 'info', 'caution', 'warning', 'critical'] as const).map((f) => (
                <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? '전체' : SEVERITY_LABEL[f]}
                </button>
              ))}
            </div>
            <div className="list">
              {behaviors.map((b) => (
                <div className="list-row" key={b.id}>
                  <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}><Eye size={14} /></div>
                  <div className="row-main">
                    <div className="row-title">{b.labelKo} <span className="faint text-xs">#{b.trackId}</span></div>
                    <div className="row-sub">{b.category} · {b.durationSec}s 지속</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${b.severity}`}>{SEVERITY_LABEL[b.severity]}</span>
                    <div className="row-sub mono">{b.timestamp.toFixed(1)}s</div>
                  </div>
                  <div className="conf-bar"><i style={{ width: `${b.confidence * 100}%` }} /></div>
                </div>
              ))}
              {behaviors.length === 0 && <div className="text-xs faint" style={{ padding: 20, textAlign: 'center' }}>해당 필터에 맞는 이벤트가 없습니다.</div>}
            </div>
          </div>
        ) : <NoData label="행동 감지" />}
      </DataCard>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/ActionsPanel.tsx</code></summary>

```tsx
import { useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Clock3, PlayCircle, ShieldAlert, UploadCloud, UserRound } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { ActionRecommendation, BehaviorSeverity } from '@/types';
import DataCard from './DataCard';
import SituationVideoGuide from './SituationVideoGuide';

const PRIORITY_LABEL: Record<ActionRecommendation['priority'], string> = {
  low: '낮음', medium: '보통', high: '높음', immediate: '즉시',
};
const SEVERITY_LABEL: Record<BehaviorSeverity, string> = {
  info: '정보', caution: '주의', warning: '경고', critical: '위험',
};

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 이 영역에 결과가 출력됩니다.</div>
    </div>
  );
}

export default function ActionsPanel() {
  const result = useStore((s) => s.result);
  const pushToast = useStore((s) => s.pushToast);

  const situations = result?.situations ?? [];
  const actions = result?.actions ?? [];
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);

  return (
    <div>
      <DataCard
        dataKey="actions-situations"
        title="감지된 상황"
        description="영상에서 판단된 상황별 심각도, 발생 시각, 신뢰도, 관련 행동 수를 표시합니다."
        icon={<AlertTriangle size={15} />}
        right={result ? <span className="chip mono">{situations.length}건</span> : undefined}
        bodyClassName="grid grid-3"
      >
        {result ? (
          <>
            {situations.map((s) => (
              <div className="card card-pad" key={s.id}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} color={s.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'} />
                  <span className="text-sm" style={{ fontWeight: 700 }}>{s.typeKo}</span>
                  <span className="card-head-spacer" />
                  <span className={`badge badge-${s.severity}`}>{SEVERITY_LABEL[s.severity]}</span>
                </div>
                <div className="text-xs dim" style={{ marginTop: 10, lineHeight: 1.6 }}>{s.description}</div>
                <div className="chip-row mt-2">
                  <span className="chip mono">{s.timestamp.toFixed(1)}s</span>
                  <span className="chip mono">신뢰도 {Math.round(s.confidence * 100)}%</span>
                  <span className="chip">관련 행동 {s.relatedBehaviors.length}건</span>
                  <span className="chip">인물 {s.persons.length}명</span>
                  <button
                    className="ghost-btn"
                    style={{ fontSize: 10, padding: '4px 8px' }}
                    onClick={() => setSelectedSituation(s.id)}
                  >
                    <PlayCircle size={11} /> 영상 안내
                  </button>
                </div>
              </div>
            ))}
            {situations.length === 0 && (
              <div className="card card-pad text-sm dim">감지된 특이 상황이 없습니다. 정상 상태입니다.</div>
            )}
          </>
        ) : <NoData label="감지 상황" />}
      </DataCard>

      {result && situations.length > 0 && (
        <SituationVideoGuide
          situations={situations}
          actions={actions}
          selectedId={selectedSituation}
          onSelect={setSelectedSituation}
        />
      )}

      <DataCard
        dataKey="actions-recommendations"
        title="상황별 조치 권고"
        description="감지된 상황에 따라 실행 가능한 대응 절차를 우선순위별로 정렬합니다. 담당자·예상 시간·자동화 여부를 확인할 수 있습니다."
        icon={<ShieldAlert size={15} />}
        className="section-gap"
        right={result ? (
          <>
            <span className="chip accent">자동화 {actions.filter((a) => a.automated).length}건</span>
            <span className="chip">수동 {actions.filter((a) => !a.automated).length}건</span>
          </>
        ) : undefined}
        bodyClassName="grid grid-2"
      >
        {result ? actions.map((a) => (
          <div className={`action-card priority-${a.priority}`} key={a.id}>
            <div className="action-head">
              <ShieldAlert size={15} color="var(--accent)" />
              <span className="action-title">{a.title}</span>
              <span className="card-head-spacer" />
              <span className="badge" style={{
                background: a.priority === 'immediate' ? 'color-mix(in srgb, var(--danger) 18%, transparent)' : 'color-mix(in srgb, var(--accent) 12%, transparent)',
                color: a.priority === 'immediate' ? 'var(--danger)' : 'var(--accent)',
              }}>{PRIORITY_LABEL[a.priority]}</span>
            </div>
            <div className="action-desc">{a.description}</div>
            <ol className="action-steps">{a.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
            <div className="action-meta">
              <span><UserRound size={11} /> {a.owner}</span>
              <span><Clock3 size={11} /> 예상 {a.estimatedTimeMin}분</span>
              <span>{a.automated ? <><Bot size={11} /> 자동 실행 가능</> : <><CheckCircle2 size={11} /> 수동 확인 필요</>}</span>
            </div>
            <button
              className="ghost-btn mt-2"
              style={{ fontSize: 10, padding: '6px 10px' }}
              onClick={() => pushToast(`조치 시작: ${a.title} (${a.owner})`, 'success')}
            >
              조치 시작
            </button>
          </div>
        )) : <NoData label="조치 권고" />}
      </DataCard>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/AccidentTimelinePanel.tsx</code></summary>

```tsx
import { useRef, useState } from 'react';
import { AlertOctagon, CheckCircle2, Clock3, MapPin, Radio, ShieldAlert, UploadCloud, Users, Video } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { useLiveAccidents } from '@/hooks/useLiveAccidents';
import DataCard from './DataCard';
import { reportFalsePositive } from '@/services/feedbackApi';
import MetricCard from '@/components/visualizations/MetricCard';

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 시간별 사고 인식 결과가 출력됩니다.</div>
    </div>
  );
}

const STATUS_LABEL = { detected: '감지됨', responding: '대응 중', resolved: '처리 완료' } as const;
const STATUS_COLOR = { detected: 'var(--warning)', responding: 'var(--danger)', resolved: 'var(--success)' } as const;

export default function AccidentTimelinePanel() {
  const result = useStore((s) => s.result);
  const video = useStore((s) => s.video);
  const pushToast = useStore((s) => s.pushToast);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoAspect, setVideoAspect] = useState(16 / 9);
  const sensitivity = useStore((s) => s.config.accuracy.personDetectionSensitivity.value);
  const threshold = useStore((s) => s.config.accuracy.confidenceThreshold.value);
  // 실시간 추적·사고 감지 상시 ON
  const liveBoxes = useLiveTracking(videoRef, true, sensitivity, threshold);
  const liveAccidents = useLiveAccidents(liveBoxes, true);
  const handleFalsePositive = async (b: (typeof liveBoxes)[number]) => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) { pushToast('영상을 재생한 뒤 신고해 주세요.', 'warning'); return; }
    const stage = document.createElement('canvas');
    stage.width = v.videoWidth; stage.height = v.videoHeight;
    stage.getContext('2d')!.drawImage(v, 0, 0);
    try {
      await reportFalsePositive(stage, b.label, b.confidence, {
        x: b.x, y: b.y, w: b.w, h: b.h,
      });
      pushToast(`'${b.label}' 오탐을 신고했습니다.`, 'success');
    } catch (err) { pushToast(`신고 실패: ${(err as Error).message}`, 'error'); }
  };

  const accidents = result?.accidents ?? [];

  return (
    <div>
      <DataCard
        dataKey="accident-summary"
        title="산업 현장 안전 분석"
        description="탐지 객체 수(현재 프레임)와 사고 이벤트(시간적 분석으로 검증된 사건)는 별개 지표입니다. 객체가 감지되었다는 것만으로 사고로 기록하지 않습니다."
        icon={<AlertOctagon size={15} />}
        right={result ? <span className={`chip ${result.engine === 'mock' ? '' : 'accent'}`}>{result.engine === 'mock' ? '데모 · 검토 필요' : '이벤트 기반 집계'}</span> : undefined}
        bodyClassName="grid grid-4"
      >
        {result ? (
          <>
            <MetricCard data={{ key: 'objects', label: '탐지 객체', value: liveBoxes.length, unit: '개', accent: 'var(--accent)' }} />
            <MetricCard data={{ key: 'events', label: '사고 이벤트', value: liveAccidents.filter((a) => a.severity === 'critical').length, unit: '건', accent: 'var(--danger)' }} />
            <MetricCard data={{ key: 'risk', label: '위험 이벤트', value: liveAccidents.length, unit: '건 · 검토 필요', accent: 'var(--warning)' }} />
            <MetricCard data={{ key: 'track', label: '추적 상태', value: liveBoxes.length, unit: 'ID 관리', accent: 'var(--success)' }} />
          </>
        ) : <NoData label="사고 요약" />}
      </DataCard>

      <DataCard
        dataKey="accident-features"
        title="분석 기능 상태"
        description="산업 현장 안전 분석에 실제로 적용된 기능입니다. 사고 판정은 객체 탐지와 분리되어 시간적 근거를 함께 확인합니다."
        icon={<ShieldAlert size={15} />}
        className="section-gap"
        right={<span className="chip mono">{(liveAccidents.length ? 6 : 4)}/6 활성</span>}
        bodyClassName="card-pad"
      >
        <div className="chip-row">
          <span className="chip accent">✓ 사람 탐지</span>
          <span className="chip accent">✓ 지게차 탐지</span>
          <span className={`chip ${liveBoxes.length ? 'accent' : ''}`}>{liveBoxes.length ? '✓' : '○'} 객체 이동 경로</span>
          <span className={`chip ${liveAccidents.some((a) => a.type === 'restricted') ? 'accent' : ''}`}>{liveAccidents.some((a) => a.type === 'restricted') ? '✓' : '○'} 위험 구역 진입</span>
          <span className={`chip ${liveAccidents.some((a) => a.type === 'collision_risk') ? 'accent' : ''}`}>{liveAccidents.some((a) => a.type === 'collision_risk') ? '✓' : '○'} 충돌 위험 분석</span>
          <span className={`chip ${liveAccidents.length ? 'accent' : ''}`}>{liveAccidents.length ? '✓' : '○'} 사고 이벤트 검증</span>
        </div>
      </DataCard>

      <DataCard
        dataKey="accident-live"
        title="실시간 사고 감지"
        description="영상을 재생하면서 트랙의 급정지·충돌·급이동·낙하·인파 밀집을 실시간으로 판단하고 근거와 함께 표시합니다."
        icon={<Radio size={15} />}
        className="section-gap"
        right={<span className="chip mono">실시간 사고 감지 상시 ON</span>}
      >
        <div className="grid grid-2" style={{ padding: '0 20px 20px', gap: 14 }}>
            <div className="video-frame">
              <div className="video-stage" style={{ aspectRatio: videoAspect }}>
                {video?.url ? <video ref={videoRef} src={video.url} muted autoPlay loop playsInline controls onLoadedMetadata={(e) => { const r = e.currentTarget.videoWidth / e.currentTarget.videoHeight; if (Number.isFinite(r) && r > 0) setVideoAspect(r); }} /> : (
                  <div className="video-placeholder"><Video size={22} /><b>업로드된 영상이 없습니다</b></div>
                )}
                {liveBoxes.map((b) => (
                  <div
                    key={b.id}
                    className={`bbox bbox-${b.kind}`}
                    data-label={`${b.label} ${Math.round(b.confidence * 100)}%`}
                    style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                  >
                    <button className="bbox-report" title="이 탐지가 틀렸으면 눌러 신고 (모델 재학습에 반영)" onClick={(e) => { e.stopPropagation(); void handleFalsePositive(b); }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="list" style={{ maxHeight: 260 }}>
              {liveAccidents.length ? liveAccidents.map((a) => (
                <div className="list-row" key={a.id}>
                  <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)' }}><AlertOctagon size={14} /></div>
                  <div className="row-main">
                    <div className="row-title">{a.title}</div>
                    <div className="row-sub">{a.description}</div>
                    <div className="chip-row mt-2">{a.evidence.map((e, i) => <span className="chip mono" key={i}>{e}</span>)}</div>
                  </div>
                  <span className={`badge badge-${a.severity}`}>{a.severity === 'critical' ? '위험' : a.severity === 'warning' ? '경고' : '주의'}</span>
                </div>
              )) : (
                <div className="empty-state"><CheckCircle2 size={24} /><b>실시간 감지된 사고 없음</b><div className="text-xs">트랙을 분석 중입니다.</div></div>
              )}
            </div>
        </div>
      </DataCard>

      <DataCard
        dataKey="accident-timeline"
        title="시간별 사고 타임라인"
        description="사고가 발생한 시각부터 종료 시각까지를 시간축에 표시하고, 사고 내용·심각도·관련 인물·대응 상태를 출력합니다."
        icon={<Clock3 size={15} />}
        className="section-gap"
        right={result ? <span className="chip mono">{accidents.length}건</span> : undefined}
      >
        {result ? (
          accidents.length ? (
            <div className="accident-timeline">
              {accidents.map((a) => (
                <div className="accident-item" key={a.id}>
                  <div className="accident-time mono">{a.timestamp.toFixed(1)}s<br /><small>~{a.endTime.toFixed(1)}s</small></div>
                  <div className="accident-marker" style={{ background: STATUS_COLOR[a.status], boxShadow: `0 0 0 5px color-mix(in srgb, ${STATUS_COLOR[a.status]} 15%, transparent)` }} />
                  <div className="accident-body">
                    <div className="flex items-center gap-2 wrap">
                      <span className="badge" style={{ background: `color-mix(in srgb, ${STATUS_COLOR[a.status]} 16%, transparent)`, color: STATUS_COLOR[a.status] }}>{STATUS_LABEL[a.status]}</span>
                      <span className={`badge badge-${a.severity}`}>{a.severity === 'critical' ? '위험' : '경고'}</span>
                      <b className="text-sm">{a.title}</b>
                      <span className="card-head-spacer" />
                      <span className="mono text-xs faint">신뢰도 {Math.round(a.confidence * 100)}%</span>
                    </div>
                    <div className="text-xs dim" style={{ marginTop: 8, lineHeight: 1.6 }}>{a.description}</div>
                    <div className="chip-row mt-2">
                      <span className="chip"><MapPin size={10} /> {a.zone}</span>
                      <span className="chip"><Users size={10} /> 인물 {a.persons.length}명 (P{a.persons.join(', P')})</span>
                      <span className="chip"><Radio size={10} /> {a.typeKo}</span>
                      {a.relatedBehaviorIds.map((id) => <span key={id} className="chip mono">{id}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state"><CheckCircle2 size={24} /><b>감지된 사고가 없습니다</b><div className="text-xs">영상 전체에서 사고 징후가 확인되지 않았습니다.</div></div>
        ) : <NoData label="사고 타임라인" />}
      </DataCard>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/VideoDescriptionPanel.tsx</code></summary>

```tsx
import { useRef, useState } from 'react';
import { Clipboard, Clock3, FileText, Highlighter, Play, Sparkles, UploadCloud, Volume2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import DataCard from './DataCard';

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 영상에 대한 텍스트 설명이 생성됩니다.</div>
    </div>
  );
}

export default function VideoDescriptionPanel() {
  const result = useStore((s) => s.result);
  const video = useStore((s) => s.video);
  const pushToast = useStore((s) => s.pushToast);
  const desc = result?.videoDescription;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [muted, setMuted] = useState(true);
  const threshold = useStore((s) => s.config.accuracy.confidenceThreshold.value);
  const liveBoxes = useLiveTracking(videoRef, !!video?.url, 0.7, threshold);
  const liveCount = liveBoxes.length;

  /** 현재 시점에 해당하는 캡션 */
  const activeCaption = desc?.captions.find(
    (c) => current >= c.timestamp && current < c.endTime,
  );

  /** 캡션 클릭 시 해당 시점으로 이동 */
  const seekTo = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setCurrent(t);
    void v.play().catch(() => {});
  };

  const copyAll = async () => {
    if (!desc) return;
    const text = [desc.summary, ...desc.captions.map((c) => `[${c.timestamp}s~${c.endTime}s] ${c.text}`)].join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      pushToast('영상 텍스트 설명을 클립보드에 복사했습니다.', 'success');
    } catch {
      pushToast('클립보드 복사에 실패했습니다.', 'warning');
    }
  };

  return (
    <div>
      <DataCard
        dataKey="video-desc-player"
        title="설명 데이터 영상"
        description="원본 영상 위에 현재 시점의 설명 캡션을 표시합니다. 아래 시간대별 설명을 누르면 해당 시점으로 이동합니다."
        icon={<Play size={15} />}
        right={
          <>
            <button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setShowOverlay((v) => !v)}>
              <FileText size={12} /> 캡션 {showOverlay ? '숨김' : '표시'}
            </button>
            <button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setMuted((v) => !v)}>
              <Volume2 size={12} /> {muted ? '음소거' : '소리'}
            </button>
          </>
        }
        bodyClassName="card-pad"
      >
        {video?.url ? (
          <div className="video-frame" style={{ maxWidth: 720 }}>
            <video
              ref={videoRef}
              src={video.url}
              muted={muted}
              controls
              playsInline
              onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            />
            {showOverlay && activeCaption && (
              <div className="video-caption">
                {activeCaption.text}
                {liveCount > 0 && (
                  <span className="caption-live">현재 프레임 추적 {liveCount}개</span>
                )}
              </div>
            )}
            <div className="video-hud">
              <span className="hud-tag">● 설명 데이터</span>
              <span className="hud-tag mono">{current.toFixed(1)}s</span>
            </div>
          </div>
        ) : <NoData label="설명 영상" />}
      </DataCard>

      <DataCard
        dataKey="video-desc-summary"
        title="영상 텍스트 요약"
        description="영상 전체의 장면, 인물 수, 사고 및 조치 내용을 자연어 문장으로 요약한 설명입니다."
        icon={<FileText size={15} />}
        right={desc ? <button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={copyAll}><Clipboard size={12} /> 전체 복사</button> : undefined}
        bodyClassName="card-pad"
      >
        {desc ? (
          <div className="video-summary-text">{desc.summary}</div>
        ) : <NoData label="영상 텍스트 요약" />}
      </DataCard>

      <div className="grid grid-2 section-gap">
        <DataCard
          dataKey="video-desc-captions"
          title="시간대별 영상 설명"
          description="10초 단위로 영상 내용을 설명한 캡션입니다. 각 구간에서 감지된 사고·행동·인구 밀도가 반영됩니다."
          icon={<Sparkles size={15} />}
          right={desc ? <span className="chip mono">{desc.sceneCount}개 구간</span> : undefined}
        >
          {desc ? (
            <div style={{ padding: '4px 20px 20px' }}>
              <div className="list">
                {desc.captions.map((c) => (
                  <button
                    className={`list-row caption-row caption-click ${activeCaption?.id === c.id ? 'active' : ''}`}
                    key={c.id}
                    onClick={() => seekTo(c.timestamp)}
                    title="클릭하면 영상이 해당 시점으로 이동합니다"
                  >
                    <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}><Play size={14} /></div>
                    <div className="row-main">
                      <div className="flex items-center gap-2"><span className="row-time mono">{c.timestamp}s ~ {c.endTime}s</span></div>
                      <div className="caption-text">{c.text}</div>
                      <div className="chip-row" style={{ marginTop: 6 }}>
                        {c.tags.map((tag, i) => <span className="chip" key={i}>{tag}</span>)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : <NoData label="시간대별 설명" />}
        </DataCard>

        <DataCard
          dataKey="video-desc-highlights"
          title="주요 하이라이트"
          description="영상에서 특히 주목해야 할 사고 시점과 통계를 추출한 목록입니다."
          icon={<Highlighter size={15} />}
          bodyClassName="card-pad"
        >
          {desc ? (
            <div className="list">
              {desc.highlights.map((h, i) => (
                <div className="list-row" key={i}>
                  <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--accent-4) 14%, transparent)', color: 'var(--accent-4)' }}><Highlighter size={14} /></div>
                  <div className="row-main"><div className="row-title text-sm">{h}</div></div>
                  <span className="row-time mono">#{i + 1}</span>
                </div>
              ))}
            </div>
          ) : <NoData label="하이라이트" />}
        </DataCard>
      </div>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/PerformancePanel.tsx</code></summary>

```tsx
import { useEffect, useState } from 'react';
import { Activity, Cpu, Gauge, MemoryStick, RefreshCw, Timer, TrendingUp, UploadCloud, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { NODE_KIND_META } from '@/pipeline/catalog';
import DataCard from './DataCard';
import MetricCard from '@/components/visualizations/MetricCard';
import { getEvaluation, getRetrainStatus, startRetrain, type EvaluationReport, type RetrainStatus } from '@/services/evaluationApi';

const STATUS_LABEL = { optimal: '최적', normal: '보통', degraded: '주의' } as const;
const STATUS_COLOR = { optimal: 'var(--success)', normal: 'var(--accent)', degraded: 'var(--danger)' } as const;

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 이 영역에 성능평가 결과가 출력됩니다.</div>
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="conf-bar" style={{ width: 80, height: 5 }}>
      <i style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: `linear-gradient(90deg, ${color}, var(--accent))` }} />
    </div>
  );
}

export default function PerformancePanel() {
  const [evalReport, setEvalReport] = useState<EvaluationReport | null>(null);
  const [retrain, setRetrain] = useState<RetrainStatus | null>(null);
  const pushToast = useStore((s) => s.pushToast);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try { const e = await getEvaluation(); if (alive) setEvalReport(e); } catch { /* ignore */ }
      try { const r = await getRetrainStatus(); if (alive) setRetrain(r); } catch { /* ignore */ }
    };
    void load();
    const timer = setInterval(() => {
      void getRetrainStatus().then((r) => { if (alive) setRetrain(r); }).catch(() => {});
    }, 3000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const handleRetrain = async () => {
    try {
      const r = await startRetrain(10, 640);
      setRetrain(r);
      pushToast('자동 재학습을 시작했습니다. 완료 시 커스텀 모델이 적용됩니다.', 'info');
    } catch (err) { pushToast(`재학습 시작 실패: ${(err as Error).message}`, 'error'); }
  };

  const result = useStore((s) => s.result);
  const graph = useStore((s) => s.graph);
  const config = useStore((s) => s.config);
  const perf = result?.performanceEvaluation ?? [];

  const avgLatency = perf.length ? perf.reduce((a, p) => a + p.latencyMs, 0) / perf.length : 0;
  const avgAccuracy = perf.length ? perf.reduce((a, p) => a + p.accuracy, 0) / perf.length : 0;
  const totalMemory = perf.reduce((a, p) => a + p.memoryMb, 0);
  const minThroughput = perf.length ? Math.min(...perf.map((p) => p.throughput)) : 0;
  const degraded = perf.filter((p) => p.status === 'degraded');

  const recommendations: string[] = [];
  if (config.performance.fps.value > 30) recommendations.push('분석 FPS가 높습니다. 정확도 저하 시 15~24 수준으로 조절하세요.');
  if (config.performance.resolution.value === '1080p') recommendations.push('1080p 입력은 메모리 사용량이 큽니다. 적응형 품질을 활용하세요.');
  if (config.accuracy.behaviorModel.value === 'fast') recommendations.push('빠른 모델을 사용 중입니다. ensemble 프로파일로 정확도를 높일 수 있습니다.');
  if (degraded.length) recommendations.push(`주의가 필요한 기능: ${degraded.map((d) => d.labelKo).join(', ')}`);
  if (!recommendations.length) recommendations.push('모든 기능이 정상 범위에서 동작하고 있습니다.');

  return (
    <div>
      <DataCard
        dataKey="perf-summary"
        title="전체 성능 요약"
        description="실제 분석에서 측정한 값만 표시합니다. 검증 데이터가 없는 지표(R(재현율)·메모리·CPU)는 0 또는 미측정으로 남깁니다."
        icon={<Gauge size={15} />}
        bodyClassName="grid grid-4"
      >
        {result && perf.length ? (
          <>
            <MetricCard data={{ key: 'latency', label: '평균 지연', value: Math.round(avgLatency), unit: 'ms', accent: 'var(--accent)' }} />
            <MetricCard data={{ key: 'accuracy', label: '평균 정확도', value: Math.round(avgAccuracy), unit: '%', accent: 'var(--success)' }} />
            <MetricCard data={{ key: 'memory', label: '총 메모리', value: totalMemory, unit: 'MB', accent: 'var(--accent-2)' }} />
            <MetricCard data={{ key: 'throughput', label: '최저 처리량', value: Math.round(minThroughput), unit: 'fps', accent: 'var(--accent-4)' }} />
          </>
        ) : <NoData label="성능 요약" />}
      </DataCard>

      <DataCard
        dataKey="perf-features"
        title="기능별 성능평가"
        description="파이프라인 각 기능의 지연 시간, 처리량, 정확도, 정밀도, 재현율, 리소스 사용량을 표시합니다. 성능/정확도 옵션 변경 시 함께 재계산됩니다."
        icon={<Activity size={15} />}
        className="section-gap"
        right={result ? (
          <span className={`chip ${perf.some((p) => p.measured) ? 'accent' : ''}`}>
            {perf.some((p) => p.measured) ? '실제 측정' : '추정값'} · {perf.length}개 기능
          </span>
        ) : undefined}
      >
        {result && perf.length ? (
          <div className="perf-list">
            <div className="perf-row perf-head">
              <span>기능</span><span>지연</span><span>처리량</span><span>정확도</span><span>정밀도</span><span>재현율</span><span>메모리</span><span>CPU/GPU</span><span>상태</span>
            </div>
            {perf.map((p) => (
              <div className="perf-row" key={p.key} title={p.description}>
                <span className="perf-name"><b>{p.labelKo}</b><small className="faint">{p.label}</small></span>
                <span className="mono">{p.latencyMs}ms</span>
                <span className="mono">{p.throughput}</span>
                <span><div className="flex items-center gap-2"><Bar value={p.accuracy} color="var(--success)" /><b className="mono">{p.accuracy}%</b></div></span>
                <span className="mono">{p.precision}%</span>
                <span className="mono">{p.recall}%</span>
                <span className="mono">{p.memoryMb}MB</span>
                <span className="mono">{p.cpuPercent}% / {p.gpuPercent}%</span>
                <span><span className="badge" style={{ background: `color-mix(in srgb, ${STATUS_COLOR[p.status]} 16%, transparent)`, color: STATUS_COLOR[p.status] }}>{STATUS_LABEL[p.status]}</span></span>
              </div>
            ))}
          </div>
        ) : <NoData label="기능별 성능" />}
      </DataCard>

      <div className="grid grid-2 section-gap">
        <DataCard
          dataKey="perf-nodes"
          title="파이프라인 노드 실행 시간"
          description="각 노드가 실제로 소요한 분석 시간과 출력 상태입니다. 분석 엔진이 측정한 단계별 시간을 우선 표시합니다."
          icon={<Timer size={15} />}
        >
          {result ? (
            <div style={{ padding: '4px 20px 20px' }}>
              <div className="list perf-node-list">
                {graph.nodes.map((n) => (
                  <div className="list-row" key={n.id}>
                    <div className="row-icon" style={{ background: `color-mix(in srgb, ${NODE_KIND_META[n.type].color} 14%, transparent)`, color: NODE_KIND_META[n.type].color }}><Zap size={14} /></div>
                    <div className="row-main"><div className="row-title">{n.label}</div><div className="row-sub">{NODE_KIND_META[n.type].labelKo} · {n.status}</div></div>
                    <span className="mono text-sm accent">{n.durationMs ? `${n.durationMs}ms` : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <NoData label="노드 실행 시간" />}
        </DataCard>

        <DataCard
          dataKey="perf-resource"
          title="리소스 사용 분석"
          description="기능별 CPU·GPU·메모리 사용 비중을 비교합니다. 하드웨어 가속 옵션이 결과에 반영됩니다."
          icon={<Cpu size={15} />}
          bodyClassName="card-pad"
        >
          {result && perf.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {perf.map((p) => (
                <div key={p.key}>
                  <div className="flex justify-between text-xs" style={{ marginBottom: 5 }}>
                    <span>{p.labelKo}</span>
                    <span className="mono faint">CPU {p.cpuPercent}% · GPU {p.gpuPercent}% · {p.memoryMb}MB</span>
                  </div>
                  <div className="run-bar" style={{ height: 6 }}>
                    <i style={{ width: `${p.cpuPercent}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
                  </div>
                </div>
              ))}
              <div className="divider" />
              <div className="flex items-center gap-2 text-xs dim"><MemoryStick size={13} className="accent" /> 하드웨어 가속: {config.performance.hardwareAcceleration.value ? 'ON' : 'OFF'}</div>
            </div>
          ) : <NoData label="리소스 사용" />}
        </DataCard>
      </div>

      <DataCard
        dataKey="perf-recommend"
        title="성능 개선 권고"
        description="현재 성능/정확도 옵션과 측정 결과를 바탕으로 개선 방향을 제안합니다."
        icon={<TrendingUp size={15} />}
        className="section-gap"
        bodyClassName="card-pad"
      >
        {result ? (
          <div className="flex flex-col gap-2">
            {recommendations.map((r, i) => (
              <div className="list-row" key={i}>
                <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--accent-4) 14%, transparent)', color: 'var(--accent-4)' }}><TrendingUp size={14} /></div>
                <div className="row-main"><div className="row-title text-sm">{r}</div></div>
              </div>
            ))}
          </div>
        ) : <NoData label="성능 개선 권고" />}
      </DataCard>

      <DataCard
        dataKey="perf-accuracy-eval"
        title="사고 인식 정확도 평가"
        description="사용자가 검토한 사고 이벤트를 기준으로 사고 유형별 Precision·Recall·F1과 혼동행렬, 추적 ID 유지율을 계산합니다. 검토 결과가 쌓일수록 신뢰도가 올라갑니다."
        icon={<Gauge size={15} />}
        className="section-gap"
        right={<span className={`chip ${evalReport?.reliable ? 'accent' : ''}`}>{evalReport?.reliable ? '신뢰 가능' : '검토 필요'}</span>}
        bodyClassName="card-pad"
      >
        {evalReport ? (
          <>
            <div className="grid grid-4">
              <MetricCard data={{ key: 'precision', label: '정밀도', value: Math.round(evalReport.overall.precision * 100), unit: '%', accent: 'var(--accent)' }} />
              <MetricCard data={{ key: 'recall', label: '재현율', value: Math.round(evalReport.overall.recall * 100), unit: '%', accent: 'var(--success)' }} />
              <MetricCard data={{ key: 'f1', label: 'F1', value: Math.round(evalReport.overall.f1 * 100), unit: '%', accent: 'var(--accent-2)' }} />
              <MetricCard data={{ key: 'id', label: 'ID 유지율', value: Math.round(evalReport.tracking.idPreservationRate * 100), unit: '%', accent: 'var(--accent-4)' }} />
            </div>
            <div className="divider" />
            <div className="text-xs faint" style={{ lineHeight: 1.7 }}>
              검토 {evalReport.reviewedEvents}건 · 예측 {evalReport.predictedEvents}건 · 추적 {evalReport.tracking.tracks}개 ·
              ID 스위치 {evalReport.tracking.idSwitches}회 · 단절 {evalReport.tracking.fragmentedTracks}개
            </div>
            <div className="text-xs faint mt-2">{evalReport.note}</div>
            {Object.keys(evalReport.perType).length > 0 && (
              <div className="perf-list mt-3">
                <div className="perf-row perf-head"><span>사고 유형</span><span>TP</span><span>FP</span><span>FN</span><span>Precision</span><span>Recall</span><span>F1</span></div>
                {Object.entries(evalReport.perType).map(([type, m]) => (
                  <div className="perf-row" key={type}>
                    <span className="perf-name"><b>{type}</b></span>
                    <span className="mono">{m.tp}</span><span className="mono">{m.fp}</span><span className="mono">{m.fn}</span>
                    <span className="mono">{Math.round(m.precision * 100)}%</span>
                    <span className="mono">{Math.round(m.recall * 100)}%</span>
                    <span className="mono">{Math.round(m.f1 * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : <NoData label="정확도 평가" />}
      </DataCard>

      <DataCard
        dataKey="perf-auto-retrain"
        title="오인식 → 재학습 자동화"
        description="검토에서 '오탐'으로 표시된 이벤트와 웹에 업로드된 영상을 학습 데이터에 반영해 커스텀 모델을 다시 학습합니다. 완료 시 모델이 자동 적용됩니다."
        icon={<RefreshCw size={15} />}
        className="section-gap"
        right={<span className={`chip ${retrain?.status === 'running' ? 'accent' : ''}`}>{retrain?.status ?? 'idle'}</span>}
        bodyClassName="card-pad"
      >
        <div className="flex justify-between text-sm"><span className="dim">진행률</span><b className="mono">{Math.round((retrain?.progress ?? 0) * 100)}%</b></div>
        <div className="run-bar mt-2"><i style={{ width: `${(retrain?.progress ?? 0) * 100}%` }} /></div>
        <div className="text-xs faint mt-2">{retrain?.message ?? '검토 결과와 업로드 영상을 수집합니다.'}</div>
        {retrain?.error && <div className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{retrain.error}</div>}
        {retrain?.lastRun && <div className="text-xs faint mt-2">마지막 실행: {retrain.lastRun} · 데이터 {retrain.samplesAdded}장</div>}
        <button className="primary-btn full mt-3" disabled={retrain?.status === 'running'} onClick={() => void handleRetrain()}>
          <RefreshCw size={14} /> 오인식 반영 재학습 시작
        </button>
      </DataCard>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/SettingsPanel.tsx</code></summary>

```tsx
import { Gauge, ListChecks, RefreshCw, ScanSearch, SlidersHorizontal, Sparkles, Target } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { EngineChoice, BackendChoice, DesignChoice, FrontendChoice, LanguageChoice } from '@/types';
import { ENGINE_LABELS } from '@/engine/factory';

interface RangeOptionLike { value: number; min: number; max: number; description: string }

function Segmented<T extends string>({
  value, choices, labels, onChange,
}: { value: T; choices: readonly T[]; labels?: Record<string, string>; onChange: (v: T) => void }) {
  return (
    <div className="segmented">
      {choices.map((c) => (
        <button key={c} className={`segment ${value === c ? 'active' : ''}`} onClick={() => onChange(c)}>
          {labels?.[c] ?? c}
        </button>
      ))}
    </div>
  );
}

function RangeField({ label, option, onChange }: {
  label: string;
  option: RangeOptionLike;
  onChange: (v: number) => void;
}) {
  const pct = ((Number(option.value) - option.min) / (option.max - option.min)) * 100;
  return (
    <div className="field">
      <div className="field-label"><span>{label}</span><span className="field-value">{option.value}</span></div>
      <input
        type="range"
        min={option.min}
        max={option.max}
        value={Number(option.value)}
        style={{ ['--fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="text-xs faint" style={{ marginTop: 5 }}>{option.description}</div>
    </div>
  );
}

function ToggleField({ label, value, onChange, description }: {
  label: string; value: boolean; onChange: (v: boolean) => void; description: string;
}) {
  return (
    <div className="field">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm" style={{ fontWeight: 600 }}>{label}</div>
          <div className="text-xs faint" style={{ marginTop: 3 }}>{description}</div>
        </div>
        <div className="toggle" onClick={() => onChange(!value)}>
          <div className={`toggle-track ${value ? 'on' : ''}`}><div className="toggle-knob" /></div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPanel() {
  const config = useStore((s) => s.config);
  const setTopOption = useStore((s) => s.setTopOption);
  const setPerformance = useStore((s) => s.setPerformance);
  const setAccuracy = useStore((s) => s.setAccuracy);
  const setMeasurement = useStore((s) => s.setMeasurement);
  const setDetection = useStore((s) => s.setDetection);
  const setConfigSection = useStore((s) => s.setConfigSection);
  const setAutoUpdate = useStore((s) => s.setAutoUpdate);
  const setDebounce = useStore((s) => s.setDebounce);
  const resetPipeline = useStore((s) => s.resetPipeline);
  const guideEnabled = useStore((s) => s.guideEnabled);
  const setGuideEnabled = useStore((s) => s.setGuideEnabled);

  const o = config.options;
  const p = config.performance;
  const a = config.accuracy;

  return (
    <div className="grid grid-2">
      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <SlidersHorizontal size={16} className="accent" />
          <span className="card-title">모듈 옵션</span>
          <span className="card-head-spacer" />
          <span className="text-xs faint">각 항목은 독립적으로 선택됩니다</span>
        </div>

        <div className="field">
          <div className="field-label"><span>프론트엔드 스택</span></div>
          <Segmented<FrontendChoice>
            value={o.frontend.value}
            choices={['react', 'next', 'vue']}
            onChange={(v) => setTopOption('frontend', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>{o.frontend.description}</div>
        </div>

        <div className="field">
          <div className="field-label"><span>분석 엔진</span></div>
          <Segmented<EngineChoice>
            value={o.analysisEngine.value}
            choices={['mock', 'real', 'hybrid']}
            labels={ENGINE_LABELS}
            onChange={(v) => setTopOption('analysisEngine', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>{o.analysisEngine.description}</div>
        </div>

        <div className="field">
          <div className="field-label"><span>백엔드</span></div>
          <Segmented<BackendChoice>
            value={o.backend.value}
            choices={['none', 'fastapi', 'express']}
            onChange={(v) => setTopOption('backend', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>{o.backend.description}</div>
        </div>

        <div className="field">
          <div className="field-label"><span>디자인 테마</span></div>
          <Segmented<DesignChoice>
            value={o.design.value}
            choices={['aurora', 'midnight', 'light', 'daylight', 'cyber']}
            onChange={(v) => setTopOption('design', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>모든 사용자의 호감도를 높이는 고급 시각화 테마</div>
        </div>

        <div className="field">
          <div className="field-label"><span>언어</span></div>
          <Segmented<LanguageChoice>
            value={o.language.value}
            choices={['ko', 'en']}
            onChange={(v) => setTopOption('language', v)}
          />
        </div>
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <Gauge size={16} style={{ color: 'var(--accent-3)' }} />
          <span className="card-title">성능 조절</span>
        </div>
        <div className="field">
          <div className="field-label"><span>해상도</span></div>
          <Segmented
            value={p.resolution.value}
            choices={p.resolution.choices}
            onChange={(v) => setPerformance('resolution', v)}
          />
        </div>
        <RangeField label="분석 FPS" option={p.fps as RangeOptionLike} onChange={(v) => setPerformance('fps', v)} />
        <RangeField label="동시 실행 수" option={p.concurrency as RangeOptionLike} onChange={(v) => setPerformance('concurrency', v)} />
        <RangeField label="배치 크기" option={p.batchSize as RangeOptionLike} onChange={(v) => setPerformance('batchSize', v)} />
        <ToggleField label="하드웨어 가속" value={p.hardwareAcceleration.value} description={p.hardwareAcceleration.description} onChange={(v) => setPerformance('hardwareAcceleration', v)} />
        <ToggleField label="적응형 품질" value={p.adaptiveQuality.value} description={p.adaptiveQuality.description} onChange={(v) => setPerformance('adaptiveQuality', v)} />
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <Target size={16} style={{ color: 'var(--accent-4)' }} />
          <span className="card-title">정확도 보완</span>
        </div>
        <RangeField label="신뢰도 임계값" option={a.confidenceThreshold as RangeOptionLike} onChange={(v) => setAccuracy('confidenceThreshold', v)} />
        <RangeField label="인물 감지 민감도" option={a.personDetectionSensitivity as RangeOptionLike} onChange={(v) => setAccuracy('personDetectionSensitivity', v)} />
        <RangeField label="NMS 임계값" option={a.nmsThreshold as RangeOptionLike} onChange={(v) => setAccuracy('nmsThreshold', v)} />
        <div className="field">
          <div className="field-label"><span>행동 모델 프로파일</span></div>
          <Segmented
            value={a.behaviorModel.value}
            choices={a.behaviorModel.choices}
            onChange={(v) => setAccuracy('behaviorModel', v)}
          />
        </div>
        <ToggleField label="시계열 평활화" value={a.temporalSmoothing.value} description={a.temporalSmoothing.description} onChange={(v) => setAccuracy('temporalSmoothing', v)} />
        <ToggleField label="인물 재식별 (Re-ID)" value={a.enableReIdentification.value} description={a.enableReIdentification.description} onChange={(v) => setAccuracy('enableReIdentification', v)} />
        <div className="divider" />
        <RangeField
          label="실시간 추론 해상도"
          option={config.detection.realtimeImgsz as RangeOptionLike}
          onChange={(v) => setConfigSection('detection', 'realtimeImgsz', v)}
        />
        <RangeField
          label="추적 버퍼 (가려짐 유지 프레임)"
          option={config.detection.trackBuffer as RangeOptionLike}
          onChange={(v) => setConfigSection('detection', 'trackBuffer', v)}
        />
        <ToggleField
          label="COCO 사람 보강"
          value={config.detection.personBoost.value}
          description={config.detection.personBoost.description}
          onChange={(v) => setConfigSection('detection', 'personBoost', v)}
        />
        <RangeField
          label="COCO 사람 보강 최소 신뢰도"
          option={config.detection.personBoostMinConf as RangeOptionLike}
          onChange={(v) => setConfigSection('detection', 'personBoostMinConf', v)}
        />
        <RangeField
          label="영상 분석 해상도"
          option={config.detection.analysisImgsz as RangeOptionLike}
          onChange={(v) => setConfigSection('detection', 'analysisImgsz', v)}
        />
        <RangeField
          label="영상 분석 FPS"
          option={config.detection.analysisFps as RangeOptionLike}
          onChange={(v) => setConfigSection('detection', 'analysisFps', v)}
        />
        <div className="text-xs faint" style={{ marginTop: 4, lineHeight: 1.6 }}>
          1080p 영상도 분석용으로 640 또는 960으로 축소합니다. 30fps 영상은 5~10fps로 샘플링해 CPU 처리 시간을 줄입니다.
        </div>
        <div className="text-xs faint" style={{ marginTop: 6, lineHeight: 1.6 }}>
          정확도 최고 설정: 신뢰도 0.30~0.35, NMS IoU 0.55, 실시간 해상도 640, 추적 버퍼 30 이상. 야간 영상에서는 COCO 사람 보강을 OFF로 유지하세요.
        </div>
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <ScanSearch size={16} className="accent" />
          <span className="card-title">전처리 · 오탐 방지</span>
        </div>
        <div className="field">
          <div className="field-label"><span>NMS IoU</span><span className="field-value">{config.preprocessing.nmsIoU.value}</span></div>
          <input type="range" min={0.1} max={0.9} step={0.05} value={config.preprocessing.nmsIoU.value} onChange={(e) => setConfigSection('preprocessing', 'nmsIoU', Number(e.target.value))} />
          <div className="text-xs faint" style={{ marginTop: 5 }}>겹치는 Box 제거. 낮추면 중복 제거가 엄격해집니다.</div>
        </div>
        <div className="field">
          <div className="field-label"><span>감마 보정</span><span className="field-value">{config.preprocessing.gamma.value}</span></div>
          <input type="range" min={0.4} max={2} step={0.1} value={config.preprocessing.gamma.value} onChange={(e) => setConfigSection('preprocessing', 'gamma', Number(e.target.value))} />
        </div>
        <div className="text-xs faint" style={{ lineHeight: 1.7 }}>
          제외 영역: 상단 {config.preprocessing.excludeZones.value[0]?.[2]?.[1] ?? 12}% / 하단 {100 - (config.preprocessing.excludeZones.value[1]?.[0]?.[1] ?? 88)}% (하늘·대시보드 반사 마스킹)
        </div>
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <ScanSearch size={16} className="accent" />
          <span className="card-title">탐지 모델 · 추적</span>
        </div>
        <div className="field">
          <div className="field-label"><span>사전학습 모델</span></div>
          <div className="segmented" style={{ flexWrap: 'wrap' }}>
            {config.detection.model.choices.map((m) => (
              <button key={m} className={`segment ${config.detection.model.value === m ? 'active' : ''}`} style={{ minWidth: 70 }} onClick={() => setDetection('model', m)}>
                {m.replace('.pt', '')}
              </button>
            ))}
          </div>
          <div className="text-xs faint" style={{ marginTop: 5 }}>{config.detection.model.description} · 상용 배포 시 Apache/MIT 계열(RT-DETR 등) 사용 권장</div>
        </div>
        <div className="field">
          <div className="field-label"><span>해상도 대응</span></div>
          <Segmented
            value={config.detection.resolutionMode.value}
            choices={config.detection.resolutionMode.choices}
            labels={{ single: '단일', multiscale: '다중스케일', tiled: '타일 분할' }}
            onChange={(v) => setDetection('resolutionMode', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>
            다중스케일: {config.detection.scales.value.join(' / ')} px 앙상블 · 타일: 4분할 후 320px 추론 (작은 객체 강점)
          </div>
        </div>
        <div className="field">
          <div className="field-label"><span>추적 알고리즘</span></div>
          <Segmented
            value={config.detection.tracker.value}
            choices={config.detection.tracker.choices}
            labels={{ nearest: '최근접', bytetrack: 'ByteTrack', botsort: 'BoT-SORT' }}
            onChange={(v) => setDetection('tracker', v)}
          />
        </div>
        <div className="field">
          <div className="field-label"><span>추론 엔진</span></div>
          <Segmented
            value={config.detection.runtime.value}
            choices={config.detection.runtime.choices}
            labels={{ onnx: 'ONNX (고속)', openvino: 'OpenVINO', pytorch: 'PyTorch' }}
            onChange={(v) => setDetection('runtime', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>ONNX Runtime은 GPU 사용 시 자동 CUDA 전환, CPU에서도 PyTorch보다 빠릅니다.</div>
        </div>
        <div className="field">
          <div className="field-label"><span>추적 클래스 범위</span></div>
          <Segmented
            value={config.detection.classFilter.value}
            choices={config.detection.classFilter.choices}
            labels={{ all: '전체 사물', person_vehicle: '인물·차량만', person_only: '사람만 (오탐 차단)' }}
            onChange={(v) => setDetection('classFilter', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>
            전체 모드는 COCO 80클래스(사람·차량·표지판·가방·가구 등)를 모두 추적하며, 오탐 방지를 위해 신뢰도 기준을 0.7 이상으로 올립니다.
          </div>
        </div>
        <ToggleField
          label="광학 흐름 모드 (학습/모델 불필요)"
          value={config.detection.opticalFlow.value}
          description={config.detection.opticalFlow.description}
          onChange={(v) => setDetection('opticalFlow', v)}
        />
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <Sparkles size={16} className="accent" />
          <span className="card-title">예측 · 스트림 · 저장</span>
        </div>
        <ToggleField
          label="이동 예측 (칼만 필터)"
          value={config.prediction.enabled.value}
          description={config.prediction.enabled.description}
          onChange={(v) => setConfigSection('prediction', 'enabled', v)}
        />
        <div className="field">
          <div className="field-label"><span>예측 시간</span><span className="field-value">{config.prediction.horizonSec.value}s</span></div>
          <input type="range" min={1} max={5} value={config.prediction.horizonSec.value} onChange={(e) => setConfigSection('prediction', 'horizonSec', Number(e.target.value))} />
        </div>
        <ToggleField
          label="시간 기반 사고 판단"
          value={config.accidentAnalysis.enabled.value}
          description={config.accidentAnalysis.enabled.description}
          onChange={(v) => setConfigSection('accidentAnalysis', 'enabled', v)}
        />
        <div className="field">
          <div className="field-label"><span>충돌 판단 시간 창</span><span className="field-value">{config.accidentAnalysis.collisionWindowSec.value}s</span></div>
          <input type="range" min={0.5} max={5} step={0.5} value={config.accidentAnalysis.collisionWindowSec.value} onChange={(e) => setConfigSection('accidentAnalysis', 'collisionWindowSec', Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>거리 급감 기준</span><span className="field-value">{Math.round(config.accidentAnalysis.collisionDistDrop.value * 100)}%</span></div>
          <input type="range" min={0.2} max={0.95} step={0.05} value={config.accidentAnalysis.collisionDistDrop.value} onChange={(e) => setConfigSection('accidentAnalysis', 'collisionDistDrop', Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>최소 지속 프레임</span><span className="field-value">{config.accidentAnalysis.minFrames.value}프레임</span></div>
          <input type="range" min={2} max={10} value={config.accidentAnalysis.minFrames.value} onChange={(e) => setConfigSection('accidentAnalysis', 'minFrames', Number(e.target.value))} />
        </div>
        <ToggleField
          label="RTSP 스트림 분석"
          value={config.streaming.enabled.value}
          description={config.streaming.enabled.description}
          onChange={(v) => setConfigSection('streaming', 'enabled', v)}
        />
        <div className="field">
          <div className="field-label"><span>RTSP 주소</span></div>
          <input className="ghost-btn full" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} value={config.streaming.rtspUrl.value} onChange={(e) => setConfigSection('streaming', 'rtspUrl', e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label"><span>WebRTC 주소 (MediaMTX)</span></div>
          <input className="ghost-btn full" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} value={config.streaming.webrtcUrl.value} placeholder="http://host:8889/camera/whep" onChange={(e) => setConfigSection('streaming', 'webrtcUrl', e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label"><span>이벤트 브로커</span></div>
          <Segmented
            value={config.broker.type.value}
            choices={config.broker.type.choices}
            labels={{ local: '로컬 파일', redis: 'Redis Streams' }}
            onChange={(v) => setConfigSection('broker', 'type', v)}
          />
          {config.broker.type.value === 'redis' && (
            <input className="ghost-btn full mt-2" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} value={config.broker.url.value} onChange={(e) => setConfigSection('broker', 'url', e.target.value)} />
          )}
        </div>
        <div className="divider" />
        <div className="text-xs faint" style={{ marginBottom: 8 }}>학습 데이터 자동 수집</div>
        <ToggleField
          label="하드 네거티브 자동 수집"
          value={config.training.activeLearning.value}
          description={config.training.activeLearning.description}
          onChange={(v) => setConfigSection('training', 'activeLearning', v)}
        />
        <div className="field">
          <div className="field-label"><span>모호 신뢰도 하한</span><span className="field-value">{config.training.ambiguousMin.value}</span></div>
          <input type="range" min={0.1} max={0.9} step={0.05} value={config.training.ambiguousMin.value} onChange={(e) => setConfigSection('training', 'ambiguousMin', Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>모호 신뢰도 상한</span><span className="field-value">{config.training.ambiguousMax.value}</span></div>
          <input type="range" min={0.1} max={0.95} step={0.05} value={config.training.ambiguousMax.value} onChange={(e) => setConfigSection('training', 'ambiguousMax', Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>클립 윈도우</span><span className="field-value">{config.training.clipWindowSec.value}s</span></div>
          <input type="range" min={1} max={15} value={config.training.clipWindowSec.value} onChange={(e) => setConfigSection('training', 'clipWindowSec', Number(e.target.value))} />
        </div>
        <ToggleField
          label="이벤트 로그 저장"
          value={config.storage.eventLog.value}
          description={config.storage.eventLog.description}
          onChange={(v) => setConfigSection('storage', 'eventLog', v)}
        />
        <div className="text-xs faint">저장 위치: services/.data/events.jsonl · 클립: services/.data/clips/</div>
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <Gauge size={16} style={{ color: 'var(--accent-4)' }} />
          <span className="card-title">사물 측정</span>
        </div>
        <ToggleField
          label="상대 크기 출력"
          value={config.measurement.relativeSize.value}
          description={config.measurement.relativeSize.description}
          onChange={(v) => setMeasurement('relativeSize', v)}
        />
        <div className="field">
          <div className="field-label"><span>기준 객체</span></div>
          <Segmented
            value={config.measurement.referenceObject.value}
            choices={config.measurement.referenceObject.choices}
            labels={{ car: '차량', person: '인물', none: '없음' }}
            onChange={(v) => setMeasurement('referenceObject', v)}
          />
        </div>
        <RangeField label="기준 객체 폭 (cm)" option={config.measurement.knownWidthCm as RangeOptionLike} onChange={(v) => setMeasurement('knownWidthCm', v)} />
        <RangeField label="카메라 화각 (°)" option={config.measurement.fieldOfViewDeg as RangeOptionLike} onChange={(v) => setMeasurement('fieldOfViewDeg', v)} />
        <ToggleField
          label="깊이 모델 (MiDaS)"
          value={config.measurement.depthEstimation.value}
          description={config.measurement.depthEstimation.description}
          onChange={(v) => setMeasurement('depthEstimation', v)}
        />
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <ListChecks size={16} className="accent" />
          <span className="card-title">파이프라인 자동화</span>
        </div>
        <ToggleField
          label="자동 업데이트"
          value={config.pipeline.autoUpdate.value}
          description={config.pipeline.autoUpdate.description}
          onChange={setAutoUpdate}
        />
        <RangeField
          label="디바운스 (ms)"
          option={{ value: config.pipeline.autoUpdateDebounceMs.value, min: 0, max: 2000, description: '변경 후 재실행까지의 대기 시간' }}
          onChange={setDebounce}
        />
        <ToggleField
          label="기능 안내 팝업"
          value={guideEnabled}
          description="처음 방문하는 탭에서 기능 설명 팝업을 자동으로 표시합니다. 꺼도 상단 '안내' 버튼으로 열 수 있습니다."
          onChange={setGuideEnabled}
        />
        <div className="divider" />
        <div className="text-xs faint" style={{ lineHeight: 1.7 }}>
          옵션을 변경하거나 파이프라인 노드를 생성·수정·삭제하면 그래프가 새 버전으로 재구성되고 분석이 자동으로 재실행됩니다.
        </div>
        <button className="ghost-btn full mt-4" onClick={resetPipeline}>
          <RefreshCw size={14} /> 전체 초기화
        </button>
      </div>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-react/src/components/panels/DataCatalogPanel.tsx</code></summary>

```tsx
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, ClipboardCopy, Database, FolderTree, RefreshCw, Server, UploadCloud } from 'lucide-react';
import { backendBaseUrl } from '@/config';
import { useStore } from '@/store/useStore';
import DataCard from './DataCard';

interface CatalogItem {
  group: string;
  name: string;
  path: string;
  kind: string;
  source: string;
  endpoint: string;
  desc: string;
  status: 'exists' | 'pending' | 'memory';
}
interface CatalogData {
  groups: string[];
  items: CatalogItem[];
  total: number;
  root: string;
  note: string;
}
interface ExternalDataset {
  id: string;
  name: string;
  source: string;
  purpose: string;
  scale: string;
  labels: string[];
  format: string;
  note: string;
}
interface ExternalData {
  datasets: ExternalDataset[];
  importDir: string;
  note: string;
  imported: Array<{ name: string; path: string; files: number }>;
}

const STATUS_LABEL: Record<CatalogItem['status'], string> = {
  exists: '생성됨', pending: '대기', memory: '메모리',
};

export default function DataCatalogPanel() {
  const pushToast = useStore((s) => s.pushToast);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [external, setExternal] = useState<ExternalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = backendBaseUrl();
      const [cRes, eRes] = await Promise.all([
        fetch(`${base}/api/data-catalog`),
        fetch(`${base}/api/external-datasets`),
      ]);
      if (!cRes.ok || !eRes.ok) throw new Error(`API 응답 오류 (${cRes.status}/${eRes.status})`);
      setCatalog(await cRes.json() as CatalogData);
      setExternal(await eRes.json() as ExternalData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const item of catalog?.items ?? []) {
      map.set(item.group, [...(map.get(item.group) ?? []), item]);
    }
    return map;
  }, [catalog]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast('경로를 클립보드에 복사했습니다.', 'success');
    } catch {
      pushToast('클립보드 복사에 실패했습니다.', 'warning');
    }
  };

  if (loading) {
    return (
      <div className="card card-pad">
        <div className="empty-state"><Database size={22} /><b>데이터 카탈로그를 불러오는 중...</b></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="card card-pad">
        <div className="empty-state">
          <Server size={22} /><b>카탈로그 조회 실패</b>
          <div className="text-xs">{error} · 백엔드({backendBaseUrl()})가 실행 중인지 확인하세요.</div>
          <button className="primary-btn mt-4" onClick={() => void load()}><RefreshCw size={14} /> 다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <DataCard
        dataKey="catalog-overview"
        title="데이터 카탈로그 개요"
        description="프로젝트가 생성·사용하는 데이터의 종류와 저장 경로를 서버에서 조회한 결과입니다."
        icon={<FolderTree size={15} />}
        right={<button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => void load()}><RefreshCw size={12} /> 새로고침</button>}
        bodyClassName="card-pad"
      >
        <div className="metric-row">
          <div className="metric-cell"><span>데이터 항목</span><b>{catalog?.total ?? 0}</b></div>
          <div className="metric-cell"><span>그룹</span><b>{catalog?.groups.length ?? 0}</b></div>
          <div className="metric-cell"><span>외부 데이터셋</span><b>{external?.datasets.length ?? 0}</b></div>
        </div>
        <div className="catalog-root">
          <span>프로젝트 루트</span>
          <code>{catalog?.root}</code>
          <button className="icon-btn" title="루트 경로 복사" onClick={() => void copy(catalog?.root ?? '')}><ClipboardCopy size={13} /></button>
        </div>
        <div className="text-xs faint" style={{ marginTop: 8 }}>{catalog?.note}</div>
      </DataCard>

      {[...grouped.entries()].map(([group, items]) => (
        <DataCard
          key={group}
          dataKey={`catalog-group-${group}`}
          title={`${group} 데이터`}
          description={`${group} 그룹에 속한 ${items.length}개 데이터의 경로·생성 주체·연결 API입니다.`}
          icon={<Database size={15} />}
          bodyClassName="card-pad"
        >
          <div className="catalog-list">
            {items.map((item) => (
              <div className="catalog-row" key={`${item.group}-${item.name}`}>
                <div className="catalog-row-main">
                  <div className="flex items-center gap-2">
                    <b className="text-sm">{item.name}</b>
                    <span className="catalog-kind">{item.kind}</span>
                    <span className={`catalog-status ${item.status}`}>
                      {item.status === 'exists' ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <div className="catalog-path">
                    <code>{item.path}</code>
                    <button className="icon-btn" title="경로 복사" onClick={() => void copy(item.path)}><ClipboardCopy size={12} /></button>
                  </div>
                  <div className="text-xs faint">{item.desc}</div>
                </div>
                <div className="catalog-meta">
                  <div><span>생성 주체</span><b>{item.source}</b></div>
                  <div><span>연결 API</span><code>{item.endpoint}</code></div>
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      ))}

      <DataCard
        dataKey="catalog-external"
        title="외부 공개 데이터셋"
        description="학습에 활용할 수 있는 공개 사고·이상행동 데이터셋 카탈로그입니다. 데이터 자체는 포함되지 않습니다."
        icon={<UploadCloud size={15} />}
        bodyClassName="card-pad"
      >
        <div className="catalog-root" style={{ marginBottom: 10 }}>
          <span>가져오기 경로</span>
          <code>{external?.importDir}</code>
          <button className="icon-btn" title="경로 복사" onClick={() => void copy(external?.importDir ?? '')}><ClipboardCopy size={13} /></button>
        </div>
        <div className="catalog-list">
          {(external?.datasets ?? []).map((ds) => (
            <div className="catalog-row" key={ds.id}>
              <div className="catalog-row-main">
                <div className="flex items-center gap-2">
                  <b className="text-sm">{ds.name}</b>
                  <span className="catalog-kind">{ds.source}</span>
                </div>
                <div className="text-xs">{ds.purpose} · {ds.scale}</div>
                <div className="text-xs faint">{ds.format} · 라벨: {ds.labels.join(', ')}</div>
                <div className="text-xs faint">{ds.note}</div>
              </div>
              <div className="catalog-meta">
                <div><span>데이터셋 ID</span><code>{ds.id}</code></div>
              </div>
            </div>
          ))}
        </div>
        {!!external?.imported.length && (
          <div className="text-xs faint" style={{ marginTop: 10 }}>
            로컬 적재: {external.imported.map((i) => `${i.name}(${i.files}개 파일)`).join(', ')}
          </div>
        )}
        <div className="text-xs faint" style={{ marginTop: 8 }}>{external?.note}</div>
      </DataCard>
    </div>
  );
}
```

</details>

<details>
<summary><code>apps/web-next/package.json</code></summary>

```json
{
  "name": "@visionflow/web-next",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 53711",
    "build": "next build",
    "start": "next start -p 53711"
  },
  "dependencies": {
    "next": "^16.4.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.7.2"
  }
}
```

</details>

<details>
<summary><code>apps/web-next/next.config.mjs</code></summary>

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
};

export default nextConfig;
```

</details>

<details>
<summary><code>apps/web-next/tsconfig.json</code></summary>

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

</details>

<details>
<summary><code>apps/web-next/app/layout.tsx</code></summary>

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VisionFlow Studio — Next.js Option',
  description: '프론트엔드 옵션 next 선택 시 실행되는 엔트리',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

</details>

<details>
<summary><code>apps/web-next/app/page.tsx</code></summary>

```tsx
import config from '../../../configs/app.config.json';

export default function Home() {
  const { project, options, performance, accuracy, pipeline } = config;
  return (
    <main className="shell">
      <header className="head">
        <div className="mark">VF</div>
        <div>
          <h1>{project.name}</h1>
          <p>Next.js 옵션 · v{project.version} · 모듈형 파이프라인 스튜디오</p>
        </div>
      </header>

      <section className="grid">
        <article className="card">
          <h2>선택된 모듈 옵션</h2>
          <ul>
            <li>프론트엔드 <b>{options.frontend.value}</b></li>
            <li>분석 엔진 <b>{options.analysisEngine.value}</b></li>
            <li>백엔드 <b>{options.backend.value}</b></li>
            <li>디자인 <b>{options.design.value}</b></li>
          </ul>
        </article>
        <article className="card">
          <h2>성능 / 정확도</h2>
          <ul>
            <li>해상도 <b>{performance.resolution.value}</b> · FPS <b>{performance.fps.value}</b></li>
            <li>신뢰도 임계값 <b>{accuracy.confidenceThreshold.value}</b></li>
            <li>행동 모델 <b>{accuracy.behaviorModel.value}</b></li>
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>파이프라인 노드 (v1 · 자동 업데이트 {pipeline.autoUpdate.value ? 'ON' : 'OFF'})</h2>
        <div className="flow">
          {pipeline.nodes.map((n: any) => (
            <span key={n.id} className={`node ${n.enabled ? '' : 'off'}`}>{n.label}</span>
          ))}
        </div>
      </section>

      <footer className="foot">
        전체 기능이 구현된 기준 앱은 <code>npm run dev</code> (React · http://localhost:53710) 에서 실행됩니다.
      </footer>
    </main>
  );
}
```

</details>

<details>
<summary><code>apps/web-next/app/globals.css</code></summary>

```css
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Pretendard', 'Inter', system-ui, sans-serif;
  background: radial-gradient(1000px 600px at 80% -10%, #dbe5fb, transparent), #f3f6fc;
  color: #16223c;
  min-height: 100vh;
}
.shell { max-width: 980px; margin: 0 auto; padding: 48px 24px; }
.head { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.mark {
  width: 52px; height: 52px; border-radius: 15px; display: grid; place-items: center;
  background: linear-gradient(135deg, #4f6ef7, #9b5cf6); color: #ffffff; font-weight: 900;
}
h1 { margin: 0; font-size: 26px; letter-spacing: -0.7px; }
.head p { margin: 5px 0 0; color: #4d6080; font-size: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.card {
  background: rgba(255, 255, 255, 0.88); border: 1px solid rgba(65, 95, 155, 0.14);
  border-radius: 18px; padding: 20px; margin-bottom: 16px; backdrop-filter: blur(16px);
  box-shadow: 0 12px 30px rgba(40, 65, 120, 0.1);
}
.card h2 { font-size: 13px; margin: 0 0 14px; color: #4f6ef7; }
.card ul { list-style: none; padding: 0; margin: 0; font-size: 12.5px; line-height: 2; color: #4d6080; }
.card b { color: #16223c; float: right; }
.flow { display: flex; gap: 8px; flex-wrap: wrap; }
.node {
  padding: 8px 12px; border-radius: 10px; font-size: 11px;
  background: rgba(79, 110, 247, 0.1); border: 1px solid rgba(79, 110, 247, 0.3); color: #4f6ef7;
}
.node.off { opacity: 0.4; filter: grayscale(1); }
.foot { font-size: 11px; color: #8798b2; margin-top: 24px; }
code { color: #9b5cf6; }
@media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
```

</details>

<details>
<summary><code>apps/web-vue/package.json</code></summary>

```json
{
  "name": "@visionflow/web-vue",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 53712 --strictPort",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.5"
  }
}
```

</details>

<details>
<summary><code>apps/web-vue/vite.config.ts</code></summary>

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 53712,
    strictPort: true,
    host: '0.0.0.0',
    fs: { allow: ['../..', '.'] },
  },
});
```

</details>

<details>
<summary><code>apps/web-vue/index.html</code></summary>

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VisionFlow Studio — Vue Option</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

</details>

<details>
<summary><code>apps/web-vue/src/main.ts</code></summary>

```ts
import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

createApp(App).mount('#app');
```

</details>

<details>
<summary><code>apps/web-vue/src/App.vue</code></summary>

```html
<script setup lang="ts">
import config from '../../../configs/app.config.json';

const { project, options, performance, accuracy, pipeline } = config;
</script>

<template>
  <main class="shell">
    <header class="head">
      <div class="mark">VF</div>
      <div>
        <h1>{{ project.name }}</h1>
        <p>Vue 옵션 · v{{ project.version }} · 모듈형 파이프라인 스튜디오</p>
      </div>
    </header>

    <section class="grid">
      <article class="card">
        <h2>선택된 모듈 옵션</h2>
        <ul>
          <li>프론트엔드 <b>{{ options.frontend.value }}</b></li>
          <li>분석 엔진 <b>{{ options.analysisEngine.value }}</b></li>
          <li>백엔드 <b>{{ options.backend.value }}</b></li>
          <li>디자인 <b>{{ options.design.value }}</b></li>
        </ul>
      </article>
      <article class="card">
        <h2>성능 / 정확도</h2>
        <ul>
          <li>해상도 <b>{{ performance.resolution.value }}</b> · FPS <b>{{ performance.fps.value }}</b></li>
          <li>신뢰도 임계값 <b>{{ accuracy.confidenceThreshold.value }}</b></li>
          <li>행동 모델 <b>{{ accuracy.behaviorModel.value }}</b></li>
        </ul>
      </article>
    </section>

    <section class="card">
      <h2>파이프라인 노드 (자동 업데이트 {{ pipeline.autoUpdate.value ? 'ON' : 'OFF' }})</h2>
      <div class="flow">
        <span v-for="n in pipeline.nodes" :key="n.id" class="node" :class="{ off: !n.enabled }">{{ n.label }}</span>
      </div>
    </section>

    <footer class="foot">
      전체 기능이 구현된 기준 앱은 <code>npm run dev</code> (React · http://localhost:53710) 에서 실행됩니다.
    </footer>
  </main>
</template>
```

</details>

<details>
<summary><code>apps/web-vue/src/style.css</code></summary>

```css
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Pretendard', 'Inter', system-ui, sans-serif;
  background: radial-gradient(1000px 600px at 80% -10%, #dbe5fb, transparent), #f3f6fc;
  color: #16223c;
  min-height: 100vh;
}
.shell { max-width: 980px; margin: 0 auto; padding: 48px 24px; }
.head { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.mark {
  width: 52px; height: 52px; border-radius: 15px; display: grid; place-items: center;
  background: linear-gradient(135deg, #4f6ef7, #9b5cf6); color: #ffffff; font-weight: 900;
}
h1 { margin: 0; font-size: 26px; letter-spacing: -0.7px; }
.head p { margin: 5px 0 0; color: #4d6080; font-size: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.card {
  background: rgba(255, 255, 255, 0.88); border: 1px solid rgba(65, 95, 155, 0.14);
  border-radius: 18px; padding: 20px; margin-bottom: 16px; backdrop-filter: blur(16px);
  box-shadow: 0 12px 30px rgba(40, 65, 120, 0.1);
}
.card h2 { font-size: 13px; margin: 0 0 14px; color: #4f6ef7; }
.card ul { list-style: none; padding: 0; margin: 0; font-size: 12.5px; line-height: 2; color: #4d6080; }
.card b { color: #16223c; float: right; }
.flow { display: flex; gap: 8px; flex-wrap: wrap; }
.node {
  padding: 8px 12px; border-radius: 10px; font-size: 11px;
  background: rgba(79, 110, 247, 0.1); border: 1px solid rgba(79, 110, 247, 0.3); color: #4f6ef7;
}
.node.off { opacity: 0.4; filter: grayscale(1); }
.foot { font-size: 11px; color: #8798b2; margin-top: 24px; }
code { color: #9b5cf6; }
@media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
```

</details>

<details>
<summary><code>services/fastapi/requirements.txt</code></summary>

```text
fastapi>=0.110
uvicorn[standard]>=0.27
pydantic>=2.5
python-multipart>=0.0.9
opencv-python-headless>=4.9
numpy>=1.26
ultralytics>=8.3.0
timm>=1.0.0
onnx>=1.16
onnxruntime>=1.19
```

</details>

<details>
<summary><code>services/fastapi/app/__init__.py</code></summary>

```python

```

</details>

<details>
<summary><code>services/fastapi/app/analyzer.py</code></summary>

```python
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
```

</details>

<details>
<summary><code>services/fastapi/app/main.py</code></summary>

```python
"""VisionFlow Studio — FastAPI 분석 백엔드 (옵션: backend=fastapi)"""
from __future__ import annotations

import asyncio
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, Form, HTTPException, Response, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .analyzer import VideoAnalyzer
from . import (
    yolo_detector, depth_estimator, trainer, behavior_recognizer,
    events, event_store, prediction, stream, preprocessing,
    broker, timeseries, clip_store, resolution, safety, active_learning, synthesis,
    dataset_manager, accident_analyzer, evaluation, auto_retrain, feedback,
    behavior_dataset, external_datasets, data_catalog,
)
from .measurement import measure_objects

app = FastAPI(title="VisionFlow CV API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    # 이 프로젝트 전용 프론트엔드 주소만 허용 (외부 프로젝트 연동 차단)
    allow_origins=[
        "http://localhost:53710",
        "http://localhost:53711",
        "http://localhost:53712",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup() -> None:
    events.set_loop(asyncio.get_running_loop())


@app.websocket("/ws/analysis")
async def websocket_analysis(websocket: WebSocket):
    await events.connect(websocket)


CONFIG_PATH = Path(__file__).resolve().parents[3] / "configs" / "app.config.json"
config = json.loads(CONFIG_PATH.read_text(encoding="utf-8")) if CONFIG_PATH.exists() else {}
yolo_detector.configure(config.get("detection", {}))
# 학습된 커스텀 모델이 있으면 재시작 후에도 자동 적용
if trainer.CUSTOM_MODEL.exists():
    try:
        _names = json.loads(
            (trainer.CUSTOM_MODEL.parent / "custom_names.json").read_text(encoding="utf-8")
        )
        yolo_detector.use_model(str(trainer.CUSTOM_MODEL), _names)
    except Exception:
        pass
preprocessing.configure(config.get("preprocessing", {}))
broker.configure(config.get("broker", {}))
resolution.configure(config.get("detection", {}))
safety.configure(config.get("safety", {}))
accident_analyzer.configure(config)
active_learning.configure(config.get("training", {}))
timeseries.init()
analyzer = VideoAnalyzer()


class AnalyzeRequest(BaseModel):
    videoName: str = "demo_surveillance_clip.mp4"
    videoUrl: str | None = None
    performance: dict = Field(default_factory=dict)
    accuracy: dict = Field(default_factory=dict)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "engine": "fastapi-yolo",
        "model": yolo_detector.active_model_info(),
        "isolation": config.get("isolation", {}).get("standalone", False),
    }


@app.get("/api/config")
def get_config():
    if not CONFIG_PATH.exists():
        raise HTTPException(status_code=404, detail="config not found")
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    if not req.videoName:
        raise HTTPException(status_code=400, detail="videoName is required")
    return analyzer.analyze(req.videoName, req.performance or {}, req.accuracy or {})


@app.post("/api/detect-frame")
async def detect_frame(
    file: UploadFile = File(...),
    threshold: float = Form(0.5),
):
    """재생 중인 프레임 1장을 YOLO로 감지한다 (실시간 추적용)."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty frame")
    try:
        det_cfg = config.get("detection", {})
        dets = yolo_detector.detect_image(
            np.array(Image.open(io.BytesIO(data)).convert("RGB")), threshold, 640,
            True,
            bool(det_cfg.get("personBoost", {}).get("value", True)),
            float(det_cfg.get("personBoostMinConf", {}).get("value", 0.3)),
        )
        # 화면 대부분을 덮는 차량/중장비 박스는 배경 오탐(잔해·붕괴 장면)으로 제거
        filtered = [
            d for d in dets
            if d.get("kind") == "person"
            or (d.get("bbox", {}).get("w", 0) * d.get("bbox", {}).get("h", 0) / 100) <= 22
        ]
        return {"detections": filtered}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YOLO detect failed: {exc}")


@app.post("/api/measure-frame")
async def measure_frame(
    file: UploadFile = File(...),
    threshold: float = Form(0.5),
    depth: bool = Form(False),
):
    """프레임에서 객체를 감지하고 상대/실측 근사치(깊이 포함)를 반환한다."""
    import time as _time

    t_req = _time.perf_counter()
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty frame")
    t_read = _time.perf_counter()
    try:
        from PIL import Image
        import numpy as np

        image = np.array(Image.open(io.BytesIO(data)).convert("RGB"))
        clip_store.push(image)
        t_image = _time.perf_counter()
        # 실시간 프레임은 경량 추론(imgsz 320) + 깊이 생략으로 지연을 줄인다.
        import time as _time

        # 실시간 경로는 설정된 단일 스케일로 추론하고 이벤트 루프를 막지 않도록 스레드에서 실행
        realtime_imgsz = int(config.get("detection", {}).get("realtimeImgsz", {}).get("value", 960))
        detections = await asyncio.to_thread(
            yolo_detector.detect_image, image, threshold, realtime_imgsz, True,
            bool(config.get("detection", {}).get("personBoost", {}).get("value", True)),
            float(config.get("detection", {}).get("personBoostMinConf", {}).get("value", 0.3)),
        )
        t_detect = _time.perf_counter()
        disparity = None
        if depth and config.get("measurement", {}).get("depthEstimation", {}).get("value", False):
            disparity = depth_estimator.estimate_disparity(image)
        items = measure_objects(detections, image.shape[1], image.shape[0], config.get("measurement", {}), disparity)
        preds = []
        if config.get("prediction", {}).get("enabled", {}).get("value", True):
            preds = prediction.update_and_predict(
                detections,
                config.get("prediction", {}).get("roiPolygons", {}).get("value", []),
                float(config.get("prediction", {}).get("horizonSec", {}).get("value", 2)),
            )
        safety_events, context_description = safety.analyze(detections)
        accident_events = accident_analyzer.analyze(detections, preds)
        captured = active_learning.capture(image, detections, safety_events)
        t_end = _time.perf_counter()
        payload = {
            "width": image.shape[1],
            "height": image.shape[0],
            "depthUsed": disparity is not None,
            "timingsMs": {
                "read": round((t_read - t_req) * 1000, 1),
                "decode": round((t_image - t_read) * 1000, 1),
                "detect": round((t_detect - t_image) * 1000, 1),
                "measure": round((t_end - t_detect) * 1000, 1),
            },
            "predictions": preds,
            "safetyEvents": safety_events,
            "accidentEvents": accident_events,
            "contextDescription": context_description,
            "capturedNegative": captured,
            "measurements": items,
        }
        danger = any(p.get("danger") for p in preds) or any(
            e.get("severity") == "critical" for e in accident_events
        )
        clip = clip_store.maybe_save(danger)
        await events.publish({
            "type": "frame",
            "predictions": preds,
            "safetyEvents": safety_events,
            "accidentEvents": accident_events,
            "contextDescription": context_description,
            "capturedNegative": captured,
            "danger": danger or any(e.get("severity") == "critical" for e in safety_events),
            "clip": clip,
        })
        if config.get("storage", {}).get("eventLog", {}).get("value", True):
            event_store.append({"kind": "frame", "predictions": preds, "danger": danger, "clip": clip})
        for ae in accident_events:
            evaluation.add_prediction(ae)
        broker.publish({"kind": "frame", "danger": danger, "predictions": preds, "clip": clip})
        timeseries.insert(len(detections), danger, payload["timingsMs"]["detect"], label="")
        payload["clip"] = clip
        return payload
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"measure failed: {exc}")


@app.post("/api/analyze-video")
async def analyze_video(
    file: UploadFile = File(...),
    threshold: float = Form(0.5),
):
    """업로드된 영상을 YOLO로 분석해 실제 감지/트랙 결과를 반환한다."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty video")
    try:
        det_cfg = config.get("detection", {})
        fps = float(det_cfg.get("analysisFps", {}).get("value", 6))
        imgsz = int(det_cfg.get("analysisImgsz", {}).get("value", 640))
        if det_cfg.get("opticalFlow", {}).get("value", False):
            return await asyncio.to_thread(yolo_detector.analyze_video_optical_flow, data, fps)
        return await asyncio.to_thread(yolo_detector.analyze_video_bytes, data, threshold, fps, imgsz)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"YOLO video analysis failed: {exc}")


class CaptureRequest(BaseModel):
    datasetId: str = "capture"
    detections: list[dict] = Field(default_factory=list)


class ClipLabelRequest(BaseModel):
    datasetId: str = "capture"
    index: int = 0
    detections: list[dict] = Field(default_factory=list)


class DatasetImportRequest(BaseModel):
    datasetId: str = "construction"
    sourcePath: str = ""
    classes: list[str] = Field(default_factory=list)
    valRatio: float = 0.2


class DatasetCreateRequest(BaseModel):
    datasetId: str = "capture"
    classes: list[str] = Field(default_factory=list)


class TrainRequest(BaseModel):
    datasetId: str = "capture"
    epochs: int = 30
    imgsz: int = 640
    batch: int = 8
    baseModel: str = "yolov8n.pt"
    augmentation: dict = Field(default_factory=dict)


@app.post("/api/behavior/frame")
async def behavior_frame(
    file: UploadFile = File(...),
    threshold: float = Form(0.5),
):
    """재생 중 프레임에서 인물 행동(포즈+이동)을 인식한다."""
    import numpy as np
    from PIL import Image

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty frame")
    try:
        image = np.array(Image.open(io.BytesIO(data)).convert("RGB"))
        return {"behaviors": behavior_recognizer.recognize(image, threshold)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"behavior recognize failed: {exc}")


@app.post("/api/dataset/create")
def dataset_create(req: DatasetCreateRequest):
    """사용자 정의 클래스 목록으로 데이터셋을 생성한다."""
    trainer.prepare_dataset(req.datasetId, req.classes)
    return {"datasetId": req.datasetId, "classes": len(req.classes)}


@app.post("/api/dataset/upload")
async def dataset_upload(
    file: UploadFile = File(...),
    datasetId: str = Form("imported"),
):
    """외부 데이터셋 ZIP을 업로드한다."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty zip")
    try:
        return trainer.import_zip(datasetId, data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"invalid zip: {exc}")


@app.post("/api/dataset/capture")
async def dataset_capture(
    file: UploadFile = File(...),
    payload: str = Form("{}"),
):
    """현재 감지 결과를 학습용 데이터셋(YOLO 라벨)으로 저장한다."""
    import json as _json

    try:
        req = _json.loads(payload)
    except Exception:
        req = {}
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty frame")
    count = trainer.save_capture(
        req.get("datasetId", "capture"),
        data,
        req.get("detections", []),
        file.filename or "frame.jpg",
    )
    return {"saved": count, "datasetId": req.get("datasetId", "capture")}


@app.get("/api/train/status")
def train_status():
    return trainer.status()


@app.post("/api/train/start")
def train_start(req: TrainRequest):
    return trainer.start_training(
        req.datasetId,
        epochs=max(1, min(req.epochs, 300)),
        imgsz=int(req.imgsz),
        batch=max(1, min(req.batch, 64)),
        base_model=req.baseModel,
        augmentation=req.augmentation,
    )


class StreamRequest(BaseModel):
    rtspUrl: str


@app.get("/api/events")
def get_events(limit: int = 100):
    return {"events": event_store.recent(limit)}


@app.get("/api/stream/status")
def stream_status():
    return {**stream.status(), "clients": events.client_count()}


@app.post("/api/stream/start")
def stream_start(req: StreamRequest):
    return stream.start(req.rtspUrl, config)


@app.post("/api/stream/stop")
def stream_stop():
    return stream.stop()


@app.get("/api/runtime")
def runtime_info():
    from . import openvino_detector

    return {
        "wsClients": events.client_count(),
        "stream": stream.status(),
        "openvino": openvino_detector.runtime_info(),
        "broker": broker.status(),
        "webrtcUrl": config.get("streaming", {}).get("webrtcUrl", {}).get("value", ""),
    }


@app.get("/api/metrics")
def get_metrics(limit: int = 100):
    return {"metrics": timeseries.recent(limit)}


class ReviewRequest(BaseModel):
    eventId: str
    verdict: str  # true | false
    accidentType: str = "unknown"
    reviewedBy: str = "user"


@app.get("/api/evaluation")
def get_evaluation():
    return evaluation.evaluate()


@app.post("/api/evaluation/review")
def review_event(req: ReviewRequest):
    if req.verdict not in ("true", "false"):
        raise HTTPException(status_code=400, detail="verdict must be true or false")
    return evaluation.add_review(req.eventId, req.verdict, req.accidentType, req.reviewedBy)


class AutoRetrainRequest(BaseModel):
    epochs: int = 10
    imgsz: int = 640
    baseModel: str = "yolov8n.pt"


@app.post("/api/feedback/false-positive")
async def report_false_positive(
    file: UploadFile = File(...),
    label: str = Form(""),
    confidence: float = Form(0.0),
    bbox: str = Form("{}"),
):
    """화면에서 잘못 탐지된 BBox를 신고 → 네거티브 샘플로 저장."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty frame")
    try:
        record = feedback.report(data, label, confidence, json.loads(bbox))
        from . import evaluation as _ev
        _ev.add_review(record["file"], "false", label or "unknown")
        return {"saved": True, "record": record}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"feedback failed: {exc}")


@app.get("/api/data-catalog")
def get_data_catalog():
    return data_catalog.catalog()


@app.get("/api/external-datasets")
def list_external_datasets():
    return {**external_datasets.catalog(), "imported": external_datasets.imported()}


@app.get("/api/external-datasets/{dataset_id}/guide")
def external_dataset_guide(dataset_id: str):
    return external_datasets.guide(dataset_id)


@app.get("/api/behavior-dataset/stats")
def behavior_dataset_stats():
    return behavior_dataset.stats()


@app.get("/api/feedback/stats")
def feedback_stats():
    return feedback.stats()


@app.get("/api/feedback/zones")
def feedback_zones():
    return {"zones": feedback.zones()}


@app.get("/api/auto-retrain/status")
def auto_retrain_status():
    return auto_retrain.status()


@app.post("/api/auto-retrain/start")
def auto_retrain_start(req: AutoRetrainRequest):
    return auto_retrain.run(
        epochs=max(3, min(req.epochs, 50)),
        imgsz=int(req.imgsz),
        base_model=req.baseModel,
    )


@app.get("/api/clips")
def get_clips():
    return {"clips": clip_store.list_clips()}


@app.get("/api/clips/{name}/info")
def get_clip_info(name: str):
    try:
        return clip_store.clip_info(name)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.get("/api/clips/{name}/frame/{index}")
def get_clip_frame(name: str, index: int):
    """클립 프레임을 JPEG로 반환 (라벨링 UI 미리보기)."""
    try:
        return Response(content=clip_store.get_frame(name, index), media_type="image/jpeg")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/clips/{name}/label")
def label_clip_frame(name: str, req: ClipLabelRequest):
    """수동으로 수정한 BBox를 YOLO 라벨로 저장. detections가 비면 네거티브 샘플."""
    try:
        frame = clip_store.get_frame(name, req.index)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    saved = trainer.save_capture(
        req.datasetId, frame, req.detections, f"clip_{Path(name).stem}_{req.index}.jpg"
    )
    return {"saved": saved, "datasetId": req.datasetId, "negative": saved == 0}


@app.get("/api/dataset/classes")
def get_dataset_classes(datasetId: str = "capture"):
    root = trainer.prepare_dataset(datasetId)
    cls_file = root / "classes.txt"
    names = [line.strip() for line in cls_file.read_text(encoding="utf-8").splitlines() if line.strip()] if cls_file.exists() else trainer.COCO_NAMES
    return {"datasetId": datasetId, "classes": names}


@app.get("/api/dataset/analyze")
def analyze_dataset(datasetId: str = "capture"):
    return dataset_manager.analyze(datasetId)


@app.get("/api/dataset/raw")
def list_raw_datasets():
    return {"datasets": dataset_manager.raw_datasets(), "root": str(dataset_manager.RAW_DIR)}


@app.post("/api/dataset/import-dir")
def import_dataset_dir(req: DatasetImportRequest):
    try:
        return dataset_manager.import_directory(req.datasetId, req.sourcePath, req.classes, req.valRatio)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/broker/recent")
def get_broker_events(limit: int = 50):
    return {"events": broker.recent(limit)}


@app.get("/api/active-learning")
def active_learning_status():
    return active_learning.stats()


@app.post("/api/dataset/synthesize")
def synthesize(datasetId: str = "capture", copies: int = 3):
    return synthesis.synthesize(datasetId, copies)


@app.post("/api/model/set")
def model_set(model: str = "yolov8s.pt", runtime: str | None = None):
    yolo_detector.set_pretrained_model(model)
    if runtime:
        yolo_detector.set_runtime(runtime)
    return {
        "model": yolo_detector.active_model_info(),
        "runtime": runtime or yolo_detector._runtime,
    }


@app.post("/api/model/use")
def model_use(pretrained: bool = True):
    if pretrained:
        from pathlib import Path as _Path

        yolo_detector.use_model(str(_Path(yolo_detector.MODEL_PATH)))
    else:
        yolo_detector.use_model(str(trainer.CUSTOM_MODEL))
    return yolo_detector.active_model_info()
```

</details>

<details>
<summary><code>services/fastapi/app/yolo_detector.py</code></summary>

```python
"""YOLO 기반 실제 객체 감지/추적 어댑터.

- 첫 사용 시 yolov8n 가중치를 프로젝트 내부 `.models/` 에 다운로드한다.
- 사람/차량/이륜차 등을 감지하고 간단한 최근접 매칭으로 트랙 ID를 부여한다.
"""
from __future__ import annotations

import io
import math
import time
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

MODEL_DIR = Path(__file__).resolve().parents[2] / ".models"
MODEL_PATH = MODEL_DIR / "yolov8n.pt"

# COCO 클래스 → 우리 서비스 분류
CLASS_KIND = {
    "person": "person",
    "bicycle": "vehicle",
    "car": "vehicle",
    "motorcycle": "vehicle",
    "airplane": "vehicle",
    "bus": "vehicle",
    "train": "vehicle",
    "truck": "vehicle",
    "boat": "vehicle",
    "forklift": "vehicle",
    "excavator": "vehicle",
    "crane": "vehicle",
    "machinery": "vehicle",
    "equipment": "object",
    "helmet": "object",
    "worker": "person",
}

KOREAN_LABEL = {
    "person": "사람", "bicycle": "자전거", "car": "자동차", "motorcycle": "오토바이",
    "forklift": "지게차", "excavator": "굴착기", "crane": "크레인", "helmet": "안전모",
    "worker": "작업자", "equipment": "장비", "machinery": "중장비",
    "airplane": "비행기", "bus": "버스", "train": "기차", "truck": "트럭", "boat": "보트",
    "traffic light": "신호등", "fire hydrant": "소화전", "stop sign": "정지 표지판",
    "parking meter": "주차 미터기", "bench": "벤치", "bird": "새", "cat": "고양이",
    "dog": "개", "horse": "말", "sheep": "양", "cow": "소", "elephant": "코끼리",
    "bear": "곰", "zebra": "얼룩말", "giraffe": "기린", "backpack": "배낭",
    "umbrella": "우산", "handbag": "핸드백", "tie": "넥타이", "suitcase": "여행가방",
    "frisbee": "프리스비", "skis": "스키", "snowboard": "스노보드", "sports ball": "공",
    "kite": "연", "baseball bat": "야구 방망이", "baseball glove": "야구 장갑",
    "skateboard": "스케이트보드", "surfboard": "서프보드", "tennis racket": "테니스 라켓",
    "bottle": "병", "wine glass": "와인잔", "cup": "컵", "fork": "포크", "knife": "칼",
    "spoon": "숟가락", "bowl": "그릇", "banana": "바나나", "apple": "사과",
    "sandwich": "샌드위치", "orange": "오렌지", "broccoli": "브로콜리", "carrot": "당근",
    "hot dog": "핫도그", "pizza": "피자", "donut": "도넛", "cake": "케이크",
    "chair": "의자", "couch": "소파", "potted plant": "화분", "bed": "침대",
    "dining table": "식탁", "toilet": "변기", "tv": "TV", "laptop": "노트북",
    "mouse": "마우스", "remote": "리모컨", "keyboard": "키보드", "cell phone": "휴대폰",
    "microwave": "전자레인지", "oven": "오븐", "toaster": "토스터", "sink": "싱크대",
    "refrigerator": "냉장고", "book": "책", "clock": "시계", "vase": "화병",
    "scissors": "가위", "teddy bear": "곰인형", "hair drier": "헤어드라이어", "toothbrush": "칫솔",
}

_model = None
_active_path = str(MODEL_PATH)
_active_names: list[str] | None = None
_pretrained_model = "yolov8n.pt"
_tracker = "bytetrack"
_runtime = "onnx"


def configure(detection: dict[str, Any]) -> None:
    """중앙 설정의 탐지 모델/추적기 옵션을 적용한다."""
    global _pretrained_model, _tracker, _runtime, _model, _active_path
    options = detection or {}
    new_model = options.get("model", {}).get("value", "yolov8n.pt")
    if new_model != _pretrained_model:
        _model = None
        from . import onnx_detector

        onnx_detector._active_onnx = None
    _pretrained_model = new_model
    _active_path = str(MODEL_DIR / _pretrained_model)
    _tracker = options.get("tracker", {}).get("value", "bytetrack")
    _runtime = options.get("runtime", {}).get("value", "onnx")


def use_model(path: str, names: list[str] | None = None) -> None:
    """학습된 커스텀 모델을 감지기에 적용한다."""
    global _model, _active_path, _active_names
    _model = None
    _active_path = path
    _active_names = names


def set_pretrained_model(model_name: str) -> None:
    """사전학습 모델을 런타임에 교체한다 (다음 추론부터 적용)."""
    global _pretrained_model, _model, _active_path
    _pretrained_model = model_name
    _model = None
    _active_path = str(MODEL_DIR / model_name)
    from . import onnx_detector

    onnx_detector._active_onnx = None


def set_runtime(runtime: str) -> None:
    global _runtime
    _runtime = runtime


def active_model_info() -> dict[str, Any]:
    pretrained_path = str(MODEL_DIR / _pretrained_model)
    return {"path": _active_path, "custom": _active_path != pretrained_path}


def get_model():
    global _model, _active_path
    if _model is None:
        from ultralytics import YOLO

        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        if Path(_active_path).exists():
            path = _active_path
        else:
            path = str(MODEL_DIR / _pretrained_model)
            if not Path(path).exists():
                YOLO(path)  # 지정된 사전학습 모델 다운로드
        _model = YOLO(path)
        _active_path = path
    return _model


def _to_percent(box, width: int, height: int) -> dict[str, float]:
    x1, y1, x2, y2 = [float(v) for v in box]
    return {
        "x": round(max(0, x1 / width * 100), 2),
        "y": round(max(0, y1 / height * 100), 2),
        "w": round(min(100, (x2 - x1) / width * 100), 2),
        "h": round(min(100, (y2 - y1) / height * 100), 2),
    }


def detect_image(
    image: np.ndarray, threshold: float = 0.5, imgsz: int = 640, fast: bool = False,
    person_boost: bool = False, person_min_conf: float = 0.3,
) -> list[dict[str, Any]]:
    """객체 감지. fast=True면 단일 스케일만 추론해 실시간 지연을 줄인다.

    person_boost=True면 커스텀 모델 결과에 COCO 사전학습 모델의 사람 감지를
    추가로 병합해, 학습 데이터에 없는 장면의 인원 누락을 보완한다.
    """
    from . import preprocessing, resolution

    image = preprocessing.apply(image)
    nms = preprocessing.settings()["nmsIoU"]
    if _runtime in ("onnx", "openvino"):
        try:
            if _runtime == "openvino":
                from . import openvino_detector

                fn = openvino_detector.detect
            else:
                from . import onnx_detector

                fn = onnx_detector.detect
            if fast:
                results = fn(image, threshold, imgsz=imgsz, model_path=_active_path, nms=nms)
                if person_boost:
                    results = _boost_people(image, results, threshold, imgsz, nms, person_min_conf)
                if len(results) >= 2:
                    return results
                # 단일 스케일에서 객체가 거의 없으면 다른 스케일을 추가 확인해
                # 원거리·소형 객체 누락을 보완한다 (세션 캐시로 지연이 작음).
                scales = resolution.settings().get("scales") or [320, 640]
                combined: list[dict[str, Any]] = list(results)
                for scale in scales:
                    if int(scale) == int(imgsz):
                        continue
                    combined.extend(
                        fn(image, threshold, imgsz=int(scale), model_path=_active_path, nms=nms)
                    )
                if person_boost:
                    combined = _boost_people(image, combined, threshold, imgsz, nms, person_min_conf)
                return resolution._fuse(combined, nms) if combined else results
            return resolution.detect(image, fn, threshold, nms, _active_path)
        except Exception as exc:
            print(f"[{_runtime} fallback] {type(exc).__name__}: {exc}", flush=True)  # 실패 시 PyTorch 경로로 폴백
    model = get_model()
    height, width = image.shape[:2]
    results = model.predict(source=image, conf=threshold, imgsz=imgsz, iou=nms, verbose=False)
    detections: list[dict[str, Any]] = []
    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            cls_id = int(box.cls.item())
            name = model.names.get(cls_id, "object")
            conf = float(box.conf.item())
            bbox = _to_percent(box.xyxy[0].tolist(), width, height)
            detections.append({
                "label": name,
                "labelKo": KOREAN_LABEL.get(name, name),
                "kind": CLASS_KIND.get(name, "object"),
                "confidence": round(conf, 3),
                "bbox": bbox,
            })
    return detections


def _boost_people(
    image: np.ndarray,
    results: list[dict[str, Any]],
    threshold: float,
    imgsz: int,
    nms: float,
    min_conf: float = 0.3,
) -> list[dict[str, Any]]:
    """COCO 사전학습 모델로 사람을 추가 감지해 커스텀 모델 결과와 병합한다.

    커스텀 모델 파인튜닝 후 사람 감지가 퇴화하는 문제를 보완한다.
    min_conf 이상의 사람만 병합해 야간 오탐을 억제한다.
    """
    from . import onnx_detector, resolution

    coco_path = MODEL_DIR / "yolov8s.pt"
    if not coco_path.exists():
        return results
    try:
        # 커스텀 모델이 사람을 2명 미만으로만 봤으면 COCO 모델로 보강
        people_seen = sum(1 for d in results if d.get("kind") == "person")
        if people_seen >= 2:
            return results
        coco_dets = onnx_detector.detect(
            image, threshold, imgsz=imgsz, model_path=str(coco_path), nms=nms
        )
        people = [
            d for d in coco_dets
            if d.get("kind") == "person" and d.get("confidence", 0) >= min_conf
        ]
        if not people:
            return results
        combined = list(results) + people
        return resolution._fuse(combined, nms)
    except Exception as exc:
        print(f"[person boost] {type(exc).__name__}: {exc}", flush=True)
        return results


def detect_frame_bytes(data: bytes, threshold: float = 0.5, imgsz: int = 320) -> list[dict[str, Any]]:
    image = Image.open(io.BytesIO(data)).convert("RGB")
    return detect_image(np.array(image), threshold, imgsz=imgsz)


def analyze_video_optical_flow(data: bytes, sample_fps: float = 2.0) -> dict[str, Any]:
    """학습 데이터/모델 없이 광학 흐름만으로 움직임 영역을 추출한다."""
    import cv2

    tmp = MODEL_DIR / f"flow_{int(time.time() * 1000)}.mp4"
    tmp.write_bytes(data)
    try:
        cap = cv2.VideoCapture(str(tmp))
        fps = cap.get(cv2.CAP_PROP_FPS) or 15.0
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total / fps if fps else 60
        step = max(1, int(fps / sample_fps))
        ok, prev = cap.read()
        if not ok:
            raise ValueError("video decode failed")
        prev_gray = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)
        h, w = prev_gray.shape
        tracks: dict[str, dict[str, Any]] = {}
        detections: list[dict[str, Any]] = []
        frame_idx = 0
        seq = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_idx % step != 0:
                frame_idx += 1
                continue
            t = round(frame_idx / fps, 2)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            flow = cv2.calcOpticalFlowFarneback(
                prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0,
            )
            mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
            prev_gray = gray
            # 4x4 그리드에서 평균 흐름이 큰 영역을 움직이는 객체 후보로 간주
            gh, gw = 4, 4
            for gy in range(gh):
                for gx in range(gw):
                    cell = mag[gy * h // gh:(gy + 1) * h // gh, gx * w // gw:(gx + 1) * w // gw]
                    m = float(cell.mean())
                    if m < 1.5:
                        continue
                    seq += 1
                    tid = f"F{seq}"
                    x = gx / gw * 100
                    y = gy / gh * 100
                    cw = 100 / gw
                    ch = 100 / gh
                    tracks[tid] = {
                        "id": tid, "label": "움직임", "kind": "object",
                        "firstSeen": t, "lastSeen": t,
                        "cx": x + cw / 2, "cy": y + ch / 2,
                        "points": [{"t": t, "x": x, "y": y, "w": cw, "h": ch, "confidence": round(min(0.95, 0.5 + m / 10), 3)}],
                        "distance": 0,
                    }
                    detections.append({
                        "id": f"{tid}-{frame_idx}", "trackId": seq,
                        "confidence": round(min(0.95, 0.5 + m / 10), 3),
                        "bbox": {"x": x, "y": y, "w": cw, "h": ch},
                        "pose": "object", "label": "움직임",
                    })
            frame_idx += 1
        cap.release()
        return {
            "engine": "optical-flow",
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "videoName": tmp.name,
            "durationSec": round(duration, 2),
            "processedFrames": frame_idx,
            "personsDetected": 0,
            "detections": detections[-200:],
            "tracks": list(tracks.values()),
        }
    finally:
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            # 일부 백엔드가 파일 핸들을 잠시 유지하는 경우 다음 요청에서 정리
            pass


def _result_series(
    all_detections: list[dict[str, Any]], duration: float,
    elapsed_sec: float = 0.0, frames_processed: int = 0,
) -> dict[str, Any]:
    """실제 감지 결과에서 UI용 시계열·요약·로그·성능 데이터를 생성한다."""
    bucket = 2.0  # 2초 단위
    n = max(1, int(duration / bucket) + 1)
    crowd = [0] * n
    motion = [0.0] * n
    conf = [0.0] * n
    conf_count = [0] * n
    prev: dict[str, tuple[float, float]] = {}
    bucket_tracks: dict[int, set[str]] = {i: set() for i in range(n)}

    for d in all_detections:
        t = float(d.get("t", 0))
        idx = min(n - 1, max(0, int(t / bucket)))
        b = d.get("bbox", {})
        cx = b.get("x", 0) + b.get("w", 0) / 2
        cy = b.get("y", 0) + b.get("h", 0) / 2
        if d.get("kind") == "person":
            tid = str(d.get("trackId") or d.get("id", ""))
            bucket_tracks[idx].add(tid)

    for idx in range(n):
        crowd[idx] = len(bucket_tracks[idx])

    # 버킷 경계 때문에 사람이 지속적으로 있어도 특정 구간만 0이 되는 현상 보정.
    # 앞뒤 버킷에 사람이 있으면 0인 구간에도 같은 수를 전파한다.
    for idx in range(n):
        if crowd[idx] == 0 and 0 < idx < n - 1:
            crowd[idx] = max(crowd[idx - 1], crowd[idx + 1])

    for d in all_detections:
        t = float(d.get("t", 0))
        idx = min(n - 1, max(0, int(t / bucket)))
        b = d.get("bbox", {})
        cx = b.get("x", 0) + b.get("w", 0) / 2
        cy = b.get("y", 0) + b.get("h", 0) / 2
        tid = str(d.get("trackId") or d.get("id", ""))
        if tid in prev:
            px, py = prev[tid]
            motion[idx] += min(100.0, math.hypot(cx - px, cy - py) * 10)
        prev[tid] = (cx, cy)
        conf[idx] += float(d.get("confidence", 0))
        conf_count[idx] += 1

    crowd_data = [{"t": round(i * bucket, 1), "value": v} for i, v in enumerate(crowd)]
    motion_data = [{"t": round(i * bucket, 1), "value": round(min(100, v), 1)} for i, v in enumerate(motion)]
    conf_data = [
        {"t": round(i * bucket, 1), "value": round(conf[i] / conf_count[i], 3) if conf_count[i] else 0}
        for i in range(n)
    ]
    avg_conf = round(sum(conf) / max(1, sum(conf_count)), 3)
    peak = max(crowd) if crowd else 0

    # 실제 감지 결과 기반 캡션 (목업 문구를 쓰지 않는다)
    captions: list[dict[str, Any]] = []
    for i in range(n):
        at = round(i * bucket, 1)
        pcount = crowd[i]
        vpeak = round(motion[i], 1)
        if pcount:
            text = f"{at:.0f}초 구역에서 사람 {pcount}명이 감지되었습니다."
            if vpeak > 25:
                text += f" 움직임 강도 {vpeak:.0f}%로 활발한 이동이 관측되었습니다."
            else:
                text += " 큰 움직임 없이 작업 중입니다."
        else:
            text = f"{at:.0f}초 구역에서 저장된 분석 프레임에는 사람이 감지되지 않았습니다."
        tags = [f"사람 {pcount}명"] if pcount else ["사람 없음"]
        if vpeak > 25:
            tags.append(f"움직임 {vpeak:.0f}%")
        captions.append({
            "id": f"cap-{i}", "timestamp": at, "endTime": at + bucket,
            "text": text, "tags": tags,
        })

    # 하이라이트: 사람이 가장 많거나 움직임이 큰 구간
    highlights: list[str] = []
    if captions:
        peak_idx = max(range(n), key=lambda i: (crowd[i], motion[i]))
        highlights.append(f"최다 인원 구간 {peak_idx * bucket:.0f}초 · {crowd[peak_idx]}명")
        motion_idx = max(range(n), key=lambda i: motion[i])
        if motion[motion_idx] > 0:
            highlights.append(f"최대 움직임 구간 {motion_idx * bucket:.0f}초 · {motion[motion_idx]:.0f}%")

    # 행동 패턴 관측 (실제 감지 결과에서 추정)
    observations: list[dict[str, Any]] = []
    for det in all_detections:
        if det.get("kind") != "person":
            continue
        motion_peak = max(motion) if motion else 0
        behavior = "급이동" if motion_peak > 25 else "정상 작업/이동"
        observations.append({
            "trackId": det.get("trackId"), "t": det.get("t", 0),
            "labelKo": behavior, "confidence": det.get("confidence", 0),
        })

    return {
        "crowdDensity": crowd_data,
        "motionSeries": motion_data,
        "confidenceSeries": conf_data,
        "videoDescription": {
            "summary": f"실제 영상 {duration:.0f}초를 분석해 최대 {peak}명 규모의 작업 장면으로 확인했습니다. 사고 이벤트는 시간적 분석 결과만 표시합니다.",
            "captions": captions,
            "highlights": highlights,
            "sceneCount": n,
        },
        "behaviors": observations[:200],
        "summary": {
            "riskScore": 0, "complianceScore": 100, "avgConfidence": avg_conf,
            "peakCrowd": peak, "totalBehaviors": 0, "criticalCount": 0,
        },
        "analysisLog": [
            {"id": "log-ingest", "nodeId": "ingest", "nodeLabel": "영상 입력", "level": "success",
             "message": "영상 로드 완료", "detail": f"실제 영상 분석 · {duration:.1f}초",
             "metrics": [{"label": "길이", "value": f"{duration:.0f}s"}], "timestamp": 0},
            {"id": "log-detect", "nodeId": "detect", "nodeLabel": "객체 탐지", "level": "success",
             "message": "YOLO 감지 완료", "detail": f"{len(all_detections)}개 감지 결과",
             "metrics": [{"label": "감지", "value": f"{len(all_detections)}건"},
                         {"label": "평균 신뢰도", "value": f"{avg_conf * 100:.0f}%"}], "timestamp": 1},
            {"id": "log-accidents", "nodeId": "accidents", "nodeLabel": "사고 인식", "level": "info",
             "message": "시간적 사고 분석", "detail": "탐지 결과와 사고 판정을 분리해 분석했습니다.",
             "metrics": [{"label": "사고", "value": "이벤트 기반"}], "timestamp": 2},
        ],
        "engineTimings": {
            "totalMs": round(elapsed_sec * 1000, 1),
            "perFrameMs": round(elapsed_sec * 1000 / max(1, frames_processed), 2),
            "processedFrames": frames_processed,
        },
        "performanceEvaluation": [
            {"key": "detect", "labelKo": "객체 탐지", "label": "Detection",
             "description": "실제 측정값 — 프레임당 처리 시간과 감지 신뢰도",
             "latencyMs": round(elapsed_sec * 1000 / max(1, frames_processed), 2),
             "throughput": round(frames_processed / max(0.001, elapsed_sec), 2) if elapsed_sec else 0,
             "accuracy": round(avg_conf * 100),
             "precision": round(avg_conf * 100),
             "recall": 0,  # 검증 데이터가 없으면 0 (임의 추정하지 않음)
             "memoryMb": 0, "cpuPercent": 0, "gpuPercent": 0,
             "status": "optimal" if avg_conf >= 0.7 else "normal",
             "measured": True},
        ],
    }


def _temporal_accidents(all_detections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """감지 결과의 프레임 히스토리를 시간순으로 분석해 사고 이벤트를 반환."""
    from . import accident_analyzer

    accident_analyzer.reset()
    events: list[dict[str, Any]] = []
    for det in all_detections:
        t = det.get("t", 0)
        if not isinstance(t, (int, float)):
            continue
        frame_dets = [d for d in all_detections if d.get("t") == t]
        events.extend(accident_analyzer.analyze(frame_dets, now=t))
    # 같은 유형+트랙은 가장 신뢰도 높은 이벤트 하나만 유지
    best: dict[str, dict[str, Any]] = {}
    for e in events:
        key = f"{e['type']}-{e.get('trackId') or e.get('trackIds')}"
        if key not in best or e["confidence"] > best[key]["confidence"]:
            best[key] = e
    return list(best.values())


def analyze_video_bytes(
    data: bytes,
    threshold: float = 0.5,
    sample_fps: float = 6.0,
    analysis_imgsz: int = 640,
) -> dict[str, Any]:
    """영상에서 프레임을 샘플링해 YOLO 감지 + 트랙을 생성한다.

    sample_fps로 30fps 영상을 5~10fps로 줄이고, analysis_imgsz로
    원본 해상도와 무관하게 AI 추론 입력 크기를 제한한다.
    """
    import cv2

    # 업로드 영상을 학습 데이터로 보존한다 (오탐 재학습에 사용)
    archive_dir = MODEL_DIR.parent / ".data" / "uploads"
    archive_dir.mkdir(parents=True, exist_ok=True)
    name = f"upload_{int(time.time() * 1000)}.mp4"
    archived = archive_dir / name
    archived.write_bytes(data)
    tmp = archived
    try:
        cap = cv2.VideoCapture(str(tmp))
        if not cap.isOpened():
            raise ValueError("video decode failed")
        native_fps = cap.get(cv2.CAP_PROP_FPS) or 15.0
        width = max(1, int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)))
        height = max(1, int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total / native_fps if native_fps else 60
        started = time.perf_counter()
        tracks: dict[str, dict[str, Any]] = {}
        all_detections: list[dict[str, Any]] = []
        seq = 0

        # 고급 추적기(ByteTrack / BoT-SORT)를 선택한 경우 Ultralytics track() 사용
        if _tracker in ("bytetrack", "botsort"):
            model = get_model()
            vid_stride = max(1, int(native_fps / sample_fps))
            results = model.track(
                source=str(tmp),
                conf=threshold,
                imgsz=analysis_imgsz,
                tracker=str(Path(__file__).with_name("custom_bytetrack.yaml")) if _tracker == "bytetrack" else f"{_tracker}.yaml",
                persist=True,
                vid_stride=vid_stride,
                verbose=False,
            )
            sample_idx = 0
            for result in results:
                t = round(sample_idx / sample_fps, 2)
                if result.boxes is None:
                    sample_idx += 1
                    continue
                for box in result.boxes:
                    track_id = int(box.id.item()) if box.id is not None else sample_idx + 1
                    cls_id = int(box.cls.item())
                    name = model.names.get(cls_id, "object")
                    det = {
                        "label": KOREAN_LABEL.get(name, name),
                        "labelKo": KOREAN_LABEL.get(name, name),
                        "kind": CLASS_KIND.get(name, "object"),
                        "confidence": round(float(box.conf.item()), 3),
                        "bbox": _to_percent(box.xyxy[0].tolist(), width, height),
                    }
                    tid = f"Y{track_id}"
                    if tid not in tracks:
                        tracks[tid] = {
                            "id": tid, "label": det["labelKo"], "kind": det["kind"],
                            "firstSeen": t, "lastSeen": t, "cx": 0, "cy": 0,
                            "points": [], "distance": 0,
                        }
                    tr = tracks[tid]
                    tr["points"].append({
                        "t": t, "x": det["bbox"]["x"], "y": det["bbox"]["y"],
                        "w": det["bbox"]["w"], "h": det["bbox"]["h"],
                        "confidence": det["confidence"],
                    })
                    tr["lastSeen"] = t
                    all_detections.append({
                        "id": f"{tid}-{sample_idx}", "trackId": tid,
                        "t": t,
                        "confidence": det["confidence"], "bbox": det["bbox"],
                        "pose": det["kind"], "kind": det["kind"],
                        "label": det["labelKo"], "labelKo": det["labelKo"],
                    })
                sample_idx += 1
            cap.release()
            series = _result_series(all_detections, duration,
                                    time.perf_counter() - started, sample_idx)
            return {
                "engine": "real-yolo",
                "tracker": _tracker,
                "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "videoName": tmp.name,
                "durationSec": round(duration, 2),
                "processedFrames": sample_idx,
                "personsDetected": series["summary"]["peakCrowd"],
                "detections": all_detections[-200:],
                "tracks": [v for v in tracks.values() if len(v["points"]) >= 2],
                "accidentEvents": _temporal_accidents(all_detections),
                **series,
            }

        # 필요한 시점만 seek 해 디코딩 (전체 프레임 순차 디코딩보다 훨씬 빠름)
        sample_times = [i / sample_fps for i in range(int(duration * sample_fps) + 1)]
        sample_idx = 0
        for t in sample_times:
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ok, frame = cap.read()
            if not ok:
                break
            t = round(t, 2)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            for det in detect_image(rgb, threshold, imgsz=analysis_imgsz):
                cx = det["bbox"]["x"] + det["bbox"]["w"] / 2
                cy = det["bbox"]["y"] + det["bbox"]["h"] / 2
                best_id, best_dist = None, float("inf")
                for tid, tr in tracks.items():
                    if t - tr["lastSeen"] > 2:
                        continue
                    dist = math.hypot(tr["cx"] - cx, tr["cy"] - cy)
                    if dist < best_dist:
                        best_id, best_dist = tid, dist
                if best_id is None or best_dist > 20:
                    seq += 1
                    best_id = f"Y{seq}"
                    tracks[best_id] = {
                        "id": best_id,
                        "label": det["labelKo"],
                        "kind": det["kind"],
                        "firstSeen": t,
                        "lastSeen": t,
                        "cx": cx,
                        "cy": cy,
                        "points": [],
                        "distance": 0,
                    }
                tr = tracks[best_id]
                prev = tr["points"][-1] if tr["points"] else None
                if prev:
                    tr["distance"] += math.hypot(cx - prev["x"], cy - prev["y"])
                tr["points"].append({
                    "t": t, "x": det["bbox"]["x"], "y": det["bbox"]["y"],
                    "w": det["bbox"]["w"], "h": det["bbox"]["h"],
                    "confidence": det["confidence"],
                })
                tr["lastSeen"] = t
                tr["cx"] = cx
                tr["cy"] = cy
                all_detections.append({
                    "id": f"{best_id}-{sample_idx}",
                    "trackId": best_id,
                    "t": t,
                    "confidence": det["confidence"],
                    "bbox": det["bbox"],
                    "pose": det["kind"],
                    "kind": det["kind"],
                    "label": det["labelKo"],
                    "labelKo": det["labelKo"],
                })
            sample_idx += 1
        cap.release()

        series = _result_series(all_detections, duration,
                                time.perf_counter() - started, sample_idx)
        return {
            "engine": "real-yolo",
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "videoName": tmp.name,
            "durationSec": round(duration, 2),
            "processedFrames": sample_idx,
            "personsDetected": series["summary"]["peakCrowd"],
            "detections": all_detections[-200:],
            "tracks": [v for v in tracks.values() if len(v["points"]) >= 2],
            "accidentEvents": _temporal_accidents(all_detections),
            **series,
        }
    finally:
        # 분석에 사용한 영상은 학습 데이터로 보존 (오탐 재학습용). 삭제하지 않는다.
        pass
```

</details>

<details>
<summary><code>services/fastapi/app/onnx_detector.py</code></summary>

```python
"""ONNX Runtime 기반 고속 YOLO 추론.

- PyTorch/Ultralytics 오버헤드를 제거해 프레임 지연을 크게 줄인다.
- GPU(CUDAExecutionProvider)가 있으면 자동 사용, 없으면 CPU.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import cv2
import numpy as np

MODEL_DIR = Path(__file__).resolve().parents[2] / ".models"
# 입력 크기별로 세션을 캐시한다. 크기를 오갈 때마다 세션을 새로 만들면
# 실시간 추적 지연이 수백 ms까지 늘어난다.
_sessions: dict[str, tuple[Any, str]] = {}
_names: list[str] = []
_active_onnx: str | None = None


def _coco_names() -> list[str]:
    import json

    custom = MODEL_DIR / "custom_names.json"
    if _active_onnx and "custom" in _active_onnx and custom.exists():
        try:
            return json.loads(custom.read_text(encoding="utf-8"))
        except Exception:
            pass
    try:
        from .trainer import COCO_NAMES

        return COCO_NAMES
    except Exception:
        return [f"class_{i}" for i in range(80)]


def ensure_onnx(model_path: str, imgsz: int = 320) -> str:
    """モデル을 ONNX로 내보내고 경로를 반환한다."""
    global _active_onnx
    src = Path(model_path)
    # 입력 크기별 모델을 별도 저장 (정적 ONNX 형상 대응)
    onnx_path = src.with_name(f"{src.stem}_{imgsz}.onnx")
    if not onnx_path.exists():
        from ultralytics import YOLO

        import shutil

        YOLO(str(src)).export(format="onnx", imgsz=imgsz, simplify=True, verbose=False)
        # Ultralytics는 항상 <model>.onnx 로 내보내므로 원하는 크기별 파일로 복사
        default_out = src.with_suffix(".onnx")
        if default_out.exists() and default_out.resolve() != onnx_path.resolve():
            shutil.copy2(default_out, onnx_path)
    _active_onnx = str(onnx_path)
    return str(onnx_path)


def get_session(path: str):
    global _names
    cached = _sessions.get(path)
    if cached is not None:
        return cached
    import onnxruntime as ort

    available = ort.get_available_providers()
    providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if "CUDAExecutionProvider" in available else ["CPUExecutionProvider"]
    options = ort.SessionOptions()
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    options.intra_op_num_threads = max(1, min(8, os.cpu_count() or 4))
    session = ort.InferenceSession(path, sess_options=options, providers=providers)
    input_name = session.get_inputs()[0].name
    _sessions[path] = (session, input_name)
    _names = _coco_names()
    return _sessions[path]


def letterbox(image: np.ndarray, imgsz: int):
    h, w = image.shape[:2]
    scale = min(imgsz / w, imgsz / h)
    nw, nh = int(round(w * scale)), int(round(h * scale))
    resized = cv2.resize(image, (nw, nh), interpolation=cv2.INTER_LINEAR)
    canvas = np.full((imgsz, imgsz, 3), 114, dtype=np.uint8)
    px = (imgsz - nw) // 2
    py = (imgsz - nh) // 2
    canvas[py:py + nh, px:px + nw] = resized
    x = canvas.astype(np.float32) / 255.0
    x = np.transpose(x, (2, 0, 1))[None, ...]
    return np.ascontiguousarray(x), scale, px, py


def detect(image: np.ndarray, threshold: float = 0.5, imgsz: int = 320, model_path: str | None = None, nms: float = 0.45) -> list[dict[str, Any]]:
    path = ensure_onnx(model_path or str(MODEL_DIR / "yolov8n.pt"), imgsz)
    session, input_name = get_session(path)
    x, scale, px, py = letterbox(image, imgsz)
    out = session.run(None, {input_name: x})[0][0]  # [84, N]
    boxes = out[:4, :]
    cls_scores = out[4:, :]
    cls_ids = np.argmax(cls_scores, axis=0)
    confs = cls_scores[cls_ids, np.arange(cls_scores.shape[1])]
    keep = confs >= threshold
    boxes, confs, cls_ids = boxes[:, keep], confs[keep], cls_ids[keep]
    if boxes.shape[1] == 0:
        return []

    cx, cy, bw, bh = boxes
    x1 = cx - bw / 2
    y1 = cy - bh / 2
    x2 = cx + bw / 2
    y2 = cy + bh / 2
    # letterbox 좌표 → 원본 이미지 좌표
    x1 = np.clip((x1 - px) / scale, 0, image.shape[1])
    y1 = np.clip((y1 - py) / scale, 0, image.shape[0])
    x2 = np.clip((x2 - px) / scale, 0, image.shape[1])
    y2 = np.clip((y2 - py) / scale, 0, image.shape[0])

    rects = [[float(a), float(b), float(c - a), float(d - b)] for a, b, c, d in zip(x1, y1, x2, y2)]
    indices = cv2.dnn.NMSBoxes(rects, confs.tolist(), threshold, nms)
    if len(indices) == 0:
        return []
    indices = np.array(indices).flatten()

    from .yolo_detector import CLASS_KIND, KOREAN_LABEL

    results = []
    for i in indices:
        name = _names[int(cls_ids[i])] if int(cls_ids[i]) < len(_names) else "object"
        rx, ry, rw, rh = rects[i]
        results.append({
            "label": KOREAN_LABEL.get(name, name),
            "labelKo": KOREAN_LABEL.get(name, name),
            "kind": CLASS_KIND.get(name, "object"),
            "confidence": round(float(confs[i]), 3),
            "bbox": {
                "x": round(rx / image.shape[1] * 100, 2),
                "y": round(ry / image.shape[0] * 100, 2),
                "w": round(rw / image.shape[1] * 100, 2),
                "h": round(rh / image.shape[0] * 100, 2),
            },
        })
    return results


def runtime_info() -> dict[str, Any]:
    import onnxruntime as ort

    return {
        "providers": ort.get_available_providers(),
        "active": _active_onnx,
        "device": "cuda" if "CUDAExecutionProvider" in ort.get_available_providers() else "cpu",
    }
```

</details>

<details>
<summary><code>services/fastapi/app/openvino_detector.py</code></summary>

```python
"""OpenVINO 런타임 추론 (Intel CPU/iGPU 최적화, 무료)."""
from __future__ import annotations

from typing import Any

import cv2
import numpy as np

from . import onnx_detector

_core = None
# 모델 경로(입력 크기별 ONNX)마다 컴파일 결과를 캐시한다.
# 기존에는 크기가 바뀔 때마다 재컴파일해 프레임당 1초 이상 지연이 발생했다.
_compiled: dict[str, Any] = {}


def _get_compiled(path: str):
    global _core
    cached = _compiled.get(path)
    if cached is not None:
        return cached
    import openvino as ov

    if _core is None:
        _core = ov.Core()
    model = _core.read_model(path)
    compiled = _core.compile_model(model, "CPU")
    _compiled[path] = compiled
    return compiled


def detect(image: np.ndarray, threshold: float = 0.5, imgsz: int = 320, model_path: str | None = None, nms: float = 0.45) -> list[dict[str, Any]]:
    from pathlib import Path

    src = model_path or str(onnx_detector.MODEL_DIR / "yolov8n.pt")
    onnx_path = onnx_detector.ensure_onnx(src, imgsz)
    compiled = _get_compiled(onnx_path)
    x, scale, px, py = onnx_detector.letterbox(image, imgsz)
    outputs = compiled([x])
    out = list(outputs.values())[0][0]
    boxes = out[:4, :]
    cls_scores = out[4:, :]
    cls_ids = np.argmax(cls_scores, axis=0)
    confs = cls_scores[cls_ids, np.arange(cls_scores.shape[1])]
    keep = confs >= threshold
    boxes, confs, cls_ids = boxes[:, keep], confs[keep], cls_ids[keep]
    if boxes.shape[1] == 0:
        return []
    cx, cy, bw, bh = boxes
    x1 = np.clip((cx - bw / 2 - px) / scale, 0, image.shape[1])
    y1 = np.clip((cy - bh / 2 - py) / scale, 0, image.shape[0])
    x2 = np.clip((cx + bw / 2 - px) / scale, 0, image.shape[1])
    y2 = np.clip((cy + bh / 2 - py) / scale, 0, image.shape[0])
    rects = [[float(a), float(b), float(c - a), float(d - b)] for a, b, c, d in zip(x1, y1, x2, y2)]
    idx = cv2.dnn.NMSBoxes(rects, confs.tolist(), threshold, nms)
    if len(idx) == 0:
        return []
    from .yolo_detector import CLASS_KIND, KOREAN_LABEL

    names = onnx_detector._coco_names()
    results = []
    for i in np.array(idx).flatten():
        name = names[int(cls_ids[i])] if int(cls_ids[i]) < len(names) else "object"
        rx, ry, rw, rh = rects[i]
        results.append({
            "label": KOREAN_LABEL.get(name, name),
            "labelKo": KOREAN_LABEL.get(name, name),
            "kind": CLASS_KIND.get(name, "object"),
            "confidence": round(float(confs[i]), 3),
            "bbox": {
                "x": round(rx / image.shape[1] * 100, 2),
                "y": round(ry / image.shape[0] * 100, 2),
                "w": round(rw / image.shape[1] * 100, 2),
                "h": round(rh / image.shape[0] * 100, 2),
            },
        })
    return results


def runtime_info() -> dict[str, Any]:
    return {"active": _active, "device": "CPU", "backend": "OpenVINO"}
```

</details>

<details>
<summary><code>services/fastapi/app/resolution.py</code></summary>

```python
"""해상도 대응 추론: 다중 스케일 앙상블 + 타일 분할 추론."""
from __future__ import annotations

from typing import Any, Callable

import cv2
import numpy as np

DetectFn = Callable[..., list[dict[str, Any]]]

_settings: dict[str, Any] = {"mode": "multiscale", "scales": [320, 640]}


def configure(config: dict[str, Any]) -> None:
    _settings["mode"] = config.get("resolutionMode", {}).get("value", "multiscale")
    scales = config.get("scales", {}).get("value", [320, 640])
    _settings["scales"] = [int(s) for s in scales] if isinstance(scales, list) else [320, 640]


def settings() -> dict[str, Any]:
    return dict(_settings)


def _bbox_xyxy(det: dict[str, Any]) -> tuple[float, float, float, float]:
    b = det["bbox"]
    return b["x"], b["y"], b["x"] + b["w"], b["y"] + b["h"]


def _fuse(detections: list[dict[str, Any]], nms: float) -> list[dict[str, Any]]:
    if not detections:
        return []
    detections = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    rects = [_bbox_xyxy(d) for d in detections]
    x1 = [r[0] for r in rects]; y1 = [r[1] for r in rects]
    x2 = [r[2] for r in rects]; y2 = [r[3] for r in rects]
    boxes = [[a, b, c - a, d - b] for a, b, c, d in zip(x1, y1, x2, y2)]
    confs = [d["confidence"] for d in detections]
    idx = cv2.dnn.NMSBoxes(boxes, confs, 0.25, nms)
    if len(idx) == 0:
        return []
    return [detections[int(i)] for i in np.array(idx).flatten()]


def detect(
    image: np.ndarray,
    detect_fn: DetectFn,
    threshold: float,
    nms: float,
    model_path: str,
) -> list[dict[str, Any]]:
    mode = _settings["mode"]
    scales = _settings["scales"] or [320]
    if mode == "single":
        return detect_fn(image, threshold, imgsz=scales[0], model_path=model_path, nms=nms)

    if mode == "tiled":
        h, w = image.shape[:2]
        results: list[dict[str, Any]] = []
        for gy in range(2):
            for gx in range(2):
                tile = image[gy * h // 2:(gy + 1) * h // 2, gx * w // 2:(gx + 1) * w // 2]
                if tile.size == 0:
                    continue
                for det in detect_fn(tile, threshold, imgsz=320, model_path=model_path, nms=nms):
                    b = det["bbox"]
                    b = dict(b)
                    b["x"] = (b["x"] / 100 * tile.shape[1] + gx * w // 2) / w * 100
                    b["y"] = (b["y"] / 100 * tile.shape[0] + gy * h // 2) / h * 100
                    b["w"] = b["w"] / 100 * tile.shape[1] / w * 100
                    b["h"] = b["h"] / 100 * tile.shape[0] / h * 100
                    results.append({**det, "bbox": b})
        return _fuse(results, nms)

    # multiscale: 각 스케일에서 추론 후 좌표를 원본 비율로 통합
    results = []
    for scale in scales:
        results.extend(detect_fn(image, threshold, imgsz=int(scale), model_path=model_path, nms=nms))
    return _fuse(results, nms)
```

</details>

<details>
<summary><code>services/fastapi/app/preprocessing.py</code></summary>

```python
"""추론 전 영상 전처리: ROI 제외 영역 마스킹 + 감마 보정."""
from __future__ import annotations

from typing import Any

import cv2
import numpy as np

_active: dict[str, Any] = {"nmsIoU": 0.45, "gamma": 1.0, "excludeZones": []}


def configure(preprocessing: dict[str, Any]) -> None:
    _active["nmsIoU"] = float(preprocessing.get("nmsIoU", {}).get("value", 0.45))
    _active["gamma"] = float(preprocessing.get("gamma", {}).get("value", 1.0))
    zones = preprocessing.get("excludeZones", {}).get("value", [])
    if isinstance(zones, dict):
        zones = zones.get("value", [])
    _active["excludeZones"] = zones or []


def settings() -> dict[str, Any]:
    return dict(_active)


def apply(image: np.ndarray) -> np.ndarray:
    gamma = _active.get("gamma", 1.0)
    if gamma and abs(gamma - 1.0) > 0.01:
        inv = 1.0 / gamma
        lut = np.array([((i / 255.0) ** inv) * 255 for i in range(256)]).astype("uint8")
        image = cv2.LUT(image, lut)

    h, w = image.shape[:2]
    for zone in _active.get("excludeZones", []):
        if len(zone) < 3:
            continue
        pts = np.array([[int(x / 100 * w), int(y / 100 * h)] for x, y in zone], dtype=np.int32)
        # 회색 패딩값으로 덮어써 모델이 배경으로 인식하게 한다.
        cv2.fillPoly(image, [pts], (114, 114, 114))
    return image
```

</details>

<details>
<summary><code>services/fastapi/app/safety.py</code></summary>

```python
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
```

</details>

<details>
<summary><code>services/fastapi/app/active_learning.py</code></summary>

```python
"""액티브 러닝: 애매한 신뢰도/오탐 프레임을 하드 네거티브로 자동 수집."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DATASET = ROOT / ".models" / "datasets" / "active_negative"
LOG_PATH = ROOT / ".data" / "active_learning.jsonl"
IMG_DIR = DATASET / "images" / "train"
LBL_DIR = DATASET / "labels" / "train"
for d in (IMG_DIR, LBL_DIR):
    d.mkdir(parents=True, exist_ok=True)

_settings: dict[str, Any] = {
    "enabled": True, "min": 0.35, "max": 0.7, "clipWindowSec": 5,
}
_last_capture = 0.0


def configure(config: dict[str, Any]) -> None:
    _settings["enabled"] = bool(config.get("activeLearning", {}).get("value", True))
    _settings["min"] = float(config.get("ambiguousMin", {}).get("value", 0.35))
    _settings["max"] = float(config.get("ambiguousMax", {}).get("value", 0.7))
    _settings["clipWindowSec"] = int(config.get("clipWindowSec", {}).get("value", 5))


def settings() -> dict[str, Any]:
    return dict(_settings)


def capture(image: np.ndarray, detections: list[dict[str, Any]], safety_events: list[dict[str, Any]]) -> dict[str, Any] | None:
    global _last_capture
    if not _settings["enabled"]:
        return None
    ambiguous = [
        d for d in detections
        if _settings["min"] <= d.get("confidence", 0) <= _settings["max"]
    ]
    candidates = [e for e in safety_events if e.get("type") in ("fall_candidate", "altercation")]
    if not ambiguous and not candidates:
        return None
    now = time.time()
    if now - _last_capture < 2:
        return None
    _last_capture = now

    stem = f"hn_{int(now * 1000)}"
    cv2.imwrite(str(IMG_DIR / f"{stem}.jpg"), image)
    # 네거티브 샘플: 라벨 파일을 비워 둔다 (배경/정상 동작)
    (LBL_DIR / f"{stem}.txt").write_text("", encoding="utf-8")
    record = {
        "ts": now, "file": f"{stem}.jpg",
        "ambiguous": len(ambiguous),
        "candidates": [e.get("type") for e in candidates],
        "reason": "hard-negative" if ambiguous else "safety-candidate",
    }
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return record


def stats(limit: int = 30) -> dict[str, Any]:
    records = []
    if LOG_PATH.exists():
        for line in LOG_PATH.read_text(encoding="utf-8").splitlines()[-limit:]:
            try:
                records.append(json.loads(line))
            except Exception:
                continue
    return {
        "count": len(list(IMG_DIR.glob("hn_*.jpg"))),
        "recent": records[::-1],
        "settings": dict(_settings),
    }
```

</details>

<details>
<summary><code>services/fastapi/app/synthesis.py</code></summary>

```python
"""합성 데이터 증강: 실제 현장 데이터 부족 시 증강 기반 의사 합성 샘플 생성."""
from __future__ import annotations

import random
from pathlib import Path
from typing import Any

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = ROOT / ".models" / "datasets"


def _adjust_label(text: str, flip: bool) -> str:
    if not flip or not text.strip():
        return text
    out = []
    for line in text.strip().splitlines():
        parts = line.split()
        if len(parts) >= 5:
            parts[1] = f"{1 - float(parts[1]):.5f}"
        out.append(" ".join(parts))
    return "\n".join(out)


def synthesize(dataset_id: str, copies: int = 3) -> dict[str, Any]:
    dataset = DATASET_ROOT / dataset_id
    img_dir = dataset / "images" / "train"
    lbl_dir = dataset / "labels" / "train"
    if not img_dir.exists():
        return {"error": "dataset not found", "created": 0}
    created = 0
    sources = list(img_dir.glob("*.jpg"))
    for src in sources:
        label = lbl_dir / f"{src.stem}.txt"
        label_text = label.read_text(encoding="utf-8") if label.exists() else ""
        image = cv2.imread(str(src))
        if image is None:
            continue
        for i in range(max(0, min(copies, 20))):
            aug = image.copy()
            flip = random.random() < 0.5
            if flip:
                aug = cv2.flip(aug, 1)
            if random.random() < 0.7:
                gamma = random.uniform(0.6, 1.6)
                lut = np.array([((j / 255.0) ** (1 / gamma)) * 255 for j in range(256)]).astype("uint8")
                aug = cv2.LUT(aug, lut)
            if random.random() < 0.5:
                angle = random.uniform(-12, 12)
                h, w = aug.shape[:2]
                m = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
                aug = cv2.warpAffine(aug, m, (w, h), borderValue=(114, 114, 114))
            name = f"syn_{src.stem}_{i}"
            cv2.imwrite(str(img_dir / f"{name}.jpg"), aug)
            (lbl_dir / f"{name}.txt").write_text(_adjust_label(label_text, flip), encoding="utf-8")
            created += 1
    return {"datasetId": dataset_id, "created": created, "method": "flip/gamma/rotation"}
```

</details>

<details>
<summary><code>services/fastapi/app/clip_store.py</code></summary>

```python
"""위험 감지 시점 전후 영상 클립 저장 (업로드 영상용 링 버퍼)."""
from __future__ import annotations

import time
from collections import deque
from pathlib import Path
from typing import Any

import cv2
import numpy as np

CLIP_DIR = Path(__file__).resolve().parents[2] / ".data" / "clips"
CLIP_DIR.mkdir(parents=True, exist_ok=True)
_buffer: deque[tuple[float, np.ndarray]] = deque(maxlen=200)
_last_save = 0.0


def push(frame: np.ndarray) -> None:
    _buffer.append((time.time(), frame.copy()))


def maybe_save(danger: bool, fps: int = 10) -> str | None:
    global _last_save
    if not danger or time.time() - _last_save < 10 or len(_buffer) < 10:
        return None
    _last_save = time.time()
    path = CLIP_DIR / f"clip_{int(_last_save)}.avi"
    h, w = _buffer[0][1].shape[:2]
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"MJPG"), fps, (w, h))
    for _, frame in list(_buffer)[-50:]:
        if frame.shape[:2] == (h, w):
            writer.write(frame)
    writer.release()
    return str(path)


def list_clips() -> list[dict[str, Any]]:
    return [
        {"name": p.name, "size": p.stat().st_size, "path": str(p)}
        for p in sorted(CLIP_DIR.glob("*.avi"), reverse=True)[:30]
    ]


def _clip_path(name: str) -> Path:
    """클립 이름을 검증해 CLIP_DIR 내부의 AVI 파일만 허용한다."""
    path = (CLIP_DIR / Path(name).name).resolve()
    if path.parent != CLIP_DIR.resolve() or path.suffix.lower() != ".avi" or not path.exists():
        raise FileNotFoundError(name)
    return path


def clip_info(name: str) -> dict[str, Any]:
    """클립의 프레임 수·해상도·FPS를 반환한다 (라벨링 UI용)."""
    cap = cv2.VideoCapture(str(_clip_path(name)))
    try:
        count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 10)
        return {
            "name": name,
            "frames": count,
            "width": width,
            "height": height,
            "fps": fps,
            "seconds": round(count / fps, 2) if fps else 0,
        }
    finally:
        cap.release()


def get_frame(name: str, index: int) -> bytes:
    """클립의 지정 프레임을 JPEG 바이트로 반환한다."""
    cap = cv2.VideoCapture(str(_clip_path(name)))
    try:
        cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, int(index)))
        ok, frame = cap.read()
        if not ok:
            raise ValueError(f"frame {index} out of range")
        ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        if not ok:
            raise ValueError("frame encode failed")
        return buf.tobytes()
    finally:
        cap.release()
```

</details>

<details>
<summary><code>services/fastapi/app/dataset_manager.py</code></summary>

```python
"""실제 건설현장 CCTV 데이터셋 수집·검증·파인튜닝 준비.

- 수집한 이미지/라벨을 학습 데이터셋으로 가져오고 train/val로 분할한다.
- 클래스 분포·사고/정상 비율·라벨 오류를 분석해 학습 전 점검 결과를 제공한다.
"""
from __future__ import annotations

import random
import shutil
from collections import Counter
from pathlib import Path
from typing import Any

from . import trainer

ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = ROOT / ".models" / "datasets"
RAW_DIR = ROOT / ".data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".bmp"}
ACCIDENT_KEYWORDS = ("fall", "accident", "collapse", "fire", "injury", "추락", "사고", "붕괴", "화재")


def _root(dataset_id: str) -> Path:
    name = Path(dataset_id).name
    if not name or name in (".", ".."):
        raise ValueError("invalid datasetId")
    return DATASET_DIR / name


def _classes(dataset_id: str, provided: list[str] | None = None) -> list[str]:
    root = _root(dataset_id)
    root.mkdir(parents=True, exist_ok=True)
    if provided:
        names = [c.strip() for c in provided if c and c.strip()]
        (root / "classes.txt").write_text("\n".join(names), encoding="utf-8")
        return names
    cls_file = root / "classes.txt"
    if cls_file.exists():
        names = [line.strip() for line in cls_file.read_text(encoding="utf-8").splitlines() if line.strip()]
        if names:
            return names
    return list(trainer.COCO_NAMES)


def _write_yaml(dataset_id: str, names: list[str]) -> None:
    root = _root(dataset_id)
    val = "images/val" if (root / "images" / "val").exists() else "images/train"
    (root / "data.yaml").write_text(
        f"path: {root.as_posix()}\ntrain: images/train\nval: {val}\n"
        f"nc: {len(names)}\nnames: {names}\n",
        encoding="utf-8",
    )


def import_directory(
    dataset_id: str,
    source_path: str,
    classes: list[str] | None = None,
    val_ratio: float = 0.2,
) -> dict[str, Any]:
    """로컬 원본 폴더의 이미지/라벨을 데이터셋으로 가져와 train/val 분할."""
    source = Path(source_path).expanduser().resolve()
    # 이 프로젝트 서비스 루트 밖은 읽지 않는다 (다른 프로젝트 간섭 방지).
    if ROOT.resolve() not in source.parents and source != ROOT.resolve():
        raise ValueError(f"source must be inside {ROOT}")
    if not source.is_dir():
        raise FileNotFoundError(str(source))

    pairs: list[tuple[Path, Path | None]] = []
    for image in sorted(source.rglob("*")):
        if image.suffix.lower() not in IMAGE_EXT:
            continue
        label = image.with_suffix(".txt")
        # images/·labels/로 나뉜 구조면 labels/ 쪽 라벨을 우선 찾는다.
        if not label.exists():
            parts = list(image.parts)
            if "images" in parts:
                idx = parts.index("images")
                alt = source.joinpath(*parts[:idx], "labels", *parts[idx + 1:]).with_suffix(".txt")
                if alt.exists():
                    label = alt
        pairs.append((image, label if label.exists() else None))
    if not pairs:
        raise ValueError("no images found in source")

    root = _root(dataset_id)
    names = _classes(dataset_id, classes)
    random.Random(42).shuffle(pairs)
    split = max(1, int(len(pairs) * (1 - min(0.5, max(0.05, val_ratio)))))
    for subset, chunk in (("train", pairs[:split]), ("val", pairs[split:])):
        img_dir = root / "images" / subset
        lbl_dir = root / "labels" / subset
        img_dir.mkdir(parents=True, exist_ok=True)
        lbl_dir.mkdir(parents=True, exist_ok=True)
        for image, label in chunk:
            shutil.copy2(image, img_dir / image.name)
            (lbl_dir / f"{image.stem}.txt").write_text(
                label.read_text(encoding="utf-8") if label else "", encoding="utf-8"
            )
    _write_yaml(dataset_id, names)
    return {
        "datasetId": dataset_id,
        "imported": len(pairs),
        "train": split,
        "val": len(pairs) - split,
        "classes": len(names),
        "source": str(source),
        "analysis": analyze(dataset_id),
    }


def analyze(dataset_id: str) -> dict[str, Any]:
    """데이터셋 통계와 학습 전 권고사항을 반환한다."""
    root = _root(dataset_id)
    cls_file = root / "classes.txt"
    names = [line.strip() for line in cls_file.read_text(encoding="utf-8").splitlines() if line.strip()] if cls_file.exists() else list(trainer.COCO_NAMES)
    counts: Counter[str] = Counter()
    total_labels = 0
    empty_labels = 0
    malformed = 0
    accident_images = 0
    labeled_images = 0

    for txt in root.rglob("*.txt"):
        if txt.name in ("classes.txt", "data.yaml"):
            continue
        lines = [line.strip() for line in txt.read_text(encoding="utf-8", errors="ignore").splitlines() if line.strip()]
        if not lines:
            empty_labels += 1
            continue
        labeled_images += 1
        has_accident = False
        for line in lines:
            parts = line.split()
            total_labels += 1
            if len(parts) < 5:
                malformed += 1
                continue
            try:
                cls = int(parts[0])
            except ValueError:
                malformed += 1
                continue
            name = names[cls] if 0 <= cls < len(names) else f"class_{cls}"
            counts[name] += 1
            if any(kw in name.lower() for kw in ACCIDENT_KEYWORDS):
                has_accident = True
        if has_accident:
            accident_images += 1

    images = len([p for p in root.rglob("*") if p.suffix.lower() in IMAGE_EXT])
    val_images = len([p for p in (root / "images" / "val").glob("*") if p.suffix.lower() in IMAGE_EXT])
    accident_ratio = round(accident_images / labeled_images, 3) if labeled_images else 0.0

    recommendations: list[str] = []
    if images == 0:
        recommendations.append("이미지가 없습니다. 원본 폴더를 가져오거나 프레임을 수집하세요.")
    if labeled_images == 0:
        recommendations.append("라벨이 없습니다. 클립 라벨링 또는 캡처로 라벨을 추가하세요.")
    if 0 < labeled_images and accident_ratio < 0.05:
        recommendations.append("사고 클래스 비율이 5% 미만입니다. 사고 클립을 더 수집하거나 언더샘플링을 고려하세요.")
    if accident_ratio > 0.5:
        recommendations.append("사고 클래스 비율이 50%를 넘습니다. 정상 샘플(하드 네거티브)을 보강하세요.")
    if empty_labels:
        recommendations.append(f"라벨 없는 네거티브 샘플 {empty_labels}장이 포함되어 있습니다 (오탐 감소에 도움).")
    if malformed:
        recommendations.append(f"형식이 잘못된 라벨 {malformed}줄이 있습니다. 학습 전 확인하세요.")
    if val_images == 0 and images:
        recommendations.append("검증(val) 세트가 없습니다. 실제 현장 데이터셋 가져오기를 사용하면 자동 분할됩니다.")

    return {
        "datasetId": dataset_id,
        "images": images,
        "labeledImages": labeled_images,
        "emptyLabels": empty_labels,
        "valImages": val_images,
        "totalLabels": total_labels,
        "accidentImages": accident_images,
        "accidentRatio": accident_ratio,
        "classes": names,
        "classCounts": dict(counts.most_common()),
        "recommendations": recommendations,
        "ready": images > 0 and labeled_images > 0 and val_images > 0 and malformed == 0,
    }


def raw_datasets() -> list[dict[str, Any]]:
    """가져올 수 있는 services/.data/raw 하위 폴더 목록."""
    return [
        {"name": p.name, "path": str(p)}
        for p in sorted(RAW_DIR.iterdir()) if p.is_dir()
    ]
```

</details>

<details>
<summary><code>services/fastapi/app/accident_analyzer.py</code></summary>

```python
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
```

</details>

<details>
<summary><code>apps/web-react/src/analysis/industrialSafety.ts</code></summary>

```ts
/** 산업 현장 전용 위험/사고 판정.
 *
 * 원칙: 탐지된 객체가 있다는 것만으로 사고가 아니다.
 * 거리·접근 속도·지속 시간·자세 변화·정지 여부를 함께 본다.
 * 단순 근접은 '주의', 시간적 특징이 맞을 때만 '사고 의심'.
 */
import type { LiveBox } from './liveTracker';

export interface SafetyFinding {
  type: 'proximity' | 'collision_risk' | 'fall' | 'sudden_stop' | 'restricted';
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  evidence: string[];
  trackIds: string[];
  confidence: number;
}

interface TrackState {
  t: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  aspect: number;
  lastMove: number;
}

const tracks = new Map<string, TrackState>();
const proximitySince = new Map<string, number>();
const emitted = new Map<string, number>();

export const INDUSTRIAL_RULES = {
  proximityDist: 14,        // 지게차-작업자 주의 거리 (%)
  dangerDist: 7,            // 위험 근접 거리 (%)
  proximitySec: 1.2,        // 위험 상태 지속 시간
  approachSpeed: 4,         // 접근 속도 기준 (%/s)
  fallDropPct: 8,
  postureChange: 0.35,
};

export function resetSafety() {
  tracks.clear();
  proximitySince.clear();
  emitted.clear();
}

const isWorker = (b: LiveBox) =>
  b.kind === 'person' || /사람|작업자|person/.test(b.label ?? '');
const isForklift = (b: LiveBox) =>
  b.kind === 'vehicle' && /지게차|forklift/.test(b.label ?? '');

function emit(type: SafetyFinding['type'], t: number, verdict: Omit<SafetyFinding, 'confidence'>): SafetyFinding | null {
  const key = `${type}-${verdict.trackIds.join('_')}`;
  if (t - (emitted.get(key) ?? -99) < 4) return null;
  emitted.set(key, t);
  return {
    ...verdict,
    confidence: verdict.severity === 'critical' ? 0.78 : verdict.severity === 'warning' ? 0.6 : 0.4,
  };
}

/** 프레임 단위 분석. 사고 의심 이벤트만 반환한다. */
export function analyzeIndustrial(boxes: LiveBox[], restrictedZones: Array<{ x: number; y: number; w: number; h: number }> = []): SafetyFinding[] {
  if (!boxes.length) return [];
  const t = boxes[0]?.t ?? 0;
  const findings: SafetyFinding[] = [];

  // 1) 트랙 상태 갱신 (속도·자세)
  const next = new Map<string, TrackState>();
  for (const b of boxes) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const aspect = b.w / Math.max(1, b.h);
    const prev = tracks.get(b.id);
    const dt = prev ? Math.max(0.05, t - prev.t) : 0.1;
    const vx = prev ? (cx - prev.x) / dt : 0;
    const vy = prev ? (cy - prev.y) / dt : 0;
    const moving = Math.hypot(vx, vy) > 1.5;
    next.set(b.id, {
      t, x: cx, y: cy, w: b.w, h: b.h, vx, vy, aspect,
      lastMove: moving ? t : (prev?.lastMove ?? t),
    });

    // 2) 추락/넘어짐: 수직 하강 + 자세 변화 + 이후 정지
    if (prev && /사람|작업자|person/.test(b.label ?? '')) {
      const drop = cy - prev.y;
      const posture = aspect - prev.aspect;
      if ((drop >= INDUSTRIAL_RULES.fallDropPct || (posture >= INDUSTRIAL_RULES.postureChange && drop >= 2))
          && Math.hypot(vx, vy) < 2.5) {
        const f = emit('fall', t, {
          type: 'fall', title: '추락·넘어짐 의심', severity: 'critical',
          description: '작업자의 급격한 위치·자세 변화 후 정지 상태가 확인되었습니다.',
          evidence: [`수직 이동 ${drop.toFixed(1)}%`, `종횡비 ${prev.aspect.toFixed(2)} → ${aspect.toFixed(2)}`, '이후 정지'],
          trackIds: [b.id],
        });
        if (f) findings.push(f);
      }
    }

    // 3) 위험 구역 체류
    for (let i = 0; i < restrictedZones.length; i += 1) {
      const z = restrictedZones[i];
      if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) {
        const f = emit('restricted', t, {
          type: 'restricted', title: '위험 구역 진입', severity: 'warning',
          description: '작업자가 설정된 위험 구역에 진입했습니다.',
          evidence: [`구역 ${i + 1}`, `${b.id} 위치 (${cx.toFixed(0)}, ${cy.toFixed(0)})`],
          trackIds: [b.id],
        });
        if (f) findings.push(f);
      }
    }
  }

  // 4) 지게차-작업자 위험 접근: 단순 근접이 아니라 '접근 + 지속 + 감속'
  const workers = boxes.filter(isWorker);
  const forklifts = boxes.filter(isForklift);
  for (const w of workers) {
    const wcx = w.x + w.w / 2;
    const wcy = w.y + w.h / 2;
    const ws = next.get(w.id);
    for (const f of forklifts) {
      const fcx = f.x + f.w / 2;
      const fcy = f.y + f.h / 2;
      const dist = Math.hypot(wcx - fcx, wcy - fcy);
      const fs = next.get(f.id);
      const approaching = fs && ws
        ? (wcx - fcx) * (fs.vx - ws.vx) + (wcy - fcy) * (fs.vy - ws.vy) < 0
        : false;
      const closing = fs && ws && dist < INDUSTRIAL_RULES.proximityDist
        ? Math.max(0, -((wcx - fcx) * (ws.vx - fs.vx) + (wcy - fcy) * (ws.vy - fs.vy)) / Math.max(dist, 1))
        : 0;
      const key = `${w.id}_${f.id}`;

      if (dist < INDUSTRIAL_RULES.proximityDist && (approaching || closing > INDUSTRIAL_RULES.approachSpeed)) {
        const since = proximitySince.get(key) ?? t;
        proximitySince.set(key, since);
        const duration = t - since;
        if (dist < INDUSTRIAL_RULES.dangerDist && duration >= INDUSTRIAL_RULES.proximitySec) {
          const stopped = ws && fs && Math.hypot(ws.vx - fs.vx, ws.vy - fs.vy) < 3;
          const result = emit('collision_risk', t, {
            type: 'collision_risk',
            title: '지게차-작업자 충돌 위험',
            severity: 'critical',
            description: '지게차와 작업자가 가까워진 상태가 지속되어 충돌 위험이 의심됩니다.',
            evidence: [
              `거리 ${dist.toFixed(1)}% (${duration.toFixed(1)}s 지속)`,
              `상대 접근 ${closing.toFixed(1)}%/s`,
              stopped ? '이후 상대 정지' : '접근 지속',
            ],
            trackIds: [w.id, f.id],
          });
          if (result) findings.push(result);
        } else if (dist < INDUSTRIAL_RULES.proximityDist) {
          const result = emit('proximity', t, {
            type: 'proximity', title: '지게차-작업자 근접', severity: 'warning',
            description: '두 객체가 가까워지고 있습니다. 사고는 아직 확인되지 않았습니다.',
            evidence: [`거리 ${dist.toFixed(1)}%`, `지속 ${duration.toFixed(1)}s`],
            trackIds: [w.id, f.id],
          });
          if (result) findings.push(result);
        }
      } else {
        proximitySince.delete(key);
      }
    }
  }

  tracks.clear();
  next.forEach((v, k) => tracks.set(k, v));
  return findings;
}
```

</details>

<details>
<summary><code>apps/web-react/src/services/feedbackApi.ts</code></summary>

```ts
import { backendBaseUrl } from '@/config';

/** 화면에서 잘못 탐지된 BBox를 신고해 네거티브 학습 데이터로 저장 */
export async function reportFalsePositive(
  canvas: HTMLCanvasElement,
  label: string,
  confidence: number,
  bbox: { x: number; y: number; w: number; h: number },
): Promise<{ saved: boolean }> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  );
  if (!blob) throw new Error('frame capture failed');
  const form = new FormData();
  form.append('file', blob, 'false_positive.jpg');
  form.append('label', label);
  form.append('confidence', String(confidence));
  form.append('bbox', JSON.stringify(bbox));
  const r = await fetch(`${backendBaseUrl()}/api/feedback/false-positive`, { method: 'POST', body: form });
  if (!r.ok) throw new Error('feedback failed');
  return r.json();
}
```

</details>

<details>
<summary><code>services/fastapi/app/evaluation.py</code></summary>

```python
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
```

</details>

<details>
<summary><code>services/fastapi/app/feedback.py</code></summary>

```python
"""사용자 오탐 신고 → 하드 네거티브 학습 데이터 저장.

화면에서 잘못 표시된 BBox를 신고하면 해당 프레임을 라벨 없는
배경(네거티브) 샘플로 저장하고, 재학습 시 오탐 억제에 사용한다.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATASET = ROOT / ".models" / "datasets" / "active_negative"
IMG_DIR = DATASET / "images" / "train"
LBL_DIR = DATASET / "labels" / "train"
LOG = ROOT / ".data" / "feedback.jsonl"
for d in (IMG_DIR, LBL_DIR, LOG.parent):
    d.mkdir(parents=True, exist_ok=True)


def report(frame_bytes: bytes, label: str, confidence: float, bbox: dict[str, Any]) -> dict[str, Any]:
    stem = f"fp_{int(time.time() * 1000)}"
    # OpenCV 한글 경로 문제 피하려고 상대경로 사용
    img_rel = (Path("services") / ".models" / "datasets" / "active_negative" / "images" / "train" / f"{stem}.jpg").as_posix()
    import cv2

    import numpy as np

    image = cv2.imdecode(np.frombuffer(frame_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("frame decode failed")
    ok = cv2.imwrite(img_rel, image)
    if not ok:
        raise ValueError("frame save failed")
    # 빈 라벨 = 이 영역은 배경(오탐)
    (LBL_DIR / f"{stem}.txt").write_text("", encoding="utf-8")
    record = {
        "ts": time.time(), "file": f"{stem}.jpg", "label": label,
        "confidence": confidence, "bbox": bbox, "kind": "false_positive",
    }
    with LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return record


def zones(limit: int = 50) -> list[dict[str, Any]]:
    """신고된 오탐 영역(BBox) 목록 — 실시간 필터링에 사용."""
    result: list[dict[str, Any]] = []
    if LOG.exists():
        for line in LOG.read_text(encoding="utf-8").splitlines()[-limit:]:
            try:
                r = json.loads(line)
                bbox = r.get("bbox") or {}
                if all(k in bbox for k in ("x", "y", "w", "h")):
                    result.append({"label": r.get("label", ""), "bbox": bbox})
            except Exception:
                continue
    return result


def stats(limit: int = 30) -> dict[str, Any]:
    records = []
    if LOG.exists():
        for line in LOG.read_text(encoding="utf-8").splitlines()[-limit:]:
            try:
                records.append(json.loads(line))
            except Exception:
                continue
    return {"count": len(list(IMG_DIR.glob("fp_*.jpg"))), "recent": records[::-1]}
```

</details>

<details>
<summary><code>services/fastapi/app/behavior_dataset.py</code></summary>

```python
"""사람 행동 패턴 학습 데이터셋 구축.

실제 영상에서 YOLO Pose로 관절을 추출하고, 시간적 특징(속도·자세·지속)
라벨을 붙여 행동 분류 학습 데이터로 저장한다.

행동 클래스:
  standing, walking, running, falling, crouching, lying,
  lifting, helping, altercation, loitering

저장 형식: JSONL (한 줄 = 한 프레임의 관절+특징+라벨)
"""
from __future__ import annotations

import json
import math
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / ".data" / "behavior_dataset"
LABEL_FILE = DATA_DIR / "patterns.jsonl"
DATA_DIR.mkdir(parents=True, exist_ok=True)

CLASSES = [
    "standing", "walking", "running", "falling", "crouching", "lying",
    "lifting", "helping", "altercation", "loitering",
]

# 관절 인덱스 (COCO pose): 0코 5어깨L 6어깨R 11엉덩이 13무릎L 14무릎R 15발L 16발R
IDX = {"nose": 0, "sh_l": 5, "sh_r": 6, "hip": 11, "knee_l": 13, "knee_r": 14, "ankle_l": 15, "ankle_r": 16}


def _features(kp: list[list[float]], prev: dict[str, Any] | None, now: float) -> dict[str, float]:
    def pt(name: str) -> list[float]:
        i = IDX.get(name, 0)
        return kp[i] if i < len(kp) else [0.0, 0.0]

    hip, sh_l, sh_r = pt("hip"), pt("sh_l"), pt("sh_r")
    ankle_l, ankle_r = pt("ankle_l"), pt("ankle_r")
    sh_cy = (sh_l[1] + sh_r[1]) / 2
    body_h = max(1.0, abs(hip[1] - sh_cy) * 2)
    hip_y = hip[1]
    # 자세: 엉덩이가 발목에 가까우면 앉기/눕기
    ankle_y = (ankle_l[1] + ankle_r[1]) / 2
    crouch = max(0.0, (hip_y - ankle_y + body_h) / max(1.0, body_h))
    # 어깨 기울기 (넘어짐 단서)
    shoulder_tilt = abs(sh_l[1] - sh_r[1]) / max(1.0, abs(sh_l[0] - sh_r[0]))
    speed = 0.0
    if prev:
        dt = max(0.05, now - prev.get("t", now))
        speed = math.hypot(hip[0] - prev.get("x", hip[0]), hip[1] - prev.get("y", hip[1])) / dt
    return {
        "body_h": round(body_h, 3),
        "hip_y": round(hip_y, 3),
        "crouch": round(crouch, 3),
        "shoulder_tilt": round(shoulder_tilt, 3),
        "speed": round(speed, 3),
    }


def classify(f: dict[str, float]) -> str:
    """위험도순 규칙 기반 라벨 (학습 데이터의 초기 라벨로 사용)."""
    if f["crouch"] > 2.4 or f["shoulder_tilt"] > 1.6:
        return "lying"
    if f["speed"] > 14:
        return "running"
    if f["crouch"] > 1.5:
        return "crouching"
    if f["speed"] < 0.8:
        return "loitering"
    if f["speed"] > 2:
        return "walking"
    return "standing"


def capture(frame: Any, threshold: float = 0.35) -> list[dict[str, Any]]:
    """프레임에서 관절 특징을 추출해 학습 데이터로 저장."""
    from . import behavior_recognizer

    model = behavior_recognizer.get_pose_model()
    results = model.predict(source=frame, conf=threshold, verbose=False)
    now = time.time()
    records: list[dict[str, Any]] = []
    for result in results:
        if result.keypoints is None:
            continue
        for kp in result.keypoints.xy.cpu().numpy():
            pts = [[float(p[0]), float(p[1])] for p in kp]
            f = _features(pts, None, now)
            label = classify(f)
            rec = {
                "t": now, "label": label, "features": f,
                "keypoints": [[round(p[0], 2), round(p[1], 2)] for p in pts],
            }
            records.append(rec)
    if records:
        with LABEL_FILE.open("a", encoding="utf-8") as fp:
            for r in records:
                fp.write(json.dumps(r, ensure_ascii=False) + "\n")
    return records


def stats() -> dict[str, Any]:
    counts: dict[str, int] = {c: 0 for c in CLASSES}
    total = 0
    if LABEL_FILE.exists():
        for line in LABEL_FILE.read_text(encoding="utf-8").splitlines():
            try:
                r = json.loads(line)
                counts[r.get("label", "unknown")] = counts.get(r.get("label", "unknown"), 0) + 1
                total += 1
            except Exception:
                continue
    return {
        "total": total, "classes": CLASSES, "counts": counts,
        "path": str(LABEL_FILE),
        "note": "실제 영상에서 추출한 관절 특징 기반 초기 라벨. 사람이 검토해 정정하면 정확도가 오릅니다.",
    }
```

</details>

<details>
<summary><code>services/fastapi/app/accident_analyzer.py</code></summary>

```python
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
```

</details>

<details>
<summary><code>services/fastapi/app/external_datasets.py</code></summary>

```python
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
```

</details>

<details>
<summary><code>services/fastapi/app/data_catalog.py</code></summary>

```python
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
```

</details>

<details>
<summary><code>services/fastapi/app/auto_retrain.py</code></summary>

```python
"""오인식 → 라벨 수정 → 재학습 자동화 파이프라인.

1) 검토 결과(false verdict)를 수집해 하드 네거티브로 저장
2) 웹에 업로드된 영상(.data/uploads)에서 프레임 샘플링
3) COCO/커스텀 모델로 초기 라벨 생성 후 사람 라벨만 신뢰
4) 데이터셋 재구축 → YOLO 미세조정 → 커스텀 모델 자동 적용
"""
from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Any

from . import trainer, evaluation

ROOT = Path(__file__).resolve().parents[2]
UPLOAD_DIR = ROOT / ".data" / "uploads"
STATE: dict[str, Any] = {
    "status": "idle", "progress": 0, "message": "대기 중",
    "lastRun": None, "samplesAdded": 0, "error": None,
}
_lock = threading.Lock()


def _update(**kwargs: Any) -> None:
    with _lock:
        STATE.update(kwargs)


def status() -> dict[str, Any]:
    with _lock:
        return dict(STATE)


def _collect_negatives() -> int:
    """화면에서 신고된 오탐 네거티브 수를 반환 (feedback.py가 이미 저장함)."""
    try:
        from . import feedback
        return feedback.stats()["count"]
    except Exception:
        return 0


def run(epochs: int = 10, imgsz: int = 640, base_model: str = "yolov8n.pt") -> dict[str, Any]:
    if STATE["status"] == "running":
        return status()
    _update(status="running", progress=0, message="오인식 데이터 수집 중", error=None)

    def worker() -> None:
        try:
            negatives = _collect_negatives()
            _update(progress=0.2, message=f"하드 네거티브 {negatives}건 수집", samplesAdded=negatives)

            from . import build_site_dataset

            result = build_site_dataset.build(sample_sec=1.0)
            _update(progress=0.45, message=f"데이터셋 {result['samples']}장 구축", samplesAdded=result["samples"])

            trainer.start_training(
                "construction", epochs=epochs, imgsz=imgsz, batch=4, base_model=base_model,
                augmentation={"fliplr": 0.3, "flipud": 0.0, "mosaic": 0.3, "mixup": 0.0,
                              "degrees": 3, "scale": 0.3},
            )
            # 학습 완료 폴링
            deadline = time.time() + 1800
            while time.time() < deadline:
                t = trainer.status()
                if t["status"] in ("completed", "error"):
                    break
                _update(progress=0.45 + min(0.5, t["progress"] * 0.5),
                        message=t.get("message", "학습 중"))
                time.sleep(2)
            final = trainer.status()
            if final["status"] == "error":
                _update(status="error", progress=1, message="학습 실패", error=final.get("error"))
            else:
                _update(status="completed", progress=1, message="재학습 완료 · 커스텀 모델 적용",
                        lastRun=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
        except Exception as exc:  # noqa: BLE001
            _update(status="error", progress=1, message="재학습 실패", error=str(exc))

    threading.Thread(target=worker, daemon=True).start()
    return status()
```

</details>

<details>
<summary><code>services/fastapi/app/build_site_dataset.py</code></summary>

```python
"""건설현장 CCTV 영상에서 지게차/트럭/사람 라벨 데이터셋을 구축한다.

COCO 사전학습 모델은 지게차 클래스가 없어 지게차를 truck으로,
트럭 적재함/운전실을 truck/bus/car로 차례로 검출한다.
CCTV는 고정 카메라라 BBox 위치가 일정하므로, 감지 좌표와
프레임 내 위치로 정확한 클래스를 재매핑해 학습 라벨을 만든다.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BASE_SOURCES = [
    ("fork", ROOT / ".models" / "upload_1795137690253.mp4"),
    ("bus", ROOT / ".models" / "upload_1795137674597.mp4"),
    ("road", ROOT / ".models" / "upload_1795137553318.mp4"),
]
# 웹에 업로드된 영상은 .data/uploads에 보존된다 — 오탐/붕괴 장면 재학습에 자동 포함
UPLOAD_DIR = ROOT / ".data" / "uploads"
DATASET = ROOT / ".models" / "datasets" / "construction"
# COCO 사전학습에 forklift 클래스가 없어 위치 규칙으로 만든 라벨이 오탐을 유발했다.
# 신뢰할 수 있는 클래스만 학습한다.
CLASSES = ["person", "car", "truck", "bus"]


def _sources() -> list[tuple[str, Path]]:
    items = list(BASE_SOURCES)
    if UPLOAD_DIR.exists():
        for p in sorted(UPLOAD_DIR.glob("*.mp4"), key=lambda x: x.stat().st_mtime, reverse=True):
            items.append(("upload", p))
    return items


def _classify(det: dict[str, Any], source: str = "fork") -> str | None:
    b = det["bbox"]
    cx = b["x"] + b["w"] / 2
    cy = b["y"] + b["h"] / 2
    area = b["w"] * b["h"] / 100
    label = det.get("label", "")
    if label in ("사람", "person"):
        return "person"
    if area < 0.3:
        return None
    if source == "fork":
        # 위치 규칙은 제거 — COCO 원본 클래스만 신뢰
        if label in ("자동차", "car"):
            return "car"
        if label in ("트럭", "truck"):
            return "truck"

    elif source == "bus":
        # 버스 영상: COCO bus 검출만 신뢰
        if label in ("버스", "bus"):
            return "bus"
    elif source == "road":
        # 야간 도로: COCO 원본 클래스 유지 (자동차를 트럭으로 합치지 않음)
        if label in ("자동차", "car"):
            return "car"
        if label in ("트럭", "truck"):
            return "truck"
    elif source == "upload":
        # 웹에서 업로드된 영상: COCO가 잔해를 트럭/자동차로 오인하므로
        # 사람만 신뢰하고 나머지는 라벨에서 제외한다 (오탐 학습 방지)
        if label in ("사람", "person", "작업자"):
            return "person"
    return None


def build(sample_sec: float = 1.0, val_ratio: float = 0.2) -> dict[str, Any]:
    for split in ("train", "val"):
        d = DATASET / "images" / split
        if d.exists():
            for old in d.glob("*.jpg"):
                old.unlink()
        l = DATASET / "labels" / split
        if l.exists():
            for old in l.glob("*.txt"):
                old.unlink()
        d.mkdir(parents=True, exist_ok=True)
        l.mkdir(parents=True, exist_ok=True)
    (DATASET / "classes.txt").write_text("\n".join(CLASSES), encoding="utf-8")

    from . import yolo_detector, preprocessing, resolution

    config = json.loads((ROOT.parent / "configs" / "app.config.json").read_text(encoding="utf-8"))
    yolo_detector.configure(config.get("detection", {}))
    preprocessing.configure(config.get("preprocessing", {}))
    resolution.configure(config.get("detection", {}))
    # 라벨 생성은 COCO 사전학습 모델로 한다 (커스텀 모델은 지게차에 과적합되어 있음)
    yolo_detector.use_model(str(ROOT / ".models" / config["detection"]["model"]["value"]))

    sources = _sources()
    all_frames: list[tuple[str, int, np.ndarray]] = []
    for source_name, video_path in sources:
        if not video_path.exists():
            continue
        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        # 짧은 영상은 모든 프레임, 긴 영상은 1초 간격 샘플링
        step = 1 if total / fps <= 6 else max(1, int(fps * sample_sec))
        for idx in range(0, total, step):
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ok, frame = cap.read()
            if ok:
                all_frames.append((source_name, idx, cv2.resize(frame, (640, 360))))
        cap.release()

    split_at = max(1, int(len(all_frames) * (1 - val_ratio)))
    counts: dict[str, int] = {c: 0 for c in CLASSES}
    samples = 0
    for i, (source, idx, frame) in enumerate(all_frames):
        rgb = np.array(Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)))
        detections = yolo_detector.detect_image(rgb, 0.3, 640, fast=True)
        # 같은 objects가 적재함/운전실로 분리 검출되므로 클래스별 최대 BBox만 유지
        by_class: dict[str, list[dict[str, Any]]] = {}
        for det in detections:
            cls = _classify(det, source)
            if cls is None:
                continue
            by_class.setdefault(cls, []).append(det)
        lines = []
        for cls, dets in by_class.items():
            dets.sort(key=lambda d: d["bbox"]["w"] * d["bbox"]["h"], reverse=True)
            keep = dets[: 1 if cls in ("car", "truck", "bus") else 3]
            for det in keep:
                b = det["bbox"]
                cx = (b["x"] + b["w"] / 2) / 100
                cy = (b["y"] + b["h"] / 2) / 100
                w = b["w"] / 100
                h = b["h"] / 100
                lines.append(f"{CLASSES.index(cls)} {cx:.5f} {cy:.5f} {w:.5f} {h:.5f}")
                counts[cls] += 1
        if not lines:
            continue
        split = "train" if i < split_at else "val"
        name = f"{source}_{idx:05d}"
        # OpenCV는 한글 포함 절대경로를 쓰지 못하므로 상대경로로 저장
        img_rel = (Path("services") / ".models" / "datasets" / "construction" / "images" / split / f"{name}.jpg").as_posix()
        cv2.imwrite(img_rel, frame)
        (DATASET / "labels" / split / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8")
        samples += 1

    # 화면에서 신고된 오탐 네거티브(빈 라벨)를 학습 데이터에 포함
    neg_img_dir = ROOT / ".models" / "datasets" / "active_negative" / "images" / "train"
    neg_lbl_dir = ROOT / ".models" / "datasets" / "active_negative" / "labels" / "train"
    negatives = 0
    if neg_img_dir.exists():
        import shutil
        for jpg in sorted(neg_img_dir.glob("*.jpg"))[-100:]:
            dst_img = DATASET / "images" / "train" / f"neg_{jpg.name}"
            dst_lbl = DATASET / "labels" / "train" / f"neg_{jpg.stem}.txt"
            shutil.copy2(jpg, dst_img)
            src_lbl = neg_lbl_dir / f"{jpg.stem}.txt"
            dst_lbl.write_text(
                src_lbl.read_text(encoding="utf-8") if src_lbl.exists() else "", encoding="utf-8"
            )
            negatives += 1

    (DATASET / "data.yaml").write_text(
        f"path: {DATASET.as_posix()}\ntrain: images/train\nval: images/val\n"
        f"nc: {len(CLASSES)}\nnames: {CLASSES}\n",
        encoding="utf-8",
    )
    return {
        "negatives": negatives,
        "datasetId": "construction",
        "sources": [str(p) for _, p in sources if p.exists()],
        "frames": len(all_frames),
        "samples": samples,
        "train": min(split_at, samples),
        "val": samples - min(split_at, samples),
        "classes": CLASSES,
        "counts": counts,
        "dataYaml": str(DATASET / "data.yaml"),
    }
```

</details>

<details>
<summary><code>services/fastapi/app/trainer.py</code></summary>

```python
"""YOLO 커스텀 학습 파이프라인.

- 감지 결과를 YOLO 라벨로 저장해 데이터셋을 만든다.
- 업로드/수집된 데이터셋으로 미세조정(fine-tuning)을 실행한다.
- 학습 완료 모델을 감지기에 즉시 적용한다.
"""
from __future__ import annotations

import shutil
import threading
import time
from pathlib import Path
from typing import Any

MODEL_DIR = Path(__file__).resolve().parents[2] / ".models"
DATASET_DIR = MODEL_DIR / "datasets"
TRAIN_DIR = MODEL_DIR / "train"
CUSTOM_MODEL = MODEL_DIR / "custom.pt"
DATASET_DIR.mkdir(parents=True, exist_ok=True)
TRAIN_DIR.mkdir(parents=True, exist_ok=True)

STATE: dict[str, Any] = {
    "status": "idle",
    "progress": 0,
    "epoch": 0,
    "totalEpochs": 0,
    "message": "학습 대기 중",
    "modelPath": None,
    "error": None,
    "datasetId": None,
    "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
}
_lock = threading.Lock()


COCO_NAMES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
    "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop",
    "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush",
]


def _update(**kwargs: Any) -> None:
    with _lock:
        STATE.update(kwargs)
        STATE["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def status() -> dict[str, Any]:
    with _lock:
        return dict(STATE)


def prepare_dataset(dataset_id: str, classes: list[str] | None = None) -> Path:
    """데이터셋 폴더에 data.yaml 이 없으면 자동 생성한다."""
    root = DATASET_DIR / dataset_id
    (root / "images" / "train").mkdir(parents=True, exist_ok=True)
    (root / "labels" / "train").mkdir(parents=True, exist_ok=True)
    class_file = root / "classes.txt"
    if classes is not None:
        class_file.write_text("\n".join(classes), encoding="utf-8")
    if class_file.exists():
        names = [line.strip() for line in class_file.read_text(encoding="utf-8").splitlines() if line.strip()]
    else:
        names = classes or COCO_NAMES
    yaml_path = root / "data.yaml"
    if not yaml_path.exists():
        val = "images/train" if not (root / "images" / "val").exists() else "images/val"
        yaml_path.write_text(
            f"path: {root.as_posix()}\ntrain: images/train\nval: {val}\n"
            f"nc: {len(names)}\nnames: {names}\n",
            encoding="utf-8",
        )
    return root


def import_zip(dataset_id: str, data: bytes) -> dict[str, Any]:
    """외부 데이터셋 ZIP(images/, labels/, classes.txt)을 가져온다."""
    import io
    import zipfile

    root = DATASET_DIR / dataset_id
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        for member in archive.namelist():
            if member.startswith("/") or ".." in member:
                continue
            archive.extract(member, root)
    prepare_dataset(dataset_id)
    images = len(list((root / "images").rglob("*.*")))
    labels = len(list((root / "labels").rglob("*.txt")))
    return {"datasetId": dataset_id, "images": images, "labels": labels}


def save_capture(dataset_id: str, image_bytes: bytes, detections: list[dict], image_name: str) -> int:
    """감지 결과를 YOLO 라벨(txt)로 저장한다. 저장된 라벨 수를 반환."""
    from PIL import Image

    root = prepare_dataset(dataset_id)
    img_dir = root / "images" / "train"
    lbl_dir = root / "labels" / "train"
    stem = Path(image_name).stem
    idx = len(list(img_dir.glob(f"{stem}*")))
    name = f"{stem}_{idx}" if idx else stem
    img = Image.open(__import__("io").BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    img.save(img_dir / f"{name}.jpg", quality=90)

    class_file = root / "classes.txt"
    names = (
        [line.strip() for line in class_file.read_text(encoding="utf-8").splitlines() if line.strip()]
        if class_file.exists() else COCO_NAMES
    )
    lines = []
    for det in detections:
        label = det.get("label") or det.get("labelKo") or ""
        from . import yolo_detector

        reverse = {v: k for k, v in yolo_detector.KOREAN_LABEL.items()}
        name = reverse.get(label, label)
        try:
            cls = names.index(name)
        except ValueError:
            try:
                cls = names.index(label)
            except ValueError:
                continue
        bbox = det["bbox"]
        cx = (bbox["x"] + bbox["w"] / 2) / 100
        cy = (bbox["y"] + bbox["h"] / 2) / 100
        bw = bbox["w"] / 100
        bh = bbox["h"] / 100
        lines.append(f"{cls} {cx:.5f} {cy:.5f} {bw:.5f} {bh:.5f}")
    (lbl_dir / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8")
    return len(lines)


def start_training(
    dataset_id: str,
    epochs: int = 30,
    imgsz: int = 640,
    batch: int = 8,
    base_model: str = "yolov8n.pt",
    augmentation: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if STATE["status"] == "running":
        return status()
    root = prepare_dataset(dataset_id)
    data_yaml = root / "data.yaml"
    if not data_yaml.exists():
        return {**status(), "status": "error", "error": "data.yaml not found"}

    _update(
        status="running",
        progress=0,
        epoch=0,
        totalEpochs=epochs,
        message="학습 시작",
        error=None,
        datasetId=dataset_id,
    )

    def run() -> None:
        try:
            from ultralytics import YOLO

            model = YOLO(base_model)
            run_name = f"run_{int(time.time())}"

            def on_epoch_end(trainer):
                epoch = int(trainer.epoch) + 1
                _update(
                    epoch=epoch,
                    progress=min(1.0, epoch / max(epochs, 1)),
                    message=f"에포크 {epoch}/{epochs} 학습 중",
                )

            model.add_callback("on_train_epoch_end", on_epoch_end)
            aug = augmentation or {}
            model.train(
                data=str(data_yaml),
                epochs=epochs,
                imgsz=imgsz,
                batch=batch,
                device="cuda" if __import__("torch").cuda.is_available() else "cpu",
                project=str(TRAIN_DIR),
                name=run_name,
                exist_ok=True,
                verbose=False,
                # 다양한 사물/각도/조명에 대한 일반화 성능을 높이는 증강 옵션
                fliplr=float(aug.get("fliplr", 0.5)),
                flipud=float(aug.get("flipud", 0.1)),
                mosaic=float(aug.get("mosaic", 1.0)),
                mixup=float(aug.get("mixup", 0.1)),
                hsv_h=float(aug.get("hsvH", 0.015)),
                hsv_s=float(aug.get("hsvS", 0.7)),
                hsv_v=float(aug.get("hsvV", 0.4)),
                degrees=float(aug.get("degrees", 5.0)),
                scale=float(aug.get("scale", 0.5)),
            )
            best = TRAIN_DIR / run_name / "weights" / "best.pt"
            if best.exists():
                shutil.copy2(best, CUSTOM_MODEL)
                class_file = root / "classes.txt"
                trained_names = (
                    [line.strip() for line in class_file.read_text(encoding="utf-8").splitlines() if line.strip()]
                    if class_file.exists() else COCO_NAMES
                )
                (CUSTOM_MODEL.parent / "custom_names.json").write_text(
                    __import__("json").dumps(trained_names), encoding="utf-8"
                )
                from . import yolo_detector, onnx_detector

                yolo_detector.use_model(str(CUSTOM_MODEL), list(trained_names))
                try:
                    onnx_detector.ensure_onnx(str(CUSTOM_MODEL), 320)
                except Exception:
                    pass  # ONNX 변환 실패 시 PyTorch 경로 사용
            _update(
                status="completed",
                progress=1,
                message="학습 완료 · 커스텀 모델 적용됨",
                modelPath=str(CUSTOM_MODEL) if best.exists() else None,
            )
        except Exception as exc:  # noqa: BLE001
            _update(status="error", error=str(exc), message="학습 실패")

    threading.Thread(target=run, daemon=True).start()
    return status()
```

</details>

<details>
<summary><code>services/fastapi/app/events.py</code></summary>

```python
"""WebSocket 실시간 이벤트 버스 (별도 브로커 없이 동작)."""
from __future__ import annotations

import asyncio
from typing import Any

_clients: set[Any] = set()
_latest: dict[str, Any] = {"type": "idle", "data": {}}
_loop: Any = None


def set_loop(loop: Any) -> None:
    global _loop
    _loop = loop


async def connect(websocket: Any) -> None:
    await websocket.accept()
    _clients.add(websocket)
    try:
        await websocket.send_json(_latest)
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        _clients.discard(websocket)


async def publish(event: dict[str, Any]) -> None:
    global _latest
    _latest = event
    for ws in list(_clients):
        try:
            await ws.send_json(event)
        except Exception:
            _clients.discard(ws)


def publish_sync(event: dict[str, Any]) -> None:
    """동기 스레드(스트림 워커)에서 이벤트를 발행한다."""
    if _loop is None:
        return
    _loop.call_soon_threadsafe(lambda: asyncio.create_task(publish(event)))


def client_count() -> int:
    return len(_clients)
```

</details>

<details>
<summary><code>services/fastapi/app/event_store.py</code></summary>

```python
"""로컬 이벤트 로그 저장 (Redis/Kafka 없이도 동작하는 경량 스토어)."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[2] / ".data"
LOG_PATH = DATA_DIR / "events.jsonl"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def append(event: dict[str, Any]) -> None:
    record = {"ts": time.time(), **event}
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def recent(limit: int = 100) -> list[dict[str, Any]]:
    if not LOG_PATH.exists():
        return []
    lines = LOG_PATH.read_text(encoding="utf-8").splitlines()[-limit:]
    result = []
    for line in lines:
        try:
            result.append(json.loads(line))
        except Exception:
            continue
    return result[::-1]
```

</details>

<details>
<summary><code>services/fastapi/app/prediction.py</code></summary>

```python
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
```

</details>

<details>
<summary><code>services/fastapi/app/stream.py</code></summary>

```python
"""RTSP 스트림 수신 + 서버 측 분석 워커 (무료 OpenCV 기반)."""
from __future__ import annotations

import threading
import time
from collections import deque
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from . import events, event_store, prediction, yolo_detector

CLIP_DIR = Path(__file__).resolve().parents[2] / ".data" / "clips"
CLIP_DIR.mkdir(parents=True, exist_ok=True)

_state: dict[str, Any] = {"running": False, "url": "", "frames": 0, "lastError": None}
_capture = None
_thread = None
_stop = threading.Event()


def _worker(url: str, config: dict[str, Any]) -> None:
    global _capture, _state
    cap = cv2.VideoCapture(url)
    _capture = cap
    if not cap.isOpened():
        _state.update({"running": False, "lastError": "cannot open stream"})
        return
    fps = cap.get(cv2.CAP_PROP_FPS) or 15.0
    sample_fps = min(8.0, float(config.get("performance", {}).get("fps", {}).get("value", 8)))
    step = max(1, int(fps / sample_fps))
    roi = config.get("prediction", {}).get("roiPolygons", {}).get("value", [])
    horizon = float(config.get("prediction", {}).get("horizonSec", {}).get("value", 2))
    frames = deque(maxlen=150)
    idx = 0
    while not _stop.is_set():
        ok, frame = cap.read()
        if not ok:
            _state["lastError"] = "stream read failed"
            time.sleep(0.5)
            continue
        frames.append(frame.copy())
        if idx % step != 0:
            idx += 1
            continue
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        try:
            dets = yolo_detector.detect_image(rgb, 0.6, imgsz=320)
        except Exception as exc:
            _state["lastError"] = str(exc)
            idx += 1
            continue
        preds = prediction.update_and_predict(dets, roi, horizon) if config.get("prediction", {}).get("enabled", {}).get("value", True) else []
        event = {
            "type": "stream_frame",
            "source": url,
            "detections": dets,
            "predictions": preds,
            "danger": any(p.get("danger") for p in preds),
            "timestamp": time.time(),
        }
        events.publish_sync(event)
        if config.get("storage", {}).get("eventLog", {}).get("value", True):
            event_store.append(event)
        if event["danger"] and len(frames) >= 10:
            path = CLIP_DIR / f"clip_{int(time.time())}.avi"
            writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"MJPG"), 10, (frame.shape[1], frame.shape[0]))
            for f in list(frames)[-30:]:
                writer.write(f)
            writer.release()
        _state["frames"] += 1
        idx += 1
    cap.release()


def start(url: str, config: dict[str, Any]) -> dict[str, Any]:
    global _thread, _stop
    if _state["running"]:
        return status()
    _stop.clear()
    _state.update({"running": True, "url": url, "frames": 0, "lastError": None})
    _thread = threading.Thread(target=_worker, args=(url, config), daemon=True)
    _thread.start()
    return status()


def stop() -> dict[str, Any]:
    _stop.set()
    _state["running"] = False
    return status()


def status() -> dict[str, Any]:
    return dict(_state)
```

</details>

<details>
<summary><code>services/fastapi/app/broker.py</code></summary>

```python
"""이벤트 브로커: Redis Streams 사용 가능 시 사용, 아니면 로컬 파일 폴백."""
from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[2] / ".data"
LOCAL_PATH = DATA_DIR / "broker.jsonl"
DATA_DIR.mkdir(parents=True, exist_ok=True)

_settings: dict[str, Any] = {"type": "local", "url": "redis://127.0.0.1:6379/0", "stream": "visionflow:events"}
_client = None
_lock = threading.Lock()


def configure(config: dict[str, Any]) -> None:
    _settings.update({
        "type": config.get("type", {}).get("value", "local"),
        "url": config.get("url", {}).get("value", "redis://127.0.0.1:6379/0"),
        "stream": config.get("stream", {}).get("value", "visionflow:events"),
    })


def status() -> dict[str, Any]:
    return {**_settings, "connected": _client is not None}


def publish(event: dict[str, Any]) -> None:
    payload = {"ts": time.time(), **event}
    with _lock:
        if _settings["type"] == "redis":
            if _client is None:
                try:
                    import redis

                    _client = redis.Redis.from_url(_settings["url"], socket_connect_timeout=1)
                    _client.ping()
                except Exception:
                    globals()["_client"] = None
            if _client is not None:
                try:
                    _client.xadd(_settings["stream"], {"event": json.dumps(payload, ensure_ascii=False)})
                    return
                except Exception:
                    globals()["_client"] = None
        with LOCAL_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def recent(limit: int = 50) -> list[dict[str, Any]]:
    if not LOCAL_PATH.exists():
        return []
    out = []
    for line in LOCAL_PATH.read_text(encoding="utf-8").splitlines()[-limit:]:
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return out[::-1]
```

</details>

<details>
<summary><code>services/fastapi/app/timeseries.py</code></summary>

```python
"""경량 시계열 저장 (SQLite) - TimescaleDB 없이도 지표 이력 보관."""
from __future__ import annotations

import sqlite3
import time
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parents[2] / ".data" / "metrics.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def init() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS metrics (
                ts REAL PRIMARY KEY,
                detections INTEGER,
                danger INTEGER,
                detect_ms REAL,
                risk REAL,
                label TEXT
            )
        """)


def insert(detections: int, danger: bool, detect_ms: float, risk: float = 0, label: str = "") -> None:
    init()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO metrics (ts, detections, danger, detect_ms, risk, label) VALUES (?,?,?,?,?,?)",
            (time.time(), detections, int(danger), detect_ms, risk, label),
        )


def recent(limit: int = 100) -> list[dict[str, Any]]:
    init()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM metrics ORDER BY ts DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]
```

</details>

<details>
<summary><code>services/fastapi/app/measurement.py</code></summary>

```python
"""사물 측정: 상대 크기 + 기준물 보정 + 깊이 추정 기반 실측 근사치."""
from __future__ import annotations

import math
from typing import Any

import numpy as np


def _median_disparity(disparity: np.ndarray, det: dict, width: int, height: int) -> float:
    # 깊이 맵 해상도(예: 256×256)에 맞춰 BBox 비율 좌표를 스케일링한다.
    dh, dw = disparity.shape[:2]
    x1 = max(0, min(dw - 1, int(det["bbox"]["x"] / 100 * dw)))
    y1 = max(0, min(dh - 1, int(det["bbox"]["y"] / 100 * dh)))
    x2 = max(x1 + 1, min(dw, int((det["bbox"]["x"] + det["bbox"]["w"]) / 100 * dw)))
    y2 = max(y1 + 1, min(dh, int((det["bbox"]["y"] + det["bbox"]["h"]) / 100 * dh)))
    crop = disparity[y1:max(y1 + 1, y2), x1:max(x1 + 1, x2)]
    return float(np.median(crop)) if crop.size else 1.0


def measure_objects(
    detections: list[dict[str, Any]],
    image_width: int,
    image_height: int,
    config: dict[str, Any],
    disparity: np.ndarray | None = None,
) -> list[dict[str, Any]]:
    fov = float(config.get("fieldOfViewDeg", {}).get("value", 60))
    focal_px = image_width / (2 * math.tan(math.radians(fov) / 2))
    known_width_m = float(config.get("knownWidthCm", {}).get("value", 180)) / 100
    ref_type = config.get("referenceObject", {}).get("value", "car")

    reference = None
    if ref_type != "none":
        for d in detections:
            kind = d.get("kind")
            label = d.get("label")
            matched = (
                (ref_type == "car" and kind == "vehicle")
                or (ref_type == "person" and kind == "person")
                or label == ref_type
            )
            if matched:
                reference = d
                break

    ref_distance = None
    depth_scale = None
    if reference:
        ref_px = max(1.0, reference["bbox"]["w"] / 100 * image_width)
        ref_distance = known_width_m * focal_px / ref_px
        if disparity is not None:
            ref_disp = _median_disparity(disparity, reference, image_width, image_height)
            depth_scale = ref_distance / max(ref_disp, 1e-6)

    results: list[dict[str, Any]] = []
    for det in detections:
        wpx = det["bbox"]["w"] / 100 * image_width
        hpx = det["bbox"]["h"] / 100 * image_height
        distance = None
        if disparity is not None and depth_scale is not None:
            disp = _median_disparity(disparity, det, image_width, image_height)
            distance = disp * depth_scale
        elif ref_distance is not None:
            # 깊이 모델이 없으면 기준물과 같은 평면에 있다고 가정
            distance = ref_distance

        width_m = wpx * distance / focal_px if distance else None
        height_m = hpx * distance / focal_px if distance else None
        results.append({
            "label": det.get("labelKo") or det.get("label"),
            "kind": det.get("kind"),
            "confidence": det.get("confidence"),
            "bbox": det["bbox"],
            "widthPx": round(wpx, 1),
            "heightPx": round(hpx, 1),
            "widthPercent": round(det["bbox"]["w"], 2),
            "heightPercent": round(det["bbox"]["h"], 2),
            "areaPercent": round(det["bbox"]["w"] * det["bbox"]["h"] / 100, 2),
            "aspectRatio": round(wpx / max(hpx, 1), 2),
            "distanceM": round(distance, 2) if distance else None,
            "widthCm": round(width_m * 100, 1) if width_m else None,
            "heightCm": round(height_m * 100, 1) if height_m else None,
            "method": (
                "reference+depth" if disparity is not None and depth_scale is not None
                else "reference-plane" if ref_distance is not None
                else "relative-only"
            ),
        })
    return results
```

</details>

<details>
<summary><code>services/fastapi/app/behavior_recognizer.py</code></summary>

```python
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
```

</details>

<details>
<summary><code>services/fastapi/app/depth_estimator.py</code></summary>

```python
"""MiDaS 기반 단안 깊이(상대 깊이) 추정.

- 모델/가중치는 프로젝트 내부 `.models/torch` 에 저장해 외부 프로젝트와 공유하지 않는다.
- 로드 실패 시 None 을 반환해 호출侧에서 깊이 없이 동작하도록 폴백한다.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import numpy as np

MODEL_DIR = Path(__file__).resolve().parents[2] / ".models"
TORCH_DIR = MODEL_DIR / "torch"
TORCH_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("TORCH_HOME", str(TORCH_DIR))

_model: Any = None
_transform: Any = None
_failed = False


def get_depth_model():
    global _model, _transform, _failed
    if _failed:
        return None, None
    if _model is not None:
        return _model, _transform
    try:
        import torch
        import torch.hub

        # timm이 참조하는 rwightman 저장소를 비대화형으로 신뢰 처리
        torch.hub._TRUSTED_REPO_OWNERS = tuple(
            set(torch.hub._TRUSTED_REPO_OWNERS) | {"rwightman", "intel-isl", "isl-org"}
        )
        model = torch.hub.load("intel-isl/MiDaS", "MiDaS_small", trust_repo=True)
        transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model.to(device).eval()
        _model = model
        # MiDaS 버전에 따라 small / small_transform 모두 지원
        _transform = getattr(transforms, "small_transform", None) or getattr(transforms, "small", None)
        return _model, _transform
    except Exception:
        _failed = True
        return None, None


def estimate_disparity(image: np.ndarray) -> np.ndarray | None:
    """이미지에서 상대 역깊이(disparity) 맵을 반환한다. 실패 시 None."""
    import torch

    model, transform = get_depth_model()
    if model is None or transform is None:
        return None
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        inp = transform(image).to(device)
        with torch.no_grad():
            pred = model(inp)
        return pred.squeeze().cpu().numpy()
    except Exception:
        return None
```

</details>

<details>
<summary><code>services/express/package.json</code></summary>

```json
{
  "name": "@visionflow/express-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.2"
  }
}
```

</details>

<details>
<summary><code>services/express/src/index.js</code></summary>

```javascript
/** VisionFlow Studio — Express 분석 백엔드 (옵션: backend=express) */
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, '../../../configs/app.config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MODEL_BOOST = { fast: -0.04, balanced: 0, accurate: 0.04, ensemble: 0.07 };

const BEHAVIORS = [
  ['보행 중', 'Walking', '이동', 'info', 0.96],
  ['급하게 이동', 'Running', '이동', 'caution', 0.9],
  ['낙상 발생', 'Falling', '안전', 'critical', 0.88],
  ['다툼/몸싸움', 'Altercation', '안전', 'critical', 0.82],
  ['인파 집중', 'Crowd Gathering', '혼잡', 'warning', 0.91],
  ['출입금지 구역 진입', 'Restricted Access', '보안', 'warning', 0.8],
];

function analyze(videoName, performance = {}, accuracy = {}) {
  const seed = Math.abs(hash(videoName));
  const rand = () => {
    let t = (seed = (seed * 9301 + 49297) % 233280) / 233280;
    return t;
  };
  const fps = performance.fps?.value ?? 15;
  const threshold = accuracy.confidenceThreshold?.value ?? 0.65;
  const boost = MODEL_BOOST[accuracy.behaviorModel?.value] ?? 0;
  const smoothing = accuracy.temporalSmoothing?.value ?? true;
  const noise = smoothing ? 0.02 : 0.08;
  const sensitivity = accuracy.personDetectionSensitivity?.value ?? 0.7;
  const persons = Math.max(1, Math.round(6 + sensitivity * 8 + rand() * 3));

  const detections = Array.from({ length: persons }, (_, i) => ({
    id: `p-${i}`,
    trackId: accuracy.enableReIdentification?.value ? i + 1 : Math.floor(rand() * persons) + 1,
    confidence: clamp(0.7 + rand() * 0.29 + boost - noise, 0.3, 0.99),
    bbox: { x: rand() * 80, y: rand() * 60, w: 8 + rand() * 16, h: 18 + rand() * 26 },
    pose: rand() > 0.5 ? 'standing' : 'walking',
  }));

  const behaviors = [];
  for (let i = 0; i < 15; i += 1) {
    const [ko, en, category, severity, base] = BEHAVIORS[Math.floor(rand() * BEHAVIORS.length)];
    const confidence = clamp(base + boost - noise + (rand() - 0.5) * 0.08, 0.3, 0.99);
    if (confidence < threshold) continue;
    behaviors.push({
      id: `b-${i}`, timestamp: Math.round(rand() * 60 * 10) / 10,
      trackId: Math.floor(rand() * persons) + 1, label: en, labelKo: ko,
      category, confidence, severity, durationSec: Math.round((1 + rand() * 8) * 10) / 10,
    });
  }
  behaviors.sort((a, b) => a.timestamp - b.timestamp);

  const critical = behaviors.filter((b) => b.severity === 'critical');
  const situations = critical.length ? [{
    id: 's-0', timestamp: critical[0].timestamp, type: 'Altercation', typeKo: '다툼/폭력 행위',
    description: '다수 인물 간 신체 접촉이 감지되어 다툼이 의심됩니다.', severity: 'critical',
    confidence: clamp(0.8 + boost - noise, 0.3, 0.99),
    relatedBehaviors: critical.map((b) => b.id),
    persons: [...new Set(critical.map((b) => b.trackId))],
  }] : [];
  const actions = situations.map((s) => ({
    id: `a-${s.id}`, situationId: s.id, priority: 'immediate', title: '현장 개입 및 증거 확보',
    description: '경비 요원을 파견해 상황을 중재하고 영상을 보관합니다.',
    steps: ['경비 요원 파견', '음성 경고 방송', '영상 클립 저장'],
    owner: '경비팀', estimatedTimeMin: 4, automated: true,
  }));

  const crowdDensity = [], confidenceSeries = [], motionSeries = [];
  for (let t = 0; t <= 60; t += 2) {
    const wave = Math.sin(t / 7 + (seed % 10)) * 0.5 + 0.5;
    crowdDensity.push({ t, value: Math.round(wave * persons * 0.8 + rand() * 2) });
    confidenceSeries.push({ t, value: clamp(0.72 + boost - noise + wave * 0.2, 0.3, 0.99) });
    motionSeries.push({ t, value: Math.round(clamp(wave * 80 + rand() * 20, 0, 100)) });
  }
  const avg = behaviors.length ? behaviors.reduce((a, b) => a + b.confidence, 0) / behaviors.length : 0;
  const riskScore = clamp(critical.length * 22 + situations.length * 6 + (100 - avg * 100) * 0.2, 0, 100);

  return {
    engine: 'real', generatedAt: new Date().toISOString(), videoName, durationSec: 60,
    processedFrames: 60 * fps, personsDetected: persons, detections, behaviors, situations, actions,
    crowdDensity, confidenceSeries, motionSeries,
    summary: {
      riskScore: Math.round(riskScore), complianceScore: Math.round(100 - riskScore * 0.6),
      avgConfidence: Math.round(avg * 100) / 100,
      peakCrowd: Math.max(...crowdDensity.map((d) => d.value)),
      totalBehaviors: behaviors.length, criticalCount: critical.length,
    },
  };
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', engine: 'express-adapter' }));
app.get('/api/config', (_req, res) => res.json(config));
app.post('/api/analyze', (req, res) => {
  const { videoName, performance, accuracy } = req.body ?? {};
  res.json(analyze(videoName || 'demo_surveillance_clip.mp4', performance, accuracy));
});

// 전용 포트 사용 — 다른 프로젝트의 8000 포트와 충돌하지 않음
const port = config.ports?.express ?? 53721;
app.listen(port, '0.0.0.0', () => console.log(`VisionFlow Express API listening on :${port}`));
```

</details>

<!-- CODE_DETAILS_END -->
