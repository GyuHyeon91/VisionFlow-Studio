import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Eye, ScanFace, UploadCloud, Video } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import type { BehaviorSeverity } from '@/types';
import DataCard from './DataCard';
import { reportFalsePositive } from '@/services/feedbackApi';
import { detectBehaviors } from '@/services/behaviorApi';
import type { BehaviorEvent } from '@/types';

const KIND_LABEL: Record<string, string> = { person: '인물', vehicle: '차량', object: '객체' };

const kindOf = (d: any): 'person' | 'vehicle' | 'object' => {
  const v = d?.kind ?? d?.pose;
  if (v === 'person' || v === '인물') return 'person';
  if (v === 'vehicle' || v === 'car' || v === '차량' || v === '자동차') return 'vehicle';
  return 'object';
};

const labelOf = (d: any): string =>
  d?.labelKo ?? d?.label ?? d?.className ?? d?.class ??
  (d?.pose === 'person' || d?.kind === 'person' ? '사람'
    : d?.pose === 'vehicle' || d?.kind === 'vehicle' ? '자동차'
      : '미분류');

/** 트랙별 최신 감지 1개만 유지 */
const uniqueDetections = (list: any[]) => {
  const map = new Map<string, any>();
  for (const d of list) {
    const key = String(d?.trackId ?? String(d?.id ?? '').split('-')[0]);
    if (!map.has(key)) map.set(key, d);
  }
  return [...map.values()].slice(0, 8);
};

const SEVERITY_LABEL: Record<BehaviorSeverity, string> = {
  info: '정보', caution: '주의', warning: '경고', critical: '위험',
};

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 이 영역에 결과가 출력됩니다.</div>
    </div>
  );
}

