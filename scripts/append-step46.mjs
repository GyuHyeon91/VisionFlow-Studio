import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 46단계 — 건설현장 추락/다툼 오인식 방지

| 코드 | 작업 | 내용 |
|---|---|---|
| \`configs/app.config.json\` | **[추가]** | \`safety\`(fallRiskZones, disappearanceSec, stillSec, gatherCount) |
| \`safety.py\` | **[신규]** | 객체 소실 감지, 수직 하강+정지 지속, 다중 작업자 접근, 위험구역 우선 판단, 다툼은 구역 밖 상호작용만 인정, 룰 기반 문맥 설명(VLM 대체) |
| \`main.py\` | **[추가]** | 분석 응답에 \`safetyEvents\`, \`contextDescription\`, WebSocket/브로커 발행 |
| \`useAnalysisStream.ts\` | **[수정]** | SafetyEvent/contextDescription 타입 |
| \`StreamPredictionPanel.tsx\` | **[추가]** | "현장 안전 판별 · 상황 추론" 카드 |

**검증 결과**
- \`/api/measure-frame\` 200 OK, safetyEvents/contextDescription 포함 확인
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step46 추가');
