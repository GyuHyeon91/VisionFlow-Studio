interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

export default function Sparkline({ data, width = 80, height = 30, color = 'var(--accent)', fill = true }: Props) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const poly = pts.join(' ');
  const area = `0,${height} ${poly} ${width},${height}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {fill && <polygon points={area} fill={color} opacity={0.15} />}
      <polyline points={poly} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
