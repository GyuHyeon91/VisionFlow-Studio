import type { ReactNode } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface Props {
  /** 데이터 영역 식별자 (숨김 상태 저장 키) */
  dataKey: string;
  title: string;
  /** 이 데이터가 무엇을 의미하는지에 대한 설명 문구 */
  description: string;
  icon?: ReactNode;
  /** 헤더 우측 추가 요소 */
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * 모든 데이터 출력 영역의 공통 카드.
 * - 데이터별 설명 문구를 항상 출력
 * - Eye 토글로 해당 데이터만 숨김/표시 가능
 */
export default function DataCard({
  dataKey, title, description, icon, right, children, className = '', bodyClassName = '',
}: Props) {
  const hidden = useStore((s) => s.dataVisibility[dataKey] === false);
  const toggle = useStore((s) => s.toggleDataVisibility);

  return (
    <section className={`card data-card ${className}`}>
      <div className="card-head">
        {icon && <div className="card-icon">{icon}</div>}
        <div style={{ minWidth: 0 }}>
          <div className="card-title">{title}</div>
          <div className="data-desc"><Info size={10} /> {description}</div>
        </div>
        <div className="card-head-spacer" />
        {right}
        <button
          className="icon-btn visibility-btn"
          title={hidden ? '데이터 표시' : '데이터 숨기기'}
          onClick={() => toggle(dataKey)}
        >
          {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hidden ? (
        <div className="data-hidden">
          <EyeOff size={16} />
          <span><b>{title}</b> 데이터가 숨겨져 있습니다. 눈 아이콘을 눌러 다시 표시하세요.</span>
        </div>
      ) : (
        <div className={bodyClassName}>{children}</div>
      )}
    </section>
  );
}
