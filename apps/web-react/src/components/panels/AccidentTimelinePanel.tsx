import { useRef, useState } from 'react';
import { AlertOctagon, CheckCircle2, Clock3, MapPin, Radio, ShieldAlert, UploadCloud, Users, Video } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { useLiveAccidents } from '@/hooks/useLiveAccidents';
import DataCard from './DataCard';
import { reportFalsePositive } from '@/services/feedbackApi';
import MetricCard from '@/components/visualizations/MetricCard';

function NoData({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><UploadCloud size={22} /></div>
      <b>{label} 데이터 없음</b>
      <div className="text-xs">영상을 업로드해 분석을 실행하면 시간별 사고 인식 결과가 출력됩니다.</div>
    </div>
  );
}

const STATUS_LABEL = { detected: '감지됨', responding: '대응 중', resolved: '처리 완료' } as const;
const STATUS_COLOR = { detected: 'var(--warning)', responding: 'var(--danger)', resolved: 'var(--success)' } as const;

export default function AccidentTimelinePanel() {
  const result = useStore((s) => s.result);
  const video = useStore((s) => s.video);
  const pushToast = useStore((s) => s.pushToast);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoAspect, setVideoAspect] = useState(16 / 9);
  const sensitivity = useStore((s) => s.config.accuracy.personDetectionSensitivity.value);
  const threshold = useStore((s) => s.config.accuracy.confidenceThreshold.value);
  // 실시간 추적·사고 감지 상시 ON
  const liveBoxes = useLiveTracking(videoRef, true, sensitivity, threshold);
  const liveAccidents = useLiveAccidents(liveBoxes, true);
  const handleFalsePositive = async (b: (typeof liveBoxes)[number]) => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) { pushToast('영상을 재생한 뒤 신고해 주세요.', 'warning'); return; }
    const stage = document.createElement('canvas');
    stage.width = v.videoWidth; stage.height = v.videoHeight;
    stage.getContext('2d')!.drawImage(v, 0, 0);
    try {
      await reportFalsePositive(stage, b.label, b.confidence, {
        x: b.x, y: b.y, w: b.w, h: b.h,
      });
      pushToast(`'${b.label}' 오탐을 신고했습니다.`, 'success');
    } catch (err) { pushToast(`신고 실패: ${(err as Error).message}`, 'error'); }
  };

  const accidents = result?.accidents ?? [];

  return (
    <div>
      <DataCard
        dataKey="accident-summary"
        title="산업 현장 안전 분석"
        description="탐지 객체 수(현재 프레임)와 사고 이벤트(시간적 분석으로 검증된 사건)는 별개 지표입니다. 객체가 감지되었다는 것만으로 사고로 기록하지 않습니다."
        icon={<AlertOctagon size={15} />}
        right={result ? <span className={`chip ${result.engine === 'mock' ? '' : 'accent'}`}>{result.engine === 'mock' ? '데모 · 검토 필요' : '이벤트 기반 집계'}</span> : undefined}
        bodyClassName="grid grid-4"
      >
        {result ? (
          <>
            <MetricCard data={{ key: 'objects', label: '탐지 객체', value: liveBoxes.length, unit: '개', accent: 'var(--accent)' }} />
            <MetricCard data={{ key: 'events', label: '사고 이벤트', value: liveAccidents.filter((a) => a.severity === 'critical').length, unit: '건', accent: 'var(--danger)' }} />
            <MetricCard data={{ key: 'risk', label: '위험 이벤트', value: liveAccidents.length, unit: '건 · 검토 필요', accent: 'var(--warning)' }} />
            <MetricCard data={{ key: 'track', label: '추적 상태', value: liveBoxes.length, unit: 'ID 관리', accent: 'var(--success)' }} />
          </>
        ) : <NoData label="사고 요약" />}
      </DataCard>

      <DataCard
        dataKey="accident-features"
        title="분석 기능 상태"
        description="산업 현장 안전 분석에 실제로 적용된 기능입니다. 사고 판정은 객체 탐지와 분리되어 시간적 근거를 함께 확인합니다."
        icon={<ShieldAlert size={15} />}
        className="section-gap"
        right={<span className="chip mono">{(liveAccidents.length ? 6 : 4)}/6 활성</span>}
        bodyClassName="card-pad"
      >
        <div className="chip-row">
          <span className="chip accent">✓ 사람 탐지</span>
          <span className="chip accent">✓ 지게차 탐지</span>
          <span className={`chip ${liveBoxes.length ? 'accent' : ''}`}>{liveBoxes.length ? '✓' : '○'} 객체 이동 경로</span>
          <span className={`chip ${liveAccidents.some((a) => a.type === 'restricted') ? 'accent' : ''}`}>{liveAccidents.some((a) => a.type === 'restricted') ? '✓' : '○'} 위험 구역 진입</span>
          <span className={`chip ${liveAccidents.some((a) => a.type === 'collision_risk') ? 'accent' : ''}`}>{liveAccidents.some((a) => a.type === 'collision_risk') ? '✓' : '○'} 충돌 위험 분석</span>
          <span className={`chip ${liveAccidents.length ? 'accent' : ''}`}>{liveAccidents.length ? '✓' : '○'} 사고 이벤트 검증</span>
        </div>
      </DataCard>

      <DataCard
        dataKey="accident-live"
        title="실시간 사고 감지"
        description="영상을 재생하면서 트랙의 급정지·충돌·급이동·낙하·인파 밀집을 실시간으로 판단하고 근거와 함께 표시합니다."
        icon={<Radio size={15} />}
        className="section-gap"
        right={<span className="chip mono">실시간 사고 감지 상시 ON</span>}
      >
        <div className="grid grid-2" style={{ padding: '0 20px 20px', gap: 14 }}>
            <div className="video-frame">
              <div className="video-stage" style={{ aspectRatio: videoAspect }}>
                {video?.url ? <video ref={videoRef} src={video.url} muted autoPlay loop playsInline controls onLoadedMetadata={(e) => { const r = e.currentTarget.videoWidth / e.currentTarget.videoHeight; if (Number.isFinite(r) && r > 0) setVideoAspect(r); }} /> : (
                  <div className="video-placeholder"><Video size={22} /><b>업로드된 영상이 없습니다</b></div>
                )}
                {liveBoxes.map((b) => (
                  <div
                    key={b.id}
                    className={`bbox bbox-${b.kind}`}
                    data-label={`${b.label} ${Math.round(b.confidence * 100)}%`}
                    style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                  >
                    <button className="bbox-report" title="이 탐지가 틀렸으면 눌러 신고 (모델 재학습에 반영)" onClick={(e) => { e.stopPropagation(); void handleFalsePositive(b); }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="list" style={{ maxHeight: 260 }}>
              {liveAccidents.length ? liveAccidents.map((a) => (
                <div className="list-row" key={a.id}>
                  <div className="row-icon" style={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)' }}><AlertOctagon size={14} /></div>
                  <div className="row-main">
                    <div className="row-title">{a.title}</div>
                    <div className="row-sub">{a.description}</div>
                    <div className="chip-row mt-2">{a.evidence.map((e, i) => <span className="chip mono" key={i}>{e}</span>)}</div>
                  </div>
                  <span className={`badge badge-${a.severity}`}>{a.severity === 'critical' ? '위험' : a.severity === 'warning' ? '경고' : '주의'}</span>
                </div>
              )) : (
                <div className="empty-state"><CheckCircle2 size={24} /><b>실시간 감지된 사고 없음</b><div className="text-xs">트랙을 분석 중입니다.</div></div>
              )}
            </div>
        </div>
      </DataCard>

      <DataCard
        dataKey="accident-timeline"
        title="시간별 사고 타임라인"
        description="사고가 발생한 시각부터 종료 시각까지를 시간축에 표시하고, 사고 내용·심각도·관련 인물·대응 상태를 출력합니다."
        icon={<Clock3 size={15} />}
        className="section-gap"
        right={result ? <span className="chip mono">{accidents.length}건</span> : undefined}
      >
        {result ? (
          accidents.length ? (
            <div className="accident-timeline">
              {accidents.map((a) => (
                <div className="accident-item" key={a.id}>
                  <div className="accident-time mono">{a.timestamp.toFixed(1)}s<br /><small>~{a.endTime.toFixed(1)}s</small></div>
                  <div className="accident-marker" style={{ background: STATUS_COLOR[a.status], boxShadow: `0 0 0 5px color-mix(in srgb, ${STATUS_COLOR[a.status]} 15%, transparent)` }} />
                  <div className="accident-body">
                    <div className="flex items-center gap-2 wrap">
                      <span className="badge" style={{ background: `color-mix(in srgb, ${STATUS_COLOR[a.status]} 16%, transparent)`, color: STATUS_COLOR[a.status] }}>{STATUS_LABEL[a.status]}</span>
                      <span className={`badge badge-${a.severity}`}>{a.severity === 'critical' ? '위험' : '경고'}</span>
                      <b className="text-sm">{a.title}</b>
                      <span className="card-head-spacer" />
                      <span className="mono text-xs faint">신뢰도 {Math.round(a.confidence * 100)}%</span>
                    </div>
                    <div className="text-xs dim" style={{ marginTop: 8, lineHeight: 1.6 }}>{a.description}</div>
                    <div className="chip-row mt-2">
                      <span className="chip"><MapPin size={10} /> {a.zone}</span>
                      <span className="chip"><Users size={10} /> 인물 {a.persons.length}명 (P{a.persons.join(', P')})</span>
                      <span className="chip"><Radio size={10} /> {a.typeKo}</span>
                      {a.relatedBehaviorIds.map((id) => <span key={id} className="chip mono">{id}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state"><CheckCircle2 size={24} /><b>감지된 사고가 없습니다</b><div className="text-xs">영상 전체에서 사고 징후가 확인되지 않았습니다.</div></div>
        ) : <NoData label="사고 타임라인" />}
      </DataCard>
    </div>
  );
}
