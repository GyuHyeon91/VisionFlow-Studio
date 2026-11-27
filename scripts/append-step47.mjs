import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 47단계 — 하드 네거티브 / 액티브 러닝 / 합성 데이터

| 코드 | 작업 | 내용 |
|---|---|---|
| \`configs/app.config.json\` | **[추가]** | \`training\`(activeLearning, ambiguousMin/Max, clipWindowSec, syntheticCopies) |
| \`active_learning.py\` | **[신규]** | 모호 신뢰도 구간·안전 후보 프레임을 라벨 없는 하드 네거티브로 자동 저장, JSONL 로그 |
| \`synthesis.py\` | **[신규]** | 증강(좌우반전·감마·회전) 기반 의사 합성 데이터 생성, 반전 시 BBox 좌표 보정 |
| \`main.py\` | **[추가]** | 분석 시 하드 네거티브 자동 수집, \`/api/active-learning\`, \`/api/dataset/synthesize\` |
| \`ModelTrainingPanel.tsx\` | **[수정]** | 네거티브 수량 표시, 합성 데이터 생성 버튼 |
| \`SettingsPanel.tsx\` | **[추가]** | 액티브 러닝/모호 구간/클립 윈도우 옵션 |

**검증 결과**
- \`/api/dataset/create\`, \`/api/active-learning\`, \`/api/dataset/synthesize\` 200 OK
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step47 추가');
