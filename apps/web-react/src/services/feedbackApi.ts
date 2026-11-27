import { backendBaseUrl } from '@/config';

/** 화면에서 잘못 탐지된 BBox를 신고해 네거티브 학습 데이터로 저장 */
export async function reportFalsePositive(
  canvas: HTMLCanvasElement,
  label: string,
  confidence: number,
  bbox: { x: number; y: number; w: number; h: number },
): Promise<{ saved: boolean }> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  );
  if (!blob) throw new Error('frame capture failed');
  const form = new FormData();
  form.append('file', blob, 'false_positive.jpg');
  form.append('label', label);
  form.append('confidence', String(confidence));
  form.append('bbox', JSON.stringify(bbox));
  const r = await fetch(`${backendBaseUrl()}/api/feedback/false-positive`, { method: 'POST', body: form });
  if (!r.ok) throw new Error('feedback failed');
  return r.json();
}
