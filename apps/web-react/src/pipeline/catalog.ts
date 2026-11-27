import type { NodeKind } from '@/types';

export interface NodeKindMeta {
  kind: NodeKind;
  labelKo: string;
  label: string;
  color: string;
  description: string;
  defaultLabel: string;
}

export const NODE_KIND_META: Record<NodeKind, NodeKindMeta> = {
  source: {
    kind: 'source',
    labelKo: '입력',
    label: 'Source',
    color: '#22d3ee',
    description: '영상 파일 또는 스트림을 파이프라인으로 유입합니다.',
    defaultLabel: '영상 입력',
  },
  transform: {
    kind: 'transform',
    labelKo: '변환',
    label: 'Transform',
    color: '#a78bfa',
    description: '입력을 분석 가능한 프레임 단위로 변환합니다.',
    defaultLabel: '프레임 디코딩',
  },
  analysis: {
    kind: 'analysis',
    labelKo: '분석',
    label: 'Analysis',
    color: '#34d399',
    description: '인물 감지, 행동 인식, 상황 판단 등 AI 분석을 수행합니다.',
    defaultLabel: '분석 노드',
  },
  output: {
    kind: 'output',
    labelKo: '출력',
    label: 'Output',
    color: '#fb923c',
    description: '분석 결과를 리포트/조치 형태로 출력합니다.',
    defaultLabel: '결과 출력',
  },
};

export const NODE_KINDS: NodeKind[] = ['source', 'transform', 'analysis', 'output'];
