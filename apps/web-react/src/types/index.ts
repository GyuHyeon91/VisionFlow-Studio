// ============================================================
// 공통 설정 타입
// ============================================================

export type FrontendChoice = 'react' | 'next' | 'vue';
export type EngineChoice = 'mock' | 'real' | 'hybrid';
export type BackendChoice = 'none' | 'fastapi' | 'express';
export type DesignChoice = 'aurora' | 'midnight' | 'light' | 'daylight' | 'cyber';
export type LanguageChoice = 'ko' | 'en';

export interface OptionGroup<T extends string> {
  value: T;
  choices: T[];
  description: string;
}

export interface NumericOption {
  value: number;
  min: number;
  max: number;
  description: string;
}

export interface EnumOption<T extends string> {
  value: T;
  choices: T[];
  description: string;
}

export interface BoolOption {
  value: boolean;
  description: string;
}

export type SelectOption = EnumOption<string> | NumericOption | BoolOption;

export interface AppConfig {
  project: {
    name: string;
    slug: string;
    version: string;
    description: string;
  };
  options: {
    frontend: OptionGroup<FrontendChoice>;
    analysisEngine: OptionGroup<EngineChoice>;
    backend: OptionGroup<BackendChoice>;
    design: OptionGroup<DesignChoice>;
    language: OptionGroup<LanguageChoice>;
  };
  performance: {
    resolution: EnumOption<'360p' | '480p' | '720p' | '1080p'>;
    fps: NumericOption;
    concurrency: NumericOption;
    hardwareAcceleration: BoolOption;
    adaptiveQuality: BoolOption;
    batchSize: NumericOption;
  };
  preprocessing: {
    nmsIoU: NumericOption;
    gamma: NumericOption;
    excludeZones: { value: number[][][]; description: string };
  };
  detection: {
    model: EnumOption<'yolov8n.pt' | 'yolov8s.pt' | 'yolov11n.pt' | 'rtdetr-l.pt'>;
    tracker: EnumOption<'nearest' | 'bytetrack' | 'botsort'>;
    trackBuffer: NumericOption;
    realtimeImgsz: NumericOption;
    personBoost: BoolOption;
    personBoostMinConf: NumericOption;
    analysisImgsz: NumericOption;
    analysisFps: NumericOption;
    opticalFlow: BoolOption;
    classFilter: EnumOption<'all' | 'person_vehicle' | 'person_only'>;
    resolutionMode: EnumOption<'single' | 'multiscale' | 'tiled'>;
    scales: { value: number[]; description: string };
    runtime: EnumOption<'onnx' | 'openvino' | 'pytorch'>;
  };
  broker: {
    type: EnumOption<'local' | 'redis'>;
    url: { value: string; description: string };
    stream: { value: string; description: string };
  };
  training: {
    activeLearning: BoolOption;
    ambiguousMin: NumericOption;
    ambiguousMax: NumericOption;
    clipWindowSec: NumericOption;
    syntheticCopies: NumericOption;
  };
  safety: {
    fallRiskZones: { value: number[][][]; description: string };
    disappearanceSec: NumericOption;
    stillSec: NumericOption;
    gatherCount: NumericOption;
  };
  prediction: {
    enabled: BoolOption;
    horizonSec: NumericOption;
    roiPolygons: { value: number[][][]; description: string };
  };
  accidentAnalysis: {
    enabled: BoolOption;
    collisionDistDrop: NumericOption;
    collisionWindowSec: NumericOption;
    stopSpeedThreshold: NumericOption;
    fallDropPct: NumericOption;
    minFrames: NumericOption;
  };
  streaming: {
    rtspUrl: { value: string; description: string };
    webrtcUrl: { value: string; description: string };
    enabled: BoolOption;
  };
  storage: {
    eventLog: BoolOption;
    clipBeforeSec: NumericOption;
    clipAfterSec: NumericOption;
  };
  measurement: {
    relativeSize: BoolOption;
    referenceObject: EnumOption<'car' | 'person' | 'none'>;
    knownWidthCm: NumericOption;
    fieldOfViewDeg: NumericOption;
    depthEstimation: BoolOption;
  };
  accuracy: {
    confidenceThreshold: NumericOption;
    personDetectionSensitivity: NumericOption;
    behaviorModel: EnumOption<'fast' | 'balanced' | 'accurate' | 'ensemble'>;
    temporalSmoothing: BoolOption;
    nmsThreshold: NumericOption;
    enableReIdentification: BoolOption;
  };
  pipeline: {
    autoUpdate: BoolOption;
    autoUpdateDebounceMs: NumericOption;
    nodes: PipelineNodeConfig[];
    edges: PipelineEdgeConfig[];
  };
  ports: {
    web: number;
    next: number;
    vue: number;
    fastapi: number;
    express: number;
  };
  isolation: {
    standalone: boolean;
    description: string;
    reservedPortOwner: string;
  };
  server: {
    port: number;
    host: string;
    corsOrigins: string[];
  };
}

