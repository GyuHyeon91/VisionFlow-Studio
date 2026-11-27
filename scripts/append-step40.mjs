import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 40단계 — 엔드투엔드 실시간 파이프라인 완성

| 코드 | 작업 | 내용 |
|---|---|---|
| \`services/fastapi/app/events.py\` | **[신규]** | WebSocket 이벤트 버스, 최신 이벤트 캐시, 스레드 안전 발행 |
| \`main.py\` | **[추가]** | \`/ws/analysis\`, \`/api/events\`, \`/api/stream/start|stop|status\`, \`/api/runtime\`, 분석 결과에 예측 포함 |
| \`prediction.py\` | **[신규]** | 칼만 필터 2D 이동 예측 + ROI 폴리곤 교차 위험 판단 |
| \`event_store.py\` | **[신규]** | JSONL 이벤트 로그 저장/조회 |
| \`stream.py\` | **[신규]** | OpenCV 기반 RTSP 수신·샘플링·분석 워커, 위험 시 클립 저장 |
| \`openvino_detector.py\` | **[신규]** | OpenVINO 런타임 추론 (Intel CPU 최적화) |
| \`configs/app.config.json\` | **[추가]** | prediction/streaming/storage 옵션, runtime openvino 추가 |
| \`useAnalysisStream.ts\` | **[신규]** | WebSocket 실시간 이벤트 수신 훅 |
| \`StreamPredictionPanel.tsx\` | **[신규]** | 스트림 제어 + 예측 궤적/위험목록 UI |
| \`SettingsPanel.tsx\` | **[추가]** | 예측/스트림/저장/OpenVINO 옵션 UI |
| \`services/mediamtx/mediamtx.yml\` | **[신규]** | RTSP→WebRTC/LL-HLS 무료 미디어 서버 설정 예시 |

**검증 결과**
- WebSocket init/event 수신 확인, 예측 3건 + ROI 위험 판정 정상
- API: \`/api/runtime\`, \`/api/events\`, \`/api/stream/status\` 200 OK
- OpenVINO 추론 중앙값 23ms (ONNX 20ms와 유사, Intel CPU 최적화 경로)
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step40 추가');
