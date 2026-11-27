import { backendBaseUrl } from '@/config';

export interface ClipInfo {
  name: string;
  frames: number;
  width: number;
  height: number;
  fps: number;
  seconds: number;
}

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LabelBox {
  id: string;
  label: string;
  bbox: BBox;
  confidence?: number;
}

export interface DetectionLike {
  label: string;
  labelKo?: string;
  confidence?: number;
  bbox: BBox;
}

const base = () => backendBaseUrl();

export async function listClips(): Promise<ClipInfo[]> {
  const res = await fetch(`${base()}/api/clips`);
  if (!res.ok) throw new Error('clip list failed');
  const data = (await res.json()) as { clips: Array<{ name: string }> };
  const infos = await Promise.all(
    data.clips.map(async (c) => {
      try {
        const r = await fetch(`${base()}/api/clips/${encodeURIComponent(c.name)}/info`);
        return (await r.json()) as ClipInfo;
      } catch {
        return { name: c.name, frames: 0, width: 0, height: 0, fps: 0, seconds: 0 };
      }
    }),
  );
  return infos;
}

export function frameUrl(name: string, index: number): string {
  return `${base()}/api/clips/${encodeURIComponent(name)}/frame/${index}`;
}

export async function getDatasetClasses(datasetId: string): Promise<string[]> {
  const res = await fetch(`${base()}/api/dataset/classes?datasetId=${encodeURIComponent(datasetId)}`);
  if (!res.ok) throw new Error('classes load failed');
  return ((await res.json()) as { classes: string[] }).classes;
}

/** 클립 프레임을 YOLO에 다시 감지해 초기 BBox를 만든다. */
export async function detectFrame(name: string, index: number, threshold = 0.3): Promise<DetectionLike[]> {
  const blob = await (await fetch(frameUrl(name, index))).blob();
  const form = new FormData();
  form.append('file', blob, `frame_${index}.jpg`);
  form.append('threshold', String(threshold));
  const res = await fetch(`${base()}/api/detect-frame`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('detect failed');
  return ((await res.json()) as { detections: DetectionLike[] }).detections;
}

export async function saveClipLabel(
  name: string,
  datasetId: string,
  index: number,
  detections: DetectionLike[],
): Promise<{ saved: number; negative: boolean }> {
  const res = await fetch(`${base()}/api/clips/${encodeURIComponent(name)}/label`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId, index, detections }),
  });
  if (!res.ok) throw new Error('label save failed');
  return res.json();
}
