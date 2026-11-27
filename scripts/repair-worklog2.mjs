/** WORKLOG 요약 원본 복구: 손상 지점 이전까지 유지 + 27단계追加 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, '../docs/WORKLOG.md');
const dst = resolve(__dirname, '../docs/WORKLOG_SUMMARY.md');
let text = readFileSync(src, 'utf-8');
const cut = text.indexOf("\n';\n");
if (cut !== -1) text = text.slice(0, cut);

const step27 = `

## 27단계 — 재생 중 실시간 추적 + 객체 종류 라벨

| 코드 | 작업 | 내용 |
|---|---|---|
| \`apps/web-react/src/analysis/browserVideoAnalyzer.ts\` | **[수정]** | \`findBlobs\`/\`BlobRegion\` export, \`classifyRegion()\` 추가(종횡비·면적으로 인물/차량/객체 분류), 트랙에 \`kind\` 저장 |
| \`apps/web-react/src/analysis/liveTracker.ts\` | **[신규]** | 재생 중 \`requestVideoFrameCallback\`으로 프레임을 직접 읽어 실시간 추적하는 \`LiveTracker\`. 트랙별 최적 Box 1개만 유지 |
| \`apps/web-react/src/hooks/useLiveTracking.ts\` | **[신규]** | 영상 요소에 LiveTracker를 연결하는 훅 |
| \`apps/web-react/src/components/panels/BehaviorPanel.tsx\` | **[수정]** | "실시간 추적 ON/OFF" 버튼, 실시간 Box 우선 표시, BBox 라벨에 인물/차량/객체 표기 |
| \`apps/web-react/src/components/panels/VideoPlaybackPanel.tsx\` | **[수정]** | 동일한 실시간 추적 토글 및 종류 라벨 적용 |
| \`apps/web-react/src/types/index.ts\` | **[추가]** | \`TrackedShape.kind\` 필드 |

> 한계: 움직임 영역 + 모양 휴리스틱 기반이므로 정밀한 차량/인물 판별은 실제 객체 인식 모델(YOLO 등)이 필요합니다.
`;

writeFileSync(dst, text.trimEnd() + step27 + '\n', 'utf-8');
console.log('WORKLOG_SUMMARY 생성 완료');
