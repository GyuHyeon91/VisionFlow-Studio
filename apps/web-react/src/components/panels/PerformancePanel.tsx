import { useEffect, useState } from 'react';
import { Activity, Cpu, Gauge, MemoryStick, RefreshCw, Timer, TrendingUp, UploadCloud, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { NODE_KIND_META } from '@/pipeline/catalog';
import DataCard from './DataCard';
import MetricCard from '@/components/visualizations/MetricCard';
import { getEvaluation, getRetrainStatus, startRetrain, type EvaluationReport, type RetrainStatus } from '@/services/evaluationApi';

const STATUS_LABEL = { optimal: '최적', normal: '보통', degraded: '주의' } as const;
const STATUS_COLOR = { optimal: 'var(--success)', normal: 'var(--accent)', degraded: 'var(--danger)' } as const;

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 이 영역에 성능평가 결과가 출력됩니다.</div>
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="conf-bar" style={{ width: 80, height: 5 }}>
      <i style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: `linear-gradient(90deg, ${color}, var(--accent))` }} />
    </div>
  );
}

export default function PerformancePanel() {
  const [evalReport, setEvalReport] = useState<EvaluationReport | null>(null);
  const [retrain, setRetrain] = useState<RetrainStatus | null>(null);
  const pushToast = useStore((s) => s.pushToast);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try { const e = await getEvaluation(); if (alive) setEvalReport(e); } catch { /* ignore */ }
      try { const r = await getRetrainStatus(); if (alive) setRetrain(r); } catch { /* ignore */ }
    };
    void load();
    const timer = setInterval(() => {
      void getRetrainStatus().then((r) => { if (alive) setRetrain(r); }).catch(() => {});
    }, 3000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const handleRetrain = async () => {
    try {
      const r = await startRetrain(10, 640);
      setRetrain(r);
      pushToast('자동 재학습을 시작했습니다. 완료 시 커스텀 모델이 적용됩니다.', 'info');
    } catch (err) { pushToast(`재학습 시작 실패: ${(err as Error).message}`, 'error'); }
  };

  const result = useStore((s) => s.result);
  const graph = useStore((s) => s.graph);
  const config = useStore((s) => s.config);
  const perf = result?.performanceEvaluation ?? [];

  const avgLatency = perf.length ? perf.reduce((a, p) => a + p.latencyMs, 0) / perf.length : 0;
  const avgAccuracy = perf.length ? perf.reduce((a, p) => a + p.accuracy, 0) / perf.length : 0;
  const totalMemory = perf.reduce((a, p) => a + p.memoryMb, 0);
  const minThroughput = perf.length ? Math.min(...perf.map((p) => p.throughput)) : 0;
  const degraded = perf.filter((p) => p.status === 'degraded');

  const recommendations: string[] = [];
  if (config.performance.fps.value > 30) recommendations.push('분석 FPS가 높습니다. 정확도 저하 시 15~24 수준으로 조절하세요.');
  if (config.performance.resolution.value === '1080p') recommendations.push('1080p 입력은 메모리 사용량이 큽니다. 적응형 품질을 활용하세요.');
  if (config.accuracy.behaviorModel.value === 'fast') recommendations.push('빠른 모델을 사용 중입니다. ensemble 프로파일로 정확도를 높일 수 있습니다.');
  if (degraded.length) recommendations.push(`주의가 필요한 기능: ${degraded.map((d) => d.labelKo).join(', ')}`);
  if (!recommendations.length) recommendations.push('모든 기능이 정상 범위에서 동작하고 있습니다.');

  return (
    <div>
      <DataCard
        dataKey="perf-summary"
        title="전체 성능 요약"
        description="실제 분석에서 측정한 값만 표시합니다. 검증 데이터가 없는 지표(R(재현율)·메모리·CPU)는 0 또는 미측정으로 남깁니다."
        icon={<Gauge size={15} />}
        bodyClassName="grid grid-4"
      >
        {result && perf.length ? (
          <>
            <MetricCard data={{ key: 'latency', label: '평균 지연', value: Math.round(avgLatency), unit: 'ms', accent: 'var(--accent)' }} />
            <MetricCard data={{ key: 'accuracy', label: '평균 정확도', value: Math.round(avgAccuracy), unit: '%', accent: 'var(--success)' }} />
            <MetricCard data={{ key: 'memory', label: '총 메모리', value: totalMemory, unit: 'MB', accent: 'var(--accent-2)' }} />
            <MetricCard data={{ key: 'throughput', label: '최저 처리량', value: Math.round(minThroughput), unit: 'fps', accent: 'var(--accent-4)' }} />
          </>
        ) : <NoData label="성능 요약" />}
      </DataCard>

      <DataCard
        dataKey="perf-features"
        title="기능별 성능평가"
        description="파이프라인 각 기능의 지연 시간, 처리량, 정확도, 정밀도, 재현율, 리소스 사용량을 표시합니다. 성능/정확도 옵션 변경 시 함께 재계산됩니다."
        icon={<Activity size={15} />}
        className="section-gap"
        right={result ? (
          <span className={`chip ${perf.some((p) => p.measured) ? 'accent' : ''}`}>
            {perf.some((p) => p.measured) ? '실제 측정' : '추정값'} · {perf.length}개 기능
          </span>
        ) : undefined}
      >
        {result && perf.length ? (
          <div className="perf-list">
            <div className="perf-row perf-head">
              <span>기능</span><span>지연</span><span>처리량</span><span>정확도</span><span>정밀도</span><span>재현율</span><span>메모리</span><span>CPU/GPU</span><span>상태</span>
            </div>
            {perf.map((p) => (
              <div className="perf-row" key={p.key} title={p.description}>
                <span className="perf-name"><b>{p.labelKo}</b><small className="faint">{p.label}</small></span>
                <span className="mono">{p.latencyMs}ms</span>
                <span className="mono">{p.throughput}</span>
                <span><div className="flex items-center gap-2"><Bar value={p.accuracy} color="var(--success)" /><b className="mono">{p.accuracy}%</b></div></span>
                <span className="mono">{p.precision}%</span>
                <span className="mono">{p.recall}%</span>
                <span className="mono">{p.memoryMb}MB</span>
                <span className="mono">{p.cpuPercent}% / {p.gpuPercent}%</span>
                <span><span className="badge" style={{ background: `color-mix(in srgb, ${STATUS_COLOR[p.status]} 16%, transparent)`, color: STATUS_COLOR[p.status] }}>{STATUS_LABEL[p.status]}</span></span>
              </div>
            ))}
          </div>
        ) : <NoData label="기능별 성능" />}
      </DataCard>

      <div className="grid grid-2 section-gap">
        <DataCard
          dataKey="perf-nodes"
          title="파이프라인 노드 실행 시간"
          description="각 노드가 실제로 소요한 분석 시간과 출력 상태입니다. 분석 엔진이 측정한 단계별 시간을 우선 표시합니다."
          icon={<Timer size={15} />}
        >
          {result ? (
            <div style={{ padding: '4px 20px 20px' }}>
              <div className="list perf-node-list">
                {graph.nodes.map((n) => (
                  <div className="list-row" key={n.id}>
                    <div className="row-icon" style={{ background: `color-mix(in srgb, ${NODE_KIND_META[n.type].color} 14%, transparent)`, color: NODE_KIND_META[n.type].color }}><Zap size={14} /></div>
                    <div className="row-main"><div className="row-title">{n.label}</div><div className="row-sub">{NODE_KIND_META[n.type].labelKo} · {n.status}</div></div>
                    <span className="mono text-sm accent">{n.durationMs ? `${n.durationMs}ms` : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <NoData label="노드 실행 시간" />}
        </DataCard>

        <DataCard
          dataKey="perf-resource"
          title="리소스 사용 분석"
          description="기능별 CPU·GPU·메모리 사용 비중을 비교합니다. 하드웨어 가속 옵션이 결과에 반영됩니다."
          icon={<Cpu size={15} />}
          bodyClassName="card-pad"
        >
          {result && perf.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {perf.map((p) => (
                <div key={p.key}>
                  <div className="flex justify-between text-xs" style={{ marginBottom: 5 }}>
                    <span>{p.labelKo}</span>
                    <span className="mono faint">CPU {p.cpuPercent}% · GPU {p.gpuPercent}% · {p.memoryMb}MB</span>
                  </div>
                  <div className="run-bar" style={{ height: 6 }}>
                    <i style={{ width: `${p.cpuPercent}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
                  </div>
                </div>
              ))}
              <div className="divider" />
              <div className="flex items-center gap-2 text-xs dim"><MemoryStick size={13} className="accent" /> 하드웨어 가속: {config.performance.hardwareAcceleration.value ? 'ON' : 'OFF'}</div>
            </div>
          ) : <NoData label="리소스 사용" />}
        </DataCard>
      </div>

      <DataCard
        dataKey="perf-recommend"
        title="성능 개선 권고"
        description="현재 성능/정확도 옵션과 측정 결과를 바탕으로 개선 방향을 제안합니다."
        icon={<TrendingUp size={15} />}
        className="section-gap"
        bodyClassName="card-pad"
      >
        {result ? (
          <div className="flex flex-col gap-2">
            {recommendations.map((r, i) => (
              <div className="list-row" key={i}>
                <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--accent-4) 14%, transparent)', color: 'var(--accent-4)' }}><TrendingUp size={14} /></div>
                <div className="row-main"><div className="row-title text-sm">{r}</div></div>
              </div>
            ))}
          </div>
        ) : <NoData label="성능 개선 권고" />}
      </DataCard>

      <DataCard
        dataKey="perf-accuracy-eval"
        title="사고 인식 정확도 평가"
        description="사용자가 검토한 사고 이벤트를 기준으로 사고 유형별 Precision·Recall·F1과 혼동행렬, 추적 ID 유지율을 계산합니다. 검토 결과가 쌓일수록 신뢰도가 올라갑니다."
        icon={<Gauge size={15} />}
        className="section-gap"
        right={<span className={`chip ${evalReport?.reliable ? 'accent' : ''}`}>{evalReport?.reliable ? '신뢰 가능' : '검토 필요'}</span>}
        bodyClassName="card-pad"
      >
        {evalReport ? (
          <>
            <div className="grid grid-4">
              <MetricCard data={{ key: 'precision', label: '정밀도', value: Math.round(evalReport.overall.precision * 100), unit: '%', accent: 'var(--accent)' }} />
              <MetricCard data={{ key: 'recall', label: '재현율', value: Math.round(evalReport.overall.recall * 100), unit: '%', accent: 'var(--success)' }} />
              <MetricCard data={{ key: 'f1', label: 'F1', value: Math.round(evalReport.overall.f1 * 100), unit: '%', accent: 'var(--accent-2)' }} />
              <MetricCard data={{ key: 'id', label: 'ID 유지율', value: Math.round(evalReport.tracking.idPreservationRate * 100), unit: '%', accent: 'var(--accent-4)' }} />
            </div>
            <div className="divider" />
            <div className="text-xs faint" style={{ lineHeight: 1.7 }}>
              검토 {evalReport.reviewedEvents}건 · 예측 {evalReport.predictedEvents}건 · 추적 {evalReport.tracking.tracks}개 ·
              ID 스위치 {evalReport.tracking.idSwitches}회 · 단절 {evalReport.tracking.fragmentedTracks}개
            </div>
            <div className="text-xs faint mt-2">{evalReport.note}</div>
            {Object.keys(evalReport.perType).length > 0 && (
              <div className="perf-list mt-3">
                <div className="perf-row perf-head"><span>사고 유형</span><span>TP</span><span>FP</span><span>FN</span><span>Precision</span><span>Recall</span><span>F1</span></div>
                {Object.entries(evalReport.perType).map(([type, m]) => (
                  <div className="perf-row" key={type}>
                    <span className="perf-name"><b>{type}</b></span>
                    <span className="mono">{m.tp}</span><span className="mono">{m.fp}</span><span className="mono">{m.fn}</span>
                    <span className="mono">{Math.round(m.precision * 100)}%</span>
                    <span className="mono">{Math.round(m.recall * 100)}%</span>
                    <span className="mono">{Math.round(m.f1 * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : <NoData label="정확도 평가" />}
      </DataCard>

      <DataCard
        dataKey="perf-auto-retrain"
        title="오인식 → 재학습 자동화"
        description="검토에서 '오탐'으로 표시된 이벤트와 웹에 업로드된 영상을 학습 데이터에 반영해 커스텀 모델을 다시 학습합니다. 완료 시 모델이 자동 적용됩니다."
        icon={<RefreshCw size={15} />}
        className="section-gap"
        right={<span className={`chip ${retrain?.status === 'running' ? 'accent' : ''}`}>{retrain?.status ?? 'idle'}</span>}
        bodyClassName="card-pad"
      >
        <div className="flex justify-between text-sm"><span className="dim">진행률</span><b className="mono">{Math.round((retrain?.progress ?? 0) * 100)}%</b></div>
        <div className="run-bar mt-2"><i style={{ width: `${(retrain?.progress ?? 0) * 100}%` }} /></div>
        <div className="text-xs faint mt-2">{retrain?.message ?? '검토 결과와 업로드 영상을 수집합니다.'}</div>
        {retrain?.error && <div className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{retrain.error}</div>}
        {retrain?.lastRun && <div className="text-xs faint mt-2">마지막 실행: {retrain.lastRun} · 데이터 {retrain.samplesAdded}장</div>}
        <button className="primary-btn full mt-3" disabled={retrain?.status === 'running'} onClick={() => void handleRetrain()}>
          <RefreshCw size={14} /> 오인식 반영 재학습 시작
        </button>
      </DataCard>
    </div>
  );
}
