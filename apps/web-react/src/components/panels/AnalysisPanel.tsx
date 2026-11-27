import { Activity, BarChart3, Clock, FileVideo, ScanSearch, Users, UploadCloud } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useStore } from '@/store/useStore';
import MetricCard from '@/components/visualizations/MetricCard';
import RadialGauge from '@/components/visualizations/RadialGauge';
import Heatmap from '@/components/visualizations/Heatmap';
import DataCard from './DataCard';
import VideoPlaybackPanel from './VideoPlaybackPanel';

const tooltipStyle = {
  background: 'var(--panel-strong)',
  border: '1px solid var(--panel-border-strong)',
  borderRadius: 10,
  fontSize: 11,
  color: 'var(--text)',
};
const axisStyle = { fill: 'var(--text-faint)', fontSize: 10 };

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 이 영역에 결과가 출력됩니다.</div>
    </div>
  );
}

export default function AnalysisPanel() {
  const result = useStore((s) => s.result);
  const running = useStore((s) => s.running);
  const video = useStore((s) => s.video);

  const s = result?.summary;
  const crowdData = (result?.crowdDensity ?? []).map((d) => ({ t: `${d.t}s`, 인원: d.value }));
  const motionData = (result?.motionSeries ?? []).map((d) => ({ t: `${d.t}s`, 움직임: d.value }));

  const metrics = result ? [
    { key: 'risk', label: '위험 점수', value: s?.riskScore ?? 0, unit: '/100', delta: 8, trend: 'down' as const, accent: 'var(--danger)' },
    { key: 'compliance', label: '준수 점수', value: s?.complianceScore ?? 0, unit: '/100', delta: 5, trend: 'up' as const, accent: 'var(--success)' },
    { key: 'confidence', label: '평균 신뢰도', value: `${Math.round((s?.avgConfidence ?? 0) * 100)}`, unit: '%', delta: 3, trend: 'up' as const, accent: 'var(--accent)' },
    { key: 'persons', label: '감지 인물', value: result.personsDetected, unit: '명', delta: 12, trend: 'up' as const, accent: 'var(--accent-2)' },
  ] : [];

  return (
    <div>
      <DataCard
        dataKey="analysis-metrics"
        title="분석 요약 지표"
        description="영상 분석으로 도출된 위험도·준수도·신뢰도·감지 인물 수입니다. 각 값은 옵션(정확도/성능) 변경 시 다시 계산됩니다."
        icon={<Activity size={15} />}
        right={result ? (
          <>
            <span className={`chip ${result.engine === 'mock' || result.engine === 'hybrid' ? '' : 'accent'} mono`}>
              {result.engine === 'mock' ? '데모 결과 · 검토 필요' : result.engine === 'hybrid' ? '데모 포함' : '실제 분석'}
            </span>
            <span className="chip mono">{video?.name ?? result.videoName}</span>
          </>
        ) : undefined}
        bodyClassName="grid grid-4"
      >
        {result ? metrics.map((m) => (
          <MetricCard key={m.key} data={m} spark={result.confidenceSeries.map((d) => d.value * 100)} />
        )) : <NoData label="분석 요약" />}
      </DataCard>

      {result && <VideoPlaybackPanel result={result} />}

      {result?.videoSignals && (
        <>
          <DataCard
            dataKey="analysis-video-signals"
            title="실제 영상 프레임 신호"
            description="업로드된 영상을 직접 샘플링해 추출한 밝기·모션·엣지 밀도와 장면 전환 시점입니다. 목업이 아닌 실제 픽셀 데이터 기반입니다."
            icon={<FileVideo size={15} />}
            right={<span className="chip accent">{result.videoSignals.source === 'browser-video' ? 'REAL FRAME ANALYSIS' : 'FALLBACK'}</span>}
          >
            <div style={{ padding: '4px 20px 20px' }}>
              <div className="thumb-strip">
                {result.videoSignals.thumbnails.map((src, i) => (
                  <img key={i} src={src} alt={`샘플 프레임 ${i + 1}`} title={`샘플 프레임 ${i + 1}`} />
                ))}
              </div>
              <div className="chip-row mt-2">
                <span className="chip mono">샘플 {result.videoSignals.sampledFrames}프레임</span>
                <span className="chip mono">실효 FPS {result.videoSignals.effectiveFps}</span>
                <span className="chip mono">{result.videoSignals.frameWidth}×{result.videoSignals.frameHeight}</span>
                <span className="chip">장면 전환 {result.videoSignals.sceneChanges.length}회</span>
              </div>
              {result.videoSignals.sceneChanges.length > 0 && (
                <div className="chip-row mt-2">
                  {result.videoSignals.sceneChanges.map((t, i) => <span className="chip accent mono" key={i}>{t}s 전환</span>)}
                </div>
              )}
              <div style={{ height: 120, marginTop: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.videoSignals.motion} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
                    <CartesianGrid stroke="var(--panel-border)" vertical={false} />
                    <XAxis dataKey="t" tick={axisStyle} stroke="var(--panel-border)" interval="preserveStartEnd" />
                    <YAxis tick={axisStyle} stroke="var(--panel-border)" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="value" name="모션 강도" stroke="var(--accent-2)" strokeWidth={2} fill="color-mix(in srgb, var(--accent-2) 18%, transparent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </DataCard>

          <DataCard
            dataKey="analysis-shape-tracking"
            title="영상 내 형상 추적"
            description="연속 프레임 간 픽셀 차분으로 움직이는 영역을 검출하고 최근접 매칭으로 동일 형상을 추적한 결과입니다. 궤적과 이동 거리를 표시합니다."
            icon={<ScanSearch size={15} />}
            className="section-gap"
            right={<span className="chip mono">{result.videoSignals.tracks.length}개 트랙</span>}
            bodyClassName="grid grid-3"
          >
            {result.videoSignals.tracks.length ? result.videoSignals.tracks.map((track) => {
              const pts = track.points;
              const last = pts[pts.length - 1];
              const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x + p.w / 2} ${p.y + p.h / 2}`).join(' ');
              return (
                <div className="card card-pad track-card" key={track.id}>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-info mono">{track.id}</span>
                    <b className="text-sm">{track.label}</b>
                    <span className="card-head-spacer" />
                    <span className="chip mono">{Math.round(last.confidence * 100)}%</span>
                  </div>
                  <svg viewBox="0 0 100 60" className="track-trajectory" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="60" fill="color-mix(in srgb, var(--bg-0) 45%, transparent)" stroke="var(--panel-border)" />
                    <path d={path} fill="none" stroke="var(--accent)" strokeWidth="0.8" />
                    {pts.map((p, i) => <circle key={i} cx={p.x + p.w / 2} cy={p.y + p.h / 2} r={i === pts.length - 1 ? 1.8 : 0.8} fill="var(--accent-2)" />)}
                  </svg>
                  <div className="text-xs faint mono mt-2">
                    {track.firstSeen.toFixed(1)}s ~ {track.lastSeen.toFixed(1)}s · {pts.length}포인트 · 이동 {track.distance.toFixed(1)}%
                  </div>
                </div>
              );
            }) : <div className="card card-pad text-sm dim">움직이는 형상이 감지되지 않았습니다.</div>}
          </DataCard>
        </>
      )}

      <div className="grid grid-2-1 section-gap">
        <DataCard
          dataKey="analysis-density"
          title="시간대별 인구 밀도"
          description="프레임별로 감지된 인물 수를 시간 축에 표시한 그래프입니다. 혼잡이 심한 구간을 찾는 데 사용합니다."
          icon={<BarChart3 size={15} />}
          right={result ? <span className="chip mono">{result.processedFrames.toLocaleString()} frames</span> : undefined}
        >
          {result ? (
            <div style={{ height: 250, padding: '0 12px 12px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={crowdData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="crowdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--panel-border)" vertical={false} />
                  <XAxis dataKey="t" tick={axisStyle} stroke="var(--panel-border)" interval={3} />
                  <YAxis tick={axisStyle} stroke="var(--panel-border)" />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--accent)', strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="인원" stroke="var(--accent)" strokeWidth={2} fill="url(#crowdGrad)" isAnimationActive={!running} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <NoData label="인구 밀도" />}
        </DataCard>

        <DataCard
          dataKey="analysis-risk"
          title="리스크 지수"
          description="위험도와 준수도를 100점 만점 게이지로 표시하고, 주요 분석 요약 수치를 함께 제공합니다."
          icon={<Activity size={15} />}
          bodyClassName="card-pad"
        >
          {result ? (
            <>
              <div className="flex justify-around" style={{ flexWrap: 'wrap', gap: 12 }}>
                <RadialGauge value={s?.riskScore ?? 0} label="위험도" color="var(--danger)" />
                <RadialGauge value={s?.complianceScore ?? 0} label="준수도" color="var(--success)" />
              </div>
              <div className="divider" />
              <div className="grid grid-2" style={{ gap: 10 }}>
                <div className="flex items-center gap-2"><Users size={13} className="accent" /><span className="text-xs dim">최대 밀집</span><b className="mono">{s?.peakCrowd ?? 0}명</b></div>
                <div className="flex items-center gap-2"><ScanSearch size={13} className="accent" /><span className="text-xs dim">행동 이벤트</span><b className="mono">{s?.totalBehaviors ?? 0}건</b></div>
                <div className="flex items-center gap-2"><Clock size={13} className="accent" /><span className="text-xs dim">영상 길이</span><b className="mono">{result.durationSec}s</b></div>
                <div className="flex items-center gap-2"><FileVideo size={13} className="accent" /><span className="text-xs dim">엔진</span><b className="mono">{result.engine}</b></div>
              </div>
            </>
          ) : <NoData label="리스크 지수" />}
        </DataCard>
      </div>

      <div className="grid grid-2 section-gap">
        <DataCard
          dataKey="analysis-motion"
          title="움직임 강도"
          description="시간대별 모션 강도를 막대 그래프로 표시합니다. 급격한 움직임 구간을 행동 감지와 비교할 수 있습니다."
          icon={<Activity size={15} />}
        >
          {result ? (
            <div style={{ height: 200, padding: '0 12px 12px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={motionData} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="var(--panel-border)" vertical={false} />
                  <XAxis dataKey="t" tick={axisStyle} stroke="var(--panel-border)" interval={3} />
                  <YAxis tick={axisStyle} stroke="var(--panel-border)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="움직임" radius={[3, 3, 0, 0]}>
                    {motionData.map((_, i) => <Cell key={i} fill={i % 3 === 0 ? 'var(--accent-2)' : 'var(--accent)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <NoData label="움직임 강도" />}
        </DataCard>

        <DataCard
          dataKey="analysis-heatmap"
          title="구역별 혼잡 히트맵"
          description="영상 시간축을 따라 혼잡 강도를 색으로 표현합니다. 색이 진할수록 인구 밀도가 높습니다."
          icon={<Activity size={15} />}
          bodyClassName="card-pad"
        >
          {result ? (
            <>
              <Heatmap data={result.crowdDensity.map((d) => d.value)} columns={24} label="타임라인 혼잡도" />
              <div className="divider" />
              <div className="flex justify-between text-sm"><span className="dim">감지된 상황</span><b className="accent">{result.situations.length}건</b></div>
              <div className="flex justify-between text-sm mt-2"><span className="dim">권고 조치</span><b className="accent">{result.actions.length}건</b></div>
              <div className="flex justify-between text-sm mt-2"><span className="dim">치명적 상황</span><b style={{ color: 'var(--danger)' }}>{s?.criticalCount ?? 0}건</b></div>
            </>
          ) : <NoData label="혼잡 히트맵" />}
        </DataCard>
      </div>

      <DataCard
        dataKey="analysis-log"
        title="파이프라인 분석 상세 로그"
        description="각 파이프라인 노드가 수행한 분석 내용과 산출값을 시간순으로 기록한 로그입니다. 데이터가 부족한 부분을 원인별로 확인할 수 있습니다."
        icon={<FileVideo size={15} />}
        className="section-gap"
        right={result ? <span className="chip mono">{result.analysisLog?.length ?? 0}개 항목</span> : undefined}
      >
        {result?.analysisLog?.length ? (
          <div style={{ padding: '4px 20px 20px' }}>
            <div className="list">
              {result.analysisLog.map((entry) => (
                <div className="list-row log-row" key={entry.id}>
                  <div className="row-icon" style={{
                    background: `color-mix(in srgb, ${entry.level === 'success' ? 'var(--success)' : entry.level === 'warning' ? 'var(--warning)' : 'var(--accent)'} 14%, transparent)`,
                    color: entry.level === 'success' ? 'var(--success)' : entry.level === 'warning' ? 'var(--warning)' : 'var(--accent)',
                  }}><FileVideo size={14} /></div>
                  <div className="row-main">
                    <div className="row-title">{entry.nodeLabel} <span className="faint text-xs mono">{entry.nodeId}</span></div>
                    <div className="row-sub">{entry.message} · {entry.detail}</div>
                    <div className="chip-row" style={{ marginTop: 6 }}>
                      {entry.metrics.map((m, i) => <span className="chip mono" key={i}>{m.label} {m.value}</span>)}
                    </div>
                  </div>
                  <span className="row-time mono">{entry.timestamp.toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </div>
        ) : <NoData label="분석 로그" />}
      </DataCard>
    </div>
  );
}
