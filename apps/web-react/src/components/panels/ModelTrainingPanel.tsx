import { useEffect, useRef, useState } from 'react';
import { BarChart3, BrainCircuit, Camera, Download, FolderOpen, RefreshCw, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { backendBaseUrl } from '@/config';
import DataCard from './DataCard';
import {
  analyzeDataset, captureFrame, createDataset, DEFAULT_AUGMENTATION, getTrainStatus,
  importDatasetDir, listRawDatasets, startTraining, uploadDataset, useModel,
  type Augmentation, type DatasetAnalysis, type RawDataset, type TrainStatus,
} from '@/services/trainingApi';

const BASE_MODELS = ['yolov8n.pt', 'yolov8s.pt', 'yolov8m.pt'];

/** COCO 사전학습 모델에는 없는 건설현장 장비 클래스 */
const SITE_CLASSES = 'person, worker, helmet, forklift, truck, bus, excavator, crane, concrete_mixer, dump_truck, traffic_cone, barrier';

export default function ModelTrainingPanel() {
  const video = useStore((s) => s.video);
  const config = useStore((s) => s.config);
  const pushToast = useStore((s) => s.pushToast);
  const [status, setStatus] = useState<TrainStatus | null>(null);
  const [datasetId, setDatasetId] = useState('capture');
  const [epochs, setEpochs] = useState(30);
  const [imgsz, setImgsz] = useState(640);
  const [batch, setBatch] = useState(8);
  const [baseModel, setBaseModel] = useState(BASE_MODELS[0]);
  const [captured, setCaptured] = useState(0);
  const [busy, setBusy] = useState(false);
  const [modelMode, setModelMode] = useState<'pretrained' | 'custom'>('pretrained');
  const [classesText, setClassesText] = useState(
    'person, car, truck, bus, bicycle, motorcycle, traffic light, stop sign, fire hydrant, dog, cat, backpack, suitcase, handbag, umbrella, chair, bench, bottle, cell phone, laptop, tv, couch, bed, dining table, refrigerator, sink, clock, scissors',
  );
  const [augmentation, setAugmentation] = useState<Augmentation>(DEFAULT_AUGMENTATION);
  const [batchCount, setBatchCount] = useState(8);
  const zipRef = useRef<HTMLInputElement>(null);
  const [negativeCount, setNegativeCount] = useState(0);
  const [synthCount, setSynthCount] = useState(0);
  const [realDatasetId, setRealDatasetId] = useState('construction');
  const [sourcePath, setSourcePath] = useState('');
  const [rawDatasets, setRawDatasets] = useState<RawDataset[]>([]);
  const [rawRoot, setRawRoot] = useState('');
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
  const [valRatio, setValRatio] = useState(0.2);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const s = await getTrainStatus();
        if (alive) setStatus(s);
      } catch { /* 백엔드 미실행 시 무시 */ }
    };
    const loadNegatives = async () => {
      try {
        const r = await (await fetch(`${backendBaseUrl()}/api/active-learning`)).json();
        setNegativeCount(r.count ?? 0);
      } catch { /* ignore */ }
    };
    void poll();
    void loadNegatives();
    const timer = setInterval(() => { void poll(); void loadNegatives(); }, 1200);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadRaw = async () => {
      try {
        const r = await listRawDatasets();
        if (alive) { setRawDatasets(r.datasets); setRawRoot(r.root); }
      } catch { /* 백엔드 미실행 시 무시 */ }
    };
    void loadRaw();
    return () => { alive = false; };
  }, []);

  const refreshAnalysis = async () => {
    try { setAnalysis(await analyzeDataset(realDatasetId)); } catch { setAnalysis(null); }
  };

  const handleImportReal = async () => {
    if (!sourcePath.trim()) { pushToast('원본 데이터 폴더 경로를 입력해 주세요.', 'warning'); return; }
    setBusy(true);
    try {
      const classes = classesText.split(',').map((c) => c.trim()).filter(Boolean);
      const r = await importDatasetDir(realDatasetId, sourcePath.trim(), classes, valRatio);
      setAnalysis(r);
      pushToast(`현장 데이터 ${r.imported}장 가져오기 완료 (학습 ${r.train} · 검증 ${r.val})`, 'success');
    } catch (err) {
      pushToast(`가져오기 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleCapture = async () => {
    if (!video?.url) { pushToast('먼저 영상을 업로드해 주세요.', 'warning'); return; }
    setBusy(true);
    try {
      const result = await captureFrame(video.url, datasetId, captured * 0.5);
      setCaptured((v) => v + result.saved);
      pushToast(`학습 데이터 ${result.saved}건 수집 (총 ${captured + result.saved}건)`, 'success');
    } catch (err) {
      pushToast(`데이터 수집 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleCreateDataset = async () => {
    try {
      const classes = classesText.split(',').map((c) => c.trim()).filter(Boolean);
      const res = await createDataset(datasetId, classes);
      pushToast(`데이터셋 생성: ${res.classes}개 클래스`, 'success');
    } catch (err) {
      pushToast(`데이터셋 생성 실패: ${(err as Error).message}`, 'error');
    }
  };

  const handleUploadZip = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadDataset(datasetId, file);
      pushToast(`데이터셋 업로드: 이미지 ${res.images} · 라벨 ${res.labels}`, 'success');
    } catch (err) {
      pushToast(`업로드 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleBatchCapture = async () => {
    if (!video?.url) { pushToast('먼저 영상을 업로드해 주세요.', 'warning'); return; }
    setBusy(true);
    let total = 0;
    try {
      for (let i = 0; i < batchCount; i += 1) {
        const res = await captureFrame(video.url, datasetId, i * 0.7);
        total += res.saved;
      }
      setCaptured((v) => v + total);
      pushToast(`${batchCount}개 시점에서 ${total}건 라벨 수집 완료`, 'success');
    } catch (err) {
      pushToast(`일괄 수집 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleTrain = async () => {
    setBusy(true);
    try {
      const s = await startTraining({ datasetId, epochs, imgsz, batch, baseModel, augmentation });
      setStatus(s);
      pushToast('YOLO 미세조정을 시작했습니다.', 'info');
    } catch (err) {
      pushToast(`학습 시작 실패: ${(err as Error).message}`, 'error');
    } finally { setBusy(false); }
  };

  const handleModelSwitch = async (mode: 'pretrained' | 'custom') => {
    try {
      await useModel(mode === 'pretrained');
      setModelMode(mode);
      pushToast(mode === 'pretrained' ? '사전학습 모델을 적용했습니다.' : '학습된 커스텀 모델을 적용했습니다.', 'success');
    } catch (err) {
      pushToast(`모델 전환 실패: ${(err as Error).message}`, 'error');
    }
  };

  return (
    <div className="grid grid-2">
      <DataCard
        dataKey="training-status"
        title="모델 학습 상태"
        description="수집된 데이터로 YOLO를 미세조정합니다. 학습이 끝나면 감지기에 커스텀 모델이 자동 적용됩니다."
        icon={<BrainCircuit size={15} />}
        right={<span className={`chip ${status?.status === 'running' ? 'accent' : ''}`}>{status?.status ?? 'idle'}</span>}
        bodyClassName="card-pad"
      >
        <div className="flex justify-between text-sm"><span className="dim">진행률</span><b className="mono">{Math.round((status?.progress ?? 0) * 100)}%</b></div>
        <div className="run-bar mt-2"><i style={{ width: `${(status?.progress ?? 0) * 100}%` }} /></div>
        <div className="flex justify-between text-sm mt-4"><span className="dim">에포크</span><b className="mono">{status?.epoch ?? 0} / {status?.totalEpochs ?? 0}</b></div>
        <div className="flex justify-between text-sm mt-2"><span className="dim">메시지</span><span className="text-xs dim">{status?.message ?? '-'}</span></div>
        {status?.error && <div className="text-xs" style={{ color: 'var(--danger)', marginTop: 8 }}>{status.error}</div>}
        <div className="divider" />
        <div className="text-xs faint" style={{ lineHeight: 1.7 }}>
          수집된 데이터셋: <b className="mono">{datasetId}</b> · 프레임 {captured}장
        </div>
      </DataCard>

      <DataCard
        dataKey="training-data"
        title="학습 데이터 수집"
        description="현재 영상의 프레임을 캡처하고 감지 결과를 YOLO 라벨로 저장해 학습 데이터를 만듭니다."
        icon={<Camera size={15} />}
        bodyClassName="card-pad"
      >
        <div className="field">
          <div className="field-label"><span>데이터셋 ID</span></div>
          <input className="ghost-btn full" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} value={datasetId} onChange={(e) => setDatasetId(e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label"><span>학습 클래스 (쉼표 구분)</span><span className="field-value">{classesText.split(',').filter(Boolean).length}개</span></div>
          <textarea
            className="ghost-btn full"
            style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)', minHeight: 72, padding: 10, lineHeight: 1.5 }}
            value={classesText}
            onChange={(e) => setClassesText(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button className="ghost-btn full" style={{ fontSize: 10, padding: '6px 10px' }} onClick={handleCreateDataset}>
              <Sparkles size={12} /> 클래스 정의로 데이터셋 생성
            </button>
            <button
              className="ghost-btn full"
              style={{ fontSize: 10, padding: '6px 10px' }}
              onClick={() => {
                setClassesText(SITE_CLASSES);
                setDatasetId('construction');
                pushToast('건설현장 클래스 프리셋을 적용했습니다. 클래스 정의 버튼으로 저장하세요.', 'info');
              }}
            >
              현장 프리셋
            </button>
          </div>
          <div className="text-xs faint mt-2" style={{ lineHeight: 1.6 }}>
            COCO 사전학습 모델에는 지게차·굴착기 클래스가 없어 지게차가 트럭으로, 화물차가 버스로 표시될 수 있습니다. 정확한 구분은 위 클래스로 현장 데이터를 수집해 학습하세요.
          </div>
        </div>
        <div className="field">
          <div className="field-label"><span>외부 데이터셋 ZIP</span></div>
          <input ref={zipRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => handleUploadZip(e.target.files?.[0])} />
          <button className="ghost-btn full" style={{ fontSize: 10, padding: '6px 10px' }} onClick={() => zipRef.current?.click()}>
            <UploadCloud size={12} /> images/labels ZIP 업로드
          </button>
        </div>
        <div className="divider" />
        <div className="flex justify-between text-sm">
          <span className="dim">자동 수집 하드 네거티브</span>
          <b className="mono accent">{negativeCount}장</b>
        </div>
        <div className="text-xs faint mt-2" style={{ lineHeight: 1.6 }}>
          애매한 신뢰도 구간과 안전 판별 후보 프레임이 라벨 없는 정상 샘플로 자동 저장됩니다.
        </div>
        <button
          className="ghost-btn full mt-2"
          style={{ fontSize: 10, padding: '6px 10px' }}
          onClick={async () => {
            try {
              const r = await (await fetch(`${backendBaseUrl()}/api/dataset/synthesize?datasetId=${datasetId}&copies=${config.training.syntheticCopies.value}`, { method: 'POST' })).json();
              setSynthCount(r.created ?? 0);
              pushToast(`합성 데이터 ${r.created ?? 0}장 생성`, 'success');
            } catch (err) { pushToast(`생성 실패: ${(err as Error).message}`, 'error'); }
          }}
        >
          <Sparkles size={12} /> 합성 데이터 생성 ({config.training.syntheticCopies.value}배)
        </button>
        {synthCount > 0 && <div className="text-xs accent mt-2">최근 생성 {synthCount}장</div>}
        <div className="field">
          <div className="field-label"><span>일괄 수집 시점</span><span className="field-value">{batchCount}장</span></div>
          <input type="range" min={1} max={30} value={batchCount} style={{ ['--fill' as string]: `${(batchCount - 1) / 29 * 100}%` }} onChange={(e) => setBatchCount(Number(e.target.value))} />
        </div>
        <button className="primary-btn full" disabled={busy || !video?.url} onClick={handleCapture}>
          <Camera size={14} /> 단일 프레임 수집
        </button>
        <button className="ghost-btn full mt-2" disabled={busy || !video?.url} onClick={handleBatchCapture}>
          <Camera size={12} /> 다중 시점 일괄 수집
        </button>
        <div className="text-xs faint mt-2">유리 반사·도로 바닥 등 오탐 영역은 라벨 없는 네거티브 샘플로 함께 수집하면 오탐이 크게 줄어듭니다.</div>
      </DataCard>

      <DataCard
        dataKey="training-real-dataset"
        title="실제 건설현장 데이터셋"
        description="현장 CCTV에서 수집한 이미지와 라벨을 가져와 train/val로 분할하고, 사고·정상 비율과 라벨 오류를 학습 전에 점검합니다."
        icon={<BarChart3 size={15} />}
        right={<span className={`chip ${analysis?.ready ? 'accent' : ''}`}>{analysis ? (analysis.ready ? '학습 준비 완료' : '점검 필요') : '미분석'}</span>}
        bodyClassName="card-pad"
      >
        <div className="field">
          <div className="field-label"><span>대상 데이터셋 ID</span></div>
          <input className="ghost-btn full" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} value={realDatasetId} onChange={(e) => setRealDatasetId(e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label"><span>원본 폴더 경로</span><span className="field-value">{rawDatasets.length}개 발견</span></div>
          <input className="ghost-btn full" style={{ cursor: 'text', justifyContent: 'flex-start', color: 'var(--text)' }} placeholder={rawRoot || 'services/.data/raw/...'} value={sourcePath} onChange={(e) => setSourcePath(e.target.value)} />
          {rawDatasets.length > 0 && (
            <div className="clip-list mt-2">
              {rawDatasets.map((d) => (
                <button key={d.name} className="clip-item" onClick={() => setSourcePath(d.path)}>
                  <span className="mono"><FolderOpen size={11} style={{ verticalAlign: 'middle', marginRight: 5 }} />{d.name}</span>
                  <span className="faint mono" style={{ fontSize: 9 }}>{d.path}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="field">
          <div className="field-label"><span>검증(val) 비율</span><span className="field-value">{Math.round(valRatio * 100)}%</span></div>
          <input type="range" min={0.05} max={0.5} step={0.05} value={valRatio} onChange={(e) => setValRatio(Number(e.target.value))} />
        </div>
        <div className="flex gap-2">
          <button className="ghost-btn full" style={{ fontSize: 11 }} disabled={busy} onClick={() => void refreshAnalysis()}><RefreshCw size={12} /> 분석</button>
          <button className="primary-btn full" style={{ fontSize: 11 }} disabled={busy} onClick={() => void handleImportReal()}><FolderOpen size={12} /> 가져오기</button>
        </div>
        {analysis && (
          <>
            <div className="divider" />
            <div className="grid grid-2 mt-2" style={{ gap: 8 }}>
              <div className="metric-card" style={{ padding: '10px 12px', borderRadius: 10 }}><div className="text-xs faint">이미지</div><b className="mono">{analysis.images}</b></div>
              <div className="metric-card" style={{ padding: '10px 12px', borderRadius: 10 }}><div className="text-xs faint">라벨 있음</div><b className="mono">{analysis.labeledImages}</b></div>
              <div className="metric-card" style={{ padding: '10px 12px', borderRadius: 10 }}><div className="text-xs faint">네거티브</div><b className="mono">{analysis.emptyLabels}</b></div>
              <div className="metric-card" style={{ padding: '10px 12px', borderRadius: 10 }}><div className="text-xs faint">사고 비율</div><b className="mono accent">{Math.round(analysis.accidentRatio * 100)}%</b></div>
            </div>
            <div className="text-xs dim mt-2">클래스 분포: {Object.entries(analysis.classCounts).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(' · ') || '없음'}</div>
            <div className="text-xs faint mt-2" style={{ lineHeight: 1.7 }}>
              {analysis.recommendations.length
                ? analysis.recommendations.map((r) => <div key={r}>• {r}</div>)
                : <div><ShieldCheck size={11} /> 학습 전 점검을 통과했습니다. 상단의 데이터셋 ID를 이 이름으로 바꾸고 학습을 시작하세요.</div>}
            </div>
          </>
        )}
      </DataCard>

      <DataCard
        dataKey="training-options"
        title="학습 옵션"
        description="기본 모델과 에포크·이미지 크기·배치를 설정합니다. CPU 환경에서는 작은 모델과 적은 에포크를 권장합니다."
        icon={<Sparkles size={15} />}
        bodyClassName="card-pad"
      >
        <div className="field">
          <div className="field-label"><span>기본 모델</span></div>
          <div className="segmented">
            {BASE_MODELS.map((m) => (
              <button key={m} className={`segment ${baseModel === m ? 'active' : ''}`} onClick={() => setBaseModel(m)}>{m.replace('yolov8', 'v8-')}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <div className="field-label"><span>에포크</span><span className="field-value">{epochs}</span></div>
          <input type="range" min={5} max={100} value={epochs} style={{ ['--fill' as string]: `${(epochs - 5) / 95 * 100}%` }} onChange={(e) => setEpochs(Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>이미지 크기</span><span className="field-value">{imgsz}</span></div>
          <input type="range" min={320} max={960} step={64} value={imgsz} style={{ ['--fill' as string]: `${(imgsz - 320) / 640 * 100}%` }} onChange={(e) => setImgsz(Number(e.target.value))} />
        </div>
        <div className="field">
          <div className="field-label"><span>배치 크기</span><span className="field-value">{batch}</span></div>
          <input type="range" min={1} max={32} value={batch} style={{ ['--fill' as string]: `${(batch - 1) / 31 * 100}%` }} onChange={(e) => setBatch(Number(e.target.value))} />
        </div>
        <div className="divider" />
        <div className="text-xs faint" style={{ marginBottom: 8 }}>데이터 증강 (다양한 사물 상태 학습)</div>
        {([
          ['fliplr', '좌우 반전', 0, 1, 0.05],
          ['flipud', '상하 반전', 0, 1, 0.05],
          ['mosaic', '모자이크', 0, 1, 0.1],
          ['mixup', '믹스업', 0, 1, 0.05],
          ['degrees', '회전 각도', 0, 30, 1],
          ['scale', '스케일', 0, 1, 0.05],
        ] as Array<[keyof Augmentation, string, number, number, number]>).map(([key, label, min, max, step]) => (
          <div className="field" key={key}>
            <div className="field-label"><span>{label}</span><span className="field-value">{augmentation[key]}</span></div>
            <input type="range" min={min} max={max} step={step} value={augmentation[key]} onChange={(e) => setAugmentation((a) => ({ ...a, [key]: Number(e.target.value) }))} />
          </div>
        ))}
        <button className="primary-btn full" disabled={busy || status?.status === 'running'} onClick={handleTrain}>
          <BrainCircuit size={14} /> 학습 시작
        </button>
      </DataCard>

      <DataCard
        dataKey="training-model"
        title="감지 모델 전환"
        description="사전학습 모델과 학습된 커스텀 모델 중 사용할 모델을 선택합니다."
        icon={<Download size={15} />}
        bodyClassName="card-pad"
      >
        <div className="segmented">
          <button className={`segment ${modelMode === 'pretrained' ? 'active' : ''}`} onClick={() => handleModelSwitch('pretrained')}>사전학습 모델</button>
          <button className={`segment ${modelMode === 'custom' ? 'active' : ''}`} onClick={() => handleModelSwitch('custom')}>커스텀 모델</button>
        </div>
        <div className="flex items-center gap-2 text-xs dim mt-4"><RefreshCw size={12} className="accent" /> 커스텀 모델 경로: {status?.modelPath ?? 'services/.models/custom.pt'}</div>
        <div className="text-xs faint mt-2" style={{ lineHeight: 1.6 }}>
          커스텀 모델이 아직 없으면 사전학습 모델이 유지됩니다. 학습 완료 후 자동으로 전환됩니다.
        </div>
      </DataCard>
    </div>
  );
}
