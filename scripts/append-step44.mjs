import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 44단계 — 임계값·모델·하드코딩 수정

| 코드 | 작업 | 내용 |
|---|---|---|
| \`configs/app.config.json\` | **[수정]** | \`accuracy.confidenceThreshold\` 0.85 → **0.5**, \`detection.model\` yolov8n → **yolov8s.pt**, classFilter=all 유지 |
| \`remoteDetector.ts\` | **[수정]** | 전체 클래스임에도 \`Math.max(threshold, 0.7)\` 로 최저 신뢰도를 강제하던 하드코딩 제거 → 중앙 설정값 그대로 사용 |
| \`BehaviorPanel.tsx\`, \`VideoPlaybackPanel.tsx\` | **[수정]** | \`useLiveTracking(..., 0.7)\` 하드코딩 제거 → \`config.accuracy.personDetectionSensitivity\` 참조 |
| \`yolo_detector.py\` | **[추가]** | \`set_pretrained_model()\`, \`set_runtime()\` — 모델/런타임 런타임 교체 |
| \`main.py\` | **[추가]** | \`POST /api/model/set\` (재시작 없이 모델/런타임 변경) |
| \`useStore.ts\` | **[수정]** | 모델/런타임 옵션 변경 시 백엔드에 즉시 반영 |

**검증 결과**
- 신뢰도 0.5 + yolov8s 적용 시 샘플에서 4개 클래스 감지 (버스/사람 등)
- 단일 요청 약 1초 (최초 모델 로드 포함), 이후 더 빠름
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step44 추가');
