import type {
  ActionRecommendation,
  AccidentEvent,
  AnalysisLogEntry,
  AnalysisResult,
  AppConfig,
  BehaviorEvent,
  BehaviorSeverity,
  FeaturePerformance,
  FrameMetric,
  PersonDetection,
  Situation,
  VideoCaption,
} from '@/types';

// ------------------------------------------------------------
// 시나리오 카탈로그 (행동 → 상황 → 조치 매핑)
// ------------------------------------------------------------

export interface BehaviorTemplate {
  key: string;
  labelKo: string;
  label: string;
  category: string;
  severity: BehaviorSeverity;
  baseConfidence: number;
}

export const BEHAVIOR_TEMPLATES: BehaviorTemplate[] = [
  { key: 'walking', labelKo: '보행 중', label: 'Walking', category: '이동', severity: 'info', baseConfidence: 0.96 },
  { key: 'running', labelKo: '급하게 이동', label: 'Running', category: '이동', severity: 'caution', baseConfidence: 0.9 },
  { key: 'falling', labelKo: '낙상 발생', label: 'Falling', category: '안전', severity: 'critical', baseConfidence: 0.88 },
  { key: 'altercation', labelKo: '다툼/몸싸움', label: 'Altercation', category: '안전', severity: 'critical', baseConfidence: 0.82 },
  { key: 'loitering', labelKo: '장시간 체류', label: 'Loitering', category: '이상', severity: 'caution', baseConfidence: 0.78 },
  { key: 'crowd', labelKo: '인파 집중', label: 'Crowd Gathering', category: '혼잡', severity: 'warning', baseConfidence: 0.91 },
  { key: 'climbing', labelKo: '출입금지 구역 진입', label: 'Restricted Access', category: '보안', severity: 'warning', baseConfidence: 0.8 },
  { key: 'unattended', labelKo: '물건 방치', label: 'Unattended Object', category: '보안', severity: 'warning', baseConfidence: 0.76 },
  { key: 'helping', labelKo: '도움 요청/제공', label: 'Assisting', category: '안전', severity: 'info', baseConfidence: 0.84 },
  { key: 'waving', labelKo: '손짓/호출', label: 'Waving', category: '커뮤니케이션', severity: 'info', baseConfidence: 0.86 },
];

export interface SituationTemplate {
  key: string;
  typeKo: string;
  type: string;
  description: string;
  severity: BehaviorSeverity;
  triggers: string[];
  actions: Array<{
    title: string;
    description: string;
    steps: string[];
    owner: string;
    estimatedTimeMin: number;
    priority: ActionRecommendation['priority'];
    automated: boolean;
  }>;
}

