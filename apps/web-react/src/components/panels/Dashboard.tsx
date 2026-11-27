import { Activity, ArrowRight, Gauge, GitBranch, Play, ScanFace, ShieldAlert, UploadCloud } from 'lucide-react';
import { useStore } from '@/store/useStore';
import MetricCard from '@/components/visualizations/MetricCard';
import RadialGauge from '@/components/visualizations/RadialGauge';
import DataCard from './DataCard';

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 이 영역에 결과가 출력됩니다.</div>
    </div>
  );
}

export default function Dashboard() {
  const result = useStore((s) => s.result);
  const graph = useStore((s) => s.graph);
  const config = useStore((s) => s.config);
  const runAnalysis = useStore((s) => s.runAnalysis);
  const setTab = useStore((s) => s.setTab);
  const running = useStore((s) => s.running);
  const video = useStore((s) => s.video);

  const s = result?.summary;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">통합 대시보드</div>
          <div className="page-desc">
            영상 분석 · 인물 행동 감지 · 상황별 조치 권고를 하나의 파이프라인으로 연결합니다.
            영상 업로드 후 분석하면 각 기능별 데이터가 출력되며, 영역별로 숨김 처리할 수 있습니다.
          </div>
        </div>
        <div className="page-head-spacer" />
        {!video && (
          <span className="chip">업로드된 영상 없음 · 상단에서 업로드</span>
        )}
        <button className="primary-btn" onClick={() => runAnalysis()} disabled={running || !video}>
          <Play size={14} fill="currentColor" /> 분석 실행
        </button>
      </div>

      <DataCard
        dataKey="dash-metrics"
        title="핵심 지표"
        description="위험 점수, 감지 인물 수, 행동 이벤트, 조치 권고 건수를 한눈에 보여주는 종합 지표입니다."
        icon={<Activity size={15} />}
        className="section-gap"
        bodyClassName="grid grid-4"
      >
        {result ? (
          <>
            <MetricCard data={{ key: 'risk', label: '위험 점수', value: s?.riskScore ?? '--', unit: '/100', delta: 8, trend: 'down', accent: 'var(--danger)' }} spark={result?.confidenceSeries.map((d) => d.value * 100)} />
            <MetricCard data={{ key: 'persons', label: '감지 인물', value: result.personsDetected, unit: '명', delta: 12, trend: 'up', accent: 'var(--accent-2)' }} />
            <MetricCard data={{ key: 'behaviors', label: '행동 이벤트', value: s?.totalBehaviors ?? 0, unit: '건', delta: 6, trend: 'up', accent: 'var(--accent)' }} />
            <MetricCard data={{ key: 'actions', label: '조치 권고', value: result.actions.length, unit: '건', delta: 4, trend: 'up', accent: 'var(--accent-4)' }} />
          </>
        ) : <NoData label="핵심 지표" />}
      </DataCard>

      <div className="grid grid-2-1 section-gap">
        <DataCard
          dataKey="dash-pipeline"
          title="파이프라인 상태"
          description="노드 실행 상태와 버전을 표시합니다. 설정이나 노드가 변경되면 자동으로 새 버전으로 재실행됩니다."
          icon={<GitBranch size={15} />}
          right={<button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setTab('pipeline')}>상세 보기 <ArrowRight size={12} /></button>}
        >
          <div style={{ padding: '4px 20px 20px' }}>
            <div className="chip-row" style={{ marginBottom: 16 }}>
              {graph.nodes.map((n) => (
                <span
                  key={n.id}
                  className="chip"
                  style={{
                    borderColor: n.status === 'done' ? 'var(--success)' : n.status === 'running' ? 'var(--warning)' : 'var(--panel-border)',
                    color: n.status === 'done' ? 'var(--success)' : n.status === 'running' ? 'var(--warning)' : 'var(--text-dim)',
                  }}
                >
                  {n.enabled ? '●' : '○'} {n.label}
                </span>
              ))}
            </div>
            <div className="run-bar"><i style={{ width: `${running ? graph.nodes.reduce((a, n) => a + n.progress, 0) / Math.max(graph.nodes.length, 1) * 100 : result ? 100 : 0}%` }} /></div>
            <div className="flex justify-between text-xs faint mt-2">
              <span>{graph.nodes.filter((n) => n.status === 'done').length}/{graph.nodes.length} 노드 완료</span>
              <span className="mono">v{graph.version} · {graph.updatedAt.slice(11, 19)}</span>
            </div>
          </div>
        </DataCard>

        <DataCard
          dataKey="dash-quality"
          title="분석 품질"
          description="감지 결과의 평균 신뢰도와 전체 준수 점수를 게이지로 표시합니다."
          icon={<Activity size={15} />}
          bodyClassName="card-pad"
        >
          {result ? (
            <div className="flex justify-around" style={{ flexWrap: 'wrap', gap: 10 }}>
              <RadialGauge value={Math.round((s?.avgConfidence ?? 0) * 100)} label="신뢰도" color="var(--accent)" size={110} />
              <RadialGauge value={s?.complianceScore ?? 0} label="준수도" color="var(--success)" size={110} />
            </div>
          ) : <NoData label="분석 품질" />}
        </DataCard>
      </div>

      <DataCard
        dataKey="dash-performance"
        title="기능별 성능평가 요약"
        description="영상 분석 기능별 지연·정확도·리소스 사용량을 집계한 결과입니다. 전체 상세는 성능 평가 탭에서 확인할 수 있습니다."
        icon={<Gauge size={15} />}
        className="section-gap"
        right={<button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setTab('performance')}>성능 평가 <ArrowRight size={12} /></button>}
        bodyClassName="grid grid-4"
      >
        {result && result.performanceEvaluation?.length ? (
          <>
            <MetricCard data={{ key: 'latency', label: '평균 지연', value: Math.round(result.performanceEvaluation.reduce((a, p) => a + p.latencyMs, 0) / result.performanceEvaluation.length), unit: 'ms', accent: 'var(--accent)' }} />
            <MetricCard data={{ key: 'accuracy', label: '평균 정확도', value: Math.round(result.performanceEvaluation.reduce((a, p) => a + p.accuracy, 0) / result.performanceEvaluation.length), unit: '%', accent: 'var(--success)' }} />
            <MetricCard data={{ key: 'degraded', label: '주의 기능', value: result.performanceEvaluation.filter((p) => p.status === 'degraded').length, unit: '건', accent: 'var(--danger)' }} />
            <MetricCard data={{ key: 'features', label: '평가 기능', value: result.performanceEvaluation.length, unit: '개', accent: 'var(--accent-2)' }} />
          </>
        ) : <NoData label="성능평가" />}
      </DataCard>

      <div className="grid grid-2 section-gap">
        <DataCard
          dataKey="dash-behaviors"
          title="최근 행동 감지"
          description="영상에서 감지된 인물 행동을 최신순으로 표시합니다. 심각도와 신뢰도를 함께 확인할 수 있습니다."
          icon={<ScanFace size={15} />}
          right={<button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setTab('behavior')}>전체 보기 <ArrowRight size={12} /></button>}
        >
          <div style={{ padding: '0 16px 16px' }}>
            {result ? (
              <div className="list">
                {result.behaviors.slice(-5).reverse().map((b) => (
                  <div className="list-row" key={b.id}>
                    <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}><ScanFace size={14} /></div>
                    <div className="row-main"><div className="row-title">{b.labelKo}</div><div className="row-sub">#{b.trackId} · {b.category}</div></div>
                    <span className={`badge badge-${b.severity}`}>{Math.round(b.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            ) : <NoData label="행동 감지" />}
          </div>
        </DataCard>

        <DataCard
          dataKey="dash-situations"
          title="주요 상황 및 조치"
          description="감지된 상황과 권고된 조치 요약입니다. 상황별 상세 절차는 상황별 조치 탭에서 확인합니다."
          icon={<ShieldAlert size={15} />}
          right={<button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setTab('actions')}>전체 보기 <ArrowRight size={12} /></button>}
        >
          <div style={{ padding: '0 16px 16px' }}>
            {result ? (
              <div className="list">
                {result.situations.slice(0, 5).map((sit) => (
                  <div className="list-row" key={sit.id}>
                    <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}><ShieldAlert size={14} /></div>
                    <div className="row-main"><div className="row-title">{sit.typeKo}</div><div className="row-sub">{sit.description}</div></div>
                    <span className="row-time">{sit.timestamp.toFixed(0)}s</span>
                  </div>
                ))}
              </div>
            ) : <NoData label="상황 및 조치" />}
          </div>
        </DataCard>
      </div>
    </div>
  );
}