// ============================================================
// 파이프라인 타입
// ============================================================

export type NodeKind = 'source' | 'transform' | 'analysis' | 'output';

export interface PipelineNodeConfig {
  id: string;
  type: NodeKind;
  label: string;
  enabled: boolean;
}

export interface PipelineEdgeConfig {
  from: string;
  to: string;
}

export interface PipelineNode extends PipelineNodeConfig {
  x: number;
  y: number;
  status: 'idle' | 'running' | 'done' | 'error';
  progress: number;
  durationMs?: number;
  output?: string;
  /** 상세 데이터: 입출력 건수·지연·설명 */
  detail?: {
    description?: string;
    inputCount?: number;
    outputCount?: number;
    latencyMs?: number;
    throughput?: string;
    note?: string;
  };
}

export interface PipelineEdge extends PipelineEdgeConfig {
  active: boolean;
}

// ============================================================
// 분석 결과 타입
// ============================================================

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PersonDetection {
  id: string;
  trackId: number;
  confidence: number;
  bbox: BoundingBox;
  pose?: string;
}

export type BehaviorSeverity = 'info' | 'caution' | 'warning' | 'critical';

export interface BehaviorEvent {
  id: string;
  timestamp: number; // 초 단위
  trackId: number;
  label: string;
  labelKo: string;
  category: string;
  confidence: number;
  severity: BehaviorSeverity;
  durationSec: number;
}

export interface Situation {
  id: string;
  timestamp: number;
  type: string;
  typeKo: string;
  description: string;
  severity: BehaviorSeverity;
  confidence: number;
  relatedBehaviors: string[];
  persons: number[];
}

export interface ActionRecommendation {
  id: string;
  situationId: string;
  priority: 'low' | 'medium' | 'high' | 'immediate';
  title: string;
  description: string;
  steps: string[];
  owner: string;
  estimatedTimeMin: number;
  automated: boolean;
}

export interface FrameMetric {
  t: number;
  value: number;
}

/** 영상 텍스트 설명 (시간대별 캡션 + 요약) */
export interface VideoCaption {
  id: string;
  timestamp: number;
  endTime: number;
  text: string;
  tags: string[];
}

export interface VideoDescription {
  summary: string;
  captions: VideoCaption[];
  highlights: string[];
  sceneCount: number;
}

/** 시간별 사고 인식 이벤트 */
export interface AccidentEvent {
  id: string;
  timestamp: number;
  endTime: number;
  type: string;
  typeKo: string;
  title: string;
  description: string;
  severity: BehaviorSeverity;
  confidence: number;
  persons: number[];
  zone: string;
  status: 'detected' | 'responding' | 'resolved';
  relatedBehaviorIds: string[];
}

/** 사물 측정 결과 (상대 크기 + 실측 근사치) */
export interface ObjectMeasurement {
  label: string;
  kind: 'person' | 'vehicle' | 'object';
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  widthPx: number;
  heightPx: number;
  widthPercent: number;
  heightPercent: number;
  areaPercent: number;
  aspectRatio: number;
  distanceM: number | null;
  widthCm: number | null;
  heightCm: number | null;
  method: 'reference+depth' | 'reference-plane' | 'relative-only';
}

