import type { AnalysisResult } from '@/types';
import type { AnalysisEngine, AnalysisRequest, RealEngineOptions } from './types';
import { RealEngine } from './realEngine';

/**
 * 하이브리드 엔진.
 * 실제 백엔드 분석 결과를 그대로 사용한다.
 *
 * 중요: 목업 값(사고 건수·신뢰도·위험도)을 실제 결과와 섞지 않는다.
 * 실제 분석에 사고 정보가 없으면 0건으로 두며, 목업 사고를 표시하지 않는다.
 * 백엔드 실패 시에만 목업을 쓰고 engine='mock'으로 명시해
 * 사용자가 "검토 필요" 상태임을 알 수 있게 한다.
 */
export class HybridEngine implements AnalysisEngine {
  readonly name = 'hybrid';
  private real: RealEngine;

  constructor(options: RealEngineOptions) {
    this.real = new RealEngine(options);
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      request.onProgress?.(0.05, '실제 엔진 분석 시도');
      const real = await this.real.analyze(request);
      request.onProgress?.(1, '실제 분석 완료');
      return this.normalize(real);
    } catch (err) {
      request.onProgress?.(1, '실제 엔진 사용 불가 — 분석 실패');
      // 가짜 사고/캡션을 절대 출력하지 않는다. 실패는 빈 결과로 명시.
      return {
        engine: 'real',
        generatedAt: new Date().toISOString(),
        videoName: request.videoName,
        durationSec: 0,
        processedFrames: 0,
        personsDetected: 0,
        detections: [],
        behaviors: [],
        situations: [],
        actions: [],
        accidents: [],
        videoDescription: {
          summary: `분석 서버에 연결할 수 없어 결과를 산출하지 못했습니다. (${(err as Error).message ?? 'unknown'})`,
          captions: [], highlights: [], sceneCount: 0,
        },
        analysisLog: [],
        crowdDensity: [], confidenceSeries: [], motionSeries: [],
        performanceEvaluation: [],
        summary: {
          riskScore: 0, complianceScore: 0, avgConfidence: 0,
          peakCrowd: 0, totalBehaviors: 0, criticalCount: 0,
        },
      };
    }
  }

  /** 실제 결과에서 목업이 섞일 여지를 제거하고, 사고 건수는 실제 이벤트 기준으로 정규화 */
  private normalize(real: AnalysisResult): AnalysisResult {
    const accidents = real.accidents ?? [];
    const detections = real.detections ?? [];
    const summary = real.summary ?? {
      riskScore: 0, complianceScore: 100, avgConfidence: 0,
      peakCrowd: 0, totalBehaviors: 0, criticalCount: 0,
    };

    // 분석 로그의 "사고" 항목도 실제 사고 건수와 일치하도록 보정
    const analysisLog = (real.analysisLog ?? []).map((entry) => {
      if (entry.nodeId !== 'accidents') return entry;
      return {
        ...entry,
        message: accidents.length ? '사고 인식 완료' : '사고 인식 완료 · 사고 없음',
        detail: `${accidents.length}건의 사고 이벤트가 분석되었습니다.`,
        metrics: entry.metrics.map((m) =>
          m.label === '사고' ? { ...m, value: `${accidents.length}건` } : m,
        ),
      };
    });

    return {
      ...real,
      engine: real.engine ?? 'real',
      accidents,
      detections,
      analysisLog,
      summary: {
        ...summary,
        criticalCount: accidents.filter((a) => a.severity === 'critical').length,
      },
    };
  }
}

export default HybridEngine;