export default function BehaviorPanel() {
  const result = useStore((s) => s.result);
  const video = useStore((s) => s.video);
  const pushToast = useStore((s) => s.pushToast);
  const latency = useStore((s) => s.detectionLatencyMs);
  const [filter, setFilter] = useState<BehaviorSeverity | 'all'>('all');
  const [current, setCurrent] = useState(0);
  const [videoAspect, setVideoAspect] = useState(16 / 9);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sensitivity = useStore((s) => s.config.accuracy.personDetectionSensitivity.value);
  const threshold = useStore((s) => s.config.accuracy.confidenceThreshold.value);
  // 실시간 추적 상시 ON
  const liveBoxes = useLiveTracking(videoRef, true, sensitivity, threshold);
  const [realBehaviors, setRealBehaviors] = useState<BehaviorEvent[]>([]);

  useEffect(() => {
    if (!video?.url) { setRealBehaviors([]); return; }
    let alive = true;
    const poll = async () => {
      try {
        const items = await detectBehaviors(video.url!, 0.5);
        if (alive) setRealBehaviors(items);
      } catch { /* 실패 시 기존 분석 결과 유지 */ }
    };
    void poll();
    const timer = setInterval(() => void poll(), 800);
    return () => { alive = false; clearInterval(timer); };
  }, [video?.url]);

  // 현재 재생 시점의 추적 형상만 표시 (프레임별 정확도 향상)
  // 트랙별로 현재 시점에 가장 가까운 위치 하나만 표시 (과거 궤적 중복 방지)
  const trackBoxes = (result?.videoSignals?.tracks ?? []).flatMap((track) => {
    const nearest = track.points.reduce<(typeof track.points)[number] | null>(
      (best, p) => (!best || Math.abs(p.t - current) < Math.abs(best.t - current) ? p : best),
      null,
    );
    if (!nearest || Math.abs(nearest.t - current) > 2) return [];
    return [{
      key: track.id,
      id: `${KIND_LABEL[track.kind] ?? '객체'} ${Math.round(nearest.confidence * 100)}%`,
      kind: track.kind,
      x: nearest.x, y: nearest.y, w: nearest.w, h: nearest.h, confidence: nearest.confidence,
    }];
  });
  // 실시간 감지 Box를 우선 사용하고, 없으면 분석 결과 Box를 표시한다
  const boxes = liveBoxes.length
    ? liveBoxes.map((b) => ({ key: b.id, id: `${b.label ?? KIND_LABEL[b.kind]} ${Math.round(b.confidence * 100)}%`, kind: b.kind, x: b.x, y: b.y, w: b.w, h: b.h, confidence: b.confidence }))
    : trackBoxes.length ? trackBoxes : uniqueDetections(
      (result?.detections ?? []).filter((d) => {
        // 목업/무작위 좌표는 클래스 정보가 없으므로 제외
        const label = (d as any).labelKo ?? (d as any).label;
        const kind = (d as any).kind;
        return !!label || kind === 'person' || kind === 'vehicle';
      }),
    ).map((d, i) => ({
    key: d.id || `d-${i}`,
    id: `${labelOf(d)} ${Math.round(d.confidence * 100)}%`,
    kind: kindOf(d),
    x: d.bbox.x, y: d.bbox.y, w: d.bbox.w, h: d.bbox.h, confidence: d.confidence,
  }));

  const handleFalsePositive = async (b: (typeof boxes)[number]) => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) { pushToast('영상을 재생한 뒤 신고해 주세요.', 'warning'); return; }
    const stage = document.createElement('canvas');
    stage.width = v.videoWidth; stage.height = v.videoHeight;
    stage.getContext('2d')!.drawImage(v, 0, 0);
    try {
      const label = String(b.id).split(' ')[0] || 'object';
      await reportFalsePositive(stage, label, b.confidence, {
        x: b.x, y: b.y, w: b.w, h: b.h,
      });
      pushToast(`'${label}' 오탐을 신고했습니다. 재학습에 반영됩니다.`, 'success');
    } catch (err) { pushToast(`신고 실패: ${(err as Error).message}`, 'error'); }
  };

  const behaviors = useMemo(() => {
    const source = realBehaviors.length ? realBehaviors : (result?.behaviors ?? []);
    return filter === 'all' ? source : source.filter((b) => b.severity === filter);
  }, [result, filter, realBehaviors]);

  return (
    <div className="grid grid-2-1">
      <DataCard
        dataKey="behavior-video"
        title="영상 분석 뷰"
        description="분석된 영상 프레임에 감지된 인물의 위치(Bounding Box), 트랙 ID, 신뢰도를 겹쳐 표시합니다."
        icon={<Video size={15} />}
        right={result ? (
          <>
            <span className="chip accent">LIVE {liveBoxes.length} · {latency}ms</span>
            <span className="chip mono" style={{ marginLeft: 6 }}>실시간 추적 상시 ON</span>
          </>
        ) : undefined}
      >
        {result ? (
          <div style={{ padding: '0 16px 16px' }}>
            <div className="video-frame">
              <div className="video-stage" style={{ aspectRatio: videoAspect }}>
                {video?.url ? <video ref={videoRef} src={video.url} muted playsInline autoPlay loop controls onLoadedMetadata={(e) => { const r = e.currentTarget.videoWidth / e.currentTarget.videoHeight; if (Number.isFinite(r) && r > 0) setVideoAspect(r); }} onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)} /> : (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at 30% 40%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 45%), linear-gradient(135deg, #0a1120, #13213c)',
                  }} />
                )}
                {boxes.map((b) => (
                  <div
                    key={b.key}
                    className={`bbox bbox-${b.kind ?? 'object'}`}
                    data-label={b.id}
                    style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                  >
                    <button className="bbox-report" title="이 탐지가 틀렸으면 눌러 신고 (모델 재학습에 반영)" onClick={(e) => { e.stopPropagation(); void handleFalsePositive(b); }}>✕</button>
                  </div>
                ))}
              </div>
              <div className="video-overlay" />
              <div className="video-hud">
                <span className="hud-tag">● LIVE TRACKING</span>
                <span className="hud-tag">{result.durationSec}s</span>
                <span className="hud-tag">{result.processedFrames} FRAMES</span>
                <span className="hud-tag">ENGINE: {result.engine}</span>
              </div>
              {boxes.length === 0 && (
                <div className="tracking-empty">추적된 형상이 없습니다. 움직이는 객체가 있는 영상을 업로드해 주세요.</div>
              )}
              <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Crosshair size={13} style={{ color: 'var(--accent-3)' }} />
                <div className="run-bar" style={{ flex: 1 }}>
                  <i style={{ width: `${(current / Math.max(result.durationSec, 1)) * 100}%`, background: 'var(--accent-3)' }} />
                </div>
                <span className="mono text-xs faint">{current.toFixed(1)}s / {result.durationSec}s</span>
              </div>
            </div>
            <div className="chip-row mt-2">
              <span className="chip">처리 프레임 {result.processedFrames.toLocaleString()}</span>
              <span className="chip">감지 인물 {result.personsDetected}명</span>
              <span className="chip">평균 신뢰도 {Math.round(result.summary.avgConfidence * 100)}%</span>
            </div>
          </div>
        ) : <NoData label="영상 분석 뷰" />}
      </DataCard>

      <DataCard
        dataKey="behavior-list"
        title="감지된 행동"
        description="시간대별 행동 이벤트와 심각도, 지속 시간, 신뢰도를 표시합니다. 심각도 탭으로 필터링할 수 있습니다."
        icon={<ScanFace size={15} />}
        right={result ? <span className="chip mono">{behaviors.length}건</span> : undefined}
      >
        {result ? (
          <div style={{ padding: '0 16px 8px' }}>
            <div className="tabs" style={{ marginBottom: 12 }}>
              {(['all', 'info', 'caution', 'warning', 'critical'] as const).map((f) => (
                <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? '전체' : SEVERITY_LABEL[f]}
                </button>
              ))}
            </div>
            <div className="list">
              {behaviors.map((b) => (
                <div className="list-row" key={b.id}>
                  <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}><Eye size={14} /></div>
                  <div className="row-main">
                    <div className="row-title">{b.labelKo} <span className="faint text-xs">#{b.trackId}</span></div>
                    <div className="row-sub">{b.category} · {b.durationSec}s 지속</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${b.severity}`}>{SEVERITY_LABEL[b.severity]}</span>
                    <div className="row-sub mono">{b.timestamp.toFixed(1)}s</div>
                  </div>
                  <div className="conf-bar"><i style={{ width: `${b.confidence * 100}%` }} /></div>
                </div>
              ))}
              {behaviors.length === 0 && <div className="text-xs faint" style={{ padding: 20, textAlign: 'center' }}>해당 필터에 맞는 이벤트가 없습니다.</div>}
            </div>
          </div>
        ) : <NoData label="행동 감지" />}
      </DataCard>
    </div>
  );
}
