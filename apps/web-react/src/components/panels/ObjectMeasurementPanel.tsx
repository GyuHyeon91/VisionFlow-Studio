import { Ruler, UploadCloud } from 'lucide-react';
import { useStore } from '@/store/useStore';
import DataCard from './DataCard';
import MetricCard from '@/components/visualizations/MetricCard';

const METHOD_LABEL = {
  'reference+depth': '기준물+깊이',
  'reference-plane': '기준물 동일평면',
  'relative-only': '상대 크기만',
} as const;

function NoData() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Ruler size={22} /></div>
      <b>사물 측정 데이터 없음</b>
      <div className="text-xs">영상을 업로드하면 실시간 추적이 자동으로 켜져 객체별 크기·거리 추정치가 출력됩니다.</div>
    </div>
  );
}

export default function ObjectMeasurementPanel() {
  const items = useStore((s) => s.measurements);
  const config = useStore((s) => s.config);
  const avgDistance = items.filter((m) => m.distanceM).reduce((a, m) => a + (m.distanceM ?? 0), 0) / Math.max(1, items.filter((m) => m.distanceM).length);
  const maxWidth = Math.max(...items.map((m) => m.widthCm ?? 0), 0);

  return (
    <div>
      <DataCard
        dataKey="measure-summary"
        title="사물 측정 요약"
        description="화면 내 상대 크기와 기준 객체·깊이 모델을 이용한 실측 근사치를 집계합니다."
        icon={<Ruler size={15} />}
        bodyClassName="grid grid-4"
      >
        {items.length ? (
          <>
            <MetricCard data={{ key: 'count', label: '측정 객체', value: items.length, unit: '개', accent: 'var(--accent)' }} />
            <MetricCard data={{ key: 'distance', label: '평균 거리', value: avgDistance ? Math.round(avgDistance * 10) / 10 : '--', unit: 'm', accent: 'var(--accent-2)' }} />
            <MetricCard data={{ key: 'width', label: '최대 폭', value: maxWidth ? Math.round(maxWidth) : '--', unit: 'cm', accent: 'var(--accent-4)' }} />
            <MetricCard data={{ key: 'depth', label: '깊이 모델', value: config.measurement.depthEstimation.value ? 'ON' : 'OFF', accent: 'var(--success)' }} />
          </>
        ) : <NoData />}
      </DataCard>

      <DataCard
        dataKey="measure-detail"
        title="객체별 측정 상세"
        description="BBox 크기(%, px), 면적 비율, 종횡비와 거리·실측 폭/높이 추정치를 표시합니다. 기준 객체와 깊이 모델 옵션에 따라 정확도가 달라집니다."
        icon={<Ruler size={15} />}
        className="section-gap"
        right={<span className="chip mono">기준: {config.measurement.referenceObject.value} · {config.measurement.knownWidthCm.value}cm</span>}
      >
        {items.length ? (
          <div className="perf-list">
            <div className="perf-row perf-head">
              <span>객체</span><span>신뢰도</span><span>화면 크기</span><span>픽셀</span><span>면적</span><span>종횡비</span><span>거리</span><span>실측 폭/높이</span><span>방식</span>
            </div>
            {items.map((m, i) => (
              <div className="perf-row" key={`${m.label}-${i}`}>
                <span className="perf-name"><b>{m.label}</b><small className="faint">{m.kind}</small></span>
                <span className="mono">{Math.round(m.confidence * 100)}%</span>
                <span className="mono">{m.widthPercent}% × {m.heightPercent}%</span>
                <span className="mono">{m.widthPx}×{m.heightPx}</span>
                <span className="mono">{m.areaPercent}%</span>
                <span className="mono">{m.aspectRatio}</span>
                <span className="mono">{m.distanceM ? `${m.distanceM}m` : '-'}</span>
                <span className="mono">{m.widthCm ? `${m.widthCm}×${m.heightCm}cm` : '-'}</span>
                <span className="chip">{METHOD_LABEL[m.method]}</span>
              </div>
            ))}
          </div>
        ) : <NoData />}
      </DataCard>
    </div>
  );
}
