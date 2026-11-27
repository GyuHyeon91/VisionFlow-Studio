import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 41단계 — 오탐 방지 (전처리 · 추론 · 후처리)

| 코드 | 작업 | 내용 |
|---|---|---|
| \`configs/app.config.json\` | **[수정]** | \`accuracy.confidenceThreshold\` 0.75 → **0.85**, \`preprocessing\`(nmsIoU 0.45, gamma 1.0, excludeZones 상단 12%/하단 12%) 추가 |
| \`preprocessing.py\` | **[신규]** | ROI 제외 영역 마스킹 + 감마 보정, NMS IoU 설정 적용 |
| \`yolo_detector.py\` | **[수정]** | 추론 전 전처리 적용, ONNX/OpenVINO/PyTorch 모두 NMS IoU 설정 반영 |
| \`onnx_detector.py\`, \`openvino_detector.py\` | **[수정]** | \`nms\` 파라미터 추가 |
| \`remoteDetector.ts\` | **[수정]** | 프론트 NMS도 설정값 사용 |
| \`SettingsPanel.tsx\` | **[추가]** | 전처리·오탐 방지 옵션 UI |
| \`ModelTrainingPanel.tsx\` | **[수정]** | 네거티브 샘플(유리 반사·도로 바닥) 안내 |

**검증 결과**
- 신뢰도 0.85 적용 시 샘플에서 버스 0.876 / 사람 0.858 등 확실한 객체만 출력 ( 저신뢰 오탐 제거 )
- NMS IoU 0.45 적용, 상/하단 ROI 마스킹으로 대시보드 반사·하늘 영역 제외
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step41 추가');
