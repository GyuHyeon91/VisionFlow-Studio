import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, PlayCircle, Video } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { ActionRecommendation, Situation } from '@/types';
import DataCard from './DataCard';

interface Props {
  situations: Situation[];
  actions: ActionRecommendation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** 감지 상황 시점 영상 + 조치 절차 안내 */
export default function SituationVideoGuide({ situations, actions, selectedId, onSelect }: Props) {
  const video = useStore((s) => s.video);
  const ref = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [guidePlaying, setGuidePlaying] = useState(false);
  const selected = situations.find((s) => s.id === selectedId) ?? situations[0];
  const related = actions.filter((a) => a.situationId === selected?.id);
  const windowStart = Math.max(0, (selected?.timestamp ?? 0) - 2);
  const windowEnd = Math.min(video?.name ? 1e9 : 1e9, (selected?.timestamp ?? 0) + 10);

  useEffect(() => {
    if (!ref.current || !selected) return;
    ref.current.currentTime = windowStart;
    setCurrent(windowStart);
  }, [selected?.id, windowStart]);

  useEffect(() => {
    if (!ref.current || !guidePlaying) return;
    if (current >= windowEnd) {
      ref.current.pause();
      setGuidePlaying(false);
    }
  }, [current, windowEnd, guidePlaying]);

  const stepIndex = selected && current >= selected.timestamp
    ? Math.min(related.length - 1, Math.floor((current - selected.timestamp) / 3))
    : 0;

  const playGuide = () => {
    if (!ref.current) return;
    ref.current.currentTime = windowStart;
    ref.current.play();
    setGuidePlaying(true);
  };

  const move = (dir: number) => {
    const idx = situations.findIndex((s) => s.id === selected?.id);
    const next = situations[(idx + dir + situations.length) % situations.length];
    if (next) onSelect(next.id);
  };

  return (
    <DataCard
      dataKey="actions-video-guide"
      title="상황 영상 안내"
      description="선택한 상황이 발생한 시점의 영상을 재생하고, 조치 절차를 순서대로 안내합니다. 타임라인 마커를 눌러 다른 상황으로 이동할 수 있습니다."
      icon={<Video size={15} />}
      right={selected ? <span className="chip accent mono">{selected.timestamp.toFixed(1)}s 상황</span> : undefined}
    >
      {!selected ? (
        <div className="empty-state"><Video size={24} /><b>안내할 상황이 없습니다</b></div>
      ) : (
        <div style={{ padding: '4px 20px 20px' }}>
          <div className="video-frame playback-frame">
            {video?.url ? (
              <video
                ref={ref}
                src={video.url}
                muted
                playsInline
                controls
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
              />
            ) : (
              <div className="video-placeholder"><Video size={22} /><b>업로드된 영상이 없습니다</b></div>
            )}
            <div className="video-overlay" />
            <div className="video-hud">
              <span className="hud-tag">● 상황 안내</span>
              <span className="hud-tag">{selected.typeKo}</span>
              <span className="hud-tag">{current.toFixed(1)}s</span>
            </div>
            <div className="situation-guide-overlay">
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} />
                <b>{selected.typeKo}</b>
                <span className="chip mono">{selected.timestamp.toFixed(1)}s</span>
              </div>
              <div className="text-xs" style={{ marginTop: 5 }}>{selected.description}</div>
              {related.length > 0 && (
                <div className="guide-step">
                  <b>조치 {stepIndex + 1}/{related.length}</b> · {related[stepIndex]?.title}
                  <div className="text-xs faint mt-2">{related[stepIndex]?.description}</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 wrap">
            <button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => move(-1)}><ChevronLeft size={12} /> 이전 상황</button>
            <button className="primary-btn" style={{ fontSize: 10, padding: '6px 12px' }} onClick={playGuide}><PlayCircle size={13} /> 구간 안내 재생</button>
            <button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => move(1)}>다음 상황 <ChevronRight size={12} /></button>
            <span className="card-head-spacer" />
            <span className="text-xs faint mono">{situations.findIndex((s) => s.id === selected.id) + 1} / {situations.length}</span>
          </div>

          <div className="playback-markers" style={{ marginTop: 10 }}>
            {situations.map((s) => (
              <button
                key={s.id}
                className="playback-marker"
                style={{ left: `${(s.timestamp / 60) * 100}%`, background: s.severity === 'critical' ? 'var(--danger)' : 'var(--warning)' }}
                title={`${s.timestamp.toFixed(1)}s ${s.typeKo}`}
                onClick={() => onSelect(s.id)}
              />
            ))}
            <div className="playback-progress" style={{ width: `${(current / 60) * 100}%` }} />
          </div>
          <div className="chip-row mt-2">
            {related.flatMap((a) => a.steps).slice(0, 5).map((step, i) => (
              <span className={`chip ${i === stepIndex ? 'accent' : ''}`} key={i}>{i + 1}. {step}</span>
            ))}
          </div>
        </div>
      )}
    </DataCard>
  );
}
