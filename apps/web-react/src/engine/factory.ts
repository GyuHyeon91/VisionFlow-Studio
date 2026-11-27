import appConfig, { backendBaseUrl } from '@/config';
import type { EngineChoice } from '@/types';
import type { AnalysisEngine, RealEngineOptions } from './types';
import { MockEngine } from './mockEngine';
import { RealEngine } from './realEngine';
import { HybridEngine } from './hybridEngine';

/**
 * 엔진 팩토리.
 * configs/app.config.json 의 options.analysisEngine.value 옵션으로 엔진을 선택한다.
 */
export function createEngine(
  choice: EngineChoice = appConfig.options.analysisEngine.value,
): AnalysisEngine {
  const backendOptions: RealEngineOptions = {
    baseUrl: backendBaseUrl(),
    timeoutMs: 120000,
  };

  switch (choice) {
    case 'real':
      return new RealEngine(backendOptions);
    case 'hybrid':
      return new HybridEngine(backendOptions);
    case 'mock':
    default:
      return new MockEngine();
  }
}

export const ENGINE_LABELS: Record<EngineChoice, string> = {
  mock: 'Mock',
  real: '실제 CV',
  hybrid: '하이브리드',
};

export default createEngine;
