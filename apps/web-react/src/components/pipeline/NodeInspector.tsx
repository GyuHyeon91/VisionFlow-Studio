import { Power, Trash2, Unlink } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { NODE_KIND_META } from '@/pipeline/catalog';
import DataCard from '@/components/panels/DataCard';

export default function NodeInspector() {
  const selectedId = useStore((s) => s.selectedNodeId);
  const graph = useStore((s) => s.graph);
  const toggleNode = useStore((s) => s.toggleNode);
  const removeNode = useStore((s) => s.removeNode);
  const renameNode = useStore((s) => s.renameNode);
  const removeEdge = useStore((s) => s.removeEdge);
  const node = graph.nodes.find((n) => n.id === selectedId);

  return (
    <DataCard
      dataKey="pipeline-node"
      title="노드 속성"
      description="캔버스에서 선택한 노드의 유형·상태·실행 시간·출력 내용과 연결 정보를 표시합니다."
      icon={<Power size={15} />}
      bodyClassName="card-pad"
    >
      {!node ? (
        <div className="result-empty" style={{ minHeight: 220 }}>
          <div className="result-empty-icon">⌁</div>
          <div className="text-sm">캔버스에서 노드를 선택하면 속성이 표시됩니다.</div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="card-icon" style={{ color: NODE_KIND_META[node.type].color, background: `color-mix(in srgb, ${NODE_KIND_META[node.type].color} 14%, transparent)` }}>⌁</div>
            <div>
              <div className="card-title">선택된 노드</div>
              <div className="card-subtitle mono">{node.id}</div>
            </div>
            <div className="card-head-spacer" />
            <button className="icon-btn" title="활성/비활성" onClick={() => toggleNode(node.id)}>
              <Power size={15} color={node.enabled ? 'var(--success)' : 'var(--text-faint)'} />
            </button>
            <button className="icon-btn" title="삭제" onClick={() => removeNode(node.id)}><Trash2 size={15} color="var(--danger)" /></button>
          </div>

          <div className="field mt-4">
            <div className="field-label"><span>라벨</span></div>
            <input
              className="ghost-btn full"
              style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }}
              value={node.label}
              onChange={(e) => renameNode(node.id, e.target.value)}
            />
          </div>

          <div className="flex justify-between text-sm mt-2"><span className="dim">유형</span><span style={{ color: NODE_KIND_META[node.type].color, fontWeight: 700 }}>{NODE_KIND_META[node.type].labelKo} · {NODE_KIND_META[node.type].label}</span></div>
          <div className="flex justify-between text-sm mt-2"><span className="dim">상태</span><span className="mono accent">{node.status}</span></div>
          <div className="flex justify-between text-sm mt-2"><span className="dim">실행 시간</span><span className="mono">{node.durationMs ? `${node.durationMs}ms` : '-'}</span></div>
          <div className="flex justify-between text-sm mt-2"><span className="dim">출력</span><span className="dim text-xs" style={{ maxWidth: 150, textAlign: 'right' }}>{node.output ?? '-'}</span></div>

          <div className="divider" />
          <div className="text-xs faint" style={{ marginBottom: 8 }}>연결 ({graph.edges.filter((e) => e.from === node.id || e.to === node.id).length})</div>
          <div className="flex flex-col gap-2">
            {graph.edges.filter((e) => e.from === node.id || e.to === node.id).map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="mono dim">{e.from} → {e.to}</span>
                <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => removeEdge(e.from, e.to)}><Unlink size={12} /></button>
              </div>
            ))}
          </div>
        </>
      )}
    </DataCard>
  );
}
