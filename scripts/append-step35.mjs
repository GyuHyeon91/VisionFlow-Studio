import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 35단계 — 노드 실행 시간 표시 개선

| 코드 | 작업 | 내용 |
|---|---|---|
| \`apps/web-react/src/types/index.ts\` | **[추가]** | \`AnalysisResult.engineTimings\` (엔진이 측정한 노드별 시간) |
| \`apps/web-react/src/engine/mockEngine.ts\` | **[추가]** | 영상 신호 분석·단계별 작업·리포트 생성 시간을 \`performance.now()\`로 측정 |
| \`apps/web-react/src/engine/hybridEngine.ts\` | **[수정]** | 백엔드 부분 응답에 타이밍이 없으면 로컬 측정값 유지 |
| \`apps/web-react/src/store/useStore.ts\` | **[수정]** | 분석 완료 시 \`engineTimings\`로 그래프 노드 \`durationMs\` 덮어쓰기 |
| \`apps/web-react/src/components/panels/PerformancePanel.tsx\` | **[수정]** | 노드 실행 시간 카드 설명 갱신, 전체 12개 노드 표시 |
| \`apps/web-react/src/styles/global.css\` | **[추가]** | \`.perf-node-list\` (max-height 해제, 스크롤 제거) |

**검증 결과**
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step35 추가');
