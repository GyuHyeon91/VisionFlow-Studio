import { backendBaseUrl } from '@/config';

export interface EvaluationReport {
  reviewedEvents: number;
  predictedEvents: number;
  overall: { tp: number; fp: number; fn: number; precision: number; recall: number; f1: number };
  perType: Record<string, { tp: number; fp: number; fn: number; precision: number; recall: number; f1: number }>;
  confusionMatrix: Record<string, Record<string, number>>;
  tracking: { tracks: number; fragmentedTracks: number; idSwitches: number; idPreservationRate: number };
  reliable: boolean;
  note: string;
}

export interface RetrainStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  message: string;
  lastRun: string | null;
  samplesAdded: number;
  error: string | null;
}

const base = () => backendBaseUrl();

export async function getEvaluation(): Promise<EvaluationReport> {
  const r = await fetch(`${base()}/api/evaluation`);
  if (!r.ok) throw new Error('evaluation failed');
  return r.json();
}

export async function reviewEvent(eventId: string, verdict: 'true' | 'false', accidentType: string) {
  const r = await fetch(`${base()}/api/evaluation/review`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, verdict, accidentType }),
  });
  if (!r.ok) throw new Error('review failed');
  return r.json();
}

export async function getRetrainStatus(): Promise<RetrainStatus> {
  const r = await fetch(`${base()}/api/auto-retrain/status`);
  if (!r.ok) throw new Error('retrain status failed');
  return r.json();
}

export async function startRetrain(epochs = 10, imgsz = 640): Promise<RetrainStatus> {
  const r = await fetch(`${base()}/api/auto-retrain/start`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epochs, imgsz, baseModel: 'yolov8n.pt' }),
  });
  if (!r.ok) throw new Error('retrain start failed');
  return r.json();
}
