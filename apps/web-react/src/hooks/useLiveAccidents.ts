import { useEffect, useState } from 'react';
import type { LiveBox } from '@/analysis/liveTracker';
import { analyzeIndustrial, resetSafety, type SafetyFinding } from '@/analysis/industrialSafety';
import type { LiveAccident } from '@/types';

const SEVERITY_MAP = {
  info: 'caution' as const,
  warning: 'warning' as const,
  critical: 'critical' as const,
};

/** 실시간 추적 Box 스트림에서 산업 현장 위험/사고 징후를 감지한다.
 * 단순 탐지는 사고가 아니며, 시간적 특징이 확인된 경우에만 이벤트를 발행한다.
 */
export function useLiveAccidents(boxes: LiveBox[], enabled: boolean): LiveAccident[] {
  const [accidents, setAccidents] = useState<LiveAccident[]>([]);

  useEffect(() => {
    if (!enabled) { setAccidents([]); resetSafety(); return; }
    if (!boxes.length) return;
    const findings: SafetyFinding[] = analyzeIndustrial(boxes);
    if (!findings.length) return;
    const t = boxes[0]?.t ?? 0;
    setAccidents((list) => [
      ...findings.map((f, i) => ({
        id: `${f.type}-${Math.round(t * 10)}-${i}`,
        timestamp: t,
        type: f.type,
        title: f.title,
        severity: SEVERITY_MAP[f.severity],
        description: `${f.description} · 추적 ${f.trackIds.join(', ')} · 신뢰도 ${Math.round(f.confidence * 100)}%`,
        evidence: f.evidence,
      })) as LiveAccident[],
      ...list,
    ].slice(0, 20));
  }, [boxes, enabled]);

  return accidents;
}
