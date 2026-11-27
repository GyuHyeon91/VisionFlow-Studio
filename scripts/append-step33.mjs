import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 33단계 — 모델 학습 파이프라인 (자동 라벨링 + 미세조정)

| 코드 | 작업 | 내용 |
|---|---|---|
| \`services/fastapi/app/trainer.py\` | **[신규]** | 감지 결과를 YOLO 라벨로 저장하는 데이터셋 수집, data.yaml 자동 생성, 백그라운드 스레드에서 YOLO 미세조정, 진행률/에포크 상태 관리, 완료 시 커스텀 모델을 감지기에 자동 적용 |
| \`services/fastapi/app/yolo_detector.py\` | **[수정]** | \`use_model()\`로 커스텀 모델 교체, \`active_model_info()\` 추가 |
| \`services/fastapi/app/main.py\` | **[추가]** | \`/api/dataset/capture\`, \`/api/train/start\`, \`/api/train/status\`, \`/api/model/use\` 엔드포인트 |
| \`apps/web-react/src/services/trainingApi.ts\` | **[신규]** | 학습/데이터 수집/모델 전환 API 클라이언트 |
| \`apps/web-react/src/components/panels/ModelTrainingPanel.tsx\` | **[신규]** | 학습 상태 진행률, 프레임 수집·자동 라벨링, 학습 옵션(모델/에포크/크기/배치), 모델 전환 UI |
| \`apps/web-react/src/store/useStore.ts\`, \`Sidebar.tsx\`, \`App.tsx\` | **[추가]** | \`training\` 탭 라우팅/메뉴 |

**검증 결과**
- 프론트 프로덕션 빌드 통과 (2391 모듈)
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step33 추가');
