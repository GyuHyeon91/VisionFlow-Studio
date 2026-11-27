import { useEffect, useState, type RefObject } from 'react';
import { backendBaseUrl } from '@/config';
import { LiveTracker, type LiveBox } from '@/analysis/liveTracker';
import { RemoteDetector } from '@/analysis/remoteDetector';
import { useStore } from '@/store/useStore';

/** 재생 중인 영상에 실시간 형상 추적을 연결하는 훅 (YOLO 원격 감지 → 로컬 폴백) */
export function useLiveTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  sensitivity = 0.7,
  threshold = 0.45,
): LiveBox[] {
  const [boxes, setBoxes] = useState<LiveBox[]>([]);
  const [remoteFailed, setRemoteFailed] = useState(false);

  const config = useStore((s) => s.config);
  const useRemote = config.options.analysisEngine.value !== 'mock'
    && config.options.backend.value !== 'none';

  useEffect(() => {
    if (!enabled || !videoRef.current) {
      setBoxes([]);
      return;
    }

    const liveConfig = useStore.getState().config;
    if (useRemote && !remoteFailed) {
      // 설정창에서 변경한 값을 실시간 추적에 즉시 반영한다.
      const fps = liveConfig.performance.fps.value;
      const intervalMs = Math.max(100, Math.min(350, Math.round(1000 / Math.min(fps, 10))));
      const detector = new RemoteDetector(
        videoRef.current,
        backendBaseUrl(),
        setBoxes,
        (items) => useStore.getState().setMeasurements(items),
        () => setRemoteFailed(true),
        threshold,
        intervalMs,
        (ms) => useStore.getState().setDetectionLatency(ms),
        liveConfig.detection.classFilter.value,
        liveConfig.preprocessing.nmsIoU.value,
      );
      // 사용자가 오탐 신고한 영역을 불러와 즉시 차단
      void fetch(`${backendBaseUrl()}/api/feedback/zones`)
        .then((r) => r.json())
        .then((j: { zones?: Array<{ bbox: { x: number; y: number; w: number; h: number } }> }) => {
          detector.setBlockedZones((j.zones ?? []).map((z) => z.bbox));
        })
        .catch(() => {});
      detector.start();
      // 감지 주기(약 100~350ms)와 무관하게 RAF(약 60fps)로 위치를 예측 갱신해
      // 빠르게 움직이는 객체도 박스가 뒤처지지 않게 한다.
      let raf = 0;
      const tick = () => {
        const video = videoRef.current;
        if (video) setBoxes(detector.getPredictedBoxes(video.currentTime));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(raf);
        detector.stop();
      };
    }

    // 원격 서버가 없거나 실패하면 프레임 차분 기반 로컬 추적기 사용
    const tracker = new LiveTracker(videoRef.current, setBoxes, sensitivity);
    tracker.start();
    return () => tracker.stop();
  }, [videoRef, enabled, sensitivity, threshold, useRemote, remoteFailed]);

  return boxes;
}
