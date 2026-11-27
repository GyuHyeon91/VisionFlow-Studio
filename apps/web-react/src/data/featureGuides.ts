import type { WorkTab } from '@/store/useStore';

/** 탭별 기능 안내 콘텐츠 (한국어) */
export interface FeatureGuide {
  title: string;
  subtitle: string;
  purpose: string;
  steps: string[];
  keyData: string[];
  caution: string;
  relatedPaths: string[];
}

export const FEATURE_GUIDES: Record<WorkTab, FeatureGuide> = {
  dashboard: {
    title: '통합 대시보드',
    subtitle: '전체 분석 현황을 한눈에 확인하는 화면',
    purpose: '업로드한 영상의 분석 결과와 파이프라인 상태를 요약해 보여줍니다. 분석은 영상을 업로드하거나 "분석 실행"을 누르면 시작됩니다.',
    steps: [
      '상단 "영상 업로드"로 분석할 영상을 선택합니다.',
      '자동 분석이 시작되면 진행률과 현재 단계가 상단에 표시됩니다.',
      '카드별 눈 아이콘으로 데이터 표시/숨김을 전환합니다.',
    ],
    keyData: ['위험 점수', '준수 점수', '최다 혼잡도', '사고 건수', '파이프라인 버전'],
    caution: '영상 업로드 전에는 데모 분석이 실행되지 않으며, 모든 수치는 실제 분석 결과만 표시됩니다.',
    relatedPaths: ['configs/app.config.json', 'services/.data/metrics.db'],
  },
  pipeline: {
    title: '파이프라인 구조',
    subtitle: '16개 노드 · 20개 연결의 실시간 처리 흐름',
    purpose: '영상 입력부터 리포트 생성까지의 처리 단계를 그래프로 표시합니다. 노드 생성·수정·삭제 시 자동으로 재배치되고 재분석됩니다.',
    steps: [
      '노드를 클릭하면 우측 상세 패널에서 설명·입출력 건수·지연 시간을 확인합니다.',
      '노드 추가/연결 변경 시 위상 정렬 기반으로 깊이(열)가 다시 계산됩니다.',
      '미니맵과 흐름 애니메이션으로 전체 구조를 파악합니다.',
    ],
    keyData: ['노드 종류(source/transform/analysis/output)', '연결 관계', '실행 상태', '처리량'],
    caution: '겹침 없는 자동 레이아웃을 사용하므로 노드를 직접 드래그해도 연결 변경 시 재배치됩니다.',
    relatedPaths: ['configs/app.config.json (pipeline.nodes/edges)', 'docs/PIPELINE_FLOW.md'],
  },
  analysis: {
    title: '영상 데이터 분석',
    subtitle: '시계열 신호와 감지 통계',
    purpose: '영상에서 추출한 혼잡도·신뢰도·움직임 신호를 그래프로 표시하고 실제 감지 결과를 집계합니다.',
    steps: [
      '영상을 업로드하면 2초 단위 버킷으로 신호가 집계됩니다.',
      '그래프 위에 마우스를 올리면 해당 시점의 수치를 확인합니다.',
      '데이터 카드의 눈 아이콘으로 원하는 그래프만 표시합니다.',
    ],
    keyData: ['혼잡도(crowdDensity)', '평균 신뢰도(confidenceSeries)', '움직임 강도(motionSeries)'],
    caution: '값은 모두 실제 영상 분석에서 나온 측정값입니다. 목업 신호는 사용하지 않습니다.',
    relatedPaths: ['services/.data/events.jsonl', 'services/.data/metrics.db'],
  },
  behavior: {
    title: '인물 행동 감지',
    subtitle: 'YOLO Pose 기반 자세·행동 인식',
    purpose: '영상 속 인물을 추적하고 관절 특징으로행동을 분류해 신뢰도와 함께 표시합니다.',
    steps: [
      '실시간 추적은 브라우저에서, 정밀 분석은 FastAPI 서버에서 수행됩니다.',
      '사람 감지 신뢰도가 낮으면 실시간 부스트(0.3)가 적용됩니다.',
      '행동 목록을 클릭하면 해당 시점의 근거를 확인합니다.',
    ],
    keyData: ['추적 ID', '행동 클래스 10종', '관절 기울기', '신뢰도'],
    caution: '행동 판정은 실제 관절 데이터가 있을 때만 표시됩니다. 추정에 불과한 라벨은 출력하지 않습니다.',
    relatedPaths: ['services/.data/behavior_dataset/patterns.jsonl', 'services/.models/custom.pt'],
  },
  actions: {
    title: '상황별 조치',
    subtitle: '감지 상황에 맞는 대응 절차 권고',
    purpose: '판단된 상황에 따라 담당자·절차·예상 소요 시간을 권고합니다.',
    steps: [
      '상황 카드를 선택하면 관련 조치 절차가 표시됩니다.',
      '조치 권고는 실제 분석 결과의 situation 항목에서 생성됩니다.',
      '결과가 없으면 "데이터 없음" 상태로 표시됩니다.',
    ],
    keyData: ['상황 유형', '권고 절차', '담당자', '예상 시간'],
    caution: '분석 실패 시 가짜 조치를 생성하지 않습니다. 서버 연결을 확인하세요.',
    relatedPaths: ['services/.data/events.jsonl'],
  },
  accidents: {
    title: '시간별 사고 인식',
    subtitle: '거리·속도·지속 시간 기반 사고 판정',
    purpose: '프레임 간 객체 이동과 시간적 근거를 바탕으로 충돌·급정지·낙상·근접 등을 판정합니다.',
    steps: [
      '사고 이벤트는 발생 시각순으로 정렬되어 표시됩니다.',
      '이벤트를 클릭하면 해당 시점의 영상/근거를 확인합니다.',
      '사용자 검토(verification)로 결과를 확인할 수 있습니다.',
    ],
    keyData: ['사고 유형', '발생 시각', '신뢰도', '지속 시간', '검토 상태'],
    caution: '가짜 사고는 출력하지 않습니다. 객체가 없거나 근거가 부족하면 사고 0건으로 표시됩니다.',
    relatedPaths: ['services/.data/events.jsonl', 'services/.data/clips/'],
  },
  description: {
    title: '영상 텍스트 설명',
    subtitle: '영상 재생과 연동된 캡션 오버레이',
    purpose: '실제 감지 결과를 시간대별 문장으로 만들고, 영상 재생 위치에 맞춰 화면에 표시합니다.',
    steps: [
      '"설명 데이터 영상" 플레이어에서 캡션 표시/숨김과 음소거를 전환합니다.',
      '아래 시간대별 설명을 누르면 영상이 해당 시점으로 이동합니다.',
      '"복사" 버튼으로 전체 설명을 클립보드에 담을 수 있습니다.',
    ],
    keyData: ['요약', '시간대별 캡션', '태그', '주요 하이라이트', '장면 수'],
    caution: '버킷 경계로 특정 구간이 비는 현상을 보정해, 사람이 계속 있으면 모든 구간에 동일하게 표시됩니다.',
    relatedPaths: ['services/.models/upload_*.mp4 (원본 보존)'],
  },
  measurement: {
    title: '사물 측정',
    subtitle: '상대 크기·기준물 보정·깊이 추정',
    purpose: '감지된 객체의 BBox를 바탕으로 크기와 거리를 근사합니다.',
    steps: [
      '기준물(예: 사람 키)을 선택해 보정 계수를 설정합니다.',
      '측정 결과는 실시간 추적 상자에 함께 표시됩니다.',
      '카드별 눈 아이콘으로 측정 데이터를 숨기거나 표시합니다.',
    ],
    keyData: ['BBox 크기', '기준물 보정값', '깊이 추정', '상대 거리'],
    caution: '단일 카메라의 깊이 추정은 근사값입니다. 정밀 측정은 교정 데이터가 필요합니다.',
    relatedPaths: ['configs/app.config.json (measurement)'],
  },
  training: {
    title: '모델 학습',
    subtitle: '감지 프레임 → YOLO 파인튜닝',
    purpose: '분석 중 수집한 프레임을 라벨 데이터로 만들고 커스텀 모델을 학습합니다.',
    steps: [
      '데이터셋 분석으로 클래스 분포와 누락 클래스를 확인합니다.',
      '하드 네거티브/합성 데이터를 추가해 오탐을 억제합니다.',
      '학습 완료 후 "모델 적용"으로 custom.pt를 활성화합니다.',
    ],
    keyData: ['클래스: person/car/truck/bus', '이미지 수', '라벨 수', 'mAP50'],
    caution: 'COCO에 없는 지게차는 학습 클래스에서 제외했습니다. 오탐 유발 라벨을 쓰지 마세요.',
    relatedPaths: ['services/.models/custom.pt', 'services/.models/datasets/construction/', 'services/.models/datasets/active_negative/'],
  },
  labeling: {
    title: '클립 수동 라벨링',
    subtitle: '위험 클립 프레임 직접 검수',
    purpose: '위험 감지로 저장된 클립의 BBox를 확인·수정해 학습 라벨로 저장합니다.',
    steps: [
      '저장된 클립 목록에서 검수할 클립을 선택합니다.',
      '프레임의 BBox를 수정하고 저장을 누르면 학습 데이터에 반영됩니다.',
      '잘못된 감지는 ✕로 신고해 실시간 차단 영역에 등록할 수 있습니다.',
    ],
    keyData: ['클립 목록', '프레임 수', 'BBox 좌표', '라벨 클래스'],
    caution: '사람이 아닌 객체를 person으로 라벨링하면 감지 정확도가 크게 떨어집니다.',
    relatedPaths: ['services/.data/clips/', 'services/.data/feedback.jsonl'],
  },
  stream: {
    title: '스트림 · 예측',
    subtitle: 'WebSocket·RTSP·칼만 필터 예측',
    purpose: '실시간 이벤트 푸시와 객체 이동 예측, 위험 구역 판단을 제공합니다.',
    steps: [
      '실시간 탐지는 RemoteDetector로 서버에 프레임을 전송합니다.',
      '칼만 필터로 다음 위치를 예측해 위험 구역 진입을 판단합니다.',
      '오탐 신고 영역은 실시간 차단에 즉시 반영됩니다.',
    ],
    keyData: ['추적 ID', '예측 위치', '위험 구역', '이벤트 스트림'],
    caution: 'RTSP 스트림은 네트워크 지연에 따라 탐지 주기가 달라질 수 있습니다.',
    relatedPaths: ['services/.data/feedback.jsonl', 'configs/app.config.json (streaming)'],
  },
  performance: {
    title: '기능별 성능평가',
    subtitle: '실제 측정값 기반 지연·처리량·정확도',
    purpose: '각 기능의 지연 시간과 처리량을 실제 엔진 타이밍으로 평가하고 개선 방향을 제안합니다.',
    steps: [
      '분석을 실행하면 engineTimings/performanceEvaluation 값이 갱신됩니다.',
      '목업 지연 시간은 제거되어 모든 값이 measured:true입니다.',
      '항목별 개선 제안을 확인합니다.',
    ],
    keyData: ['평균 지연(ms)', '처리량(fps)', '정확도 지표', '리소스 사용량'],
    caution: '측정 데이터가 없으면 0 또는 "측정 전"으로 표시되며 임의의 값을 채우지 않습니다.',
    relatedPaths: ['services/.data/evaluation (메모리)', 'services/.data/metrics.db'],
  },
  settings: {
    title: '옵션 · 성능 · 정확도',
    subtitle: '모듈별 독립 설정',
    purpose: 'frontend·engine·backend·테마·성능·정확도·측정·학습·안전 옵션을 개별적으로 조정합니다.',
    steps: [
      '옵션을 바꾸면 파이프라인이 새 버전으로 재구성되고 재분석됩니다.',
      '"기능 안내 팝업" 항목에서 자동 안내 표시를 켜거나 끌 수 있습니다.',
      '"전체 초기화"로 설정과 파이프라인을 기본값으로 되돌립니다.',
    ],
    keyData: ['분석 엔진', '백엔드', '신뢰도 임계값', '자동 업데이트', '안내 팝업 옵션'],
    caution: '설정을 바꾸면 결과 캐시가 무효화되어 분석이 다시 실행됩니다.',
    relatedPaths: ['configs/app.config.json', 'configs/app.config.schema.json'],
  },
  catalog: {
    title: '데이터 카탈로그',
    subtitle: '웹에 구성된 데이터 종류와 저장 경로',
    purpose: '프로젝트가 생성·사용하는 모든 데이터의 종류, 경로, 생성 주체, 연결 API를 한눈에 출력합니다.',
    steps: [
      '그룹별 카드에서 데이터 이름과 상대 경로를 확인합니다.',
      '경로 옆 복사 버튼으로 전체 경로를 클립보드에 담습니다.',
      '외부 데이터셋 카드에서 공개 사고 데이터셋 8종과 가져오기 경로를 확인합니다.',
    ],
    keyData: ['그룹 수', '데이터 항목 수', '상태(exists/pending)', '엔드포인트', '루트 경로'],
    caution: '경로는 프로젝트 루트 기준 상대경로입니다. 외부 데이터셋은 파일 자체를 포함하지 않습니다.',
    relatedPaths: ['GET /api/data-catalog', 'GET /api/external-datasets', 'docs/DATA_CATALOG.md'],
  },
};
