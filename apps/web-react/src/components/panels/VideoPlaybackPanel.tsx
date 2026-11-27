import { useRef, useState } from 'react';
import { AlertTriangle, Play, Radio, Video } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import type { AnalysisResult } from '@/types';
import DataCard from './DataCard';
import { reportFalsePositive } from '@/services/feedbackApi';

interface Props {
  result: AnalysisResult;
}

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

const uniqueDetections = (list: any[]) => {
  const map = new Map<string, any>();
  for (const d of list) {
    const key = String(d?.trackId ?? String(d?.id ?? '').split('-')[0]);
    if (!map.has(key)) map.set(key, d);
  }
  return [...map.values()].slice(0, 8);
};

/** 업로드된 영상 재생 + 재생 시점 기반 데이터 오버레이 */
export default function VideoPlaybackPanel({ result }: Props) {
  const video = useStore((s) => s.video);
  const pushToast = useStore((s) => s.pushToast);
  const ref = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const [videoAspect, setVideoAspect] = useState(16 / 9);
  const sensitivity = useStore((s) => s.config.accuracy.personDetectionSensitivity.value);
  const threshold = useStore((s) => s.config.accuracy.confidenceThreshold.value);
  // 실시간 추적은 항상 활성화 (토글 없음)
  const liveBoxes = useLiveTracking(ref, true, sensitivity, threshold);

  // 재생 중 프레임에서 직접 검출한 Box를 항상 우선 표시
  const liveMapped = liveBoxes.map((b) => ({ key: b.id, id: `${b.label ?? KIND_LABEL[b.kind]} ${Math.round(b.confidence * 100)}%`, kind: b.kind, x: b.x, y: b.y, w: b.w, h: b.h, confidence: b.confidence }));
  const primaryBoxes = liveMapped;
  const displayBoxes = primaryBoxes.length
    ? primaryBoxes
    : uniqueDetections(
      result.detections.filter((d) => {
        const label = (d as any).labelKo ?? (d as any).label;
        const kind = (d as any).kind;
        return !!label || kind === 'person' || kind === 'vehicle';
      }),
    ).map((d, i) => ({
    key: `d-${i}`,
    id: `${labelOf(d)} ${Math.round(d.confidence * 100)}%`,
    kind: kindOf(d),
    x: d.bbox.x,
    y: d.bbox.y,
    w: d.bbox.w,
    h: d.bbox.h,
    confidence: d.confidence,
  }));

  const caption = result.videoDescription?.captions.find((c) => current >= c.timestamp && current < c.endTime);
  const activeAccidents = result.accidents.filter((a) => current >= a.timestamp && current <= a.endTime);
  const seek = (t: number) => {
    if (ref.current) { ref.current.currentTime = t; setCurrent(t); }
  };
  const fmt = (t: number) => `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`;

  const handleFalsePositive = async (b: (typeof displayBoxes)[number]) => {
    const v = ref.current;
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
    } catch (err) {
      pushToast(`신고 실패: ${(err as Error).message}`, 'error');
    }
  };

  return (
    <DataCard
      dataKey="analysis-video-playback"
      title="영상 재생 및 영상 내 데이터"
      description="업로드한 영상을 재생하며 현재 시점의 추적 형상(BBox·트랙 ID·신뢰도), 사고 알림, 시간대별 캡션을 영상 위에 표시합니다. 실시간 추적은 항상 켜져 있습니다."
      icon={<Video size={15} />}
      right={
        <>
          <span className="chip accent mono">LIVE {liveBoxes.length}</span>
          <span className="chip mono" style={{ marginLeft: 6 }}>
            <Radio size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 실시간 추적 상시 ON
          </span>
        </>
      }
    >
      <div style={{ padding: '4px 20px 20px' }}>
        <div className="video-frame playback-frame">
          <div className="video-stage" style={{ aspectRatio: videoAspect }}>
            {video?.url && !mediaError ? (
              <video
                ref={ref}
                src={video.url}
                controls
                playsInline
                onLoadedMetadata={(e) => {
                  const r = e.currentTarget.videoWidth / e.currentTarget.videoHeight;
                  if (Number.isFinite(r) && r > 0) setVideoAspect(r);
                }}
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
                onError={() => setMediaError(true)}
              />
            ) : (
              <div className="video-placeholder">
                <Play size={28} />
                <b>{mediaError ? '영상을 재생할 수 없습니다' : '업로드된 영상이 없습니다'}</b>
                <span>상단의 영상 업로드에서 실제 영상 파일을 선택하면 재생과 데이터 오버레이가 표시됩니다.</span>
              </div>
            )}
            {displayBoxes.map((b) => (
              <div
                key={b.key}
                className={`bbox bbox-${b.kind ?? 'object'}`}
                data-label={b.id}
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
              >
                <button
                  className="bbox-report"
                  title="이 탐지가 틀렸으면 눌러 신고 (모델 재학습에 반영)"
                  onClick={(e) => { e.stopPropagation(); void handleFalsePositive(b); }}
                >✕</button>
              </div>
            ))}
          </div>
          <div className="video-overlay" />
          <div className="video-hud">
            <span className="hud-tag">● LIVE DATA</span>
            <span className="hud-tag">{fmt(current)} / {fmt(result.durationSec)}</span>
            <span className="hud-tag">프레임 객체 {displayBoxes.length}</span>
          </div>

          {activeAccidents.map((a) => (
            <div className="accident-alert" key={a.id}>
              <AlertTriangle size={13} /> {a.timestamp.toFixed(1)}s {a.title} · {a.zone}
            </div>
          ))}

          {caption && <div className="video-caption">{caption.text}</div>}
        </div>

        <div className="playback-markers">
          {result.accidents.map((a) => (
            <button
              key={a.id}
              className="playback-marker"
              style={{ left: `${(a.timestamp / Math.max(result.durationSec, 1)) * 100}%`, background: a.severity === 'critical' ? 'var(--danger)' : 'var(--warning)' }}
              title={`${a.timestamp.toFixed(1)}s ${a.title}`}
              onClick={() => seek(a.timestamp)}
            />
          ))}
          <div className="playback-progress" style={{ width: `${(current / Math.max(result.durationSec, 1)) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs faint mt-2">
          <span>사고 마커를 클릭하면 해당 시점으로 이동합니다.</span>
          <span className="mono">{displayBoxes.length}개 객체 · {activeAccidents.length}건 진행 중</span>
        </div>
      </div>
    </DataCard>
  );
}
