import { create } from 'zustand';
import appConfig, { backendBaseUrl } from '@/config';
import { createEngine } from '@/engine/factory';
import {
  buildGraph,
  edgeConfigsFromGraph,
  nodeConfigsFromGraph,
  updateGraph,
  type PipelineGraph,
} from '@/pipeline/graph';
import { executePipeline, type ExecutionHandle } from '@/pipeline/executor';
import { NODE_KIND_META } from '@/pipeline/catalog';
import type { AnalysisResult, AppConfig, NodeKind, ObjectMeasurement, Toast } from '@/types';

// 엔진/파이프라인 실행 핸들 (상태 외부에서 관리)
let analysisHandle: ExecutionHandle | null = null;
let pipelineHandle: ExecutionHandle | null = null;
let autoTimer: ReturnType<typeof setTimeout> | null = null;
let abortController: AbortController | null = null;

export type WorkTab = 'dashboard' | 'pipeline' | 'analysis' | 'behavior' | 'actions' | 'accidents' | 'description' | 'measurement' | 'training' | 'labeling' | 'stream' | 'performance' | 'settings' | 'catalog';

interface AppState {
  config: AppConfig;
  graph: PipelineGraph;
  result: AnalysisResult | null;
  video: { name: string; url?: string; size?: number; lastModified?: number } | null;
  running: boolean;
  stage: string;
  progress: number;
  tab: WorkTab;
  toasts: Toast[];
  selectedNodeId: string | null;
  lastUpdated: string | null;
  /** 데이터별 숨김/표시 상태 (키: 데이터 식별자) */
  dataVisibility: Record<string, boolean>;
  measurements: ObjectMeasurement[];
  detectionLatencyMs: number;
  /** 기능 안내 팝업 옵션 */
  guideEnabled: boolean;
  guideSeen: Record<string, boolean>;
  guideOpen: boolean;

  toggleDataVisibility: (key: string) => void;
  setGuideEnabled: (value: boolean) => void;
  openGuide: () => void;
  closeGuide: () => void;
  setDetectionLatency: (ms: number) => void;
  setMeasurements: (items: ObjectMeasurement[]) => void;
  setTab: (tab: WorkTab) => void;
  setVideo: (name: string, url?: string, meta?: { size?: number; lastModified?: number }) => void;
  setSelectedNode: (id: string | null) => void;

  setTopOption: (key: keyof AppConfig['options'], value: string) => void;
  setPerformance: (key: keyof AppConfig['performance'], value: boolean | number | string) => void;
  setAccuracy: (key: keyof AppConfig['accuracy'], value: boolean | number | string) => void;
  setMeasurement: (key: keyof AppConfig['measurement'], value: boolean | number | string) => void;
  setDetection: (key: keyof AppConfig['detection'], value: boolean | number | string) => void;
  setConfigSection: (section: 'preprocessing' | 'broker' | 'prediction' | 'accidentAnalysis' | 'detection' | 'accuracy' | 'training' | 'safety' | 'streaming' | 'storage', key: string, value: unknown) => void;
  setAutoUpdate: (value: boolean) => void;
  setDebounce: (value: number) => void;

