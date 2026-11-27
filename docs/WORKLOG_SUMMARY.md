# VisionFlow Studio — 단계별 코드 작업 기록 (1~102단계)

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

## 101단계 — 실제 데이터 화면자료·시연영상 / 행동 데이터 정규화

| 코드 | 작업 | 내용 |
|---|---|---|
| `realEngine.ts` | **[수정]** | 서버 behaviors(프레임 샘플 `{t, trackId, labelKo}`)를 UI `BehaviorEvent`로 정규화. `timestamp` 누락으로 인한 `toFixed` 렌더 오류 해결, `summary.totalBehaviors`를 고유 이벤트 수로 보정 |
| `docs/웹_시연영상.mp4` | **[추가]** | 실제 업로드 영상 분석 결과가 표시된 화면으로 구성한 36초 시연영상 (12장면, 한국어 자막·안내 팝업 포함) |
| 외부 제출자료 | **[추가]** | `01_결과보고서_발표자료/실제데이터_화면자료/` 8개 화면 이미지 + 설명 문서 |

**검증**: 실제 영상(`upload_1795069361166.mp4`) UI 업로드 → 분석 완료, 위험점수 0·행동 3건·BBox 버스 77%/사람 65%·캡션 3개·평균 지연 42ms 출력. Behaviors 정규화 후 인물 행동 감지 탭 렌더 오류 해소

## 102단계 — 전체 화면 캡처·AI 안내 음성 시연영상

| 코드 | 작업 | 내용 |
|---|---|---|
| 외부 제출자료 | **[수정]** | 기능별 화면을 `fullPage`(1197×967)로 재캡처 — 사이드바·데이터 카탈로그 잘림 제거, 10개 이미지로 확장 |
| 시연영상 | **[수정]** | 1000×808 가로형 36초 영상으로 재구성. 표지·10개 기능 화면·종료 장면에 한국어 자막 |
| 안내 음성 | **[추가]** | Windows SAPI `Microsoft Heami Desktop`(ko-KR)로 장면별 나레이션 WAV 생성 → 3초 단위 패딩·병합 → AAC 오디오로 mux |

**검증**: 최종 MP4 36.00초, Video 1000×808@24fps, Audio AAC 22050Hz mono, 14.2MB. 브라우저 미리보기 재생 확인

