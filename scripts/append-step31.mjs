import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 31단계 — 분석/출력 성능 최적화

| 코드 | 작업 | 내용 |
|---|---|---|
| \`services/fastapi/app/yolo_detector.py\` | **[수정]** | 영상 전체 분석을 순차 디코딩 → 시점 seek 방식으로 변경. 필요한 샘플 프레임만 디코딩 (processedFrames도 샘플 수로 정확히 기록) |
| \`apps/web-react/src/store/useStore.ts\` | **[수정]** | 영상 이름+크기+수정시각+옵션을 키로 하는 분석 결과 캐시 추가. 동일 조건 재업로드 시 파이프라인/엔진 재실행 없이 즉시 결과 재사용. 영상 메타(size/lastModified) 저장 |
| \`apps/web-react/src/components/layout/Topbar.tsx\` | **[수정]** | 업로드 시 파일 크기·수정시각을 스토어에 전달 |
| \`apps/web-react/src/analysis/remoteDetector.ts\` | **[수정]** | 프레임 320×180 → 256×144, JPEG 품질 0.6 → 0.45, 일시정지/탭 숨김 시 전송 중단 |
| \`apps/web-react/src/hooks/useLiveTracking.ts\` | **[수정]** | 실시간 전송 간격을 성능 옵션 FPS에 연동(80~400ms) |
| \`apps/web-react/src/analysis/liveTracker.ts\` | **[수정]** | 탭 숨김 시 로컬 추적 중단 |

**검증 결과**
- \`/api/analyze-video\` 200 OK (5초 영상 → 25 샘플 프레임 분석)
- 프론트 빌드 통과
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step31 추가');
