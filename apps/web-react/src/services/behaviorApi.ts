import { backendBaseUrl } from '@/config';
import type { BehaviorEvent } from '@/types';

/** 재생 중 프레임을 캡처해 YOLO Pose 기반 행동을 인식한다 */
export async function detectBehaviors(videoUrl: string, threshold = 0.5): Promise<BehaviorEvent[]> {
  const video = document.createElement('video');
  video.muted = true;
  video.src = videoUrl;
  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error('video load failed'));
  });
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.6));
  if (!blob) throw new Error('capture failed');

  const form = new FormData();
  form.append('file', blob, 'behavior_frame.jpg');
  form.append('threshold', String(threshold));
  const res = await fetch(`${backendBaseUrl()}/api/behavior/frame`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('behavior detect failed');
  const data = (await res.json()) as { behaviors: BehaviorEvent[] };
  return data.behaviors ?? [];
}
