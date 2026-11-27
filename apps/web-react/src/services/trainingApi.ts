import { backendBaseUrl } from '@/config';

export interface TrainStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  epoch: number;
  totalEpochs: number;
  message: string;
  modelPath: string | null;
  error: string | null;
  datasetId: string | null;
  updatedAt: string;
}

export interface TrainRequest {
  datasetId: string;
  epochs: number;
  imgsz: number;
  batch: number;
  baseModel: string;
  augmentation?: Augmentation;
}

export interface Augmentation {
  fliplr: number;
  flipud: number;
  mosaic: number;
  mixup: number;
  hsvH: number;
  hsvS: number;
  hsvV: number;
  degrees: number;
  scale: number;
}

export const DEFAULT_AUGMENTATION: Augmentation = {
  fliplr: 0.5, flipud: 0.1, mosaic: 1.0, mixup: 0.1,
  hsvH: 0.015, hsvS: 0.7, hsvV: 0.4, degrees: 5, scale: 0.5,
};

export interface MeasurementLike {
  label: string;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface DatasetAnalysis {
  datasetId: string;
  images: number;
  labeledImages: number;
  emptyLabels: number;
  valImages: number;
  totalLabels: number;
  accidentImages: number;
  accidentRatio: number;
  classes: string[];
  classCounts: Record<string, number>;
  recommendations: string[];
  ready: boolean;
}

export interface RawDataset { name: string; path: string; }

const base = () => backendBaseUrl();

export async function getTrainStatus(): Promise<TrainStatus> {
  const res = await fetch(`${base()}/api/train/status`);
  if (!res.ok) throw new Error('status failed');
  return res.json();
}

export async function createDataset(datasetId: string, classes: string[]) {
  const res = await fetch(`${base()}/api/dataset/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId, classes }),
  });
  if (!res.ok) throw new Error('dataset create failed');
  return res.json();
}

export async function uploadDataset(datasetId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  form.append('datasetId', datasetId);
  const res = await fetch(`${base()}/api/dataset/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('dataset upload failed');
  return res.json();
}

/** 실제 현장 데이터셋을 분석해 클래스 분포·사고 비율을 반환 */
export async function analyzeDataset(datasetId: string): Promise<DatasetAnalysis> {
  const res = await fetch(`${base()}/api/dataset/analyze?datasetId=${encodeURIComponent(datasetId)}`);
  if (!res.ok) throw new Error('dataset analyze failed');
  return res.json();
}

/** services/.data/raw 하위의 원본 폴더 목록 */
export async function listRawDatasets(): Promise<{ datasets: RawDataset[]; root: string }> {
  const res = await fetch(`${base()}/api/dataset/raw`);
  if (!res.ok) throw new Error('raw dataset list failed');
  return res.json();
}

/** 원본 폴더를 가져와 train/val로 분할하고 data.yaml을 생성 */
export async function importDatasetDir(
  datasetId: string, sourcePath: string, classes: string[], valRatio = 0.2,
): Promise<DatasetAnalysis & { imported: number; train: number; val: number }> {
  const res = await fetch(`${base()}/api/dataset/import-dir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId, sourcePath, classes, valRatio }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? 'dataset import failed');
  }
  return res.json();
}

export async function startTraining(req: TrainRequest): Promise<TrainStatus> {
  const res = await fetch(`${base()}/api/train/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('train start failed');
  return res.json();
}

export async function useModel(pretrained: boolean) {
  const res = await fetch(`${base()}/api/model/use?pretrained=${pretrained}`, { method: 'POST' });
  if (!res.ok) throw new Error('model switch failed');
  return res.json();
}

/** 영상 프레임을 캡처해 감지 → YOLO 라벨로 데이터셋에 저장 */
export async function captureFrame(
  videoUrl: string,
  datasetId: string,
  timeSec = 0,
): Promise<{ saved: number }> {
  const video = document.createElement('video');
  video.muted = true;
  video.src = videoUrl;
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('video load failed'));
  });
  video.currentTime = Math.min(timeSec, Math.max(0, video.duration - 0.1));
  await new Promise<void>((resolve) => { video.onseeked = () => resolve(); });
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.7));
  if (!blob) throw new Error('capture failed');

  const measureForm = new FormData();
  measureForm.append('file', blob, 'capture.jpg');
  measureForm.append('threshold', '0.4');
  const measureRes = await fetch(`${base()}/api/measure-frame`, { method: 'POST', body: measureForm });
  if (!measureRes.ok) throw new Error('measure failed');
  const measured = (await measureRes.json()) as { measurements: MeasurementLike[] };

  const captureForm = new FormData();
  captureForm.append('file', blob, `frame_${Date.now()}.jpg`);
  captureForm.append('payload', JSON.stringify({
    datasetId,
    detections: measured.measurements.map((m) => ({ label: m.label, bbox: m.bbox })),
  }));
  const res = await fetch(`${base()}/api/dataset/capture`, { method: 'POST', body: captureForm });
  if (!res.ok) throw new Error('capture save failed');
  return res.json();
}
