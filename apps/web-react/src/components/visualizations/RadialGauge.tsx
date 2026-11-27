import { motion } from 'framer-motion';

interface Props {
  value: number; // 0~100
  label: string;
  color?: string;
  size?: number;
  sublabel?: string;
}

export default function RadialGauge({ value, label, color = 'var(--accent)', size = 132, sublabel }: Props) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-border)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800 }}>{Math.round(pct)}</div>
            <div className="text-xs faint">{sublabel ?? '/ 100'}</div>
          </div>
        </div>
      </div>
      <div className="text-sm" style={{ fontWeight: 700 }}>{label}</div>
    </div>
  );
}
