/**
 * WORKLOG.md 에 "코드 상세" 섹션을 생성/갱신합니다.
 * 각 파일명을 클릭하면 <details> 안의 전체 소스 코드가 펼쳐집니다.
 * 실행: node scripts/generate-code-doc.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const files = [
  'package.json',
  'configs/app.config.json',
  'configs/app.config.schema.json',
  'scripts/check-ports.mjs',
  'scripts/generate-code-doc.mjs',
  'README.md',
  'docs/ISOLATION.md',
  'docs/PIPELINE_FLOW.md',
  'docs/DATA_CATALOG.md',
  'apps/web-react/package.json',
  'apps/web-react/vite.config.ts',
  'apps/web-react/tsconfig.json',
  'apps/web-react/index.html',
  'apps/web-react/src/main.tsx',
  'apps/web-react/src/App.tsx',
  'apps/web-react/src/types/index.ts',
  'apps/web-react/src/config/index.ts',
  'apps/web-react/src/data/mockData.ts',
  'apps/web-react/src/data/featureGuides.ts',
  'apps/web-react/src/engine/types.ts',
  'apps/web-react/src/engine/mockEngine.ts',
  'apps/web-react/src/engine/realEngine.ts',
  'apps/web-react/src/engine/hybridEngine.ts',
  'apps/web-react/src/engine/factory.ts',
  'apps/web-react/src/pipeline/catalog.ts',
  'apps/web-react/src/pipeline/graph.ts',
  'apps/web-react/src/pipeline/executor.ts',
  'apps/web-react/src/store/useStore.ts',
  'apps/web-react/src/services/trainingApi.ts',
  'apps/web-react/src/services/labelingApi.ts',
  'apps/web-react/src/analysis/remoteDetector.ts',
  'apps/web-react/src/analysis/browserVideoAnalyzer.ts',
  'apps/web-react/src/analysis/liveTracker.ts',
  'apps/web-react/src/analysis/motionCompensation.ts',
  'apps/web-react/src/hooks/useLiveTracking.ts',
  'apps/web-react/src/hooks/useLiveAccidents.ts',
  'apps/web-react/src/hooks/useAnalysisStream.ts',
  'apps/web-react/src/styles/global.css',
  'apps/web-react/src/components/visualizations/RadialGauge.tsx',
  'apps/web-react/src/components/visualizations/Sparkline.tsx',
  'apps/web-react/src/components/visualizations/MetricCard.tsx',
  'apps/web-react/src/components/visualizations/Heatmap.tsx',
  'apps/web-react/src/components/layout/Sidebar.tsx',
  'apps/web-react/src/components/layout/Topbar.tsx',
  'apps/web-react/src/components/layout/ToastHost.tsx',
  'apps/web-react/src/components/layout/FeatureGuideModal.tsx',
  'apps/web-react/src/components/pipeline/PipelineCanvas.tsx',
  'apps/web-react/src/components/pipeline/NodeInspector.tsx',
  'apps/web-react/src/components/panels/DataCard.tsx',
  'apps/web-react/src/components/panels/ClipLabelingPanel.tsx',
  'apps/web-react/src/components/panels/ModelTrainingPanel.tsx',
  'apps/web-react/src/components/panels/ObjectMeasurementPanel.tsx',
  'apps/web-react/src/components/panels/SituationVideoGuide.tsx',
  'apps/web-react/src/components/panels/StreamPredictionPanel.tsx',
  'apps/web-react/src/components/panels/VideoPlaybackPanel.tsx',
  'apps/web-react/src/components/panels/Dashboard.tsx',
  'apps/web-react/src/components/panels/AnalysisPanel.tsx',
  'apps/web-react/src/components/panels/BehaviorPanel.tsx',
  'apps/web-react/src/components/panels/ActionsPanel.tsx',
  'apps/web-react/src/components/panels/AccidentTimelinePanel.tsx',
  'apps/web-react/src/components/panels/VideoDescriptionPanel.tsx',
  'apps/web-react/src/components/panels/PerformancePanel.tsx',
  'apps/web-react/src/components/panels/SettingsPanel.tsx',
  'apps/web-react/src/components/panels/DataCatalogPanel.tsx',
  'apps/web-next/package.json',
  'apps/web-next/next.config.mjs',
  'apps/web-next/tsconfig.json',
  'apps/web-next/app/layout.tsx',
  'apps/web-next/app/page.tsx',
  'apps/web-next/app/globals.css',
  'apps/web-vue/package.json',
  'apps/web-vue/vite.config.ts',
  'apps/web-vue/index.html',
  'apps/web-vue/src/main.ts',
  'apps/web-vue/src/App.vue',
  'apps/web-vue/src/style.css',
  'services/fastapi/requirements.txt',
  'services/fastapi/app/__init__.py',
  'services/fastapi/app/analyzer.py',
  'services/fastapi/app/main.py',
  'services/fastapi/app/yolo_detector.py',
  'services/fastapi/app/onnx_detector.py',
  'services/fastapi/app/openvino_detector.py',
  'services/fastapi/app/resolution.py',
  'services/fastapi/app/preprocessing.py',
  'services/fastapi/app/safety.py',
  'services/fastapi/app/active_learning.py',
  'services/fastapi/app/synthesis.py',
  'services/fastapi/app/clip_store.py',
  'services/fastapi/app/dataset_manager.py',
  'services/fastapi/app/accident_analyzer.py',
  'apps/web-react/src/analysis/industrialSafety.ts',
  'apps/web-react/src/services/feedbackApi.ts',
  'services/fastapi/app/evaluation.py',
  'services/fastapi/app/feedback.py',
  'services/fastapi/app/behavior_dataset.py',
  'services/fastapi/app/accident_analyzer.py',
  'services/fastapi/app/external_datasets.py',
  'services/fastapi/app/data_catalog.py',
  'services/fastapi/app/auto_retrain.py',
  'services/fastapi/app/build_site_dataset.py',
  'services/fastapi/app/trainer.py',
  'services/fastapi/app/events.py',
  'services/fastapi/app/event_store.py',
  'services/fastapi/app/prediction.py',
  'services/fastapi/app/stream.py',
  'services/fastapi/app/broker.py',
  'services/fastapi/app/timeseries.py',
  'services/fastapi/app/measurement.py',
  'services/fastapi/app/behavior_recognizer.py',
  'services/fastapi/app/depth_estimator.py',
  'services/express/package.json',
  'services/express/src/index.js',
];

const langFor = (path) => {
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.ts')) return 'ts';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'javascript';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.html') || path.endsWith('.vue')) return 'html';
  if (path.endsWith('.py')) return 'python';
  return 'text';
};

const markerStart = '<!-- CODE_DETAILS_START -->';
const markerEnd = '<!-- CODE_DETAILS_END -->';

let lines = [
  markerStart,
  '',
  '## 코드 상세 (파일명 클릭 시 전체 코드 펼침)',
  '',
  '> 아래 파일명을 클릭하면 해당 파일의 **실제 전체 코드**가 표시됩니다.',
  '',
];

for (const file of files) {
  const full = resolve(root, file);
  let code;
  try {
    code = readFileSync(full, 'utf-8').replace(/\r\n/g, '\n').trimEnd();
  } catch {
    code = '(파일을 읽을 수 없습니다)';
  }
  const fence = '```';
  lines.push('<details>');
  lines.push(`<summary><code>${file}</code></summary>`);
  lines.push('');
  lines.push(`${fence}${langFor(file)}`);
  lines.push(code);
  lines.push(fence);
  lines.push('');
  lines.push('</details>');
  lines.push('');
}
lines.push(markerEnd);

const worklogPath = resolve(root, 'docs/WORKLOG.md');
const summaryPath = resolve(root, 'docs/WORKLOG_SUMMARY.md');
// 요약 원본을 항상 새로 읽어 코드 상세를 덧붙인다 (중복 방지)
let existing = readFileSync(summaryPath, 'utf-8').trimEnd();
writeFileSync(worklogPath, existing + '\n\n' + lines.join('\n') + '\n', 'utf-8');
console.log(`CODE_DETAILS 갱신 완료: ${files.length}개 파일`);