  toggleNode: (id: string) => void;
  addNode: (type: NodeKind) => void;
  removeNode: (id: string) => void;
  renameNode: (id: string, label: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  addEdge: (from: string, to: string) => void;
  removeEdge: (from: string, to: string) => void;

  runAnalysis: (videoName?: string, force?: boolean) => Promise<void>;
  cancelAnalysis: () => void;
  resetPipeline: () => void;
  pushToast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;
}

const cloneConfig = (c: AppConfig): AppConfig => structuredClone(c);

/** 기능 안내 팝업 설정/방문 기록은 브라우저에 보관 (다른 프로젝트와 공유하지 않음) */
const GUIDE_KEY = 'visionflow-studio:guide';
function loadGuidePrefs(): { enabled: boolean; seen: Record<string, boolean> } {
  try {
    const raw = localStorage.getItem(GUIDE_KEY);
    if (!raw) return { enabled: true, seen: {} };
    const parsed = JSON.parse(raw);
    return { enabled: parsed.enabled !== false, seen: parsed.seen ?? {} };
  } catch {
    return { enabled: true, seen: {} };
  }
}
function saveGuidePrefs(enabled: boolean, seen: Record<string, boolean>) {
  try { localStorage.setItem(GUIDE_KEY, JSON.stringify({ enabled, seen })); } catch { /* 저장 불가 시 무시 */ }
}

/** 동일 영상+동일 옵션 재분석 시 결과를 재사용하기 위한 캐시 */
const resultCache = new Map<string, AnalysisResult>();
export const clearResultCache = () => resultCache.clear();
const configKey = (c: AppConfig) => JSON.stringify({
  p: c.performance,
  a: c.accuracy,
  m: c.measurement,
  det: c.detection,
  pre: c.preprocessing,
  brk: c.broker,
  pred: c.prediction,
  trn: c.training,
  safety: c.safety,
  stream: c.streaming,
  store: c.storage,
  e: c.options.analysisEngine.value,
  b: c.options.backend.value,
  d: c.options.design.value,
});
const videoKey = (v: { name: string; size?: number; lastModified?: number }) =>
  `${v.name}:${v.size ?? 0}:${v.lastModified ?? 0}`;

function scheduleAutoUpdate(get: () => AppState) {
  const state = get();
  if (!state.config.pipeline.autoUpdate.value) return;
  if (autoTimer) clearTimeout(autoTimer);
  // 업로드된 영상이 없으면 데모 분석을 실행하지 않는다.
  if (!state.video) return;
  const delay = state.config.pipeline.autoUpdateDebounceMs.value;
  const videoName = state.video.name;
  autoTimer = setTimeout(() => {
    void get().runAnalysis(videoName);
  }, delay);
}

export const useStore = create<AppState>((set, get) => ({
  config: cloneConfig(appConfig),
  graph: buildGraph(appConfig.pipeline.nodes, appConfig.pipeline.edges, 1),
  result: null,
  video: null,
  running: false,
  stage: '대기 중',
  progress: 0,
  tab: 'dashboard',
  toasts: [],
  selectedNodeId: null,
  lastUpdated: null,
  dataVisibility: {},
  measurements: [],
  detectionLatencyMs: 0,
  guideEnabled: loadGuidePrefs().enabled,
  guideSeen: loadGuidePrefs().seen,
  guideOpen: false,

  setMeasurements: (items) => set({ measurements: items }),
  setDetectionLatency: (ms) => set({ detectionLatencyMs: Math.round(ms) }),

  toggleDataVisibility: (key) => {
    set((s) => ({
      dataVisibility: { ...s.dataVisibility, [key]: s.dataVisibility[key] === false },
    }));
  },

  setGuideEnabled: (value) => {
    set((s) => {
      saveGuidePrefs(value, s.guideSeen);
      return { guideEnabled: value };
    });
  },
  openGuide: () => set({ guideOpen: true }),
  closeGuide: () => {
    set((s) => {
      const seen = { ...s.guideSeen, [s.tab]: true };
      saveGuidePrefs(s.guideEnabled, seen);
      return { guideOpen: false, guideSeen: seen };
    });
  },

  setTab: (tab) => set({ tab }),
  setVideo: (name, url, meta) => {
    set({ video: { name, url, size: meta?.size, lastModified: meta?.lastModified } });
    scheduleAutoUpdate(get);
  },
  setSelectedNode: (id) => set({ selectedNodeId: id }),

  setTopOption: (key, value) => {
    const config = cloneConfig(get().config);
    (config.options[key] as { value: unknown }).value = value;
    set({ config });
    get().pushToast(`옵션 변경: ${key} → ${value}`, 'info');
    scheduleAutoUpdate(get);
  },

  setPerformance: (key, value) => {
    const config = cloneConfig(get().config);
    (config.performance[key] as { value: unknown }).value = value;
    set({ config });
    scheduleAutoUpdate(get);
  },

  setAccuracy: (key, value) => {
    const config = cloneConfig(get().config);
    (config.accuracy[key] as { value: unknown }).value = value;
    set({ config });
    scheduleAutoUpdate(get);
  },

  setMeasurement: (key, value) => {
    const config = cloneConfig(get().config);
    (config.measurement[key] as { value: unknown }).value = value;
    set({ config });
    scheduleAutoUpdate(get);
  },

  setDetection: (key, value) => {
    const config = cloneConfig(get().config);
    (config.detection[key] as { value: unknown }).value = value;
    set({ config });
    // 모델/런타임 변경은 백엔드에 즉시 반영 (재시작 불필요)
    if (key === 'model' || key === 'runtime') {
      const params = new URLSearchParams({
        model: config.detection.model.value,
        runtime: config.detection.runtime.value,
      });
      void fetch(`${backendBaseUrl()}/api/model/set?${params}`, { method: 'POST' }).catch(() => {});
    }
    scheduleAutoUpdate(get);
  },

  setConfigSection: (section, key, value) => {
    const config = cloneConfig(get().config);
    (config[section] as unknown as Record<string, { value: unknown }>)[key].value = value;
    // 감지 모델·추론 해상도 등이 바뀌면 이전 분석 결과는 무효 → 캐시 초기화
    if (section === 'detection' || section === 'preprocessing' || section === 'accuracy') {
      clearResultCache();
    }
    set({ config });
    scheduleAutoUpdate(get);
  },

  setAutoUpdate: (value) => {
    const config = cloneConfig(get().config);
    config.pipeline.autoUpdate.value = value;
    set({ config });
    get().pushToast(`파이프라인 자동 업데이트 ${value ? '활성' : '비활성'}`, 'info');
  },

  setDebounce: (value) => {
    const config = cloneConfig(get().config);
    config.pipeline.autoUpdateDebounceMs.value = value;
    set({ config });
  },

  toggleNode: (id) => {
    const state = get();
    const nodeConfigs = nodeConfigsFromGraph(state.graph).map((n) =>
      n.id === id ? { ...n, enabled: !n.enabled } : n,
    );
    const graph = updateGraph(state.graph, nodeConfigs, edgeConfigsFromGraph(state.graph));
    set({ graph, lastUpdated: graph.updatedAt });
    state.pushToast(`노드 ${id} ${nodeConfigs.find((n) => n.id === id)?.enabled ? '활성' : '비활성'}`, 'info');
    scheduleAutoUpdate(get);
  },

  addNode: (type) => {
    const state = get();
    const id = `${type}-${Date.now().toString(36)}`;
    const nodeConfigs = [
      ...nodeConfigsFromGraph(state.graph),
      { id, type, label: NODE_KIND_META[type].defaultLabel, enabled: true },
    ];
    // 이전 노드와 자동 연결 (첫 노드 제외)
    const prev = nodeConfigs.filter((n) => n.id !== id).slice(-1)[0];
    const edges = edgeConfigsFromGraph(state.graph);
    if (prev) edges.push({ from: prev.id, to: id });
    const graph = updateGraph(state.graph, nodeConfigs, edges);
    set({ graph, lastUpdated: graph.updatedAt, selectedNodeId: id });
    state.pushToast(`노드 추가: ${NODE_KIND_META[type].labelKo}`, 'success');
    scheduleAutoUpdate(get);
  },

  removeNode: (id) => {
    const state = get();
    const nodeConfigs = nodeConfigsFromGraph(state.graph).filter((n) => n.id !== id);
    const edges = edgeConfigsFromGraph(state.graph).filter((e) => e.from !== id && e.to !== id);
    const graph = updateGraph(state.graph, nodeConfigs, edges);
    set({ graph, lastUpdated: graph.updatedAt, selectedNodeId: null });
    state.pushToast(`노드 삭제: ${id}`, 'warning');
    scheduleAutoUpdate(get);
  },

  renameNode: (id, label) => {
    const state = get();
    const nodeConfigs = nodeConfigsFromGraph(state.graph).map((n) =>
      n.id === id ? { ...n, label } : n,
    );
    const graph = updateGraph(state.graph, nodeConfigs, edgeConfigsFromGraph(state.graph));
    set({ graph, lastUpdated: graph.updatedAt });
    scheduleAutoUpdate(get);
  },

  moveNode: (id, x, y) => {
    const state = get();
    const graph: PipelineGraph = {
      ...state.graph,
      nodes: state.graph.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    };
    set({ graph });
  },

  addEdge: (from, to) => {
    if (from === to) return;
    const state = get();
    const edges = edgeConfigsFromGraph(state.graph);
    if (edges.some((e) => e.from === from && e.to === to)) return;
    edges.push({ from, to });
    const graph = updateGraph(state.graph, nodeConfigsFromGraph(state.graph), edges);
    set({ graph, lastUpdated: graph.updatedAt });
    state.pushToast('노드 연결 추가', 'success');
    scheduleAutoUpdate(get);
  },

  removeEdge: (from, to) => {
    const state = get();
    const edges = edgeConfigsFromGraph(state.graph).filter((e) => !(e.from === from && e.to === to));
    const graph = updateGraph(state.graph, nodeConfigsFromGraph(state.graph), edges);
    set({ graph, lastUpdated: graph.updatedAt });
    state.pushToast('노드 연결 제거', 'warning');
    scheduleAutoUpdate(get);
  },

  runAnalysis: async (videoName, force = false) => {
    if (force) clearResultCache();
    const state = get();
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    if (state.running) {
      pipelineHandle?.cancel();
      abortController?.abort();
    }

    const name = videoName ?? state.video?.name;
    // 업로드된 영상이 없으면 분석을 시작하지 않는다 (데모 분석 없음)
    if (!name) {
      state.pushToast('분석할 영상을 먼저 업로드해 주세요.', 'warning');
      return;
    }
    // 동일 영상+옵션이면 캐시 결과를 즉시 재사용 (파이프라인 재실행 불필요)
    const cacheKey = state.video ? `${videoKey(state.video)}|${configKey(state.config)}` : '';
    const cached = resultCache.get(cacheKey);
    if (cached) {
      set({
        result: cached,
        running: false,
        progress: 1,
        stage: '캐시된 결과 사용',
        video: state.video,
        lastUpdated: new Date().toISOString(),
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.map((n) => ({
            ...n,
            status: n.enabled ? 'done' : 'idle',
            progress: 1,
            durationMs: 0,
            output: '캐시에서 로드',
          })),
        },
      });
      state.pushToast('동일 영상·옵션의 캐시 결과를 사용했습니다.', 'info');
      return;
    }

    abortController = new AbortController();

    set({
      running: true,
      progress: 0,
      stage: '파이프라인 초기화',
      graph: { ...state.graph, nodes: state.graph.nodes.map((n) => ({ ...n, status: 'idle', progress: 0 })) },
    });

    // 1) 파이프라인 실행 (노드별 진행 표시)
    pipelineHandle = executePipeline(get().graph, get().config, {
      onNodeStart: (id) => {
        set((s) => ({
          stage: s.graph.nodes.find((n) => n.id === id)?.label ?? '실행 중',
          graph: {
            ...s.graph,
            nodes: s.graph.nodes.map((n) => (n.id === id ? { ...n, status: 'running', progress: 0 } : n)),
          },
        }));
      },
      onNodeProgress: (id, p) => {
        set((s) => ({
          progress: p,
          graph: {
            ...s.graph,
            nodes: s.graph.nodes.map((n) => (n.id === id ? { ...n, progress: p } : n)),
          },
        }));
      },
      onNodeDone: (id, durationMs, output) => {
        set((s) => ({
          graph: {
            ...s.graph,
            nodes: s.graph.nodes.map((n) =>
              n.id === id ? { ...n, status: 'done', progress: 1, durationMs, output } : n,
            ),
          },
        }));
      },
    });

    try {
      await pipelineHandle.promise;
    } catch {
      // 취소됨
    }

    // 2) 분석 엔진 실행 (옵션으로 선택된 엔진)
    try {
      const engine = createEngine();
      set({ stage: `${engine.name} 엔진 분석 중`, progress: 0 });
      const result = await engine.analyze({
        videoName: name,
        videoUrl: state.video?.url,
        config: get().config,
        signal: abortController.signal,
        onProgress: (p, stage) => set({ progress: p, stage }),
      });

      if (cacheKey) resultCache.set(cacheKey, result);
      set((s) => ({
        result,
        running: false,
        progress: 1,
        stage: '완료',
        graph: {
          ...s.graph,
          nodes: s.graph.nodes.map((n) => ({
            ...n,
            durationMs: result.engineTimings?.[n.id] ?? n.durationMs,
          })),
        },
        video: {
          name,
          url: state.video?.url,
          size: state.video?.size,
          lastModified: state.video?.lastModified,
        },
        lastUpdated: new Date().toISOString(),
      }));
      get().pushToast('분석이 완료되었습니다.', 'success');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        set({ running: false, stage: '취소됨' });
        return;
      }
      set({ running: false, stage: '오류 발생' });
      get().pushToast(`분석 실패: ${(err as Error).message}`, 'error');
    }
  },

  cancelAnalysis: () => {
    pipelineHandle?.cancel();
    abortController?.abort();
    set({ running: false, stage: '취소됨' });
    get().pushToast('분석을 취소했습니다.', 'info');
  },

  resetPipeline: () => {
    const graph = buildGraph(appConfig.pipeline.nodes, appConfig.pipeline.edges, get().graph.version + 1);
    set({ graph, config: cloneConfig(appConfig), lastUpdated: graph.updatedAt });
    get().pushToast('파이프라인을 초기화했습니다.', 'info');
    scheduleAutoUpdate(get);
  },

  pushToast: (message, tone = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => get().dismissToast(id), 3600);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export default useStore;
