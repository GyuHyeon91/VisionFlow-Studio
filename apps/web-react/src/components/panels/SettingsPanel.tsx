import { Gauge, ListChecks, RefreshCw, ScanSearch, SlidersHorizontal, Sparkles, Target } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { EngineChoice, BackendChoice, DesignChoice, FrontendChoice, LanguageChoice } from '@/types';
import { ENGINE_LABELS } from '@/engine/factory';

interface RangeOptionLike { value: number; min: number; max: number; description: string }

function Segmented<T extends string>({
  value, choices, labels, onChange,
}: { value: T; choices: readonly T[]; labels?: Record<string, string>; onChange: (v: T) => void }) {
  return (
    <div className="segmented">
      {choices.map((c) => (
        <button key={c} className={`segment ${value === c ? 'active' : ''}`} onClick={() => onChange(c)}>
          {labels?.[c] ?? c}
        </button>
      ))}
    </div>
  );
}

function RangeField({ label, option, onChange }: {
  label: string;
  option: RangeOptionLike;
  onChange: (v: number) => void;
}) {
  const pct = ((Number(option.value) - option.min) / (option.max - option.min)) * 100;
  return (
    <div className="field">
      <div className="field-label"><span>{label}</span><span className="field-value">{option.value}</span></div>
      <input
        type="range"
        min={option.min}
        max={option.max}
        value={Number(option.value)}
        style={{ ['--fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="text-xs faint" style={{ marginTop: 5 }}>{option.description}</div>
    </div>
  );
}

function ToggleField({ label, value, onChange, description }: {
  label: string; value: boolean; onChange: (v: boolean) => void; description: string;
}) {
  return (
    <div className="field">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm" style={{ fontWeight: 600 }}>{label}</div>
          <div className="text-xs faint" style={{ marginTop: 3 }}>{description}</div>
        </div>
        <div className="toggle" onClick={() => onChange(!value)}>
          <div className={`toggle-track ${value ? 'on' : ''}`}><div className="toggle-knob" /></div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPanel() {
  const config = useStore((s) => s.config);
  const setTopOption = useStore((s) => s.setTopOption);
  const setPerformance = useStore((s) => s.setPerformance);
  const setAccuracy = useStore((s) => s.setAccuracy);
  const setMeasurement = useStore((s) => s.setMeasurement);
  const setDetection = useStore((s) => s.setDetection);
  const setConfigSection = useStore((s) => s.setConfigSection);
  const setAutoUpdate = useStore((s) => s.setAutoUpdate);
  const setDebounce = useStore((s) => s.setDebounce);
  const resetPipeline = useStore((s) => s.resetPipeline);
  const guideEnabled = useStore((s) => s.guideEnabled);
  const setGuideEnabled = useStore((s) => s.setGuideEnabled);

  const o = config.options;
  const p = config.performance;
  const a = config.accuracy;

  return (
    <div className="grid grid-2">
      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <SlidersHorizontal size={16} className="accent" />
          <span className="card-title">모듈 옵션</span>
          <span className="card-head-spacer" />
          <span className="text-xs faint">각 항목은 독립적으로 선택됩니다</span>
        </div>

        <div className="field">
          <div className="field-label"><span>프론트엔드 스택</span></div>
          <Segmented<FrontendChoice>
            value={o.frontend.value}
            choices={['react', 'next', 'vue']}
            onChange={(v) => setTopOption('frontend', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>{o.frontend.description}</div>
        </div>

        <div className="field">
          <div className="field-label"><span>분석 엔진</span></div>
          <Segmented<EngineChoice>
            value={o.analysisEngine.value}
            choices={['mock', 'real', 'hybrid']}
            labels={ENGINE_LABELS}
            onChange={(v) => setTopOption('analysisEngine', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>{o.analysisEngine.description}</div>
        </div>

        <div className="field">
          <div className="field-label"><span>백엔드</span></div>
          <Segmented<BackendChoice>
            value={o.backend.value}
            choices={['none', 'fastapi', 'express']}
            onChange={(v) => setTopOption('backend', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>{o.backend.description}</div>
        </div>

        <div className="field">
          <div className="field-label"><span>디자인 테마</span></div>
          <Segmented<DesignChoice>
            value={o.design.value}
            choices={['aurora', 'midnight', 'light', 'daylight', 'cyber']}
            onChange={(v) => setTopOption('design', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>모든 사용자의 호감도를 높이는 고급 시각화 테마</div>
        </div>

        <div className="field">
          <div className="field-label"><span>언어</span></div>
          <Segmented<LanguageChoice>
            value={o.language.value}
            choices={['ko', 'en']}
            onChange={(v) => setTopOption('language', v)}
          />
        </div>
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <Gauge size={16} style={{ color: 'var(--accent-3)' }} />
          <span className="card-title">성능 조절</span>
        </div>
        <div className="field">
          <div className="field-label"><span>해상도</span></div>
          <Segmented
            value={p.resolution.value}
            choices={p.resolution.choices}
            onChange={(v) => setPerformance('resolution', v)}
          />
        </div>
        <RangeField label="분석 FPS" option={p.fps as RangeOptionLike} onChange={(v) => setPerformance('fps', v)} />
        <RangeField label="동시 실행 수" option={p.concurrency as RangeOptionLike} onChange={(v) => setPerformance('concurrency', v)} />
        <RangeField label="배치 크기" option={p.batchSize as RangeOptionLike} onChange={(v) => setPerformance('batchSize', v)} />
        <ToggleField label="하드웨어 가속" value={p.hardwareAcceleration.value} description={p.hardwareAcceleration.description} onChange={(v) => setPerformance('hardwareAcceleration', v)} />
        <ToggleField label="적응형 품질" value={p.adaptiveQuality.value} description={p.adaptiveQuality.description} onChange={(v) => setPerformance('adaptiveQuality', v)} />
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <Target size={16} style={{ color: 'var(--accent-4)' }} />
          <span className="card-title">정확도 보완</span>
        </div>
        <RangeField label="신뢰도 임계값" option={a.confidenceThreshold as RangeOptionLike} onChange={(v) => setAccuracy('confidenceThreshold', v)} />
        <RangeField label="인물 감지 민감도" option={a.personDetectionSensitivity as RangeOptionLike} onChange={(v) => setAccuracy('personDetectionSensitivity', v)} />
        <RangeField label="NMS 임계값" option={a.nmsThreshold as RangeOptionLike} onChange={(v) => setAccuracy('nmsThreshold', v)} />
        <div className="field">
          <div className="field-label"><span>행동 모델 프로파일</span></div>
          <Segmented
            value={a.behaviorModel.value}
            choices={a.behaviorModel.choices}
            onChange={(v) => setAccuracy('behaviorModel', v)}
          />
        </div>
        <ToggleField label="시계열 평활화" value={a.temporalSmoothing.value} description={a.temporalSmoothing.description} onChange={(v) => setAccuracy('temporalSmoothing', v)} />
        <ToggleField label="인물 재식별 (Re-ID)" value={a.enableReIdentification.value} description={a.enableReIdentification.description} onChange={(v) => setAccuracy('enableReIdentification', v)} />
        <div className="divider" />
        <RangeField
          label="실시간 추론 해상도"
          option={config.detection.realtimeImgsz as RangeOptionLike}
          onChange={(v) => setConfigSection('detection', 'realtimeImgsz', v)}
        />
        <RangeField
          label="추적 버퍼 (가려짐 유지 프레임)"
          option={config.detection.trackBuffer as RangeOptionLike}
          onChange={(v) => setConfigSection('detection', 'trackBuffer', v)}
        />
        <ToggleField
          label="COCO 사람 보강"
          value={config.detection.personBoost.value}
          description={config.detection.personBoost.description}
          onChange={(v) => setConfigSection('detection', 'personBoost', v)}
        />
        <RangeField
          label="COCO 사람 보강 최소 신뢰도"
          option={config.detection.personBoostMinConf as RangeOptionLike}
          onChange={(v) => setConfigSection('detection', 'personBoostMinConf', v)}
        />
        <RangeField
          label="영상 분석 해상도"
          option={config.detection.analysisImgsz as RangeOptionLike}
          onChange={(v) => setConfigSection('detection', 'analysisImgsz', v)}
        />
        <RangeField
          label="영상 분석 FPS"
          option={config.detection.analysisFps as RangeOptionLike}
          onChange={(v) => setConfigSection('detection', 'analysisFps', v)}
        />
        <div className="text-xs faint" style={{ marginTop: 4, lineHeight: 1.6 }}>
          1080p 영상도 분석용으로 640 또는 960으로 축소합니다. 30fps 영상은 5~10fps로 샘플링해 CPU 처리 시간을 줄입니다.
        </div>
        <div className="text-xs faint" style={{ marginTop: 6, lineHeight: 1.6 }}>
          정확도 최고 설정: 신뢰도 0.30~0.35, NMS IoU 0.55, 실시간 해상도 640, 추적 버퍼 30 이상. 야간 영상에서는 COCO 사람 보강을 OFF로 유지하세요.
        </div>
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <ScanSearch size={16} className="accent" />
          <span className="card-title">전처리 · 오탐 방지</span>
        </div>
        <div className="field">
          <div className="field-label"><span>NMS IoU</span><span className="field-value">{config.preprocessing.nmsIoU.value}</span></div>
          <input type="range" min={0.1} max={0.9} step={0.05} value={config.preprocessing.nmsIoU.value} onChange={(e) => setConfigSection('preprocessing', 'nmsIoU', Number(e.target.value))} />
          <div className="text-xs faint" style={{ marginTop: 5 }}>겹치는 Box 제거. 낮추면 중복 제거가 엄격해집니다.</div>
        </div>
        <div className="field">
          <div className="field-label"><span>감마 보정</span><span className="field-value">{config.preprocessing.gamma.value}</span></div>
          <input type="range" min={0.4} max={2} step={0.1} value={config.preprocessing.gamma.value} onChange={(e) => setConfigSection('preprocessing', 'gamma', Number(e.target.value))} />
        </div>
        <div className="text-xs faint" style={{ lineHeight: 1.7 }}>
          제외 영역: 상단 {config.preprocessing.excludeZones.value[0]?.[2]?.[1] ?? 12}% / 하단 {100 - (config.preprocessing.excludeZones.value[1]?.[0]?.[1] ?? 88)}% (하늘·대시보드 반사 마스킹)
        </div>
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <ScanSearch size={16} className="accent" />
          <span className="card-title">탐지 모델 · 추적</span>
        </div>
        <div className="field">
          <div className="field-label"><span>사전학습 모델</span></div>
          <div className="segmented" style={{ flexWrap: 'wrap' }}>
            {config.detection.model.choices.map((m) => (
              <button key={m} className={`segment ${config.detection.model.value === m ? 'active' : ''}`} style={{ minWidth: 70 }} onClick={() => setDetection('model', m)}>
                {m.replace('.pt', '')}
              </button>
            ))}
          </div>
          <div className="text-xs faint" style={{ marginTop: 5 }}>{config.detection.model.description} · 상용 배포 시 Apache/MIT 계열(RT-DETR 등) 사용 권장</div>
        </div>
        <div className="field">
          <div className="field-label"><span>해상도 대응</span></div>
          <Segmented
            value={config.detection.resolutionMode.value}
            choices={config.detection.resolutionMode.choices}
            labels={{ single: '단일', multiscale: '다중스케일', tiled: '타일 분할' }}
            onChange={(v) => setDetection('resolutionMode', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>
            다중스케일: {config.detection.scales.value.join(' / ')} px 앙상블 · 타일: 4분할 후 320px 추론 (작은 객체 강점)
          </div>
        </div>
        <div className="field">
          <div className="field-label"><span>추적 알고리즘</span></div>
          <Segmented
            value={config.detection.tracker.value}
            choices={config.detection.tracker.choices}
            labels={{ nearest: '최근접', bytetrack: 'ByteTrack', botsort: 'BoT-SORT' }}
            onChange={(v) => setDetection('tracker', v)}
          />
        </div>
        <div className="field">
          <div className="field-label"><span>추론 엔진</span></div>
          <Segmented
            value={config.detection.runtime.value}
            choices={config.detection.runtime.choices}
            labels={{ onnx: 'ONNX (고속)', openvino: 'OpenVINO', pytorch: 'PyTorch' }}
            onChange={(v) => setDetection('runtime', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>ONNX Runtime은 GPU 사용 시 자동 CUDA 전환, CPU에서도 PyTorch보다 빠릅니다.</div>
        </div>
        <div className="field">
          <div className="field-label"><span>추적 클래스 범위</span></div>
          <Segmented
            value={config.detection.classFilter.value}
            choices={config.detection.classFilter.choices}
            labels={{ all: '전체 사물', person_vehicle: '인물·차량만', person_only: '사람만 (오탐 차단)' }}
            onChange={(v) => setDetection('classFilter', v)}
          />
          <div className="text-xs faint" style={{ marginTop: 5 }}>
            전체 모드는 COCO 80클래스(사람·차량·표지판·가방·가구 등)를 모두 추적하며, 오탐 방지를 위해 신뢰도 기준을 0.7 이상으로 올립니다.
          </div>
        </div>
        <ToggleField
          label="광학 흐름 모드 (학습/모델 불필요)"
          value={config.detection.opticalFlow.value}
          description={config.detection.opticalFlow.description}
          onChange={(v) => setDetection('opticalFlow', v)}
        />
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <Sparkles size={16} className="accent" />
          <span className="card-title">예측 · 스트림 · 저장</span>
        </div>
        <ToggleField
          label="이동 예측 (칼만 필터)"
          value={config.prediction.enabled.value}
          description={config.prediction.enabled.description}
          onChange={(v) => setConfigSection('prediction', 'enabled', v)}
        />
        <div className="field">
          <div className="field-label"><span>예측 시간</span><span className="field-value">{config.prediction.horizonSec.value}s</span></div>
          <input type="range" min={1} max={5} value={config.prediction.horizonSec.value} onChange={(e) => setConfigSection('prediction', 'horizonSec', Number(e.target.value))} />
        </div>
        <ToggleField
          label="시간 기반 사고 판단"
          value={config.accidentAnalysis.enabled.value}
          description={config.accidentAnalysis.enabled.description}
          onChange={(v) => setConfigSection('accidentAnalysis', 'enabled', v)}
        />
        <div className="field">
          <div className="field-label"><span>충돌 판단 시간 창</span><span className="field-value">{config.accidentAnalysis.collisionWindowSec.value}s</span></div>
          <input type="range" min={0.5} max={5} step={0.5} value={config.accidentAnalysis.collisionWindowSec.value} onChange={(e) => setConfigSection('accidentAnalysis', 'collisionWindowSec', Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>거리 급감 기준</span><span className="field-value">{Math.round(config.accidentAnalysis.collisionDistDrop.value * 100)}%</span></div>
          <input type="range" min={0.2} max={0.95} step={0.05} value={config.accidentAnalysis.collisionDistDrop.value} onChange={(e) => setConfigSection('accidentAnalysis', 'collisionDistDrop', Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>최소 지속 프레임</span><span className="field-value">{config.accidentAnalysis.minFrames.value}프레임</span></div>
          <input type="range" min={2} max={10} value={config.accidentAnalysis.minFrames.value} onChange={(e) => setConfigSection('accidentAnalysis', 'minFrames', Number(e.target.value))} />
        </div>
        <ToggleField
          label="RTSP 스트림 분석"
          value={config.streaming.enabled.value}
          description={config.streaming.enabled.description}
          onChange={(v) => setConfigSection('streaming', 'enabled', v)}
        />
        <div className="field">
          <div className="field-label"><span>RTSP 주소</span></div>
          <input className="ghost-btn full" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} value={config.streaming.rtspUrl.value} onChange={(e) => setConfigSection('streaming', 'rtspUrl', e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label"><span>WebRTC 주소 (MediaMTX)</span></div>
          <input className="ghost-btn full" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} value={config.streaming.webrtcUrl.value} placeholder="http://host:8889/camera/whep" onChange={(e) => setConfigSection('streaming', 'webrtcUrl', e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label"><span>이벤트 브로커</span></div>
          <Segmented
            value={config.broker.type.value}
            choices={config.broker.type.choices}
            labels={{ local: '로컬 파일', redis: 'Redis Streams' }}
            onChange={(v) => setConfigSection('broker', 'type', v)}
          />
          {config.broker.type.value === 'redis' && (
            <input className="ghost-btn full mt-2" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} value={config.broker.url.value} onChange={(e) => setConfigSection('broker', 'url', e.target.value)} />
          )}
        </div>
        <div className="divider" />
        <div className="text-xs faint" style={{ marginBottom: 8 }}>학습 데이터 자동 수집</div>
        <ToggleField
          label="하드 네거티브 자동 수집"
          value={config.training.activeLearning.value}
          description={config.training.activeLearning.description}
          onChange={(v) => setConfigSection('training', 'activeLearning', v)}
        />
        <div className="field">
          <div className="field-label"><span>모호 신뢰도 하한</span><span className="field-value">{config.training.ambiguousMin.value}</span></div>
          <input type="range" min={0.1} max={0.9} step={0.05} value={config.training.ambiguousMin.value} onChange={(e) => setConfigSection('training', 'ambiguousMin', Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>모호 신뢰도 상한</span><span className="field-value">{config.training.ambiguousMax.value}</span></div>
          <input type="range" min={0.1} max={0.95} step={0.05} value={config.training.ambiguousMax.value} onChange={(e) => setConfigSection('training', 'ambiguousMax', Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>클립 윈도우</span><span className="field-value">{config.training.clipWindowSec.value}s</span></div>
          <input type="range" min={1} max={15} value={config.training.clipWindowSec.value} onChange={(e) => setConfigSection('training', 'clipWindowSec', Number(e.target.value))} />
        </div>
        <ToggleField
          label="이벤트 로그 저장"
          value={config.storage.eventLog.value}
          description={config.storage.eventLog.description}
          onChange={(v) => setConfigSection('storage', 'eventLog', v)}
        />
        <div className="text-xs faint">저장 위치: services/.data/events.jsonl · 클립: services/.data/clips/</div>
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <Gauge size={16} style={{ color: 'var(--accent-4)' }} />
          <span className="card-title">사물 측정</span>
        </div>
        <ToggleField
          label="상대 크기 출력"
          value={config.measurement.relativeSize.value}
          description={config.measurement.relativeSize.description}
          onChange={(v) => setMeasurement('relativeSize', v)}
        />
        <div className="field">
          <div className="field-label"><span>기준 객체</span></div>
          <Segmented
            value={config.measurement.referenceObject.value}
            choices={config.measurement.referenceObject.choices}
            labels={{ car: '차량', person: '인물', none: '없음' }}
            onChange={(v) => setMeasurement('referenceObject', v)}
          />
        </div>
        <RangeField label="기준 객체 폭 (cm)" option={config.measurement.knownWidthCm as RangeOptionLike} onChange={(v) => setMeasurement('knownWidthCm', v)} />
        <RangeField label="카메라 화각 (°)" option={config.measurement.fieldOfViewDeg as RangeOptionLike} onChange={(v) => setMeasurement('fieldOfViewDeg', v)} />
        <ToggleField
          label="깊이 모델 (MiDaS)"
          value={config.measurement.depthEstimation.value}
          description={config.measurement.depthEstimation.description}
          onChange={(v) => setMeasurement('depthEstimation', v)}
        />
      </div>

      <div className="card card-pad">
        <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
          <ListChecks size={16} className="accent" />
          <span className="card-title">파이프라인 자동화</span>
        </div>
        <ToggleField
          label="자동 업데이트"
          value={config.pipeline.autoUpdate.value}
          description={config.pipeline.autoUpdate.description}
          onChange={setAutoUpdate}
        />
        <RangeField
          label="디바운스 (ms)"
          option={{ value: config.pipeline.autoUpdateDebounceMs.value, min: 0, max: 2000, description: '변경 후 재실행까지의 대기 시간' }}
          onChange={setDebounce}
        />
        <ToggleField
          label="기능 안내 팝업"
          value={guideEnabled}
          description="처음 방문하는 탭에서 기능 설명 팝업을 자동으로 표시합니다. 꺼도 상단 '안내' 버튼으로 열 수 있습니다."
          onChange={setGuideEnabled}
        />
        <div className="divider" />
        <div className="text-xs faint" style={{ lineHeight: 1.7 }}>
          옵션을 변경하거나 파이프라인 노드를 생성·수정·삭제하면 그래프가 새 버전으로 재구성되고 분석이 자동으로 재실행됩니다.
        </div>
        <button className="ghost-btn full mt-4" onClick={resetPipeline}>
          <RefreshCw size={14} /> 전체 초기화
        </button>
      </div>
    </div>
  );
}
