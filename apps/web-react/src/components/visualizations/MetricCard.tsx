import type { MetricCardData } from '@/types';
import Sparkline from './Sparkline';

interface Props {
  data: MetricCardData;
  spark?: number[];
}

export default function MetricCard({ data, spark }: Props) {
  const TrendIcon = data.trend === 'up' ? '▲' : data.trend === 'down' ? '▼' : '—';
  const trendClass = data.trend === 'up' ? 'delta-up' : data.trend === 'down' ? 'delta-down' : 'delta-flat';

  return (
    <div className="metric-card">
      <div className="metric-glow" style={{ background: data.accent }} />
      <div className="metric-label">
        <span style={{ width: 7, height: 7, borderRadius: 2, background: data.accent }} />
        {data.label}
      </div>
      <div className="metric-value">
        {data.value}<span className="metric-unit">{data.unit}</span>
      </div>
      {data.delta !== undefined && (
        <div className={`metric-delta ${trendClass}`}>
          {TrendIcon} {Math.abs(data.delta)}% <span className="faint" style={{ fontWeight: 500 }}>전년 대비</span>
        </div>
      )}
      {spark && <div className="metric-spark"><Sparkline data={spark} color={data.accent} width={74} height={28} /></div>}
    </div>
  );
}
