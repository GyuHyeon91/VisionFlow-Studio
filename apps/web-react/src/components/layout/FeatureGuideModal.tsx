import { BookOpen, Check, ChevronLeft, ChevronRight, Lightbulb, MapPin, ShieldCheck, X } from 'lucide-react';
import { FEATURE_GUIDES } from '@/data/featureGuides';
import { useStore, type WorkTab } from '@/store/useStore';

const TAB_ORDER: WorkTab[] = [
  'dashboard', 'pipeline', 'analysis', 'behavior', 'actions', 'accidents',
  'description', 'measurement', 'training', 'labeling', 'stream', 'performance',
  'settings', 'catalog',
];

/**
 * 기능별 안내 팝업.
 * - 기본적으로 처음 방문하는 탭에서 자동 표시 (옵션에서 끌 수 있음)
 * - 상단 "안내" 버튼으로 언제든 다시 열기 가능
 */
export default function FeatureGuideModal() {
  const open = useStore((s) => s.guideOpen);
  const tab = useStore((s) => s.tab);
  const closeGuide = useStore((s) => s.closeGuide);
  const enabled = useStore((s) => s.guideEnabled);
  const setGuideEnabled = useStore((s) => s.setGuideEnabled);
  const setTab = useStore((s) => s.setTab);

  if (!open) return null;
  const guide = FEATURE_GUIDES[tab];
  const idx = TAB_ORDER.indexOf(tab);
  const go = (delta: number) => {
    const next = TAB_ORDER[idx + delta];
    if (next) setTab(next);
  };

  return (
    <div className="feature-guide-backdrop" onMouseDown={closeGuide}>
      <div
        className="feature-guide-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${guide.title} 기능 안내`}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') closeGuide(); }}
        tabIndex={-1}
      >
        <div className="feature-guide-head">
          <div className="card-icon"><BookOpen size={17} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="card-title">{guide.title} · 기능 안내</div>
            <div className="text-xs faint">{guide.subtitle}</div>
          </div>
          <div className="card-head-spacer" />
          <button className="icon-btn" onClick={closeGuide} title="닫기"><X size={16} /></button>
        </div>

        <div className="feature-guide-body">
          <section className="guide-section">
            <div className="guide-section-title"><Lightbulb size={14} /> 이 기능은 무엇인가요?</div>
            <p>{guide.purpose}</p>
          </section>

          <section className="guide-section">
            <div className="guide-section-title"><Check size={14} /> 사용 순서</div>
            <ol className="guide-steps">
              {guide.steps.map((step, i) => <li key={i}><span className="guide-step-num">{i + 1}</span>{step}</li>)}
            </ol>
          </section>

          <section className="guide-section">
            <div className="guide-section-title"><ShieldCheck size={14} /> 주요 데이터</div>
            <div className="guide-tags">
              {guide.keyData.map((d) => <span className="guide-tag" key={d}>{d}</span>)}
            </div>
          </section>

          <section className="guide-section caution">
            <div className="guide-section-title"><Lightbulb size={14} /> 주의 사항</div>
            <p>{guide.caution}</p>
          </section>

          <section className="guide-section">
            <div className="guide-section-title"><MapPin size={14} /> 관련 데이터 경로</div>
            <div className="guide-paths">
              {guide.relatedPaths.map((p) => <code key={p}>{p}</code>)}
            </div>
          </section>
        </div>

        <div className="feature-guide-foot">
          <label className="guide-option">
            <input type="checkbox" checked={enabled} onChange={(e) => setGuideEnabled(e.target.checked)} />
            <span>탭을 처음 열 때 안내 팝업 자동 표시</span>
          </label>
          <div className="card-head-spacer" />
          <button className="ghost-btn" onClick={() => go(-1)} disabled={idx <= 0}>
            <ChevronLeft size={14} /> 이전
          </button>
          <button className="ghost-btn" onClick={() => go(1)} disabled={idx >= TAB_ORDER.length - 1}>
            다음 <ChevronRight size={14} />
          </button>
          <button className="primary-btn" onClick={closeGuide}><Check size={14} /> 확인</button>
        </div>
      </div>
    </div>
  );
}
