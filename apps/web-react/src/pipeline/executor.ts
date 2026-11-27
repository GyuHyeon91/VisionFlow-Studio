import type { AppConfig, PipelineNode } from '@/types';
import type { PipelineGraph } from './graph';

export interface ExecutionHandle {
  promise: Promise<void>;
  cancel: () => void;
}

export interface ExecutorCallbacks {
  onNodeStart?: (id: string) => void;
  onNodeProgress?: (id: string, progress: number) => void;
  onNodeDone?: (id: string, durationMs: number, output: string) => void;
  onNodeError?: (id: string, error: string) => void;
}

const OUTPUT_SUMMARY: Record<string, string> = {
  ingest: '영상 스트림 로드 완료',
  decode: '프레임 시퀀스 생성',
  signals: '밝기·모션·엣지 신호 추출',
  track: '형상 검출 및 트랙 매칭 완료',
  detect: '인물 감지 완료',
  behavior: '행동 이벤트 추출',
  accidents: '시간별 사고 인식 완료',
  situation: '상황 판단 완료',
  action: '조치 권고 매핑',
  description: '영상 텍스트 설명 생성',
  performance: '기능별 성능평가 완료',
  report: '리포트 생성',
};

/**
 * 파이프라인 실행기.
 * - 위상 정렬 순서대로 노드를 실행한다.
 * - performance.concurrency 만큼 동시 실행을 허용한다.
 * - 파이프라인이 수정되면 새 그래프를 받아 재실행된다.
 */
export function executePipeline(
  graph: PipelineGraph,
  config: AppConfig,
  callbacks: ExecutorCallbacks = {},
): ExecutionHandle {
  let cancelled = false;
  const queue = [...graph.order];
  const concurrency = Math.max(1, Math.min(config.performance.concurrency.value, 16));
  const speedFactor = 15 / Math.max(config.performance.fps.value, 1);
  const baseDuration = 220 * speedFactor;

  const runOne = async (id: string) => {
    const node = graph.nodes.find((n) => n.id === id);
    if (!node || !node.enabled || cancelled) return;
    callbacks.onNodeStart?.(id);
    const started = Date.now();
    const steps = 10;
    for (let s = 1; s <= steps; s += 1) {
      if (cancelled) return;
      await new Promise<void>((resolve) => setTimeout(resolve, (baseDuration / steps) * (0.6 + Math.random() * 0.8)));
      callbacks.onNodeProgress?.(id, s / steps);
    }
    const durationMs = Date.now() - started;
    callbacks.onNodeDone?.(id, durationMs, OUTPUT_SUMMARY[id] ?? `${node.label} 완료`);
  };

  const worker = async () => {
    while (queue.length && !cancelled) {
      const id = queue.shift()!;
      await runOne(id);
    }
  };

  const promise = Promise.all(Array.from({ length: concurrency }, () => worker())).then(() => {
    if (cancelled) throw new DOMException('Aborted', 'AbortError');
  });

  return {
    promise,
    cancel: () => { cancelled = true; },
  };
}

export function resetNode(node: PipelineNode): PipelineNode {
  return { ...node, status: 'idle', progress: 0, durationMs: undefined, output: undefined };
}
