import { classifyRegion, findBlobs, type BlobRegion } from './browserVideoAnalyzer';
import { alignFrame, estimateGlobalShift } from './motionCompensation';

export interface LiveBox {
  id: string;
  /** 화면에 표시할 클래스명 (예: 자동차, 사람, 버스) */
  label: string;
  kind: 'person' | 'vehicle' | 'object';
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
  t: number;
}

interface LiveTrack {
  id: string;
  kind: 'person' | 'vehicle' | 'object';
  lastT: number;
  cx: number;
  cy: number;
}

const W = 160;
const H = 90;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * 재생 중인 <video>에서 프레임을 직접 읽어 실시간으로 움직이는 형상을 추적한다.
 * 분석 완료를 기다리지 않으며, 재생 시점마다 BBox를 콜백으로 전달한다.
 */
export class LiveTracker {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  /** 정적 배경 모델(움직이지 않는 벽·건물은 제거하기 위해 사용) */
  private background: Float32Array | null = null;
  private prevFrame: Float32Array | null = null;
  private tracks: LiveTrack[] = [];
  private seq = 0;
  private lastSample = 0;
  private rafId: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private stopped = false;

  constructor(
    private video: HTMLVideoElement,
    private onUpdate: (boxes: LiveBox[]) => void,
    private sensitivity = 0.7,
    private sampleIntervalMs = 90,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  start() {
    const supportsFrameCallback = typeof (this.video as any).requestVideoFrameCallback === 'function';
    if (supportsFrameCallback) {
      const cb = (now: number) => {
        if (this.stopped) return;
        if (now - this.lastSample >= this.sampleIntervalMs) {
          this.lastSample = now;
          this.sample();
        }
        this.rafId = (this.video as any).requestVideoFrameCallback(cb);
      };
      this.rafId = (this.video as any).requestVideoFrameCallback(cb);
    } else {
      this.timer = setInterval(() => this.sample(), this.sampleIntervalMs);
    }
  }

  stop() {
    this.stopped = true;
    if (this.rafId !== null && typeof (this.video as any).cancelVideoFrameCallback === 'function') {
      (this.video as any).cancelVideoFrameCallback(this.rafId);
    }
    if (this.timer) clearInterval(this.timer);
    this.onUpdate([]);
  }

  private sample() {
    const video = this.video;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (video.readyState < 2 || video.videoWidth === 0) return;
    this.ctx.drawImage(video, 0, 0, W, H);
    const image = this.ctx.getImageData(0, 0, W, H).data;
    const luma = new Float32Array(W * H);
    for (let p = 0; p < W * H; p += 1) {
      const i = p * 4;
      luma[p] = 0.299 * image[i] + 0.587 * image[i + 1] + 0.114 * image[i + 2];
    }

    // 카메라 흔들림 보정: 이전 프레임 대비 전역 이동량을 추정해 현재 프레임을 되민다.
    let aligned: Float32Array = luma;
    if (this.prevFrame) {
      const { dx, dy } = estimateGlobalShift(this.prevFrame, luma, W, H);
      if (Math.abs(dx) <= 12 && Math.abs(dy) <= 12) aligned = alignFrame(luma, dx, dy, W, H);
    }
    this.prevFrame = luma;

    if (this.background) {
      // 배경 차분: 정적 벽/건물은 배경으로 학습되고 움직이는 차량·인물만 남는다.
      const threshold = 26 + (1 - this.sensitivity) * 18;
      const minArea = Math.max(70, Math.round(160 * (1 - this.sensitivity)));
      const mask = new Uint8Array(W * H);
      let changed = 0;
      for (let p = 0; p < W * H; p += 1) {
        if (Math.abs(aligned[p] - this.background[p]) > threshold) {
          mask[p] = 1;
          changed += 1;
        }
        // 배경을 아주 천천히 갱신해 조명 변화에 적응하되 움직이는 물체는 흡수하지 않음
        this.background[p] = this.background[p] * 0.985 + aligned[p] * 0.015;
      }
      // 화면 대부분이 바뀌면 장면 전환으로 보고 무시
      const blobs = changed / mask.length > 0.6 ? [] : findBlobs(mask, W, H, minArea);
      const t = video.currentTime;
      const boxMap = new Map<string, { box: LiveBox; area: number }>();

      for (const blob of blobs as BlobRegion[]) {
        const cx = (blob.cx / W) * 100;
        const cy = (blob.cy / H) * 100;
        let best: LiveTrack | undefined;
        let bestDist = Infinity;
        for (const track of this.tracks) {
          const d = Math.hypot(track.cx - cx, track.cy - cy);
          if (d < bestDist && t - track.lastT < 2) { best = track; bestDist = d; }
        }
        if (best && bestDist > 16) continue;
        if (!best) {
          if (this.tracks.length >= 5 || blob.area < minArea * 1.5) continue;
          this.seq += 1;
          best = { id: `L${this.seq}`, kind: classifyRegion(blob), lastT: t, cx, cy };
          this.tracks.push(best);
        }
        best.cx = best.cx * 0.4 + cx * 0.6;
        best.cy = best.cy * 0.4 + cy * 0.6;
        best.lastT = t;
        const box: LiveBox = {
          id: best.id,
          label: best.kind === 'vehicle' ? '자동차' : best.kind === 'person' ? '사람' : '객체',
          kind: best.kind,
          x: clamp((blob.x / W) * 100, 0, 100),
          y: clamp((blob.y / H) * 100, 0, 100),
          w: clamp((blob.w / W) * 100, 1, 100),
          h: clamp((blob.h / H) * 100, 1, 100),
          confidence: clamp(0.55 + (blob.area / (W * H)) * 4, 0.55, 0.99),
          t,
        };
        const existing = boxMap.get(best.id);
        if (!existing || blob.area > existing.area) boxMap.set(best.id, { box, area: blob.area });
      }
      this.tracks = this.tracks.filter((track) => t - track.lastT < 2);
      this.onUpdate(
        [...boxMap.values()]
          .sort((a, b) => b.area - a.area)
          .slice(0, 5)
          .map((v) => v.box),
      );
    }
    if (!this.background) this.background = luma.slice();
  }
}
