import type { AppConfig, FrameMetric, TrackedShape, VideoSignalMetrics } from '@/types';

export interface BlobRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  area: number;
}

/**
 * 차분 마스크의 노이즈를 제거하고 유효한 형상 영역만 반환한다.
 * - 전체 화면이 바뀐 경우(카메라 흔들림/장면 전환)는 추적하지 않음
 * - 3×3 다수결 필터로 작은 점 노이즈 제거
 * - 너무 크거나 작은 영역 제외
 */
export function prepareBlobs(
  mask: Uint8Array,
  width: number,
  height: number,
  minArea: number,
): BlobRegion[] {
  let changed = 0;
  for (let i = 0; i < mask.length; i += 1) if (mask[i]) changed += 1;
  // 장면 전환/카메라 흔들림으로 화면 대부분이 바뀐 경우에만 제외
  if (changed / mask.length > 0.55) return [];

  const cleaned = new Uint8Array(mask.length);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const p = y * width + x;
      let count = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (mask[p + dy * width + dx]) count += 1;
        }
      }
      if (count >= 3) cleaned[p] = 1;
    }
  }
  const maxArea = mask.length * 0.35;
  return findBlobs(cleaned, width, height, minArea).filter(
    (b) => b.area <= maxArea && b.w <= width * 0.6 && b.h <= height * 0.8,
  );
}

/** 영역의 종횡비·면적으로 인물/차량/일반 객체를 분류 (휴리스틱) */
export function classifyRegion(region: { w: number; h: number; area: number }): 'person' | 'vehicle' | 'object' {
  const ratio = region.w / Math.max(region.h, 1);
  if (ratio < 0.85 && region.area < 6000) return 'person';
  if (ratio > 1.3 && region.area > 100) return 'vehicle';
  return 'object';
}

/** 프레임 차분 마스크에서 연결 요소(움직이는 형상)를 추출한다 */
export function findBlobs(mask: Uint8Array, width: number, height: number, minArea: number): BlobRegion[] {
  const visited = new Uint8Array(mask.length);
  const blobs: BlobRegion[] = [];
  const stack: number[] = [];

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    stack.length = 0;
    stack.push(start);
    visited[start] = 1;
    let count = 0;
    let minX = width; let minY = height; let maxX = 0; let maxY = 0;
    let sumX = 0; let sumY = 0;

    while (stack.length) {
      const p = stack.pop()!;
      const x = p % width;
      const y = Math.floor(p / width);
      count += 1;
      sumX += x; sumY += y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      const neighbors = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && mask[n] && !visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }

    if (count >= minArea) {
      blobs.push({
        x: minX, y: minY,
        w: Math.max(1, maxX - minX + 1),
        h: Math.max(1, maxY - minY + 1),
        cx: sumX / count,
        cy: sumY / count,
        area: count,
      });
    }
  }
  return blobs
    // 프레임 경계에 닿은 노이즈 영역은 제외
    .filter((b) => b.x > 1 && b.y > 1 && b.x + b.w < width - 1 && b.y + b.h < height - 1)
    .sort((a, b) => b.area - a.area)
    .slice(0, 6);
}

/**
 * 업로드된 영상을 브라우저에서 실제로 읽어 프레임 신호를 추출한다.
 * - 프레임 샘플링 + 픽셀 차분으로 모션/장면전환 계산
 * - 밝기(luma)와 엣지 밀도 계산
 * - 타임라인 썸네일 생성
 * 외부 API 없이 동작하며, 실패 시 호출 측에서 목업으로 폴백한다.
 */