export const SITUATION_TEMPLATES: SituationTemplate[] = [
  {
    key: 'crowd_surge',
    typeKo: '인파 밀집 경보',
    type: 'Crowd Surge',
    description: '특정 구역에 인구 밀도가 임계치를 초과하여 압사 위험이 감지되었습니다.',
    severity: 'critical',
    triggers: ['crowd', 'running'],
    actions: [
      {
        title: '인파 분산 유도',
        description: '해당 구역으로의 진입을 제한하고 인파를 인접 공간으로 분산시킵니다.',
        steps: ['진입로 차단 안내 방송 송출', '인파 분산 유도 요원 배치', '밀도 모니터링 강화'],
        owner: '현장 안전팀',
        estimatedTimeMin: 3,
        priority: 'immediate',
        automated: true,
      },
      {
        title: '비상 대응팀 출동',
        description: '현장 상황을 안전 관제실에 보고하고 대응팀을 출동시킵니다.',
        steps: ['관제실 상황 보고', '대응팀 출동 지시', 'CCTV 해당 구역 확대'],
        owner: '관제 센터',
        estimatedTimeMin: 5,
        priority: 'high',
        automated: false,
      },
    ],
  },
  {
    key: 'potential_fall',
    typeKo: '낙상 의심',
    type: 'Potential Fall',
    description: '인물이 급격한 자세 변화 후 움직이지 않아 낙상이 의심됩니다.',
    severity: 'critical',
    triggers: ['falling', 'helping'],
    actions: [
      {
        title: '즉시 현장 확인',
        description: '낙상 의심 위치로 요원을 파견해 상태를 확인합니다.',
        steps: ['최근 접근 요원 호출', '의료 키트 준비', '현장 접근 및 상태 확인'],
        owner: '안전 요원',
        estimatedTimeMin: 2,
        priority: 'immediate',
        automated: true,
      },
      {
        title: '구급대 연락',
        description: '상태 확인 결과에 따라 구급대를 호출합니다.',
        steps: ['119/구급대 연락 대기', '정확한 위치 전달', '접근로 확보'],
        owner: '관제 센터',
        estimatedTimeMin: 5,
        priority: 'high',
        automated: false,
      },
    ],
  },
  {
    key: 'altercation',
    typeKo: '다툼/폭력 행위',
    type: 'Altercation',
    description: '두 명 이상의 인물 간 신체 접촉이 감지되어 다툼이 의심됩니다.',
    severity: 'critical',
    triggers: ['altercation', 'running'],
    actions: [
      {
        title: '현장 개입',
        description: '경비 요원을 파견해 다툼을 중재하고 위험을 차단합니다.',
        steps: ['경비 요원 파견', '음성 경고 방송', '신체적 개입 준비'],
        owner: '경비팀',
        estimatedTimeMin: 3,
        priority: 'immediate',
        automated: false,
      },
      {
        title: '증거 영상 확보',
        description: '해당 구역 영상을 클립으로 저장하고 사건 기록을 생성합니다.',
        steps: ['영상 클립 저장', '사건 번호 생성', '관제실 아카이빙'],
        owner: '관제 센터',
        estimatedTimeMin: 4,
        priority: 'medium',
        automated: true,
      },
    ],
  },
  {
    key: 'unauthorized_access',
    typeKo: '출입금지 구역 진입',
    type: 'Unauthorized Access',
    description: '출입이 제한된 구역에 인물이 진입했습니다.',
    severity: 'warning',
    triggers: ['climbing', 'loitering'],
    actions: [
      {
        title: '출입 통제 안내',
        description: '해당 인물에게 경고 방송을 송출하고 출입을 통제합니다.',
        steps: ['경고 방송 송출', '출입구 잠금 확인', '인물 이동 유도'],
        owner: '경비팀',
        estimatedTimeMin: 4,
        priority: 'high',
        automated: true,
      },
    ],
  },
  {
    key: 'unattended_object',
    typeKo: '물건 방치 의심',
    type: 'Unattended Object',
    description: '일정 시간 이상 움직이지 않는 물건이 감지되었습니다.',
    severity: 'warning',
    triggers: ['unattended'],
    actions: [
      {
        title: '소유자 확인 및 조치',
        description: '주변 인물에게 소유자를 확인하고 미수령 시 회수 절차를 진행합니다.',
        steps: ['소유자 확인 방송', '담당자 현장 확인', '유실물 처리 절차'],
        owner: '시설 관리팀',
        estimatedTimeMin: 8,
        priority: 'medium',
        automated: false,
      },
    ],
  },
];

// ------------------------------------------------------------
// 결정적 난수 생성 (설정에 따라 결과 재현 가능)
// ------------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ============================================================
// 목업 분석 결과 생성기
// - 정확도 옵션(confidenceThreshold, sensitivity, model)이 결과에 반영된다.
// - 성능 옵션(fps, resolution)이 처리 프레임 수/노이즈에 반영된다.
// ============================================================

