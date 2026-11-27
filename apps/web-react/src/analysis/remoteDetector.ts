import type { LiveBox } from './liveTracker';
import { estimateGlobalShift } from './motionCompensation';
import type { ObjectMeasurement } from '@/types';

function iou(a: Detection['bbox'], b: Detection['bbox']): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = a.w * a.h;
  const areaB = b.w * b.h;
  return inter / Math.max(1, areaA + areaB - inter);
}

interface Detection {
  label: string;
  labelKo: string;
  kind: 'person' | 'vehicle' | 'object';
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

/**
 * 재생 중 프레임을 FastAPI YOLO 서버로 전송해 실제 객체 감지를 수행한다.
 * 서버 응답을 LiveBox 형태로 변환하고 프레임 간 최근접 매칭으로 트랙 ID를 유지한다.
 */
export class RemoteDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private timer: ReturnType<typeof setInterval> | null = null;
  private effectiveInterval: number;
  private busy = false;
  private seq = 0;
  private tracks = new Map<string, { x: number; y: number; t: number; seen: number }>();
  /** 마지막 감지 결과와 프레임 캡처 시점 — 프레임 단위 예측에 사용 */
  private lastBoxes: LiveBox[] = [];
  /** 칼만 필터: 트랙별 위치·속도·공분산 (상수 속도 모델) */
  private kalman = new Map<string, {
    x: number; y: number; vx: number; vy: number;
    px: number; py: number; pvx: number; pvy: number; t: number;
  }>();
  private capturedAt = 0;
  private stopped = false;
  private failed = false;
  private prevFrame: Float32Array | null = null;
  private pausedSampled = false;
  private lastPausedTime = -1;
  private blockedZones: Array<{ x: number; y: number; w: number; h: number }> = [];

  constructor(
    private video: HTMLVideoElement,
    private baseUrl: string,
    private onUpdate: (boxes: LiveBox[]) => void,
    private onMeasure?: (items: ObjectMeasurement[]) => void,
    private onError?: () => void,
    private threshold = 0.5,
    private intervalMs = 220,
    private onLatency?: (ms: number) => void,
    private classFilter: 'all' | 'person_vehicle' | 'person_only' = 'all',
    private nmsIoU = 0.45,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.ctx = this.canvas.getContext('2d')!;
    this.effectiveInterval = intervalMs;
  }

  start() {
    // 감지는 이 주기로 수행하고, 화면은 RAF에서 프레임 단위로 예측 갱신한다.
    this.timer = setInterval(() => void this.sample(), this.effectiveInterval);
    void this.sample();
  }

  /** 샘플링 주기는 고정 유지 — 지연이 있어도 busy 플래그가 요청 적체를 막는다. */
  private retune(_latency: number) {
    return;
  }

  /**
   * 현재 영상 시점 기준으로 예측된 Box를 반환한다.
   * 감지 결과가 나온 뒤 응답 지연만큼 객체가 이동하므로 속도로 보상하고,
   * 다음 감지 결과가 오면 실제 위치로 즉시 수렴한다.
   */
  getPredictedBoxes(now: number): LiveBox[] {
    if (!this.lastBoxes.length) return [];
    const dt = this.kalman.size
      ? Math.max(0, Math.min(0.4, now - this.capturedAt))
      : 0;
    return this.lastBoxes.map((b) => {
      const k = this.kalman.get(b.id);
      if (!k || dt <= 0) return b;
      // 칼만 상태 예측: x' = x + v*dt, 공분산도 함께 증가
      const px = k.x + k.vx * dt;
      const py = k.y + k.vy * dt;
      // 예측 위치와 마지막 감지 위치의 차이 (과도한 외삽 제한)
      const maxShiftX = Math.max(2, b.w * 0.4);
      const maxShiftY = Math.max(2, b.h * 0.4);
      const dx = Math.max(-maxShiftX, Math.min(maxShiftX, px - k.x));
      const dy = Math.max(-maxShiftY, Math.min(maxShiftY, py - k.y));
      return { ...b, x: b.x + dx, y: b.y + dy };
    });
  }

