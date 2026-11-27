import type { AnalysisResult } from '@/types';
import type { AnalysisEngine, AnalysisRequest, RealEngineOptions } from './types';

/**
 * 실제 백엔드 CV 서비스 호출 엔진.
 * 백엔드 옵션(fastapi / express)이 선택되었을 때 사용된다.
 * 엔진 자체는 HTTP 계약만 알고 있어 특정 백엔드 구현과 결합되지 않는다.
 */
export class RealEngine implements AnalysisEngine {
  readonly name = 'real';

  constructor(private options: RealEngineOptions) {}

  async analyze({ videoName, videoUrl, config, onProgress, signal }: AnalysisRequest): Promise<AnalysisResult> {
    onProgress?.(0.1, '백엔드 분석 요청 전송');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 120000);
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      const threshold = config.accuracy.confidenceThreshold.value;
      let response: Response;
      if (videoUrl) {
        // 업로드된 영상은 실제 파일로 전송해 YOLO 분석을 수행한다.
        const blob = await (await fetch(videoUrl)).blob();
        const form = new FormData();
        form.append('file', blob, videoName);
        form.append('threshold', String(threshold));
        response = await fetch(`${this.options.baseUrl}/api/analyze-video`, {
          method: 'POST',
          body: form,
          signal: controller.signal,
        });
      } else {
        response = await fetch(`${this.options.baseUrl}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoName,
            performance: config.performance,
            accuracy: config.accuracy,
          }),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        throw new Error(`분석 서버 오류: ${response.status} ${response.statusText}`);
      }

      onProgress?.(0.85, '결과 수신 중');
      const raw = await response.json() as Record<string, unknown>;
      // /api/analyze-video는 부분 결과를 반환한다. 사고는 실제 이벤트만 사용하고,
      // 누락된 필드는 0/빈 값으로 채운다 (임의 사고·신뢰도를 만들지 않는다).
      const accidentEvents = (raw.accidentEvents ?? []) as Array<{
        type: string; labelKo: string; severity: string; confidence: number;
        trackId?: string; trackIds?: string[]; evidence?: string[];
      }>;
      const accidents: AnalysisResult['accidents'] = (raw.accidents ?? (accidentEvents.length
        ? accidentEvents.map((e, i) => ({
            id: `accident-${i}`,
            timestamp: (raw.durationSec as number) ? (raw.durationSec as number) * i / Math.max(1, accidentEvents.length) : 0,
            endTime: (raw.durationSec as number) ?? 0,
            type: e.type,
            typeKo: e.labelKo,
            title: e.labelKo,
            description: (e.evidence ?? []).join(' · '),
            severity: (e.severity === 'critical' ? 'critical' : 'warning') as AnalysisResult['accidents'][number]['severity'],
            confidence: e.confidence,
            persons: [],
            zone: '',
            status: 'detected' as const,
            relatedBehaviorIds: [e.trackId ?? e.trackIds?.join(', ') ?? ''],
          }))
        : [])) as AnalysisResult['accidents'];
      const detections = (raw.detections ?? []) as AnalysisResult['detections'];
      // 서버 behaviors는 프레임 샘플({t, labelKo, trackId, confidence}) 형태이므로
      // UI가 기대하는 BehaviorEvent로 정규화한다. (누락 필드로 인한 렌더 오류 방지)
      const rawBehaviors = (raw.behaviors ?? []) as Array<Record<string, unknown>>;
      const behaviors: AnalysisResult['behaviors'] = rawBehaviors.map((b, i) => {
        const sev = String(b.severity ?? 'info');
        const severity = (['info', 'caution', 'warning', 'critical'].includes(sev)
          ? sev : 'info') as AnalysisResult['behaviors'][number]['severity'];
        return {
          id: String(b.id ?? `behavior-${i}`),
          timestamp: Number(b.timestamp ?? b.t ?? 0),
          trackId: Number(String(b.trackId ?? 0).replace(/^\D+/, '')) || 0,
          label: String(b.label ?? b.labelKo ?? 'behavior'),
          labelKo: String(b.labelKo ?? b.label ?? '행동'),
          category: String(b.category ?? '일반'),
          confidence: Number(b.confidence ?? 0),
          severity,
          durationSec: Number(b.durationSec ?? 0),
        };
      });
      const rawSummary = (raw.summary ?? {}) as Partial<AnalysisResult['summary']>;
      const behaviorEventCount = new Set(behaviors.map((b) => `${b.trackId}:${b.labelKo}`)).size;
      const result: AnalysisResult = {
        engine: (raw.engine as AnalysisResult['engine']) ?? 'real',
        generatedAt: (raw.generatedAt as string) ?? new Date().toISOString(),
        videoName: (raw.videoName as string) ?? videoName,
        durationSec: (raw.durationSec as number) ?? 0,
        processedFrames: (raw.processedFrames as number) ?? 0,
        personsDetected: (raw.personsDetected as number) ?? detections.filter((d) =>
          (d as unknown as { kind?: string }).kind === 'person'
          || (d as unknown as { pose?: string }).pose === 'person',
        ).length,
        detections,
        behaviors,
        situations: (raw.situations ?? []) as AnalysisResult['situations'],
        actions: (raw.actions ?? []) as AnalysisResult['actions'],
        accidents,
        videoDescription: (raw.videoDescription ?? {
          summary: '영상 분석 결과를 수신했습니다.',
          captions: [],
        }) as AnalysisResult['videoDescription'],
        videoSignals: raw.videoSignals as AnalysisResult['videoSignals'],
        analysisLog: (raw.analysisLog ?? []) as AnalysisResult['analysisLog'],
        crowdDensity: (raw.crowdDensity ?? []) as AnalysisResult['crowdDensity'],
        confidenceSeries: (raw.confidenceSeries ?? []) as AnalysisResult['confidenceSeries'],
        motionSeries: (raw.motionSeries ?? []) as AnalysisResult['motionSeries'],
        performanceEvaluation: (raw.performanceEvaluation ?? []) as AnalysisResult['performanceEvaluation'],
        engineTimings: raw.engineTimings as AnalysisResult['engineTimings'],
        summary: {
          riskScore: rawSummary.riskScore ?? 0,
          complianceScore: rawSummary.complianceScore ?? 100,
          avgConfidence: rawSummary.avgConfidence ?? 0,
          peakCrowd: rawSummary.peakCrowd ?? 0,
          totalBehaviors: Math.max(rawSummary.totalBehaviors ?? 0, behaviorEventCount),
          criticalCount: rawSummary.criticalCount ?? 0,
        },
      };
      onProgress?.(1, '완료');
      return result;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    }
  }
}

export default RealEngine;
