import { useEffect, useState } from 'react';
import { Activity, Radio, Route, ShieldAlert } from 'lucide-react';
import { useStore } from '@/store/useStore';
import DataCard from './DataCard';
import { backendBaseUrl } from '@/config';
import { useAnalysisStream } from '@/hooks/useAnalysisStream';

export default function StreamPredictionPanel() {
  const config = useStore((s) => s.config);
  const pushToast = useStore((s) => s.pushToast);
  const { event, connected } = useAnalysisStream();
  const [url, setUrl] = useState(config.streaming.rtspUrl.value);
  const [streamStatus, setStreamStatus] = useState<{ running: boolean; frames: number; lastError: string | null } | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [runtime, setRuntime] = useState<{ broker?: { type: string; connected: boolean }; webrtcUrl?: string } | null>(null);
  const [clips, setClips] = useState<Array<{ name: string; size: number }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await (await fetch(`${backendBaseUrl()}/api/stream/status`)).json();
        setStreamStatus(s);
        const e = await (await fetch(`${backendBaseUrl()}/api/events?limit=100`)).json();
        setEventCount(e.events?.length ?? 0);
        const rt = await (await fetch(`${backendBaseUrl()}/api/runtime`)).json();
        setRuntime(rt);
        const c = await (await fetch(`${backendBaseUrl()}/api/clips`)).json();
        setClips(c.clips ?? []);
      } catch { /* 백엔드 미실행 시 무시 */ }
    };
    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => clearInterval(timer);
  }, [event?.timestamp]);

  const control = async (action: 'start' | 'stop') => {
    try {
      const res = await fetch(`${backendBaseUrl()}/api/stream/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'start' ? JSON.stringify({ rtspUrl: url }) : undefined,
      });
      if (!res.ok) throw new Error('요청 실패');
      pushToast(action === 'start' ? 'RTSP 분석을 시작했습니다.' : 'RTSP 분석을 중지했습니다.', 'success');
    } catch (err) {
      pushToast(`스트림 제어 실패: ${(err as Error).message}`, 'error');
    }
  };

  const predictions = event?.predictions ?? [];

  return (
    <div className="grid grid-2">
      <DataCard
        dataKey="stream-status"
        title="실시간 스트림 · 이벤트 푸시"
        description="WebSocket으로 서버 분석 이벤트를 즉시 수신합니다. RTSP 주소를 입력하면 서버가 프레임을 직접 수신·분석합니다."
        icon={<Radio size={15} />}
        right={<span className={`chip ${connected ? 'accent' : ''}`}>{connected ? 'WS 연결' : 'WS 대기'}</span>}
        bodyClassName="card-pad"
      >
        <div className="field">
          <div className="field-label"><span>RTSP 주소</span></div>
          <input
            className="ghost-btn full"
            style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }}
            value={url}
            placeholder="rtsp://user:pass@camera/stream"
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="flex gap-2 wrap">
          <button className="primary-btn" onClick={() => control('start')} disabled={!url || streamStatus?.running}><Radio size={14} /> 분석 시작</button>
          <button className="ghost-btn" onClick={() => control('stop')} disabled={!streamStatus?.running}>분석 중지</button>
        </div>
        <div className="divider" />
        <div className="flex justify-between text-sm"><span className="dim">서버 상태</span><b className="mono">{streamStatus?.running ? 'RUNNING' : 'IDLE'}</b></div>
        <div className="flex justify-between text-sm mt-2"><span className="dim">처리 프레임</span><b className="mono">{streamStatus?.frames ?? 0}</b></div>
        <div className="flex justify-between text-sm mt-2"><span className="dim">저장 이벤트</span><b className="mono">{eventCount}</b></div>
        <div className="flex justify-between text-sm mt-2"><span className="dim">브로커</span><b className="mono">{runtime?.broker?.type ?? 'local'} · {runtime?.broker?.connected ? '연결' : '로컬'}</b></div>
        <div className="flex justify-between text-sm mt-2"><span className="dim">저장 클립</span><b className="mono">{clips.length}개</b></div>
        {runtime?.webrtcUrl && (
          <a className="ghost-btn full mt-2" style={{ fontSize: 10, padding: '6px 10px', justifyContent: 'center' }} href={runtime.webrtcUrl} target="_blank" rel="noreferrer">
            <Radio size={12} /> WebRTC 영상 열기
          </a>
        )}
        {streamStatus?.lastError && <div className="text-xs" style={{ color: 'var(--danger)', marginTop: 8 }}>{streamStatus.lastError}</div>}
      </DataCard>

      <DataCard
        dataKey="prediction-list"
        title="이동 예측 · 위험 구역"
        description="칼만 필터로 예측한 1~3초 후 위치와 ROI 위험구역 교차 여부를 표시합니다. 별도 유료 예측 모델 없이 동작합니다."
        icon={<Route size={15} />}
        right={<span className="chip mono">{predictions.length}개 객체</span>}
        bodyClassName="card-pad"
      >
        {predictions.length ? (
          <div className="list">
            {predictions.map((p) => (
              <div className="list-row" key={p.id}>
                <div className="row-icon" style={{ background: p.danger ? 'color-mix(in srgb, var(--danger) 14%, transparent)' : 'color-mix(in srgb, var(--accent) 12%, transparent)', color: p.danger ? 'var(--danger)' : 'var(--accent)' }}>
                  {p.danger ? <ShieldAlert size={14} /> : <Activity size={14} />}
                </div>
                <div className="row-main">
                  <div className="row-title">{p.label} <span className="faint text-xs mono">{p.id}</span></div>
                  <div className="row-sub">
                    현재 ({p.current.map((v) => v.toFixed(0)).join(', ')}) → {p.horizonSec}초 후 ({p.predicted.map((v) => v.toFixed(0)).join(', ')}) · 속도 {p.speed}
                  </div>
                </div>
                <span className={`badge ${p.danger ? 'badge-critical' : 'badge-info'}`}>{p.danger ? '위험구역 진입' : '안전'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><Route size={24} /><b>예측 데이터 대기 중</b><div className="text-xs">영상 재생 또는 RTSP 분석을 시작하면 예측 궤적이 표시됩니다.</div></div>
        )}
      </DataCard>

      <DataCard
        dataKey="safety-events"
        title="현장 안전 판별 · 상황 추론"
        description="위험 구역 내 객체 소실과 정지 지속을 조합해 추락과 다툼을 구분합니다. VLM 대신 무료 룰 기반 문맥 추론으로 근거를 생성합니다."
        icon={<ShieldAlert size={15} />}
        className="section-gap"
        right={<span className="chip mono">{(event?.safetyEvents ?? []).length}건</span>}
      >
        {event?.contextDescription && (
          <div className="guide-step" style={{ marginBottom: 12 }}>{event.contextDescription}</div>
        )}
        {(event?.safetyEvents ?? []).length ? (
          <div className="list">
            {event!.safetyEvents!.map((e) => (
              <div className="list-row" key={e.id}>
                <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)' }}>
                  <ShieldAlert size={14} />
                </div>
                <div className="row-main">
                  <div className="row-title">{e.labelKo} <span className="faint text-xs mono">{e.zone}</span></div>
                  <div className="row-sub">{e.reason}</div>
                  <div className="chip-row mt-2">{e.evidence.map((v, i) => <span className="chip mono" key={i}>{v}</span>)}</div>
                </div>
                <span className={`badge badge-${e.severity === 'critical' ? 'critical' : 'warning'}`}>{Math.round(e.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><ShieldAlert size={24} /><b>안전 이벤트 없음</b></div>
        )}
      </DataCard>

      <DataCard
        dataKey="accident-events"
        title="시간 기반 사고 판단"
        description="단일 프레임이 아닌 전·중·후 프레임의 거리·속도·자세 변화를 함께 분석해 충돌·급정지·넘어짐을 판단합니다. 사고 의심 구간은 클립으로 저장됩니다."
        icon={<Activity size={15} />}
        className="section-gap"
        right={<span className="chip mono">{(event?.accidentEvents ?? []).length}건</span>}
      >
        {(event?.accidentEvents ?? []).length ? (
          <div className="list">
            {event!.accidentEvents!.map((e, i) => (
              <div className="list-row" key={`${e.type}-${i}`}>
                <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)' }}>
                  <Activity size={14} />
                </div>
                <div className="row-main">
                  <div className="row-title">{e.labelKo} <span className="faint text-xs mono">{e.trackIds?.join(', ') ?? e.trackId ?? ''}</span></div>
                  <div className="chip-row mt-2">{e.evidence.map((v, k) => <span className="chip mono" key={k}>{v}</span>)}</div>
                </div>
                <span className={`badge badge-${e.severity === 'critical' ? 'critical' : 'warning'}`}>{Math.round(e.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><Activity size={24} /><b>사고 의심 이벤트 없음</b><div className="text-xs">프레임 히스토리를 분석 중입니다.</div></div>
        )}
      </DataCard>
    </div>
  );
}
