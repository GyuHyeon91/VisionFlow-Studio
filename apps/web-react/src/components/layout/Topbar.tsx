import { CircleStop, Moon, Play, Sun, Upload } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ENGINE_LABELS } from '@/engine/factory';
import appConfig from '@/config';
import { useRef } from 'react';

interface Props {
  onThemeToggle: () => void;
  isDark: boolean;
}

export default function Topbar({ onThemeToggle, isDark }: Props) {
  const engine = useStore((s) => s.config.options.analysisEngine.value);
  const running = useStore((s) => s.running);
  const stage = useStore((s) => s.stage);
  const progress = useStore((s) => s.progress);
  const runAnalysis = useStore((s) => s.runAnalysis);
  const cancelAnalysis = useStore((s) => s.cancelAnalysis);
  const setVideo = useStore((s) => s.setVideo);
  const pushToast = useStore((s) => s.pushToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const video = useStore((s) => s.video);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideo(file.name, url, { size: file.size, lastModified: file.lastModified });
    pushToast(`영상 로드됨: ${file.name} · 자동 분석 시작`, 'success');
  };

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{appConfig.project.name}</div>
        <div className="topbar-sub">{running ? stage : video ? `분석 완료 · ${video.name}` : '영상을 업로드하면 분석이 시작됩니다'}</div>
      </div>
      <div style={{ width: 180 }}>
        <div className="run-bar"><i style={{ width: `${(running ? progress : 1) * 100}%` }} /></div>
      </div>
      <div className="topbar-spacer" />
      <div className="engine-pill">엔진 <b>{ENGINE_LABELS[engine]}</b></div>
      <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFile} />
      <button className="ghost-btn" onClick={() => fileRef.current?.click()}>
        <Upload size={14} /> 영상 업로드
      </button>
      <button className="icon-btn" onClick={onThemeToggle} title="테마 전환">
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      {running ? (
        <button className="ghost-btn" onClick={cancelAnalysis}><CircleStop size={14} /> 중지</button>
      ) : (
        <button className="primary-btn" onClick={() => runAnalysis(undefined, true)}>
          <Play size={15} fill="currentColor" /> 분석 실행
        </button>
      )}
    </header>
  );
}
