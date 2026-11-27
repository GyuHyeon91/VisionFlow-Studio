import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 29단계 — 실시간 인식 오탐 수정 (배경 차분)

| 코드 | 작업 | 내용 |
|---|---|---|
| \`apps/web-react/src/analysis/liveTracker.ts\` | **[수정]** | 인접 프레임 차분 → 배경 차분(지수 평활 배경 모델)으로 변경. 정적 벽·건물은 배경으로 학습되어 제거되고 움직이는 차량·인물만 검출 |
| \`apps/web-react/src/components/panels/BehaviorPanel.tsx\` | **[수정]** | 실시간 추적 ON 시 저장된 추정 Box(P5 등) 폴백 제거. 오직 실시간 추적 Box(L1…)만 표시 |
| \`apps/web-react/src/components/panels/VideoPlaybackPanel.tsx\` | **[수정]** | 동일하게 실시간 모드에서 정적 Box 제거 |

**검증**: 움직이는 사각형 영상에서 \`LIVE 1 / L1 인물\` 정상 표시, 빌드 통과.
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step29 추가');
