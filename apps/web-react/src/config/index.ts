import rawConfig from '../../../../configs/app.config.json';
import type { AppConfig } from '@/types';

/**
 * 중앙 설정 로더 (프로젝트 내부 설정만 참조 — 외부 프로젝트와 공유하지 않음).
 * configs/app.config.json 이 단일 진실 공급원(SSOT)입니다.
 */
export const appConfig = rawConfig as unknown as AppConfig;

export function getConfigValue<T>(group: Record<string, any>, fallback: T): T {
  return (group?.value ?? fallback) as T;
}

/** 선택된 백엔드 옵션에 맞는 이 프로젝트 전용 URL */
export const backendBaseUrl = (): string => {
  const backend = appConfig.options.backend.value;
  const port = backend === 'express'
    ? appConfig.ports.express
    : appConfig.ports.fastapi;
  // localhost는 IPv6(::1) 해석 지연이 있어 127.0.0.1 사용
  return `http://127.0.0.1:${port}`;
};

export const ownPorts = appConfig.ports;

export default appConfig;
