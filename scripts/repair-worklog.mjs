/** WORKLOG.md 손상 복구: 1~23단계 요약만 남기고 24단계를追加한 뒤 코드 상세는 생성기에 맡긴다. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = resolve(__dirname, '../docs/WORKLOG.md');
let text = readFileSync(path, 'utf-8');

const breakIdx = text.indexOf("\n';\n");
if (breakIdx !== -1) text = text.slice(0, breakIdx);
// 혹시 남아있는 코드 상세 마커 제거
text = text.replace(/<!-- CODE_DETAILS_START -->[\s\S]*<!-- CODE_DETAILS_END -->/g, '').trimEnd();

const step24 = `

## 24단계 — 파이프라인 확장 + 분석 데이터 보강

| 코드 | 작업 | 내용 |
|---|---|---|
| \`configs/app.config.json\` | **[수정]** | 파이프라인 노드 7개 → 12개로 확장(신호 추출/형상 추적/사고 인식/텍스트 설명/성능 평가 추가), 엣지 6개 → 13개로 재구성 |
| \`apps/web-react/src/pipeline/graph.ts\` | **[수정]** | 노드 간격 78px로 조정해 12개 노드가 캔버스(560px) 안에 배치되도록 변경 |
| \`apps/web-react/src/pipeline/executor.ts\` | **[수정]** | 신규 5개 노드의 출력 요약 메시지 추가 |
| \`apps/web-react/src/components/pipeline/PipelineCanvas.tsx\` | **[수정]** | 캔버스 논리 높이 420 → 560, 클램프 범위 조정 |
| \`apps/web-react/src/styles/global.css\` | **[수정]** | 캔버스 뷰포트 480px / 내부 560px |
| \`apps/web-react/src/types/index.ts\` | **[추가]** | \`AnalysisLogEntry\` 타입과 \`AnalysisResult.analysisLog\` 필드 |
| \`apps/web-react/src/data/mockData.ts\` | **[추가]** | 12개 노드별 상세 로그 생성, 성능평가 템플릿 7개 → 12개 기능으로 확장 |
| \`apps/web-react/src/components/panels/AnalysisPanel.tsx\` | **[추가]** | "파이프라인 분석 상세 로그" DataCard 추가 |

**검증 결과**
- 파이프라인: 12개 노드 / 13개 연결 정상 표시
- 분석 로그: 12개 항목이 시간순(0.0~55.0s) 출력, 콘솔 오류 0건
- 빌드 통과
`;

writeFileSync(path, text.trimEnd() + step24 + '\n', 'utf-8');
console.log('WORKLOG 요약 복구 완료');
