import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 42단계 — 파이프라인 잔여 항목 완성

| 코드 | 작업 | 내용 |
|---|---|---|
| \`broker.py\` | **[신규]** | Redis Streams 우선, 실패 시 로컬 JSONL 폴백 이벤트 브로커 |
| \`timeseries.py\` | **[신규]** | SQLite 기반 지표 시계열 저장 (탐지 수/위험/지연) |
| \`clip_store.py\` | **[신규]** | 위험 감지 시점 전후 프레임 링버퍼 → AVI 클립 저장 |
| \`prediction.py\` | **[수정]** | 예측 경로 간 충돌 가능성(8% 이내 접근) 추가 |
| \`main.py\` | **[추가]** | \`/api/metrics\`, \`/api/clips\`, \`/api/broker/recent\`, \`/api/runtime\` 확장, 분석 시 브로커·시계열·클립 저장 |
| \`configs/app.config.json\` | **[추가]** | \`broker\`, \`streaming.webrtcUrl\` |
| \`StreamPredictionPanel.tsx\` | **[수정]** | 브로커 상태·저장 클립·WebRTC 링크 표시 |
| \`SettingsPanel.tsx\` | **[추가]** | 브로커 선택/URL, WebRTC 주소 UI |

**검증 결과**
- \`/api/metrics\`, \`/api/clips\`, \`/api/broker/recent\` 200 OK
- 분석 요청 3회 후 시계열 3건·브로커 이벤트 저장 확인
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step42 추가');
