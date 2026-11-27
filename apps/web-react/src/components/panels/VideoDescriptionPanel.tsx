import { useRef, useState } from 'react';
import { Clipboard, Clock3, FileText, Highlighter, Play, Sparkles, UploadCloud, Volume2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import DataCard from './DataCard';

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 영상에 대한 텍스트 설명이 생성됩니다.</div>
    </div>
  );
}

export default function VideoDescriptionPanel() {
  const result = useStore((s) => s.result);
  const video = useStore((s) => s.video);
  const pushToast = useStore((s) => s.pushToast);
  const desc = result?.videoDescription;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [muted, setMuted] = useState(true);
  const threshold = useStore((s) => s.config.accuracy.confidenceThreshold.value);
  const liveBoxes = useLiveTracking(videoRef, !!video?.url, 0.7, threshold);
  const liveCount = liveBoxes.length;

  /** 현재 시점에 해당하는 캡션 */
  const activeCaption = desc?.captions.find(
    (c) => current >= c.timestamp && current < c.endTime,
  );

  /** 캡션 클릭 시 해당 시점으로 이동 */
  const seekTo = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setCurrent(t);
    void v.play().catch(() => {});
  };

  const copyAll = async () => {
    if (!desc) return;
    const text = [desc.summary, ...desc.captions.map((c) => `[${c.timestamp}s~${c.endTime}s] ${c.text}`)].join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      pushToast('영상 텍스트 설명을 클립보드에 복사했습니다.', 'success');
    } catch {
      pushToast('클립보드 복사에 실패했습니다.', 'warning');
    }
  };

  return (
    <div>
      <DataCard
        dataKey="video-desc-player"
        title="설명 데이터 영상"
        description="원본 영상 위에 현재 시점의 설명 캡션을 표시합니다. 아래 시간대별 설명을 누르면 해당 시점으로 이동합니다."
        icon={<Play size={15} />}
        right={
          <>
            <button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setShowOverlay((v) => !v)}>
              <FileText size={12} /> 캡션 {showOverlay ? '숨김' : '표시'}
            </button>
            <button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => setMuted((v) => !v)}>
              <Volume2 size={12} /> {muted ? '음소거' : '소리'}
            </button>
          </>
        }
        bodyClassName="card-pad"
      >
        {video?.url ? (
          <div className="video-frame" style={{ maxWidth: 720 }}>
            <video
              ref={videoRef}
              src={video.url}
              muted={muted}
              controls
              playsInline
              onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            />
            {showOverlay && activeCaption && (
              <div className="video-caption">
                {activeCaption.text}
                {liveCount > 0 && (
                  <span className="caption-live">현재 프레임 추적 {liveCount}개</span>
                )}
              </div>
            )}
            <div className="video-hud">
              <span className="hud-tag">● 설명 데이터</span>
              <span className="hud-tag mono">{current.toFixed(1)}s</span>
            </div>
          </div>
        ) : <NoData label="설명 영상" />}
      </DataCard>

      <DataCard
        dataKey="video-desc-summary"
        title="영상 텍스트 요약"
        description="영상 전체의 장면, 인물 수, 사고 및 조치 내용을 자연어 문장으로 요약한 설명입니다."
        icon={<FileText size={15} />}
        right={desc ? <button className="ghost-btn" style={{ fontSize: 10, padding: '6px 10px' }} onClick={copyAll}><Clipboard size={12} /> 전체 복사</button> : undefined}
        bodyClassName="card-pad"
      >
        {desc ? (
          <div className="video-summary-text">{desc.summary}</div>
        ) : <NoData label="영상 텍스트 요약" />}
      </DataCard>

      <div className="grid grid-2 section-gap">
        <DataCard
          dataKey="video-desc-captions"
          title="시간대별 영상 설명"
          description="10초 단위로 영상 내용을 설명한 캡션입니다. 각 구간에서 감지된 사고·행동·인구 밀도가 반영됩니다."
          icon={<Sparkles size={15} />}
          right={desc ? <span className="chip mono">{desc.sceneCount}개 구간</span> : undefined}
        >
          {desc ? (
            <div style={{ padding: '4px 20px 20px' }}>
              <div className="list">
                {desc.captions.map((c) => (
                  <button
                    className={`list-row caption-row caption-click ${activeCaption?.id === c.id ? 'active' : ''}`}
                    key={c.id}
                    onClick={() => seekTo(c.timestamp)}
                    title="클릭하면 영상이 해당 시점으로 이동합니다"
                  >
                    <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}><Play size={14} /></div>
                    <div className="row-main">
                      <div className="flex items-center gap-2"><span className="row-time mono">{c.timestamp}s ~ {c.endTime}s</span></div>
                      <div className="caption-text">{c.text}</div>
                      <div className="chip-row" style={{ marginTop: 6 }}>
                        {c.tags.map((tag, i) => <span className="chip" key={i}>{tag}</span>)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : <NoData label="시간대별 설명" />}
        </DataCard>

        <DataCard
          dataKey="video-desc-highlights"
          title="주요 하이라이트"
          description="영상에서 특히 주목해야 할 사고 시점과 통계를 추출한 목록입니다."
          icon={<Highlighter size={15} />}
          bodyClassName="card-pad"
        >
          {desc ? (
            <div className="list">
              {desc.highlights.map((h, i) => (
                <div className="list-row" key={i}>
                  <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--accent-4) 14%, transparent)', color: 'var(--accent-4)' }}><Highlighter size={14} /></div>
                  <div className="row-main"><div className="row-title text-sm">{h}</div></div>
                  <span className="row-time mono">#{i + 1}</span>
                </div>
              ))}
            </div>
          ) : <NoData label="하이라이트" />}
        </DataCard>
      </div>
    </div>
  );
}
