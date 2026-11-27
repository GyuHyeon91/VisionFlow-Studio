import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 38단계 — 전체 클래스 추적 + 오탐 방지 강화

| 코드 | 작업 | 내용 |
|---|---|---|
| \`configs/app.config.json\` | **[추가]** | \`detection.classFilter\`(all/person_vehicle), COCO 80클래스 전체 추적 기본 |
| \`analysis/remoteDetector.ts\` | **[수정]** | 전체 모드 신뢰도 0.7 이상, 2프레임 지속성, NMS 0.25, 크기 1~60%, 지연 기반 매칭 창 동적 확장, 지연 측정 |
| \`yolo_detector.py\` | **[수정]** | COCO 80클래스 한글 라벨 전체 보강 |
| \`VideoPlaybackPanel.tsx\`, \`BehaviorPanel.tsx\` | **[수정]** | \`pose\` 필드 기준 오탐 필터, 실시간 모드 저장 Box 폴백 제거 |

## 39단계 — ONNX 고속 추론 + localhost 지연 제거

| 코드 | 작업 | 내용 |
|---|---|---|
| \`requirements.txt\` | **[추가]** | onnx, onnxruntime |
| \`services/fastapi/app/onnx_detector.py\` | **[신규]** | YOLO ONNX 자동 export, ONNX Runtime 추론(letterbox→decode→NMS), GPU(CUDA) 자동 선택 |
| \`yolo_detector.py\` | **[수정]** | \`runtime\` 옵션(onnx/pytorch), ONNX 경로 우선 + 실패 시 PyTorch 폴백 |
| \`trainer.py\` | **[수정]** | 학습 완료 시 커스텀 모델도 ONNX 자동 export |
| \`configs/app.config.json\` | **[추가]** | \`detection.runtime\`(기본 onnx) |
| \`SettingsPanel.tsx\` | **[추가]** | 추론 엔진 선택 UI |
| \`config/index.ts\` | **[수정]** | 백엔드 주소 \`localhost\` → \`127.0.0.1\` (IPv6 해석 2초 지연 제거) |
| \`main.py\` | **[추가]** | 응답에 단계별 timingsMs 포함 |

**검증 결과 (127.0.0.1 기준)**
- ONNX 추론: 12~22ms/프레임
- 전체 API(depth OFF): 평균 **20ms** (기존 약 2056ms → 100배 개선)
- depth ON: 중앙값 102ms (최초 모델 로드 시 4.5초)
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step38-39 추가');
