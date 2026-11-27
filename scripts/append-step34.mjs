import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 34단계 — 다양한 사물 학습 지원 (클래스/데이터/증강 확장)

| 코드 | 작업 | 내용 |
|---|---|---|
| \`services/fastapi/app/trainer.py\` | **[수정]** | 사용자 정의 클래스 목록(classes.txt) 기반 data.yaml 생성, 라벨 매핑을 사용자 클래스로 확장, 외부 데이터셋 ZIP 가져오기(\`import_zip\`), 학습 시 증강 옵션(fliplr/flipud/mosaic/mixup/hsv/degrees/scale) 적용 |
| \`services/fastapi/app/main.py\` | **[추가]** | \`/api/dataset/create\`, \`/api/dataset/upload\`, 학습 요청에 augmentation 필드 |
| \`apps/web-react/src/services/trainingApi.ts\` | **[수정]** | 데이터셋 생성/업로드/증강 타입 및 API |
| \`apps/web-react/src/components/panels/ModelTrainingPanel.tsx\` | **[수정]** | 클래스 정의 textarea, ZIP 업로드, 다중 시점 일괄 수집 슬라이더, 증강 옵션 UI |

**검증 결과**
- 사용자 정의 5클래스 데이터셋 생성 성공
- 샘플 이미지에서 4건 라벨 자동 저장 성공
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step34 추가');
