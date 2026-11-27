import { Activity, BrainCircuit, Clock3, Database, FileText, Gauge, GitBranch, LayoutDashboard, Radio, Ruler, ScanFace, Settings2, ShieldAlert, Tags, Waypoints, Zap } from 'lucide-react';
import { useStore, type WorkTab } from '@/store/useStore';
import appConfig from '@/config';

const NAV: Array<{ id: WorkTab; label: string; icon: typeof LayoutDashboard; badge?: string }> = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'pipeline', label: '파이프라인', icon: GitBranch, badge: 'LIVE' },
  { id: 'analysis', label: '영상 데이터 분석', icon: Activity },
  { id: 'behavior', label: '인물 행동 감지', icon: ScanFace },
  { id: 'actions', label: '상황별 조치', icon: ShieldAlert },
  { id: 'accidents', label: '시간별 사고 인식', icon: Clock3 },
  { id: 'description', label: '영상 텍스트 설명', icon: FileText },
  { id: 'measurement', label: '사물 측정', icon: Ruler },
  { id: 'training', label: '모델 학습', icon: BrainCircuit },
  { id: 'labeling', label: '클립 라벨링', icon: Tags },
  { id: 'stream', label: '스트림 · 예측', icon: Radio },
  { id: 'performance', label: '성능 평가', icon: Gauge },
  { id: 'settings', label: '옵션 / 설정', icon: Settings2 },
  { id: 'catalog', label: '데이터 카탈로그', icon: Database },
];

export default function Sidebar() {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const graph = useStore((s) => s.graph);
  const autoUpdate = useStore((s) => s.config.pipeline.autoUpdate.value);
  const engine = useStore((s) => s.config.options.analysisEngine.value);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Waypoints size={21} strokeWidth={2.4} /></div>
        <div>
          <div className="brand-name">{appConfig.project.name}</div>
          <div className="brand-sub">v{appConfig.project.version} · Studio</div>
        </div>
      </div>

      <div className="nav-section-label">워크스페이스</div>
      <nav className="nav-list">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-icon"><Icon size={16} /></span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              {item.id === 'pipeline' && <span className="nav-badge">v{graph.version}</span>}
            </button>
          );
        })}
      </nav>

      <div className="nav-section-label">시스템 상태</div>
      <div className="status-chip" style={{ marginBottom: 8 }}>
        <span className="status-dot" />
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 700 }}>엔진: {engine}</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>자동 업데이트: {autoUpdate ? 'ON' : 'OFF'}</div>
        </div>
      </div>
      <div className="status-chip">
        <Zap size={13} style={{ color: 'var(--accent)' }} />
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 700 }}>{graph.nodes.filter((n) => n.enabled).length}개 노드 활성</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>{graph.edges.length}개 연결 · v{graph.version}</div>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="status-chip">© 2026 VisionFlow Lab</div>
      </div>
    </aside>
  );
}