  /** 칼만 필터 업데이트 — 측정값으로 상태와 공분산을 보정 */
  private updateKalman(id: string, x: number, y: number, t: number) {
    const k = this.kalman.get(id);
    if (!k) {
      this.kalman.set(id, { x, y, vx: 0, vy: 0, px: 1, py: 1, pvx: 4, pvy: 4, t });
      return;
    }
    const dt = Math.max(0.05, t - k.t);
    // 예측
    let ex = k.x + k.vx * dt;
    let ey = k.y + k.vy * dt;
    let epx = k.px + dt * (2 * k.pvx) + dt * dt * 0.5;
    let epy = k.py + dt * (2 * k.pvy) + dt * dt * 0.5;
    epx += 0.2; epy += 0.2; // 과정 노이즈
    // 칼만 게인
    const kx = epx / (epx + 1.0);
    const ky = epy / (epy + 1.0);
    const vx = k.vx + kx * ((x - ex) / dt);
    const vy = k.vy + ky * ((y - ey) / dt);
    const nx = ex + kx * (x - ex);
    const ny = ey + ky * (y - ey);
    this.kalman.set(id, {
      x: nx, y: ny, vx, vy,
      px: (1 - kx) * epx, py: (1 - ky) * epy,
      pvx: (1 - kx) * k.pvx, pvy: (1 - ky) * k.pvy,
      t,
    });
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.onUpdate([]);
  }

  get hasFailed() {
    return this.failed;
  }

  /** 사용자가 오탐 신고한 영역을 설정 (해당 영역과 겹치는 감지를 숨김) */
  setBlockedZones(zones: Array<{ x: number; y: number; w: number; h: number }>) {
    this.blockedZones = zones;
  }

  private isBlocked(det: Detection): boolean {
    // 신고 영역과 감지 박스가 어느 정도 겹치면 차단 (위치가 조금씩 달라도 잡히도록)
    return this.blockedZones.some((z) => {
      const overlap = iou(z, det.bbox);
      const cz = { x: z.x + z.w / 2, y: z.y + z.h / 2 };
      const cd = { x: det.bbox.x + det.bbox.w / 2, y: det.bbox.y + det.bbox.h / 2 };
      const centerDist = Math.hypot(cz.x - cd.x, cz.y - cd.y);
      return overlap > 0.12 || centerDist < 8;
    });
  }

