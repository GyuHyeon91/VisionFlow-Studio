import appConfig from '@/config';
import type { PipelineEdge, PipelineEdgeConfig, PipelineNode, PipelineNodeConfig } from '@/types';

export interface PipelineGraph {
  version: number;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  order: string[];
  updatedAt: string;
}

/** 자동 레이아웃 상수 — 노드 크기(178×104)보다 크게 잡아 겹침 방지 */
const COL_W = 198;
const ROW_H = 124;
const MARGIN = 20;

/** 위상 정렬에서 각 노드의 깊이(열)를 계산 */
function computeDepth(nodes: PipelineNode[], edges: PipelineEdge[]): Map<string, number> {
  const enabled = new Set(nodes.filter((n) => n.enabled).map((n) => n.id));
  const indeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => {
    if (enabled.has(n.id)) { indeg.set(n.id, 0); adj.set(n.id, []); }
  });
  edges.forEach((e) => {
    if (enabled.has(e.from) && enabled.has(e.to)) {
      indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
      adj.get(e.from)?.push(e.to);
    }
  });
  const depth = new Map<string, number>();
  const queue = [...indeg.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  queue.forEach((id) => depth.set(id, 0));
  while (queue.length) {
    const id = queue.shift()!;
    const d = depth.get(id) ?? 0;
    adj.get(id)?.forEach((next) => {
      depth.set(next, Math.max(depth.get(next) ?? 0, d + 1));
      indeg.set(next, (indeg.get(next) ?? 0) - 1);
      if (indeg.get(next) === 0) queue.push(next);
    });
  }
  // 사이클/비활성 노드는 마지막 열로
  nodes.forEach((n) => {
    if (!depth.has(n.id)) depth.set(n.id, Math.max(0, ...[...depth.values()]));
  });
  return depth;
}

/** 깊이별 열 + 열 내 행으로 자동 배치. 어떤 조합에서도 노드가 겹치지 않는다. */
function autoLayout(nodes: PipelineNode[], edges: PipelineEdge[]): PipelineNode[] {
  const depth = computeDepth(nodes, edges);
  const column = new Map<number, PipelineNode[]>();
  [...nodes]
    .sort((a, b) => (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0))
    .forEach((n) => {
      const d = depth.get(n.id) ?? 0;
      if (!column.has(d)) column.set(d, []);
      column.get(d)!.push(n);
    });
  return nodes.map((n) => {
    const d = depth.get(n.id) ?? 0;
    const row = column.get(d)!.findIndex((x) => x.id === n.id);
    return {
      ...n,
      x: MARGIN + d * COL_W,
      y: MARGIN + row * ROW_H,
    };
  });
}

/** 설정의 노드/엣지를 실제 그래프(위치 포함)로 변환 */
export function buildGraph(
  nodeConfigs: PipelineNodeConfig[] = appConfig.pipeline.nodes,
  edgeConfigs: PipelineEdgeConfig[] = appConfig.pipeline.edges,
  version = 1,
): PipelineGraph {
  const nodes: PipelineNode[] = nodeConfigs.map((n) => ({
    ...n, x: 0, y: 0, status: 'idle', progress: 0,
  }));
  const edges: PipelineEdge[] = edgeConfigs.map((e) => ({ ...e, active: true }));
  const arranged = autoLayout(nodes, edges);
  return {
    version,
    nodes: arranged,
    edges,
    order: topologicalOrder(arranged, edges),
    updatedAt: new Date().toISOString(),
  };
}

/** 위상 정렬 (사이클 감지 포함). 사이클 시 접근 가능한 순서를 반환 */
export function topologicalOrder(nodes: PipelineNode[], edges: PipelineEdge[]): string[] {
  const enabled = new Set(nodes.filter((n) => n.enabled).map((n) => n.id));
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  nodes.forEach((n) => {
    if (enabled.has(n.id)) { indegree.set(n.id, 0); adjacency.set(n.id, []); }
  });
  edges.forEach((e) => {
    if (enabled.has(e.from) && enabled.has(e.to)) {
      indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1);
      adjacency.get(e.from)?.push(e.to);
    }
  });
  const queue = [...indegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    adjacency.get(id)?.forEach((next) => {
      const d = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, d);
      if (d === 0) queue.push(next);
    });
  }
  nodes.forEach((n) => {
    if (enabled.has(n.id) && !order.includes(n.id)) order.push(n.id);
  });
  return order;
}

/** 노드/엣지 변경 시 새 그래프 생성. 이전 위치는 겹치지 않는 한 보존 */
export function updateGraph(
  previous: PipelineGraph,
  nodeConfigs: PipelineNodeConfig[],
  edgeConfigs: PipelineEdgeConfig[],
): PipelineGraph {
  const prevById = new Map(previous.nodes.map((n) => [n.id, n]));
  const base: PipelineNode[] = nodeConfigs.map((n) => {
    const prev = prevById.get(n.id);
    return {
      ...n,
      x: prev?.x ?? 0,
      y: prev?.y ?? 0,
      status: prev?.status ?? 'idle',
      progress: prev?.progress ?? 0,
      durationMs: prev?.durationMs,
      output: prev?.output,
    };
  });
  const edges: PipelineEdge[] = edgeConfigs.map((e) => ({
    ...e,
    active: previous.edges.some((pe) => pe.from === e.from && pe.to === e.to) || true,
  }));
  const nodes = autoLayout(base, edges);

  return {
    version: previous.version + 1,
    nodes,
    edges,
    order: topologicalOrder(nodes, edges),
    updatedAt: new Date().toISOString(),
  };
}

export function nodeConfigsFromGraph(graph: PipelineGraph): PipelineNodeConfig[] {
  return graph.nodes.map(({ id, type, label, enabled }) => ({ id, type, label, enabled }));
}

export function edgeConfigsFromGraph(graph: PipelineGraph): PipelineEdgeConfig[] {
  return graph.edges.map(({ from, to }) => ({ from, to }));
}
