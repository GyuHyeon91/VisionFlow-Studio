import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 45단계 — 실시간 경로 3대 병목 제거

| 코드 | 작업 | 내용 |
|---|---|---|
| \`main.py\` | **[수정]** | \`/api/measure-frame\` 추론 입력 320 → **640** (작은 객체 감지) |
| \`configs/app.config.json\` | **[수정]** | 신뢰도 임계값 0.5 → **0.45** |
| \`useLiveTracking.ts\` | **[수정]** | 정적 \`appConfig\` 참조 제거 → **스토어 설정값** 사용, \`threshold\` 인자 추가 |
| \`remoteDetector.ts\` | **[수정]** | classFilter·nmsIoU를 생성자 인자로 받아 UI 변경 즉시 반영 |
| \`BehaviorPanel.tsx\`, \`VideoPlaybackPanel.tsx\`, \`AccidentTimelinePanel.tsx\` | **[수정]** | 하드코딩 0.7 제거, 설정의 confidenceThreshold 전달 |
| \`BehaviorPanel.tsx\`, \`VideoPlaybackPanel.tsx\` | **[수정]** | 클래스 정보 없는 목업/무작위 Box 완전 제거 |

**검증 결과**
- 신뢰도 0.45 + 640 입력에서 샘플 5개 객체 감지
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step45 추가');
