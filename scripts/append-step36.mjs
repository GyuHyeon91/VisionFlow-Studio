import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 36단계 — 상황별 조치 영상 안내 + 행동 인식 강화

| 코드 | 작업 | 내용 |
|---|---|---|
| \`apps/web-react/src/components/panels/SituationVideoGuide.tsx\` | **[신규]** | 상황 발생 시점 영상 재생, 조치 절차 단계 표시, 구간 재생, 상황 간 이동 마커 |
| \`apps/web-react/src/components/panels/ActionsPanel.tsx\` | **[수정]** | 상황 카드에 "영상 안내" 버튼, 안내 패널 연결 |
| \`services/fastapi/app/behavior_recognizer.py\` | **[신규]** | YOLO Pose 키포인트 + 시계열 휴리스틱으로 낙상/앉기/걷기/달리기/손짓/체류 분류 |
| \`services/fastapi/app/main.py\` | **[추가]** | \`/api/behavior/frame\` |
| \`apps/web-react/src/services/behaviorApi.ts\` | **[신규]** | 실시간 행동 인식 API 클라이언트 |
| \`apps/web-react/src/components/panels/BehaviorPanel.tsx\` | **[수정]** | 실시간 추적 ON 시 포즈 기반 행동을 목록에 반영 |

## 37단계 — 사전학습 모델/추적기/광학 흐름 옵션

| 코드 | 작업 | 내용 |
|---|---|---|
| \`configs/app.config.json\` | **[추가]** | \`detection\` 옵션(모델: yolov8n/s, yolov11n, rtdetr-l / 추적기: nearest, bytetrack, botsort / 광학 흐름 ON/OFF) |
| \`services/fastapi/app/yolo_detector.py\` | **[수정]** | 모델 선택 적용, ByteTrack/BoT-SORT 추적, 광학 흐름(Farneback) 분석 함수 |
| \`services/fastapi/app/main.py\` | **[수정]** | 설정 기반 모델/추적기 초기화, 광학 흐름 모드 분기 |
| \`apps/web-react/src/components/panels/SettingsPanel.tsx\` | **[추가]** | 탐지 모델·추적·광학 흐름 옵션 UI |
| \`apps/web-react/src/store/useStore.ts\` | **[수정]** | \`setDetection\`, 캐시 키에 detection 옵션 포함 |

**검증 결과**
- \`/api/behavior/frame\` 200 OK (샘플 이미지에서 4명 self-standing 분류)
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step36-37 추가');
