import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 30단계 — YOLO 실제 객체 인식(실시간 + 영상 분석) 구현

| 코드 | 작업 | 내용 |
|---|---|---|
| \`services/fastapi/requirements.txt\` | **[수정]** | \`ultralytics\` 추가 |
| \`services/fastapi/app/yolo_detector.py\` | **[신규]** | yolov8n 모델 지연 로드(서비스 내부 \`.models/\`), \`detect_image\`, \`detect_frame_bytes\`, \`analyze_video_bytes\`(샘플 프레임 감지 + 최근접 트랙 매칭) |
| \`services/fastapi/app/main.py\` | **[수정]** | \`/api/detect-frame\`(실시간 1프레임), \`/api/analyze-video\`(영상 업로드 분석) 엔드포인트, health에 모델 정보 추가 |
| \`apps/web-react/src/analysis/remoteDetector.ts\` | **[신규]** | 재생 중 프레임을 JPEG로 캡처해 YOLO API로 전송, 응답을 LiveBox로 변환하고 트랙 ID 유지 |
| \`apps/web-react/src/hooks/useLiveTracking.ts\` | **[수정]** | 엔진/백엔드 옵션에 따라 원격 YOLO 감지 사용, 실패 시 로컬 프레임 차분으로 폴백 |
| \`apps/web-react/src/engine/realEngine.ts\` | **[수정]** | 업로드 영상을 \`/api/analyze-video\`로 전송 |
| \`apps/web-react/src/engine/hybridEngine.ts\` | **[수정]** | 백엔드 부분 응답의 누락 필드를 목업으로 보완해 병합 안정화 |
| \`apps/web-react/src/App.tsx\`, \`styles/global.css\` | **[수정]** | 탭 전환 AnimatePresence 제거(CSS 애니메이션으로 대체, 콘텐츠 고정 문제 해소) |
| \`configs/app.config.json\` | **[수정]** | 기본 엔진 \`hybrid\`, 백엔드 \`fastapi\`로 변경 |
| \`package.json\`, \`.gitignore\` | **[수정]** | venv 백엔드 실행 스크립트, \`.venv\`/\`.models\` 제외 |

**검증 결과**
- YOLO 모델(yolov8n 6.2MB) 서비스 내부 경로에 다운로드 완료
- 실제 샘플 이미지에서 버스 1대 + 인물 3명 감지 (신뢰도 0.81~0.87)
- \`/api/detect-frame\` 다수 호출 200 OK, 프론트 엔진 라벨 \`hybrid\` 확인
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step30 추가');
