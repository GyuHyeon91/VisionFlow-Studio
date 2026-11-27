import { analyzeBrowserVideo } from '@/analysis/browserVideoAnalyzer';
import { generateMockResult } from '@/data/mockData';
import type { AnalysisEngine, AnalysisRequest } from './types';

const STAGES = [
  '영상 프레임 로딩',
  '픽셀 신호 추출',
  '형상 검출 및 추적',
  '행동 인식',
  '상황 판단',
  '조치 권고 생성',
];
/** 각 단계를 파이프라인 노드 ID에 매핑 */
const STAGE_NODES = ['decode', 'signals', 'track', 'behavior', 'situation', 'action'];

/** 브라우저 내부 분석 엔진 (백엔드 불필요) */
export class MockEngine implements AnalysisEngine {
  readonly name = 'mock';

  async analyze({ videoName, videoUrl, config, onProgress, signal }: AnalysisRequest) {
    // 업로드된 영상이 있으면 실제 프레임을 분석해 신호를 추출한다.
    const timings: Record<string, number> = {};
    let signals: Awaited<ReturnType<typeof analyzeBrowserVideo>> | undefined;
    if (videoUrl) {
      try {
        const t0 = performance.now();
        signals = await analyzeBrowserVideo(videoUrl, config, (p, stage) => {
          onProgress?.(p * 0.85, stage);
        }, signal);
        timings.signals = Math.round(performance.now() - t0);
        timings.track = Math.round((performance.now() - t0) * 0.3);
      } catch (err) {
        if ((err as Error).name === 'AbortError') throw err;
        // 영상 디코딩 실패 시 목업 데이터로 폴백
      }
    }

    const total = STAGES.length;
    for (let i = 0; i < total; i += 1) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      onProgress?.(0.85 + ((i + 1) / total) * 0.15, STAGES[i]);
      const t0 = performance.now();
      const base = 90;
      const fpsFactor = 15 / Math.max(config.performance.fps.value, 1);
      await new Promise<void>((resolve) => setTimeout(resolve, base * fpsFactor));
      const node = STAGE_NODES[i];
      timings[node] = Math.round(performance.now() - t0);
    }

    const tGen = performance.now();
    const result = generateMockResult(videoName, config);
    // 목업이 만든 가짜 사고/캡션을 제거 — 실제 영상 신호가 있으면 사고 0건으로 시작
    result.accidents = [];
    result.situations = [];
    result.actions = [];
    result.videoDescription = {
      summary: signals ? '브라우저에서 샘플링한 실제 영상 신호 기반 분석입니다. 사고 판정은 서버 분석에서 수행됩니다.' : '영상 신호를 추출하지 못했습니다.',
      captions: signals ? signals.motion.map((m, i) => ({
        id: `cap-${i}`,
        timestamp: m.t,
        endTime: (signals.motion[i + 1]?.t ?? m.t + 2),
        text: `${m.t}초 구역 모션 강도 ${m.value}%`,
        tags: [`모션 ${m.value}%`],
      })) : [],
      highlights: [],
      sceneCount: signals?.motion.length ?? 0,
    };
    result.summary.criticalCount = 0;
    result.summary.riskScore = 0;
    result.summary.complianceScore = 100;
    const genMs = Math.round(performance.now() - tGen);
    timings.description = Math.round(genMs * 0.25);
    timings.performance = Math.round(genMs * 0.15);
    timings.report = Math.round(genMs * 0.6);
    result.engineTimings = timings;
    if (signals) {
      result.videoSignals = signals;
      result.durationSec = signals.durationSec;
      result.processedFrames = signals.sampledFrames;
      result.motionSeries = signals.motion;
      // 실제로 추적된 형상만 감지 결과로 사용 (임의의 Box를 표시하지 않음)
      result.personsDetected = signals.tracks.length;
      result.detections = signals.tracks.map((track, i) => {
        const point = track.points[track.points.length - 1];
        return {
          id: `trk-${track.id}`,
          trackId: i + 1,
          confidence: point.confidence,
          bbox: { x: point.x, y: point.y, w: point.w, h: point.h },
          pose: 'moving',
        };
      });
      result.summary.riskScore = Math.max(0, Math.min(100, result.summary.riskScore + signals.sceneChanges.length * 4));
    } else if (videoUrl) {
      // 영상 디코딩 실패 시 무작위 Box를 숨기고 폴백 상태로 표시
      result.personsDetected = 0;
      result.detections = [];
      result.videoSignals = {
        durationSec: result.durationSec,
        sampledFrames: 0,
        effectiveFps: 0,
        frameWidth: 160,
        frameHeight: 90,
        brightness: [],
        motion: result.motionSeries,
        edgeDensity: [],
        sceneChanges: [],
        thumbnails: [],
        tracks: [],
        source: 'fallback',
      };
    }
    return result;
  }
}

export default MockEngine;
