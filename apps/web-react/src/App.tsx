import { useEffect } from 'react';
import { CircleHelp } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import ToastHost from '@/components/layout/ToastHost';
import FeatureGuideModal from '@/components/layout/FeatureGuideModal';
import Dashboard from '@/components/panels/Dashboard';
import PipelineCanvas from '@/components/pipeline/PipelineCanvas';
import NodeInspector from '@/components/pipeline/NodeInspector';
import AnalysisPanel from '@/components/panels/AnalysisPanel';
import BehaviorPanel from '@/components/panels/BehaviorPanel';
import ActionsPanel from '@/components/panels/ActionsPanel';
import AccidentTimelinePanel from '@/components/panels/AccidentTimelinePanel';
import VideoDescriptionPanel from '@/components/panels/VideoDescriptionPanel';
import ObjectMeasurementPanel from '@/components/panels/ObjectMeasurementPanel';
import ModelTrainingPanel from '@/components/panels/ModelTrainingPanel';
import ClipLabelingPanel from '@/components/panels/ClipLabelingPanel';
import StreamPredictionPanel from '@/components/panels/StreamPredictionPanel';
import PerformancePanel from '@/components/panels/PerformancePanel';
import SettingsPanel from '@/components/panels/SettingsPanel';
import DataCatalogPanel from '@/components/panels/DataCatalogPanel';
import { useStore } from '@/store/useStore';
import type { WorkTab } from '@/store/useStore';

const TITLES: Record<WorkTab, { title: string; desc: string }> = {
  dashboard: { title: '통합 대시보드', desc: '전체 분석 현황과 파이프라인 상태를 한눈에 확인합니다.' },
  pipeline: { title: '파이프라인 구조', desc: '노드 생성·수정·삭제 시 그래프가 자동으로 재구성되고 재실행됩니다.' },
  analysis: { title: '영상 데이터 분석 결과', desc: '영상에서 추출한 시계열·혼잡도·신뢰도 데이터를 시각화합니다.' },
  behavior: { title: '인물 행동 감지', desc: '영상 속 인물을 추적하고 행동을 감지해 신뢰도와 함께 표시합니다.' },
  actions: { title: '상황별 조치 내용', desc: '감지된 상황에 맞는 대응 절차와 담당자, 예상 시간을 권고합니다.' },
  accidents: { title: '시간별 사고 인식', desc: '영상에서 인식된 사고를 발생 시각순으로 표시하고 사고 내용과 대응 상태를 출력합니다.' },
  description: { title: '영상 텍스트 설명', desc: '영상 전체 요약과 10초 단위 캡션으로 영상 내용을 텍스트로 설명합니다.' },
  measurement: { title: '사물 측정', desc: '상대 크기, 기준물 보정, 깊이 추정으로 객체의 크기와 거리를 근사합니다.' },
  training: { title: '모델 학습', desc: '감지 프레임을 라벨 데이터로 수집하고 YOLO를 미세조정해 커스텀 모델을 만듭니다.' },
  labeling: { title: '클립 수동 라벨링', desc: '위험 감지로 저장된 클립의 프레임을 직접 확인하고 BBox를 수정해 학습 라벨로 저장합니다.' },
  stream: { title: '스트림 · 예측', desc: 'WebSocket 이벤트 푸시, RTSP 스트림 분석, 칼만 필터 이동 예측과 위험구역 판단을 제공합니다.' },
  performance: { title: '기능별 성능평가', desc: '각 기능의 지연·처리량·정확도·리소스 사용량을 분석하고 개선 방향을 제안합니다.' },
  settings: { title: '옵션 · 성능 · 정확도', desc: '각 모듈을 독립적으로 선택하고 성능과 정확도를 세부 조절합니다.' },
  catalog: { title: '데이터 카탈로그', desc: '웹에 구성된 데이터 종류와 저장 경로, 연결 API를 한눈에 출력합니다.' },
};

export default function App() {
  const tab = useStore((s) => s.tab);
  const design = useStore((s) => s.config.options.design.value);
  const setTopOption = useStore((s) => s.setTopOption);
  const guideEnabled = useStore((s) => s.guideEnabled);
  const guideSeen = useStore((s) => s.guideSeen);
  const guideOpen = useStore((s) => s.guideOpen);
  const openGuide = useStore((s) => s.openGuide);

  // 디자인 옵션을 실제 테마로 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', design);
  }, [design]);

  // 처음 방문하는 탭에서 기능 안내 자동 표시 (옵션으로 비활성화 가능)
  useEffect(() => {
    if (guideEnabled && !guideSeen[tab] && !guideOpen) openGuide();
  }, [tab, guideEnabled, guideSeen, guideOpen, openGuide]);

  const isDark = design !== 'light' && design !== 'daylight';
  const onThemeToggle = () => setTopOption('design', isDark ? 'daylight' : 'aurora');
  const meta = TITLES[tab];

  const renderContent = () => {
    switch (tab) {
      case 'pipeline':
        return (
          <div className="grid grid-2-1">
            <PipelineCanvas />
            <NodeInspector />
          </div>
        );
      case 'analysis': return <AnalysisPanel />;
      case 'behavior': return <BehaviorPanel />;
      case 'actions': return <ActionsPanel />;
      case 'accidents': return <AccidentTimelinePanel />;
      case 'description': return <VideoDescriptionPanel />;
      case 'measurement': return <ObjectMeasurementPanel />;
      case 'training': return <ModelTrainingPanel />;
      case 'labeling': return <ClipLabelingPanel />;
      case 'stream': return <StreamPredictionPanel />;
      case 'performance': return <PerformancePanel />;
      case 'settings': return <SettingsPanel />;
      case 'catalog': return <DataCatalogPanel />;
      case 'dashboard':
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <Topbar onThemeToggle={onThemeToggle} isDark={isDark} />
      <main className="workspace">
        <div className="page-head">
          <div>
            <div className="page-title">{meta.title}</div>
            <div className="page-desc">{meta.desc}</div>
          </div>
          <button className="ghost-btn" style={{ marginLeft: 'auto' }} onClick={openGuide} title="이 기능에 대한 안내 팝업 열기">
            <CircleHelp size={14} /> 안내
          </button>
        </div>
        <div key={tab} className="tab-content">{renderContent()}</div>
      </main>
      <ToastHost />
      <FeatureGuideModal />
    </div>
  );
}
