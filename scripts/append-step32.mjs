import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 32단계 — 사물 측정 3종 구현 (상대 크기 / 기준물 보정 / 깊이 추정)

| 코드 | 작업 | 내용 |
|---|---|---|
| \`configs/app.config.json\` | **[추가]** | \`measurement\` 옵션(relativeSize, referenceObject, knownWidthCm, fieldOfViewDeg, depthEstimation) |
| \`services/fastapi/app/depth_estimator.py\` | **[신규]** | MiDaS_small 모델을 프로젝트 내부 \`.models/torch\`에 로드, 상대 역깊이(disparity) 추출. timm 의존성 및 신뢰 저장소 처리 |
| \`services/fastapi/app/measurement.py\` | **[신규]** | BBox 상대 크기(%, px, 면적, 종횡비) + 기준물 폭/화각 기반 거리·실측 치수 계산 + 깊이 스케일 보정 |
| \`services/fastapi/app/main.py\` | **[추가]** | \`POST /api/measure-frame\` 엔드포인트 |
| \`apps/web-react/src/types/index.ts\` | **[추가]** | \`ObjectMeasurement\`, \`AppConfig.measurement\` 타입 |
| \`apps/web-react/src/analysis/remoteDetector.ts\` | **[수정]** | \`/api/measure-frame\` 호출, 측정값 콜백, NMS 및 흔들림 보정 적용 |
| \`apps/web-react/src/store/useStore.ts\` | **[추가]** | \`measurements\` 상태 및 \`setMeasurements\`, 캐시 키에 measurement 옵션 포함 |
| \`apps/web-react/src/components/panels/ObjectMeasurementPanel.tsx\` | **[신규]** | 측정 요약 + 객체별 상세 테이블(설명+숨김 토글) |
| \`apps/web-react/src/components/panels/SettingsPanel.tsx\` | **[추가]** | 사물 측정 옵션 UI |
| \`apps/web-react/src/App.tsx\`, \`Sidebar.tsx\` | **[추가]** | "사물 측정" 탭 라우팅/메뉴 |

**검증 결과**
- 기준물만: 버스 180cm 기준 → 거리 1.61m, 인물 키 105~116cm 근사 출력
- 깊이 모델 ON: \`depthUsed=true\`, 인물 거리 1.74~2.11m, 키 120~151cm, 방식 \`reference+depth\` 출력
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step32 추가');
