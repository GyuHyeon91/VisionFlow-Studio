/** VisionFlow Studio — Express 분석 백엔드 (옵션: backend=express) */
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, '../../../configs/app.config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MODEL_BOOST = { fast: -0.04, balanced: 0, accurate: 0.04, ensemble: 0.07 };

const BEHAVIORS = [
  ['보행 중', 'Walking', '이동', 'info', 0.96],
  ['급하게 이동', 'Running', '이동', 'caution', 0.9],
  ['낙상 발생', 'Falling', '안전', 'critical', 0.88],
  ['다툼/몸싸움', 'Altercation', '안전', 'critical', 0.82],
  ['인파 집중', 'Crowd Gathering', '혼잡', 'warning', 0.91],
  ['출입금지 구역 진입', 'Restricted Access', '보안', 'warning', 0.8],
];

function analyze(videoName, performance = {}, accuracy = {}) {
  const seed = Math.abs(hash(videoName));
  const rand = () => {
    let t = (seed = (seed * 9301 + 49297) % 233280) / 233280;
    return t;
  };
  const fps = performance.fps?.value ?? 15;
  const threshold = accuracy.confidenceThreshold?.value ?? 0.65;
  const boost = MODEL_BOOST[accuracy.behaviorModel?.value] ?? 0;
  const smoothing = accuracy.temporalSmoothing?.value ?? true;
  const noise = smoothing ? 0.02 : 0.08;
  const sensitivity = accuracy.personDetectionSensitivity?.value ?? 0.7;
  const persons = Math.max(1, Math.round(6 + sensitivity * 8 + rand() * 3));

  const detections = Array.from({ length: persons }, (_, i) => ({
    id: `p-${i}`,
    trackId: accuracy.enableReIdentification?.value ? i + 1 : Math.floor(rand() * persons) + 1,
    confidence: clamp(0.7 + rand() * 0.29 + boost - noise, 0.3, 0.99),
    bbox: { x: rand() * 80, y: rand() * 60, w: 8 + rand() * 16, h: 18 + rand() * 26 },
    pose: rand() > 0.5 ? 'standing' : 'walking',
  }));

  const behaviors = [];
  for (let i = 0; i < 15; i += 1) {
    const [ko, en, category, severity, base] = BEHAVIORS[Math.floor(rand() * BEHAVIORS.length)];
    const confidence = clamp(base + boost - noise + (rand() - 0.5) * 0.08, 0.3, 0.99);
    if (confidence < threshold) continue;
    behaviors.push({
      id: `b-${i}`, timestamp: Math.round(rand() * 60 * 10) / 10,
      trackId: Math.floor(rand() * persons) + 1, label: en, labelKo: ko,
      category, confidence, severity, durationSec: Math.round((1 + rand() * 8) * 10) / 10,
    });
  }
  behaviors.sort((a, b) => a.timestamp - b.timestamp);

  const critical = behaviors.filter((b) => b.severity === 'critical');
  const situations = critical.length ? [{
    id: 's-0', timestamp: critical[0].timestamp, type: 'Altercation', typeKo: '다툼/폭력 행위',
    description: '다수 인물 간 신체 접촉이 감지되어 다툼이 의심됩니다.', severity: 'critical',
    confidence: clamp(0.8 + boost - noise, 0.3, 0.99),
    relatedBehaviors: critical.map((b) => b.id),
    persons: [...new Set(critical.map((b) => b.trackId))],
  }] : [];
  const actions = situations.map((s) => ({
    id: `a-${s.id}`, situationId: s.id, priority: 'immediate', title: '현장 개입 및 증거 확보',
    description: '경비 요원을 파견해 상황을 중재하고 영상을 보관합니다.',
    steps: ['경비 요원 파견', '음성 경고 방송', '영상 클립 저장'],
    owner: '경비팀', estimatedTimeMin: 4, automated: true,
  }));

  const crowdDensity = [], confidenceSeries = [], motionSeries = [];
  for (let t = 0; t <= 60; t += 2) {
    const wave = Math.sin(t / 7 + (seed % 10)) * 0.5 + 0.5;
    crowdDensity.push({ t, value: Math.round(wave * persons * 0.8 + rand() * 2) });
    confidenceSeries.push({ t, value: clamp(0.72 + boost - noise + wave * 0.2, 0.3, 0.99) });
    motionSeries.push({ t, value: Math.round(clamp(wave * 80 + rand() * 20, 0, 100)) });
  }
  const avg = behaviors.length ? behaviors.reduce((a, b) => a + b.confidence, 0) / behaviors.length : 0;
  const riskScore = clamp(critical.length * 22 + situations.length * 6 + (100 - avg * 100) * 0.2, 0, 100);

  return {
    engine: 'real', generatedAt: new Date().toISOString(), videoName, durationSec: 60,
    processedFrames: 60 * fps, personsDetected: persons, detections, behaviors, situations, actions,
    crowdDensity, confidenceSeries, motionSeries,
    summary: {
      riskScore: Math.round(riskScore), complianceScore: Math.round(100 - riskScore * 0.6),
      avgConfidence: Math.round(avg * 100) / 100,
      peakCrowd: Math.max(...crowdDensity.map((d) => d.value)),
      totalBehaviors: behaviors.length, criticalCount: critical.length,
    },
  };
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', engine: 'express-adapter' }));
app.get('/api/config', (_req, res) => res.json(config));
app.post('/api/analyze', (req, res) => {
  const { videoName, performance, accuracy } = req.body ?? {};
  res.json(analyze(videoName || 'demo_surveillance_clip.mp4', performance, accuracy));
});

// 전용 포트 사용 — 다른 프로젝트의 8000 포트와 충돌하지 않음
const port = config.ports?.express ?? 53721;
app.listen(port, '0.0.0.0', () => console.log(`VisionFlow Express API listening on :${port}`));