/** 건설현장 안전 이벤트 (추락 vs 다툼 구분) */
export interface SafetyEvent {
  id: string;
  type: 'fall' | 'altercation' | 'fall_candidate';
  labelKo: string;
  severity: BehaviorSeverity;
  confidence: number;
  timestamp: number;
  reason: string;
  evidence: string[];
  zone: string;
}

/** 재생 중 실시간으로 감지된 사고 */
export interface LiveAccident {
  id: string;
  type: string;
  title: string;
  severity: 'caution' | 'warning' | 'critical';
  timestamp: number;
  description: string;
  evidence: string[];
}

/** 영상에서 추적된 형상(움직이는 객체)의 궤적 점 */
export interface TrackedShapePoint {
  t: number;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
}

/** 영상에서 추적된 형상 */
export interface TrackedShape {
  id: string;
  label: string;
  /** 모양 기반 분류 (실제 객체 인식 모델이 아닌 휴리스틱) */
  kind: 'person' | 'vehicle' | 'object';
  firstSeen: number;
  lastSeen: number;
  points: TrackedShapePoint[];
  distance: number;
}

/** 파이프라인 노드별 분석 상세 로그 */
export interface AnalysisLogEntry {
  id: string;
  nodeId: string;
  nodeLabel: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning';
  message: string;
  detail: string;
  metrics: Array<{ label: string; value: string }>;
}

/** 브라우저에서 실제 영상 프레임을 샘플링해 추출한 신호 */
export interface VideoSignalMetrics {
  durationSec: number;
  sampledFrames: number;
  effectiveFps: number;
  frameWidth: number;
  frameHeight: number;
  brightness: FrameMetric[];
  motion: FrameMetric[];
  edgeDensity: FrameMetric[];
  sceneChanges: number[];
  thumbnails: string[];
  /** 프레임 차분 + 연결 요소 분석으로 추적한 형상 목록 */
  tracks: TrackedShape[];
  source: 'browser-video' | 'fallback';
}

/** 기능별 성능평가 지표 */
export interface FeaturePerformance {
  measured?: boolean;
  key: string;
  label: string;
  labelKo: string;
  description: string;
  latencyMs: number;
  throughput: number;
  accuracy: number;
  precision: number;
  recall: number;
  memoryMb: number;
  cpuPercent: number;
  gpuPercent: number;
  status: 'optimal' | 'normal' | 'degraded';
}

export interface AnalysisResult {
  engine: EngineChoice;
  generatedAt: string;
  videoName: string;
  durationSec: number;
  processedFrames: number;
  personsDetected: number;
  detections: PersonDetection[];
  behaviors: BehaviorEvent[];
  situations: Situation[];
  actions: ActionRecommendation[];
  /** 시간별 사고 인식 결과 */
  accidents: AccidentEvent[];
  /** 영상 텍스트 설명 결과 */
  videoDescription: VideoDescription;
  /** 실제 영상 프레임에서 추출한 신호(업로드 영상일 때만) */
  videoSignals?: VideoSignalMetrics;
  /** 파이프라인 노드별 분석 상세 로그 */
  analysisLog: AnalysisLogEntry[];
  /** 엔진이 실제로 측정한 분석 단계 시간(ms) */
  engineTimings?: Record<string, number>;
  crowdDensity: FrameMetric[];
  confidenceSeries: FrameMetric[];
  motionSeries: FrameMetric[];
  /** 기능별 성능평가 분석 데이터 */
  performanceEvaluation: FeaturePerformance[];
  summary: {
    riskScore: number;
    complianceScore: number;
    avgConfidence: number;
    peakCrowd: number;
    totalBehaviors: number;
    criticalCount: number;
  };
}

// ============================================================
// 시각화/UI 타입
// ============================================================

export interface MetricCardData {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  trend?: 'up' | 'down' | 'flat';
  accent: string;
  icon?: string;
}

export interface Toast {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'warning' | 'error';
}