const W = 160;
const H = 90;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function waitFor(video: HTMLVideoElement, event: string, timeoutMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => { cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error(`video ${event} timeout`)); }, timeoutMs);
    const done = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error('video load error')); };
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener(event, done);
      video.removeEventListener('error', fail);
      signal?.removeEventListener('abort', onAbort);
    };
    video.addEventListener(event, done, { once: true });
    video.addEventListener('error', fail, { once: true });
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function analyzeBrowserVideo(
  url: string,
  config: AppConfig,
  onProgress?: (progress: number, stage: string) => void,
  signal?: AbortSignal,
): Promise<VideoSignalMetrics> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;

  try {
    onProgress?.(0.02, '영상 메타데이터 로드');
    await waitFor(video, 'loadedmetadata', 8000, signal);

    const rawDuration = Number.isFinite(video.duration) ? video.duration : 60;
    const durationSec = Math.max(1, Math.min(Math.round(rawDuration * 10) / 10, 120));
    const configuredFps = Math.min(config.performance.fps.value, 4);
    const sampleCount = Math.max(8, Math.min(Math.round(durationSec * configuredFps), 60));
    // 짧은 영상은 키프레임이 없어 seek가 실패할 수 있으므로 실시간 재생으로 샘플링한다.
    const playbackMode = durationSec <= 12;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('canvas 2d context unavailable');

    const brightnessRaw: number[] = [];
    const motionRaw: number[] = [];
    const edgeRaw: number[] = [];
    const times: number[] = [];
    const thumbnails: string[] = [];
    const tracks: TrackedShape[] = [];
    let trackSeq = 0;
    const sensitivity = config.accuracy.personDetectionSensitivity.value;
    // 노이즈(압축 아티팩트)를 형상으로 오인하지 않도록 임계값을 높인다.
    const diffThreshold = 24 + (1 - sensitivity) * 18;
    const minBlobArea = Math.max(60, Math.round(140 * (1 - sensitivity)));
    let prevLuma: Float32Array | null = null;

    for (let i = 0; i < sampleCount; i += 1) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const t = sampleCount === 1 ? 0 : (i / (sampleCount - 1)) * durationSec;
      if (playbackMode) {
        if (i === 0) await video.play();
        await new Promise<void>((resolve) => setTimeout(resolve, 1000 / configuredFps));
      } else {
        video.currentTime = Math.min(t, Math.max(0, durationSec - 0.05));
        await waitFor(video, 'seeked', 2500, signal);
      }
      ctx.drawImage(video, 0, 0, W, H);
      const image = ctx.getImageData(0, 0, W, H).data;

      const luma = new Float32Array(W * H);
      let sum = 0;
      let edgeSum = 0;
      for (let p = 0; p < W * H; p += 1) {
        const idx = p * 4;
        const l = 0.299 * image[idx] + 0.587 * image[idx + 1] + 0.114 * image[idx + 2];
        luma[p] = l;
        sum += l;
        if (p % W < W - 1) edgeSum += Math.abs(l - luma[p + 1]);
      }
      const avgLuma = sum / luma.length;
      brightnessRaw.push(Math.round((avgLuma / 255) * 1000) / 10);
      edgeRaw.push(Math.round((edgeSum / luma.length) * 10) / 10);

      if (prevLuma) {
        let diff = 0;
        const mask = new Uint8Array(W * H);
        for (let p = 0; p < luma.length; p += 1) {
          const d = Math.abs(luma[p] - prevLuma[p]);
          diff += d;
          if (d > diffThreshold) mask[p] = 1;
        }
        motionRaw.push(diff / luma.length);

        // 움직이는 형상을 연결 요소로 검출하고 최근접 거리로 트랙에 할당
        const blobs = prepareBlobs(mask, W, H, minBlobArea);
        for (const blob of blobs) {
          const cx = (blob.cx / W) * 100;
          const cy = (blob.cy / H) * 100;
          let best: TrackedShape | undefined;
          let bestDist = Infinity;
          for (const track of tracks) {
            const last = track.points[track.points.length - 1];
            if (!last || t - last.t > 2.5) continue;
            const d = Math.hypot(last.x + last.w / 2 - cx, last.y + last.h / 2 - cy);
            if (d < bestDist) { best = track; bestDist = d; }
          }
          // 기존 트랙과 너무 멀면 노이즈로 간주(단, 기존 트랙이 없을 때는 새 트랙 생성 허용)
          if (best && bestDist > 18) continue;
          if (!best) {
            if (tracks.length >= 10 || blob.area < minBlobArea * 1.5) continue;
            trackSeq += 1;
            best = {
              id: `T${trackSeq}`,
              label: `형상 T${trackSeq}`,
              kind: classifyRegion(blob),
              firstSeen: t,
              lastSeen: t,
              points: [],
              distance: 0,
            };
            tracks.push(best);
          }
          const prev = best.points[best.points.length - 1];
          const raw = {
            x: clamp((blob.x / W) * 100, 0, 100),
            y: clamp((blob.y / H) * 100, 0, 100),
            w: clamp((blob.w / W) * 100, 1, 100),
            h: clamp((blob.h / H) * 100, 1, 100),
          };
          // 위치 평활화로 프레임 간 떨림 제거
          const next = prev
            ? {
                x: prev.x * 0.45 + raw.x * 0.55,
                y: prev.y * 0.45 + raw.y * 0.55,
                w: prev.w * 0.6 + raw.w * 0.4,
                h: prev.h * 0.6 + raw.h * 0.4,
              }
            : raw;
          if (prev) best.distance += Math.hypot(next.x - prev.x, next.y - prev.y);
          best.lastSeen = t;
          best.points.push({
            t,
            ...next,
            confidence: clamp(0.55 + (blob.area / (W * H)) * 4, 0.55, 0.99),
          });
        }
      } else {
        motionRaw.push(0);
      }
      prevLuma = luma;
      times.push(Math.round(t * 10) / 10);

      // 썸네일은 최대 12장만 저장 (문서 크기/메모리 절약)
      if (i % Math.max(1, Math.floor(sampleCount / 12)) === 0 && thumbnails.length < 12) {
        thumbnails.push(canvas.toDataURL('image/jpeg', 0.45));
      }
      onProgress?.(0.05 + (i + 1) / sampleCount * 0.9, `영상 프레임 분석 ${i + 1}/${sampleCount}`);
    }

    const maxMotion = Math.max(...motionRaw, 0.001);
    const maxEdge = Math.max(...edgeRaw, 0.001);
    const motion: FrameMetric[] = times.map((t, i) => ({
      t,
      value: Math.round((motionRaw[i] / maxMotion) * 1000) / 10,
    }));
    const edgeDensity: FrameMetric[] = times.map((t, i) => ({
      t,
      value: Math.round((edgeRaw[i] / maxEdge) * 1000) / 10,
    }));
    const brightness: FrameMetric[] = times.map((t, i) => ({ t, value: brightnessRaw[i] }));
    const sceneChanges: number[] = [];
    for (let i = 1; i < motion.length; i += 1) {
      if (motion[i].value > 55 && motion[i].value > motion[i - 1].value * 1.5) sceneChanges.push(motion[i].t);
    }

    // 짧게 스쳐간 노이즈 트랙 제거 + 상위 트랙만 유지
    const tracked = tracks
      .filter((t) => t.points.length >= 3 && t.lastSeen - t.firstSeen >= 0.6)
      .sort((a, b) => b.points.length - a.points.length)
      .slice(0, 8)
      .map((t, i) => ({ ...t, id: `T${i + 1}`, label: `형상 T${i + 1}` }));

    onProgress?.(0.98, '영상 신호 분석 완료');
    return {
      durationSec,
      sampledFrames: sampleCount,
      effectiveFps: Math.round((sampleCount / durationSec) * 10) / 10,
      frameWidth: W,
      frameHeight: H,
      brightness,
      motion,
      edgeDensity,
      sceneChanges,
      thumbnails,
      tracks: tracked,
      source: 'browser-video',
    };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}
