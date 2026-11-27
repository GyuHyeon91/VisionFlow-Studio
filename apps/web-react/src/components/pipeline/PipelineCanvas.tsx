import { useRef, useState } from 'react';
import {
  Activity, BarChart3, GitBranch, Info, Maximize2, Plus, RotateCcw,
  ZoomIn, ZoomOut,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { NODE_KIND_META, NODE_KINDS } from '@/pipeline/catalog';
import type { NodeKind } from '@/types';

const STATUS_COLOR: Record<string, string> = {
  idle: 'var(--text-faint)',
  running: 'var(--warning)',
  done: 'var(--success)',
  error: 'var(--danger)',
};

// 캔버스 논리 좌표계
const CANVAS_W = 2280;  // 약 11열 × 198px + 여백 (깊이별 자동 배치)
const CANVAS_H = 820;
const NODE_W = 178;
const NODE_H = 104;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** 레이어 정의 — 고급 시각화용 그룹 배경 */
const LAYERS = [
  { id: 'input', label: '입력 · 전처리', x: 10, y: 10, w: 440, h: 800, color: '#22d3ee' },
  { id: 'detect', label: '탐지 · 추적', x: 458, y: 10, w: 640, h: 800, color: '#a78bfa' },
  { id: 'analyze', label: '사고 · 행동 분석', x: 1106, y: 10, w: 720, h: 800, color: '#34d399' },
  { id: 'output', label: '검토 · 출력', x: 1834, y: 10, w: 436, h: 800, color: '#fb923c' },
];

interface DragState { id: string; dx: number; dy: number; }

export default function PipelineCanvas() {
  const graph = useStore((s) => s.graph);
  const moveNode = useStore((s) => s.moveNode);
  const addNode = useStore((s) => s.addNode);
  const resetPipeline = useStore((s) => s.resetPipeline);
  const selected = useStore((s) => s.selectedNodeId);
  const setSelected = useStore((s) => s.setSelectedNode);
  const autoUpdate = useStore((s) => s.config.pipeline.autoUpdate.value);
  const result = useStore((s) => s.result);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [tick, setTick] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showLayers, setShowLayers] = useState(true);
  const [hover, setHover] = useState<string | null>(null);

  const toLogical = (clientX: number, clientY: number) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: (clientX - rect.left + el.scrollLeft) / zoom,
      y: (clientY - rect.top + el.scrollTop) / zoom,
    };
  };

  const onPointerDown = (e: React.PointerEvent, id: string, x: number, y: number) => {
    const p = toLogical(e.clientX, e.clientY);
    drag.current = { id, dx: p.x - x, dy: p.y - y };
    setSelected(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = toLogical(e.clientX, e.clientY);
    moveNode(
      drag.current.id,
      clamp(p.x - drag.current.dx, 0, CANVAS_W - NODE_W),
      clamp(p.y - drag.current.dy, 0, CANVAS_H - NODE_H),
    );
    setTick((t) => t + 1);
  };

  const onPointerUp = () => { drag.current = null; };
  const changeZoom = (delta: number) =>
    setZoom((z) => clamp(Math.round((z + delta) * 10) / 10, ZOOM_MIN, ZOOM_MAX));

  const nodeById = (id: string) => graph.nodes.find((n) => n.id === id);

  /** 노드 상세 데이터 — 실제 분석 결과에서 가져와 이해도 향상 */
  const nodeDetail = (id: string) => {
    const base: Record<string, { input: string; output: string; note: string }> = {
      ingest: { input: '영상 파일', output: `${result ? 1 : 0}개 소스`, note: '원본 영상은 저장·재생용으로 유지' },
      decode: { input: '원본 프레임', output: `${result?.processedFrames ?? 0}프레임`, note: '30fps 원본 읽기' },
      preprocess: { input: '원본 프레임', output: '640px · 6fps', note: 'AI 추론용 축소/샘플링 (CPU 속도 개선)' },
      signals: { input: '샘플 프레임', output: `${result?.motionSeries?.length ?? 0}개 구간`, note: '밝기·모션·엣지 신호' },
      detect: { input: '축소 프레임', output: `${result?.detections?.length ?? 0}감지`, note: 'YOLO 객체 탐지 (사람/차량/지게차)' },
      track: { input: '감지 결과', output: `${new Set((result?.detections ?? []).map((d) => (d as unknown as { trackId?: string }).trackId).filter(Boolean)).size}트랙`, note: 'ByteTrack ID 유지 · 이동 경로' },
      pose: { input: '사람 BBox', output: '관절 좌표', note: '자세 변화·기울기 분석' },
      behavior: { input: '트랙+자세', output: `${result?.behaviors?.length ?? 0}건`, note: '시계열 행동 분류' },
      accidents: { input: '이동/자세', output: `${result?.accidents?.length ?? 0}건`, note: '시간적 근거 기반 사고 판단' },
      industrial: { input: '사고+객체', output: '위험 분석', note: '지게차-작업자·추락·협착' },
      situation: { input: '분석 이벤트', output: `${result?.situations?.length ?? 0}상황`, note: '이벤트 조합 상황 판단' },
      action: { input: '상황', output: `${result?.actions?.length ?? 0}조치`, note: '대응 절차 매핑' },
      description: { input: '분석 결과', output: `${result?.videoDescription?.captions?.length ?? 0}캡션`, note: '실제 감지 기반 텍스트' },
      performance: { input: '처리 시간', output: `${result?.engineTimings?.perFrameMs ?? 0}ms/프레임`, note: '실제 측정값만 표시' },
      review: { input: '사고 의심', output: '검토 필요', note: '사용자 검증 후 확정' },
      report: { input: '전체 결과', output: '리포트', note: '시각화용 데이터 조립' },
    };
    return base[id] ?? { input: '-', output: '-', note: '' };
  };

  return (
    <div className="card">
      <div className="pipeline-toolbar">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="accent" />
          <span className="text-sm" style={{ fontWeight: 700 }}>파이프라인 그래프</span>
          <span className="chip mono">v{graph.version}</span>
          {autoUpdate && <span className="chip accent">AUTO-UPDATE</span>}
          <span className="chip mono">{graph.nodes.length} 노드 · {graph.edges.length} 연결</span>
        </div>
        <div className="card-head-spacer" />
        <button className="ghost-btn" style={{ padding: '6px 10px', fontSize: 10 }} onClick={() => setShowLayers((v) => !v)}>
          <Info size={12} /> 레이어 {showLayers ? '숨김' : '표시'}
        </button>
        {NODE_KINDS.map((k) => (
          <button key={k} className="ghost-btn" style={{ padding: '6px 10px', fontSize: 10 }} onClick={() => addNode(k as NodeKind)}>
            <Plus size={12} style={{ color: NODE_KIND_META[k].color }} /> {NODE_KIND_META[k].labelKo}
          </button>
        ))}
        <div className="zoom-controls">
          <button className="icon-btn" style={{ width: 28, height: 28 }} title="축소" onClick={() => changeZoom(-ZOOM_STEP)}><ZoomOut size={13} /></button>
          <span className="chip mono" style={{ minWidth: 46, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button className="icon-btn" style={{ width: 28, height: 28 }} title="확대" onClick={() => changeZoom(ZOOM_STEP)}><ZoomIn size={13} /></button>
          <button className="icon-btn" style={{ width: 28, height: 28 }} title="배율 초기화" onClick={() => setZoom(1)}><Maximize2 size={13} /></button>
        </div>
        <button className="ghost-btn" style={{ padding: '6px 10px', fontSize: 10 }} onClick={resetPipeline}>
          <RotateCcw size={12} /> 초기화
        </button>
      </div>

      <div className="canvas-wrap" ref={canvasRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
        <div className="canvas-stage" style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom }}>
          <div className="canvas-inner" style={{ transform: `scale(${zoom})` }}>
            {showLayers && LAYERS.map((layer) => (
              <div
                key={layer.id}
                className="pipeline-layer"
                style={{
                  left: layer.x, top: layer.y, width: layer.w, height: layer.h,
                  borderColor: `color-mix(in srgb, ${layer.color} 25%, transparent)`,
                  background: `color-mix(in srgb, ${layer.color} 4%, transparent)`,
                }}
              >
                <span className="pipeline-layer-label" style={{ color: layer.color }}>{layer.label}</span>
              </div>
            ))}

            <svg className="canvas-edges" key={`edges-${tick}-${graph.version}`}>
              <defs>
                <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--accent-2)" />
                </linearGradient>
                <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill="var(--accent)" />
                </marker>
              </defs>
              {graph.edges.map((edge, i) => {
                const a = nodeById(edge.from);
                const b = nodeById(edge.to);
                if (!a || !b) return null;
                const x1 = a.x + NODE_W;
                const y1 = a.y + 46;
                const x2 = b.x;
                const y2 = b.y + 46;
                const mx = (x1 + x2) / 2;
                const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                const active = a.status === 'done' && b.status !== 'idle';
                return (
                  <g key={`${edge.from}-${edge.to}-${i}`}>
                    <path d={d} fill="none" stroke="var(--panel-border-strong)" strokeWidth={2} />
                    <path
                      d={d} fill="none" stroke="url(#edgeGrad)"
                      strokeWidth={active ? 2.5 : 1.5}
                      strokeDasharray={active ? '0' : '5 5'}
                      markerEnd="url(#arrowHead)"
                      opacity={active ? 1 : 0.55}
                    >
                      {active && <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />}
                    </path>
                  </g>
                );
              })}
            </svg>

            {graph.nodes.map((node) => {
              const meta = NODE_KIND_META[node.type];
              const detail = nodeDetail(node.id);
              const isHover = hover === node.id;
              return (
                <div
                  key={node.id}
                  className={[
                    'pnode', selected === node.id ? 'selected' : '',
                    !node.enabled ? 'disabled' : '', `status-${node.status}`,
                  ].filter(Boolean).join(' ')}
                  style={{ left: node.x, top: node.y }}
                  onPointerDown={(e) => onPointerDown(e, node.id, node.x, node.y)}
                  onMouseEnter={() => setHover(node.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <div className="pnode-top">
                    <span className="pnode-icon" style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}>
                      <GitBranch size={14} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="pnode-label">{node.label}</div>
                      <div className="pnode-kind">{meta.label}</div>
                    </div>
                    <span className="pnode-status-dot" style={{ background: STATUS_COLOR[node.status] }} />
                  </div>
                  <div className="pnode-progress">
                    <div className="pnode-progress-fill" style={{ width: `${node.progress * 100}%` }} />
                  </div>
                  <div className="pnode-output">{node.output ?? detail.output}</div>
                  <div className="pnode-metrics">
                    <span><BarChart3 size={9} /> {detail.input}</span>
                    <span><Activity size={9} /> {detail.output}</span>
                  </div>
                  {isHover && (
                    <div className="pnode-tooltip">
                      <b>{node.label}</b>
                      <div>{meta.description}</div>
                      <div className="mono">입력: {detail.input}</div>
                      <div className="mono">출력: {detail.output}</div>
                      <div className="mono">상태: {node.status} · {Math.round(node.progress * 100)}%</div>
                      {node.durationMs && <div className="mono">지연: {node.durationMs}ms</div>}
                      {detail.note && <div className="faint">{detail.note}</div>}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 미니맵 */}
            <div className="pipeline-minimap">
              <div className="pipeline-minimap-inner" style={{ transform: `scale(${150 / CANVAS_W})` }}>
                {graph.nodes.map((n) => (
                  <span key={n.id} style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H, background: NODE_KIND_META[n.type].color }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderTop: '1px solid var(--panel-border)' }}>
        <span className="text-xs faint">
          노드를 드래그해 배치를 변경하고, 옵션 수정 시 자동 재구성됩니다. 노드에 마우스를 올리면 상세 입출력 데이터가 표시됩니다.
        </span>
        <span className="text-xs mono accent">마지막 갱신 {graph.updatedAt.slice(11, 19)}</span>
      </div>
    </div>
  );
}
