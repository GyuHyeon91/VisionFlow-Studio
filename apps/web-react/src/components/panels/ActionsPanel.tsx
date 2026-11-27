import { useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Clock3, PlayCircle, ShieldAlert, UploadCloud, UserRound } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { ActionRecommendation, BehaviorSeverity } from '@/types';
import DataCard from './DataCard';
import SituationVideoGuide from './SituationVideoGuide';

const PRIORITY_LABEL: Record<ActionRecommendation['priority'], string> = {
  low: '낮음', medium: '보통', high: '높음', immediate: '즉시',
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

export default function ActionsPanel() {
  const result = useStore((s) => s.result);
  const pushToast = useStore((s) => s.pushToast);

  const situations = result?.situations ?? [];
  const actions = result?.actions ?? [];
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);

  return (
    <div>
      <DataCard
        dataKey="actions-situations"
        title="감지된 상황"
        description="영상에서 판단된 상황별 심각도, 발생 시각, 신뢰도, 관련 행동 수를 표시합니다."
        icon={<AlertTriangle size={15} />}
        right={result ? <span className="chip mono">{situations.length}건</span> : undefined}
        bodyClassName="grid grid-3"
      >
        {result ? (
          <>
            {situations.map((s) => (
              <div className="card card-pad" key={s.id}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} color={s.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'} />
                  <span className="text-sm" style={{ fontWeight: 700 }}>{s.typeKo}</span>
                  <span className="card-head-spacer" />
                  <span className={`badge badge-${s.severity}`}>{SEVERITY_LABEL[s.severity]}</span>
                </div>
                <div className="text-xs dim" style={{ marginTop: 10, lineHeight: 1.6 }}>{s.description}</div>
                <div className="chip-row mt-2">
                  <span className="chip mono">{s.timestamp.toFixed(1)}s</span>
                  <span className="chip mono">신뢰도 {Math.round(s.confidence * 100)}%</span>
                  <span className="chip">관련 행동 {s.relatedBehaviors.length}건</span>
                  <span className="chip">인물 {s.persons.length}명</span>
                  <button
                    className="ghost-btn"
                    style={{ fontSize: 10, padding: '4px 8px' }}
                    onClick={() => setSelectedSituation(s.id)}
                  >
                    <PlayCircle size={11} /> 영상 안내
                  </button>
                </div>
              </div>
            ))}
            {situations.length === 0 && (
              <div className="card card-pad text-sm dim">감지된 특이 상황이 없습니다. 정상 상태입니다.</div>
            )}
          </>
        ) : <NoData label="감지 상황" />}
      </DataCard>

      {result && situations.length > 0 && (
        <SituationVideoGuide
          situations={situations}
          actions={actions}
          selectedId={selectedSituation}
          onSelect={setSelectedSituation}
        />
      )}

      <DataCard
        dataKey="actions-recommendations"
        title="상황별 조치 권고"
        description="감지된 상황에 따라 실행 가능한 대응 절차를 우선순위별로 정렬합니다. 담당자·예상 시간·자동화 여부를 확인할 수 있습니다."
        icon={<ShieldAlert size={15} />}
        className="section-gap"
        right={result ? (
          <>
            <span className="chip accent">자동화 {actions.filter((a) => a.automated).length}건</span>
            <span className="chip">수동 {actions.filter((a) => !a.automated).length}건</span>
          </>
        ) : undefined}
        bodyClassName="grid grid-2"
      >
        {result ? actions.map((a) => (
          <div className={`action-card priority-${a.priority}`} key={a.id}>
            <div className="action-head">
              <ShieldAlert size={15} color="var(--accent)" />
              <span className="action-title">{a.title}</span>
              <span className="card-head-spacer" />
              <span className="badge" style={{
                background: a.priority === 'immediate' ? 'color-mix(in srgb, var(--danger) 18%, transparent)' : 'color-mix(in srgb, var(--accent) 12%, transparent)',
                color: a.priority === 'immediate' ? 'var(--danger)' : 'var(--accent)',
              }}>{PRIORITY_LABEL[a.priority]}</span>
            </div>
            <div className="action-desc">{a.description}</div>
            <ol className="action-steps">{a.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
            <div className="action-meta">
              <span><UserRound size={11} /> {a.owner}</span>
              <span><Clock3 size={11} /> 예상 {a.estimatedTimeMin}분</span>
              <span>{a.automated ? <><Bot size={11} /> 자동 실행 가능</> : <><CheckCircle2 size={11} /> 수동 확인 필요</>}</span>
            </div>
            <button
              className="ghost-btn mt-2"
              style={{ fontSize: 10, padding: '6px 10px' }}
              onClick={() => pushToast(`조치 시작: ${a.title} (${a.owner})`, 'success')}
            >
              조치 시작
            </button>
          </div>
        )) : <NoData label="조치 권고" />}
      </DataCard>
    </div>
  );
}
