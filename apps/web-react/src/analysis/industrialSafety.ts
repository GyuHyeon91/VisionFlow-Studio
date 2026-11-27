/** 산업 현장 전용 위험/사고 판정.
 *
 * 원칙: 탐지된 객체가 있다는 것만으로 사고가 아니다.
 * 거리·접근 속도·지속 시간·자세 변화·정지 여부를 함께 본다.
 * 단순 근접은 '주의', 시간적 특징이 맞을 때만 '사고 의심'.
 */
import type { LiveBox } from './liveTracker';

export interface SafetyFinding {
  type: 'proximity' | 'collision_risk' | 'fall' | 'sudden_stop' | 'restricted';
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  evidence: string[];
  trackIds: string[];
  confidence: number;
}

interface TrackState {
  t: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  aspect: number;
  lastMove: number;
}

const tracks = new Map<string, TrackState>();
const proximitySince = new Map<string, number>();
const emitted = new Map<string, number>();

export const INDUSTRIAL_RULES = {
  proximityDist: 14,        // 지게차-작업자 주의 거리 (%)
  dangerDist: 7,            // 위험 근접 거리 (%)
  proximitySec: 1.2,        // 위험 상태 지속 시간
  approachSpeed: 4,         // 접근 속도 기준 (%/s)
  fallDropPct: 8,
  postureChange: 0.35,
};

export function resetSafety() {
  tracks.clear();
  proximitySince.clear();
  emitted.clear();
}

const isWorker = (b: LiveBox) =>
  b.kind === 'person' || /사람|작업자|person/.test(b.label ?? '');
const isForklift = (b: LiveBox) =>
  b.kind === 'vehicle' && /지게차|forklift/.test(b.label ?? '');

function emit(type: SafetyFinding['type'], t: number, verdict: Omit<SafetyFinding, 'confidence'>): SafetyFinding | null {
  const key = `${type}-${verdict.trackIds.join('_')}`;
  if (t - (emitted.get(key) ?? -99) < 4) return null;
  emitted.set(key, t);
  return {
    ...verdict,
    confidence: verdict.severity === 'critical' ? 0.78 : verdict.severity === 'warning' ? 0.6 : 0.4,
  };
}

/** 프레임 단위 분석. 사고 의심 이벤트만 반환한다. */
export function analyzeIndustrial(boxes: LiveBox[], restrictedZones: Array<{ x: number; y: number; w: number; h: number }> = []): SafetyFinding[] {
  if (!boxes.length) return [];
  const t = boxes[0]?.t ?? 0;
  const findings: SafetyFinding[] = [];

  // 1) 트랙 상태 갱신 (속도·자세)
  const next = new Map<string, TrackState>();
  for (const b of boxes) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const aspect = b.w / Math.max(1, b.h);
    const prev = tracks.get(b.id);
    const dt = prev ? Math.max(0.05, t - prev.t) : 0.1;
    const vx = prev ? (cx - prev.x) / dt : 0;
    const vy = prev ? (cy - prev.y) / dt : 0;
    const moving = Math.hypot(vx, vy) > 1.5;
    next.set(b.id, {
      t, x: cx, y: cy, w: b.w, h: b.h, vx, vy, aspect,
      lastMove: moving ? t : (prev?.lastMove ?? t),
    });

    // 2) 추락/넘어짐: 수직 하강 + 자세 변화 + 이후 정지
    if (prev && /사람|작업자|person/.test(b.label ?? '')) {
      const drop = cy - prev.y;
      const posture = aspect - prev.aspect;
      if ((drop >= INDUSTRIAL_RULES.fallDropPct || (posture >= INDUSTRIAL_RULES.postureChange && drop >= 2))
          && Math.hypot(vx, vy) < 2.5) {
        const f = emit('fall', t, {
          type: 'fall', title: '추락·넘어짐 의심', severity: 'critical',
          description: '작업자의 급격한 위치·자세 변화 후 정지 상태가 확인되었습니다.',
          evidence: [`수직 이동 ${drop.toFixed(1)}%`, `종횡비 ${prev.aspect.toFixed(2)} → ${aspect.toFixed(2)}`, '이후 정지'],
          trackIds: [b.id],
        });
        if (f) findings.push(f);
      }
    }

    // 3) 위험 구역 체류
    for (let i = 0; i < restrictedZones.length; i += 1) {
      const z = restrictedZones[i];
      if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) {
        const f = emit('restricted', t, {
          type: 'restricted', title: '위험 구역 진입', severity: 'warning',
          description: '작업자가 설정된 위험 구역에 진입했습니다.',
          evidence: [`구역 ${i + 1}`, `${b.id} 위치 (${cx.toFixed(0)}, ${cy.toFixed(0)})`],
          trackIds: [b.id],
        });
        if (f) findings.push(f);
      }
    }
  }

  // 4) 지게차-작업자 위험 접근: 단순 근접이 아니라 '접근 + 지속 + 감속'
  const workers = boxes.filter(isWorker);
  const forklifts = boxes.filter(isForklift);
  for (const w of workers) {
    const wcx = w.x + w.w / 2;
    const wcy = w.y + w.h / 2;
    const ws = next.get(w.id);
    for (const f of forklifts) {
      const fcx = f.x + f.w / 2;
      const fcy = f.y + f.h / 2;
      const dist = Math.hypot(wcx - fcx, wcy - fcy);
      const fs = next.get(f.id);
      const approaching = fs && ws
        ? (wcx - fcx) * (fs.vx - ws.vx) + (wcy - fcy) * (fs.vy - ws.vy) < 0
        : false;
      const closing = fs && ws && dist < INDUSTRIAL_RULES.proximityDist
        ? Math.max(0, -((wcx - fcx) * (ws.vx - fs.vx) + (wcy - fcy) * (ws.vy - fs.vy)) / Math.max(dist, 1))
        : 0;
      const key = `${w.id}_${f.id}`;

      if (dist < INDUSTRIAL_RULES.proximityDist && (approaching || closing > INDUSTRIAL_RULES.approachSpeed)) {
        const since = proximitySince.get(key) ?? t;
        proximitySince.set(key, since);
        const duration = t - since;
        if (dist < INDUSTRIAL_RULES.dangerDist && duration >= INDUSTRIAL_RULES.proximitySec) {
          const stopped = ws && fs && Math.hypot(ws.vx - fs.vx, ws.vy - fs.vy) < 3;
          const result = emit('collision_risk', t, {
            type: 'collision_risk',
            title: '지게차-작업자 충돌 위험',
            severity: 'critical',
            description: '지게차와 작업자가 가까워진 상태가 지속되어 충돌 위험이 의심됩니다.',
            evidence: [
              `거리 ${dist.toFixed(1)}% (${duration.toFixed(1)}s 지속)`,
              `상대 접근 ${closing.toFixed(1)}%/s`,
              stopped ? '이후 상대 정지' : '접근 지속',
            ],
            trackIds: [w.id, f.id],
          });
          if (result) findings.push(result);
        } else if (dist < INDUSTRIAL_RULES.proximityDist) {
          const result = emit('proximity', t, {
            type: 'proximity', title: '지게차-작업자 근접', severity: 'warning',
            description: '두 객체가 가까워지고 있습니다. 사고는 아직 확인되지 않았습니다.',
            evidence: [`거리 ${dist.toFixed(1)}%`, `지속 ${duration.toFixed(1)}s`],
            trackIds: [w.id, f.id],
          });
          if (result) findings.push(result);
        }
      } else {
        proximitySince.delete(key);
      }
    }
  }

  tracks.clear();
  next.forEach((v, k) => tracks.set(k, v));
  return findings;
}
