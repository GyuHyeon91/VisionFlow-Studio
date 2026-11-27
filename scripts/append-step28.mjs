import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const d = dirname(fileURLToPath(import.meta.url));
const p = resolve(d, '../docs/WORKLOG_SUMMARY.md');
const step = `

## 28단계 — 실시간 사고 감지 강화 + 추적 Box 정밀화

| 코드 | 작업 | 내용 |
|---|---|---|
| \`apps/web-react/src/types/index.ts\` | **[추가]** | \`LiveAccident\` 타입(유형·심각도·근거·시각) 추가 |
| \`apps/web-react/src/hooks/useLiveAccidents.ts\` | **[신규]** | 트랙 속도 변화로 급정지/낙상, 트랙 간 근접으로 충돌/다툼, 급이동, 낙하, 인파 밀집을 실시간 감지 |
| \`apps/web-react/src/components/panels/AccidentTimelinePanel.tsx\` | **[수정]** | "실시간 사고 감지 ON/OFF" 패널 추가. 영상 재생 + 추적 Box + 감지 사고 근거 출력 |
| \`apps/web-react/src/analysis/browserVideoAnalyzer.ts\` | **[수정]** | \`prepareBlobs()\`(다수결 노이즈 제거, 전체 화면 변화 제외, 크기 제한) 추가. 오프라인 분석에 적용 |
| \`apps/web-react/src/analysis/liveTracker.ts\` | **[수정]** | 최소 영역 55px↑, 최대 5트랙/5Box 제한, 트랙별 최적 Box 유지, 실시간 경로는 과도한 필터 제거로 재생성 정상화 |
| \`apps/web-react/src/components/panels/BehaviorPanel.tsx\`, \`VideoPlaybackPanel.tsx\` | **[수정]** | BBox에 인물/차량/객체 라벨 표시 |

**검증 결과**
- 실시간 추적 정상: \`LIVE 1\`, 라벨 \`L1 인물 62%\`
- 빌드 통과, 콘솔 오류 0건
`;
writeFileSync(p, readFileSync(p, 'utf-8').trimEnd() + step + '\n', 'utf-8');
console.log('step28 추가');
