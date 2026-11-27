interface Props {
  data: number[];
  columns?: number;
  label?: string;
}

/** 시간대별 혼잡도 히트맵 */
export default function Heatmap({ data, columns = 20, label }: Props) {
  const max = Math.max(...data, 1);
  const cells = Array.from({ length: columns }, (_, i) => {
    const v = data[Math.floor((i / columns) * data.length)] ?? 0;
    return v / max;
  });
  const colorFor = (v: number) => {
    if (v < 0.25) return 'color-mix(in srgb, var(--accent) 12%, transparent)';
    if (v < 0.5) return 'color-mix(in srgb, var(--accent) 35%, transparent)';
    if (v < 0.75) return 'color-mix(in srgb, var(--accent-4) 55%, transparent)';
    return 'color-mix(in srgb, var(--danger) 80%, transparent)';
  };

  return (
    <div>
      {label && <div className="text-xs faint" style={{ marginBottom: 8 }}>{label}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 4 }}>
        {cells.map((v, i) => (
          <div
            key={i}
            title={`${Math.round((i / columns) * 100)}% 지점 · 강도 ${Math.round(v * 100)}%`}
            style={{
              height: 22,
              borderRadius: 5,
              background: colorFor(v),
              border: '1px solid var(--panel-border)',
              transition: 'transform 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs faint" style={{ marginTop: 6 }}>
        <span>00:00</span><span>타임라인 혼잡도</span><span>01:00</span>
      </div>
    </div>
  );
}