  private async sample() {
    if (this.stopped || this.busy || this.failed) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    const video = this.video;
    if (video.readyState < 2 || video.videoWidth === 0) return;
    // 일시정지 상태에서는 같은 프레임을 반복 전송하지 않고 한 번만 분석
    if (video.paused) {
      if (this.pausedSampled && this.lastPausedTime === video.currentTime) return;
      this.pausedSampled = true;
      this.lastPausedTime = video.currentTime;
    } else {
      this.pausedSampled = false;
    }
    this.busy = true;
    // 응답이 돌아온 뒤의 currentTime이 아니라, 프레임을 실제로 캡처한 시점을 기록한다.
    const capturedAt = video.currentTime;
    try {
      // 원본 비율을 유지하도록 캔버스 크기를 맞춘다 (세로 영상을 16:9로 늘리면 좌표가 틀어짐)
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const targetW = 640;
      const targetH = Math.max(1, Math.round((vh / vw) * targetW));
      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
      }
      this.ctx.drawImage(video, 0, 0, targetW, targetH);
      // 흔들림 보정: 프레임 간 전역 이동을 추정해 트랙 매칭 오차를 줄인다.
      const w = this.canvas.width;
      const h = this.canvas.height;
      const pixels = this.ctx.getImageData(0, 0, w, h).data;
      const luma = new Float32Array(w * h);
      for (let p = 0; p < w * h; p += 1) {
        const i = p * 4;
        luma[p] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      }
      let shakeX = 0;
      let shakeY = 0;
      if (this.prevFrame) {
        const shift = estimateGlobalShift(this.prevFrame, luma, w, h);
        shakeX = (shift.dx / w) * 100;
        shakeY = (shift.dy / h) * 100;
      }
      this.prevFrame = luma;

      // JPEG 품질이 낮으면 원거리·소형 객체가 압축 노이즈로 사라진다 (0.5 → 0.85)
      const blob = await new Promise<Blob | null>((resolve) =>
        this.canvas.toBlob(resolve, 'image/jpeg', 0.85),
      );
      if (!blob) return;
      const form = new FormData();
      form.append('file', blob, 'frame.jpg');
      form.append('threshold', String(this.threshold));
      // 실시간 추적에서는 깊이 추론을 생략해 응답 지연을 줄인다.
      form.append('depth', 'false');
      const t0 = performance.now();
      const res = await fetch(`${this.baseUrl}/api/measure-frame`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`measure failed: ${res.status}`);
      const data = (await res.json()) as { measurements: ObjectMeasurement[]; depthUsed: boolean };
      const latency = performance.now() - t0;
      this.onLatency?.(latency);
      this.retune(latency);
      // 추론 지연이 길어도 같은 트랙으로 이어지도록 매칭 창을 동적으로 확장
      const matchWindowSec = Math.max(0.8, Math.min(2.0, (latency / 1000) * 2 + 0.4));
      const detections: Detection[] = (data.measurements ?? []).map((m) => ({
        label: m.label,
        labelKo: m.label,
        kind: m.kind,
        confidence: m.confidence,
        bbox: m.bbox,
      }));
      this.onMeasure?.(data.measurements ?? []);
      // 매칭·예측 기준 시점을 캡처 시점으로 고정 (응답 지연으로 인한 뒤처짐 제거)
      const t = capturedAt;
      this.capturedAt = t;
      const frameBoxes = new Map<string, LiveBox>();
      const accepted: Detection[] = [];

      // 사람/차량을 구분해 필터링
      const classFilter = this.classFilter;
      const isPerson = (d: Detection) =>
        d.kind === 'person' || d.label.includes('사람') || d.label.includes('작업자');
      const candidates = detections
        .filter((d) => !this.isBlocked(d))
        .filter((d) => classFilter === 'all' ? true
          : classFilter === 'person_only' ? isPerson(d)
            : d.kind !== 'object')
        .filter((d) => {
          const area = (d.bbox.w * d.bbox.h) / 100; // 화면 면적 %
          if (isPerson(d)) {
            // 사람: 낮은 신뢰도도 허용해 인원 누락 방지, 단 너무 작은 노이즈는 제거
            return d.confidence >= Math.max(0.25, this.threshold - 0.15)
              && area >= 0.15 && area <= 45;
          }
          // 차량/중장비: 화면 22% 초과 박스는 배경 오탐(잔해·붕괴 현장)으로 제거
          return d.confidence >= this.threshold && area >= 0.5 && area <= 22;
        })
        .sort((a: Detection, b: Detection) => b.confidence - a.confidence);

      // 사람은 여러 명 허용. 차량/중장비는 같은 클래스 중복만 제거.
      const usedVehicleLabels = new Set<string>();
      for (const det of candidates) {
        if (!isPerson(det) && usedVehicleLabels.has(det.label)) continue;
        if (accepted.some((a) => iou(a.bbox, det.bbox) > this.nmsIoU)) continue;
        if (accepted.length >= 16) break;
        if (!isPerson(det)) usedVehicleLabels.add(det.label);
        accepted.push(det);

        const cx = det.bbox.x + det.bbox.w / 2;
        const cy = det.bbox.y + det.bbox.h / 2;
        let bestId: string | undefined;
        let bestDist = Infinity;
        for (const [id, last] of this.tracks) {
          if (t - last.t > matchWindowSec) continue;
          const k = this.kalman.get(id);
          if (k) {
            // 칼만 예측 위치 기준으로 매칭 (프레임 간 지연 보상)
            const dt = Math.max(0, Math.min(0.4, t - k.t));
            const px = k.x + k.vx * dt;
            const py = k.y + k.vy * dt;
            const dist = Math.hypot(px + shakeX - cx, py + shakeY - cy);
            if (dist < bestDist) { bestId = id; bestDist = dist; }
          } else {
            const dist = Math.hypot(last.x + shakeX - cx, last.y + shakeY - cy);
            if (dist < bestDist) { bestId = id; bestDist = dist; }
          }
        }
        if (!bestId || bestDist > 14) {
          this.seq += 1;
          bestId = `Y${this.seq}`;
        }
        const last = this.tracks.get(bestId);
        const seen = last && t - last.t <= matchWindowSec ? last.seen + 1 : 1;
        // 칼만 필터 업데이트 (속도/방향 부드럽게 추정)
        this.updateKalman(bestId, cx, cy, t);
        this.tracks.set(bestId, { x: cx, y: cy, t, seen });

        // 신뢰도가 높으면 즉시 표시, 애매한 후보만 2프레임 연속 감지 요구
        if (seen < 2 && det.confidence < 0.7) continue;
        frameBoxes.set(bestId, {
          id: bestId,
          label: det.labelKo || det.label,
          kind: det.kind,
          x: det.bbox.x,
          y: det.bbox.y,
          w: det.bbox.w,
          h: det.bbox.h,
          confidence: det.confidence,
          t,
        });
      }
      // 사라진 트랙 정리
      for (const [id, last] of this.tracks) {
        if (t - last.t > matchWindowSec * 1.5) {
          this.tracks.delete(id);
          this.kalman.delete(id);
        }
      }
      this.lastBoxes = [...frameBoxes.values()];
      this.onUpdate(this.getPredictedBoxes(video.currentTime));
    } catch {
      this.failed = true;
      this.onError?.();
    } finally {
      this.busy = false;
    }
  }
}
