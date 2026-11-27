import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 43단계 — 다양한 해상도 대응 (다중 스케일 / 타일 추론)

| 코드 | 작업 | 내용 |
|---|---|---|
| \`configs/app.config.json\` | **[추가]** | \`detection.resolutionMode\`(single/multiscale/tiled), \`detection.scales\`(320/640) |
| \`resolution.py\` | **[신규]** | 다중 스케일 앙상블, 2×2 타일 분할 추론, 결과 NMS 퓨전 |
| \`onnx_detector.py\` | **[수정]** | 입력 크기별 ONNX 파일(\`<model>_<size>.onnx\`) 자동 export/복사 |
| \`yolo_detector.py\` | **[수정]** | 추론 시 resolution 모듈 경로 사용 |
| \`main.py\` | **[추가]** | resolution.configure |
| \`SettingsPanel.tsx\` | **[추가]** | 해상도 대응 옵션 UI |
| \`remoteDetector.ts\`, \`behaviorApi.ts\`, \`trainingApi.ts\` | **[수정]** | 프레임 캡처 256×144/320×180 → **640×360** (작은 객체 정보 유지) |

**검증 결과**
- 320/640 ONNX 모델 생성 완료
- 다중 스케일 적용 시 신뢰도 0.85에서 버스 1 + 사람 3 검출 (단일 스케일 2건 → 4건)
- 다중 스케일 추론 약 590ms/프레임, 단일 약 20ms/프레임
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step43 추가');