export function generateMockResult(
  videoName: string,
  config: AppConfig,
): AnalysisResult {
  const seed = hashString(videoName + config.options.analysisEngine.value);
  const rand = mulberry32(seed);

  const durationSec = 60;
  const fps = config.performance.fps.value;
  const processedFrames = Math.round(durationSec * fps);

  const threshold = config.accuracy.confidenceThreshold.value;
  const sensitivity = config.accuracy.personDetectionSensitivity.value;
  const model = config.accuracy.behaviorModel.value;
  const smoothing = config.accuracy.temporalSmoothing.value;
  const reid = config.accuracy.enableReIdentification.value;

  // 모델 프로파일에 따른 신뢰도 보정
  const modelBoost: Record<string, number> = {
    fast: -0.04,
    balanced: 0,
    accurate: 0.04,
    ensemble: 0.07,
  };
  const boost = modelBoost[model] ?? 0;
  const noise = smoothing ? 0.02 : 0.08;

  // 인물 감지 수 (민감도 반영)
  const personsDetected = Math.max(1, Math.round(6 + sensitivity * 8 + rand() * 3));

  const detections: PersonDetection[] = Array.from({ length: personsDetected }, (_, i) => ({
    id: `p-${i}`,
    trackId: reid ? i + 1 : Math.floor(rand() * personsDetected) + 1,
    confidence: clamp(0.7 + rand() * 0.29 + boost - noise, 0.3, 0.99),
    bbox: {
      x: Math.round(rand() * 80),
      y: Math.round(rand() * 60),
      w: Math.round(8 + rand() * 16),
      h: Math.round(18 + rand() * 26),
    },
    pose: rand() > 0.5 ? 'standing' : 'walking',
  }));

  // 행동 이벤트 생성 (임계값 이상만 채택 → 정확도 옵션 반영)
  const behaviors: BehaviorEvent[] = [];
  const eventCount = 14 + Math.floor(rand() * 8);
  for (let i = 0; i < eventCount; i += 1) {
    const tpl = BEHAVIOR_TEMPLATES[Math.floor(rand() * BEHAVIOR_TEMPLATES.length)];
    const confidence = clamp(tpl.baseConfidence + boost - noise + (rand() - 0.5) * 0.08, 0.3, 0.99);
    if (confidence < threshold) continue;
    behaviors.push({
      id: `b-${i}`,
      timestamp: Math.round(rand() * durationSec * 10) / 10,
      trackId: Math.floor(rand() * personsDetected) + 1,
      label: tpl.label,
      labelKo: tpl.labelKo,
      category: tpl.category,
      confidence,
      severity: tpl.severity,
      durationSec: Math.round((1 + rand() * 8) * 10) / 10,
    });
  }
  behaviors.sort((a, b) => a.timestamp - b.timestamp);

  // 상황 판단: 트리거 행동이 존재하면 상황 생성
  const situations: Situation[] = [];
  SITUATION_TEMPLATES.forEach((stpl, idx) => {
    const matched = behaviors.filter((b) => stpl.triggers.includes(
      BEHAVIOR_TEMPLATES.find((t) => t.labelKo === b.labelKo)?.key ?? '',
    ));
    if (matched.length === 0 && rand() > 0.7) return;
    const situationConfidence = clamp(
      0.7 + boost - noise + matched.length * 0.03 + rand() * 0.08,
      0.3,
      0.99,
    );
    if (situationConfidence < threshold) return;
    situations.push({
      id: `s-${idx}`,
      timestamp: matched.length ? matched[0].timestamp : Math.round(rand() * durationSec),
      type: stpl.type,
      typeKo: stpl.typeKo,
      description: stpl.description,
      severity: stpl.severity,
      confidence: situationConfidence,
      relatedBehaviors: matched.map((m) => m.id),
      persons: Array.from(new Set(matched.map((m) => m.trackId))),
    });
  });

  // 조치 권고 생성
  const actions: ActionRecommendation[] = [];
  situations.forEach((sit) => {
    const stpl = SITUATION_TEMPLATES.find((s) => s.type === sit.type);
    stpl?.actions.forEach((a, ai) => {
      actions.push({
        id: `a-${sit.id}-${ai}`,
        situationId: sit.id,
        priority: a.priority,
        title: a.title,
        description: a.description,
        steps: a.steps,
        owner: a.owner,
        estimatedTimeMin: a.estimatedTimeMin,
        automated: a.automated,
      });
    });
  });

  // 시간별 사고 인식 생성 (행동 이벤트를 사고로 매핑)
  const accidentTemplates: Record<string, { type: string; typeKo: string; title: string; description: string }> = {
    falling: { type: 'fall', typeKo: '낙상', title: '인물 낙상 사고', description: '인물이 균형을 잃고 바닥에 쓰러진 것이 감지되었습니다. 즉시 상태 확인이 필요합니다.' },
    altercation: { type: 'altercation', typeKo: '폭력', title: '다툼·폭력 사고', description: '두 명 이상의 인물 간 신체 접촉이 감지되어 폭력 행위가 의심됩니다.' },
    crowd: { type: 'crowd_crush', typeKo: '인파', title: '인파 밀집 사고 위험', description: '해당 구역의 인구 밀도가 임계치를 초과해 압사 위험이 발생했습니다.' },
    unattended: { type: 'unattended', typeKo: '방치', title: '수상 물체 방치', description: '장시간 이동하지 않는 물체가 감지되어 소유자 확인이 필요합니다.' },
    climbing: { type: 'intrusion', typeKo: '침입', title: '출입금지 구역 침입', description: '인물이 통제 구역에 진입한 것이 감지되었습니다.' },
    running: { type: 'panic', typeKo: '혼란', title: '급격한 이동·혼란', description: '다수 인물이 급하게 이동하여 혼란이 감지되었습니다.' },
  };
  const accidentKeys = ['falling', 'altercation', 'crowd', 'unattended', 'climbing', 'running'];
  const accidents: AccidentEvent[] = [];
  behaviors
    .filter((b) => {
      const key = BEHAVIOR_TEMPLATES.find((t) => t.labelKo === b.labelKo)?.key ?? '';
      return (b.severity === 'critical' || b.severity === 'warning') && accidentKeys.includes(key);
    })
    .slice(0, 10)
    .forEach((b, i) => {
      const key = BEHAVIOR_TEMPLATES.find((t) => t.labelKo === b.labelKo)?.key ?? 'running';
      const tpl = accidentTemplates[key] ?? accidentTemplates.running;
      const end = Math.min(durationSec, Math.round((b.timestamp + b.durationSec) * 10) / 10);
      const status: AccidentEvent['status'] =
        b.severity === 'critical' ? (i % 3 === 0 ? 'resolved' : 'responding') : (i % 2 === 0 ? 'detected' : 'resolved');
      accidents.push({
        id: `ac-${i}`,
        timestamp: b.timestamp,
        endTime: end,
        type: tpl.type,
        typeKo: tpl.typeKo,
        title: tpl.title,
        description: tpl.description,
        severity: b.severity,
        confidence: b.confidence,
        persons: [b.trackId, ...(rand() > 0.5 ? [(b.trackId % personsDetected) + 1] : [])],
        zone: `구역 ${['A', 'B', 'C', 'D'][Math.floor(rand() * 4)]}`,
        status,
        relatedBehaviorIds: [b.id],
      });
    });
  accidents.sort((a, b) => a.timestamp - b.timestamp);

  // 영상 텍스트 설명 생성 (시간대별 캡션 + 요약)
  const captions: VideoCaption[] = [];
  for (let t = 0; t < durationSec; t += 10) {
    const end = Math.min(durationSec, t + 10);
    const accidentsInWindow = accidents.filter((a) => a.timestamp >= t && a.timestamp < end);
    const behaviorsInWindow = behaviors.filter((b) => b.timestamp >= t && b.timestamp < end);
    const crowdAt = Math.round(clamp(personsDetected * (0.5 + 0.5 * Math.sin(t / 7 + seed)), 0, personsDetected));
    let text: string;
    if (accidentsInWindow.length) {
      text = `${t}초부터 ${end}초 사이 ${accidentsInWindow[0].zone}에서 ${accidentsInWindow[0].title}이(가) 감지되었습니다. ${accidentsInWindow.length}건의 사고가 기록되었으며 신뢰도는 ${Math.round(accidentsInWindow[0].confidence * 100)}%입니다.`;
    } else if (behaviorsInWindow.length) {
      text = `${t}초부터 ${end}초 사이 인물 ${behaviorsInWindow.length}명이 ${behaviorsInWindow[0].labelKo} 행동을 보였습니다. 해당 구역의 인구 밀도는 ${crowdAt}명 수준입니다.`;
    } else {
      text = `${t}초부터 ${end}초 사이 특이 행동 없이 ${crowdAt}명의 인물이 정상적으로 이동하고 있습니다.`;
    }
    captions.push({
      id: `cap-${t}`,
      timestamp: t,
      endTime: end,
      text,
      tags: [
        ...accidentsInWindow.map((a) => a.typeKo),
        ...behaviorsInWindow.slice(0, 2).map((b) => b.labelKo),
        `인구밀도 ${crowdAt}명`,
      ],
    });
  }

  const accidentSummary = accidents.length
    ? `총 ${accidents.length}건의 사고가 감지되었으며, 이 중 ${accidents.filter((a) => a.severity === 'critical').length}건이 치명적 단계입니다.`
    : '감지된 사고가 없습니다.';
  const videoDescription = {
    summary: `본 영상은 ${durationSec}초 길이이며 총 ${processedFrames}프레임이 분석되었습니다. 평균 ${personsDetected}명의 인물이 감지되었고, 최고 밀집 시점에는 ${personsDetected}명이 동시에 확인되었습니다. ${accidentSummary} ${situations.length}건의 상황이 판단되어 ${actions.length}건의 조치가 권고되었습니다.`,
    captions,
    highlights: [
      ...accidents.slice(0, 3).map((a) => `${a.timestamp.toFixed(0)}초 ${a.title}`),
      `최고 인구 밀도 ${personsDetected}명`,
      `평균 신뢰도 ${Math.round((behaviors.length ? behaviors.reduce((sum, b) => sum + b.confidence, 0) / behaviors.length : 0) * 100)}%`,
    ],
    sceneCount: captions.length,
  };

  // 시계열 시그널 생성
  const crowdDensity: FrameMetric[] = [];
  const confidenceSeries: FrameMetric[] = [];
  const motionSeries: FrameMetric[] = [];
  for (let t = 0; t <= durationSec; t += 2) {
    const wave = Math.sin(t / 7 + seed) * 0.5 + 0.5;
    crowdDensity.push({ t, value: Math.round(clamp(wave * personsDetected * 0.8 + rand() * 2, 0, personsDetected)) });
    confidenceSeries.push({ t, value: Math.round(clamp(0.72 + boost - noise + wave * 0.2 + rand() * 0.05, 0.3, 0.99) * 100) / 100 });
    motionSeries.push({ t, value: Math.round(clamp(wave * 80 + rand() * 20, 0, 100)) });
  }

  const avgConfidence = behaviors.length
    ? behaviors.reduce((sum, b) => sum + b.confidence, 0) / behaviors.length
    : 0;
  const criticalCount = situations.filter((s) => s.severity === 'critical').length;
  const riskScore = clamp(
    criticalCount * 22 + situations.length * 6 + (100 - avgConfidence * 100) * 0.2,
    0,
    100,
  );
  const complianceScore = clamp(100 - riskScore * 0.6 + boost * 50, 0, 100);
  const peakCrowd = Math.max(...crowdDensity.map((d) => d.value), 0);

  // ------------------------------------------------------------
  // 기능별 성능평가 데이터
  // - 성능 옵션(fps/해상도/동시성/가속)과 정확도 옵션이 지표에 반영된다.
  // ------------------------------------------------------------
  const resolutionFactor: Record<string, number> = { '360p': 0.5, '480p': 0.7, '720p': 1, '1080p': 1.8 };
  const resF = resolutionFactor[config.performance.resolution.value] ?? 1;
  const fpsF = fps / 15;
  const accel = config.performance.hardwareAcceleration.value;
  const concurrency = config.performance.concurrency.value;
  const batch = config.performance.batchSize.value;

  const perfTemplates: Array<{
    key: string;
    label: string;
    labelKo: string;
    description: string;
    baseLatency: number;
    baseMemory: number;
    cpu: number;
    accuracyBias: number;
  }> = [
    { key: 'ingest', label: 'Video Ingest', labelKo: '영상 입력', description: '영상 파일 또는 스트림을 로드하고 분석을 준비하는 단계입니다.', baseLatency: 4, baseMemory: 24, cpu: 6, accuracyBias: 0 },
    { key: 'decode', label: 'Frame Decode', labelKo: '프레임 디코딩', description: '영상을 분석 가능한 프레임으로 변환하는 단계입니다.', baseLatency: 12, baseMemory: 48, cpu: 14, accuracyBias: 0 },
    { key: 'preprocess', label: 'AI Preprocess', labelKo: 'AI 전처리', description: 'AI 추론용으로 640px·6fps로 축소/샘플링합니다.', baseLatency: 6, baseMemory: 32, cpu: 10, accuracyBias: 0 },
    { key: 'signals', label: 'Video Signal Extract', labelKo: '영상 신호 추출', description: '샘플 프레임의 밝기·모션·엣지 신호를 추출합니다.', baseLatency: 28, baseMemory: 96, cpu: 26, accuracyBias: 0.01 },
    { key: 'detect', label: 'YOLO Detection', labelKo: '객체 탐지', description: 'YOLO로 사람·차량·지게차를 감지합니다.', baseLatency: 38, baseMemory: 180, cpu: 32, accuracyBias: 0.02 },
    { key: 'track', label: 'ByteTrack', labelKo: '객체 추적', description: 'ByteTrack으로 ID를 유지하고 이동 경로를 기록합니다.', baseLatency: 44, baseMemory: 160, cpu: 38, accuracyBias: 0.01 },
    { key: 'pose', label: 'Pose Estimation', labelKo: '자세 분석', description: '사람 관절 좌표로 자세 변화를 분석합니다.', baseLatency: 46, baseMemory: 200, cpu: 40, accuracyBias: 0.01 },
    { key: 'behavior', label: 'Behavior Recognition', labelKo: '행동 인식', description: '감지된 인물의 시계열 행동을 분류합니다.', baseLatency: 52, baseMemory: 240, cpu: 44, accuracyBias: -0.01 },
    { key: 'accidents', label: 'Temporal Analysis', labelKo: '시간 기반 사고 판단', description: '거리·속도·자세·지속 시간으로 사고를 판단합니다.', baseLatency: 18, baseMemory: 72, cpu: 18, accuracyBias: 0.02 },
    { key: 'industrial', label: 'Industrial Safety', labelKo: '산업현장 위험 분석', description: '지게차-작업자 충돌·추락·협착 위험을 분석합니다.', baseLatency: 22, baseMemory: 88, cpu: 20, accuracyBias: 0.01 },
    { key: 'situation', label: 'Situation Analysis', labelKo: '상황 판단', description: '행동 이벤트를 조합해 상황을 판단합니다.', baseLatency: 24, baseMemory: 96, cpu: 22, accuracyBias: 0.01 },
    { key: 'action', label: 'Action Mapping', labelKo: '조치 권고', description: '상황에 맞는 대응 절차를 매핑합니다.', baseLatency: 9, baseMemory: 32, cpu: 8, accuracyBias: 0 },
    { key: 'description', label: 'Text Description', labelKo: '영상 텍스트 설명', description: '분석 결과를 자연어 요약과 캡션으로 생성합니다.', baseLatency: 34, baseMemory: 88, cpu: 20, accuracyBias: 0 },
    { key: 'performance', label: 'Performance Eval', labelKo: '성능 평가', description: '기능별 지연·정확도·리소스 지표를 산출합니다.', baseLatency: 11, baseMemory: 36, cpu: 12, accuracyBias: 0 },
    { key: 'review', label: 'Incident Review', labelKo: '사고 검토', description: '사고 의심 구간을 사용자 검토 상태로 표시합니다.', baseLatency: 5, baseMemory: 24, cpu: 6, accuracyBias: 0 },
    { key: 'report', label: 'Report Generation', labelKo: '리포트 생성', description: '분석 결과를 시각화용 데이터로 조립합니다.', baseLatency: 7, baseMemory: 40, cpu: 10, accuracyBias: 0 },
  ];

  const performanceEvaluation: FeaturePerformance[] = perfTemplates.map((t, i) => {
    const latencyMs = Math.round((t.baseLatency * resF / Math.sqrt(fpsF)) / (accel ? 1.45 : 1) * (1 + rand() * 0.12) * 10) / 10;
    const throughput = Math.round((1000 / Math.max(latencyMs, 1)) * (concurrency / 4) * (batch / 8) * 10) / 10;
    const accuracy = clamp(
      (74 + boost * 100 + t.accuracyBias + sensitivity * 12 + (smoothing ? 3 : 0) + (reid ? 2 : 0) - noise * 60 + (rand() - 0.5) * 4),
      35, 99,
    );
    const precision = clamp(accuracy + (rand() - 0.3) * 6, 30, 99);
    const recall = clamp(accuracy - 2 + (rand() - 0.5) * 8, 30, 99);
    const memoryMb = Math.round(t.baseMemory * resF * (1 + i * 0.03));
    const cpuPercent = clamp(t.cpu / Math.sqrt(concurrency) * (accel ? 0.75 : 1), 2, 100);
    const gpuPercent = accel ? clamp(t.cpu * 1.6 / Math.sqrt(concurrency), 5, 100) : 0;
    const status: FeaturePerformance['status'] =
      latencyMs > 90 || accuracy < 65 ? 'degraded' : latencyMs > 45 || accuracy < 78 ? 'normal' : 'optimal';
    return {
      key: t.key,
      label: t.label,
      labelKo: t.labelKo,
      description: t.description,
      latencyMs,
      throughput,
      accuracy: Math.round(accuracy),
      precision: Math.round(precision),
      recall: Math.round(recall),
      memoryMb,
      cpuPercent: Math.round(cpuPercent),
      gpuPercent: Math.round(gpuPercent),
      status,
    };
  });

  // 파이프라인 노드별 상세 분석 로그
  const logSpecs: Array<{
    nodeId: string;
    nodeLabel: string;
    level: AnalysisLogEntry['level'];
    message: string;
    detail: string;
    metrics: Array<{ label: string; value: string }>;
  }> = [
    { nodeId: 'ingest', nodeLabel: '영상 입력', level: 'success', message: '영상 스트림 로드 완료', detail: `파일 ${videoName}을(를) 분석 파이프라인에 연결했습니다.`, metrics: [{ label: '길이', value: `${durationSec}s` }, { label: 'FPS 설정', value: `${fps}` }] },
    { nodeId: 'decode', nodeLabel: '프레임 디코딩', level: 'success', message: '프레임 시퀀스 생성 완료', detail: `해상도 ${config.performance.resolution.value} 기준으로 프레임을 변환했습니다.`, metrics: [{ label: '처리 프레임', value: `${processedFrames}` }, { label: '배치', value: `${config.performance.batchSize.value}` }] },
    { nodeId: 'signals', nodeLabel: '실제 영상 신호 추출', level: 'info', message: '밝기·모션·엣지 신호 추출', detail: '샘플 프레임의 픽셀 차분과 그라디언트로 영상 신호를 계산했습니다.', metrics: [{ label: '장면 전환', value: `${videoDescription.captions.length}회` }, { label: '신뢰도', value: `${Math.round(avgConfidence * 100)}%` }] },
    { nodeId: 'track', nodeLabel: '형상 검출·추적', level: 'info', message: '움직이는 형상 추적 완료', detail: '연속 프레임 간 차분 영역을 연결 요소로 검출하고 최근접 매칭으로 트랙을 유지했습니다.', metrics: [{ label: '추적 후보', value: `${Math.min(personsDetected, 8)}개` }, { label: '민감도', value: `${sensitivity}` }] },
    { nodeId: 'detect', nodeLabel: '인물 감지', level: 'success', message: '인물 감지 완료', detail: `신뢰도 임계값 ${threshold} 이상의 감지 결과만 채택했습니다.`, metrics: [{ label: '감지 인물', value: `${personsDetected}명` }, { label: '평균 신뢰도', value: `${Math.round(avgConfidence * 100)}%` }] },
    { nodeId: 'behavior', nodeLabel: '행동 인식', level: 'info', message: '행동 이벤트 추출 완료', detail: `행동 모델 ${model} 프로파일로 시계열 행동을 분류했습니다.`, metrics: [{ label: '이벤트', value: `${behaviors.length}건` }, { label: '평활화', value: smoothing ? 'ON' : 'OFF' }] },
    { nodeId: 'accidents', nodeLabel: '시간별 사고 인식', level: situations.some((s) => s.severity === 'critical') ? 'warning' : 'success', message: '사고 인식 완료', detail: '행동 이벤트를 사고 유형으로 매핑하고 발생 시각순으로 정렬했습니다.', metrics: [{ label: '사고', value: `${accidents.length}건` }, { label: '치명', value: `${situations.filter((s) => s.severity === 'critical').length}건` }] },
    { nodeId: 'situation', nodeLabel: '상황 판단', level: 'success', message: '상황 판단 완료', detail: '행동과 사고를 조합해 대응이 필요한 상황을 도출했습니다.', metrics: [{ label: '상황', value: `${situations.length}건` }, { label: '위험도', value: `${Math.round(situations.filter((s) => s.severity === 'critical').length * 22 + situations.length * 6)}` }] },
    { nodeId: 'action', nodeLabel: '조치 권고', level: 'info', message: '조치 권고 매핑 완료', detail: '상황별 담당자와 실행 절차를 연결했습니다.', metrics: [{ label: '조치', value: `${actions.length}건` }, { label: '자동화', value: `${actions.filter((a) => a.automated).length}건` }] },
    { nodeId: 'description', nodeLabel: '영상 텍스트 설명', level: 'success', message: '텍스트 설명 생성 완료', detail: '영상 요약과 시간대별 캡션을 자연어로 생성했습니다.', metrics: [{ label: '캡션', value: `${videoDescription.captions.length}개` }, { label: '구간', value: `${videoDescription.sceneCount}` }] },
    { nodeId: 'performance', nodeLabel: '성능 평가', level: 'success', message: '기능별 성능평가 완료', detail: '스토리지·연산 옵션을 반영해 각 기능의 지연과 정확도를 산출했습니다.', metrics: [{ label: '평균 지연', value: `${Math.round(performanceEvaluation.reduce((a, p) => a + p.latencyMs, 0) / performanceEvaluation.length)}ms` }, { label: '평균 정확도', value: `${Math.round(performanceEvaluation.reduce((a, p) => a + p.accuracy, 0) / performanceEvaluation.length)}%` }] },
    { nodeId: 'report', nodeLabel: '분석 리포트', level: 'success', message: '최종 리포트 생성 완료', detail: '모든 분석 결과를 시각화용 데이터 구조로 조립했습니다.', metrics: [{ label: '데이터 항목', value: '12개' }, { label: '엔진', value: 'mock' }] },
  ];
  const analysisLog: AnalysisLogEntry[] = logSpecs.map((spec, i) => ({
    id: `log-${i}`,
    ...spec,
    timestamp: Math.round(i * (durationSec / Math.max(logSpecs.length, 1)) * 10) / 10,
  }));

  return {
    engine: 'mock',
    generatedAt: new Date().toISOString(),
    videoName,
    durationSec,
    processedFrames,
    personsDetected,
    detections,
    behaviors,
    situations,
    actions,
    accidents,
    videoDescription,
    analysisLog,
    crowdDensity,
    confidenceSeries,
    motionSeries,
    performanceEvaluation,
    summary: {
      riskScore: Math.round(riskScore),
      complianceScore: Math.round(complianceScore),
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      peakCrowd,
      totalBehaviors: behaviors.length,
      criticalCount,
    },
  };
}

export default generateMockResult;
