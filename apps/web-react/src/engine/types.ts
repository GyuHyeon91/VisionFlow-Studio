import type { AnalysisResult, AppConfig } from '@/types';

export interface AnalysisRequest {
  videoName: string;
  videoUrl?: string;
  config: AppConfig;
  onProgress?: (progress: number, stage: string) => void;
  signal?: AbortSignal;
}

/**
 * 모든 분석 엔진이 구현해야 하는 공통 계약.
 * 옵션 분석: mock / real / hybrid 중 하나를.factory가 선택한다.
 */
export interface AnalysisEngine {
  readonly name: string;
  analyze(request: AnalysisRequest): Promise<AnalysisResult>;
}

export interface RealEngineOptions {
  baseUrl: string;
  timeoutMs?: number;
}
