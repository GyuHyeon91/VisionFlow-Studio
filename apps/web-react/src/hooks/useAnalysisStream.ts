import { useEffect, useState } from 'react';
import { backendBaseUrl } from '@/config';

export interface StreamEvent {
  type: string;
  predictions?: Array<{
    id: string;
    label: string;
    current: number[];
    predicted: number[];
    speed: number;
    danger: boolean;
    horizonSec: number;
  }>;
  danger?: boolean;
  safetyEvents?: Array<{
    id: string;
    type: 'fall' | 'altercation' | 'fall_candidate';
    labelKo: string;
    severity: string;
    confidence: number;
    reason: string;
    evidence: string[];
    zone: string;
  }>;
  contextDescription?: string;
  accidentEvents?: Array<{
    type: 'collision' | 'sudden_stop' | 'fall' | 'proximity';
    labelKo: string;
    severity: string;
    confidence: number;
    trackId?: string;
    trackIds?: string[];
    evidence: string[];
  }>;
  clip?: string | null;
  source?: string;
  timestamp?: number;
}

/** WebSocket 실시간 분석 이벤트 수신 (폴링 대신 서버 푸시) */
export function useAnalysisStream() {
  const [event, setEvent] = useState<StreamEvent | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = backendBaseUrl().replace('http://', 'ws://') + '/ws/analysis';
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(url);
        ws.onopen = () => setConnected(true);
        ws.onmessage = (e) => {
          try { setEvent(JSON.parse(e.data)); } catch { /* ignore */ }
        };
        ws.onclose = () => {
          setConnected(false);
          retry = setTimeout(connect, 2000);
        };
      } catch {
        retry = setTimeout(connect, 2000);
      }
    };
    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    };
  }, []);

  return { event, connected };
}
