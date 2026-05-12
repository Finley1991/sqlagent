import { useMemo } from 'react';
import { wsUrl } from '../services/api';
import { ChartConfig } from '../types';

type WsEvent =
  | { type: 'sql'; content: string }
  | { type: 'text'; content: string }
  | { type: 'chart'; config: ChartConfig }
  | { type: 'complete' }
  | { type: 'error'; message: string };

export function useWebSocket(sessionId: string | null) {
  const url = useMemo(() => (sessionId ? wsUrl(sessionId) : null), [sessionId]);

  const sendQuery = (question: string, onEvent: (event: WsEvent) => void) => {
    if (!url) {
      return;
    }
    let attempt = 0;
    const maxAttempt = 2;
    let finished = false;

    const connect = () => {
      const socket = new WebSocket(url);
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'query', content: question }));
      };
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data) as WsEvent;
        onEvent(payload);
        if (payload.type === 'complete' || payload.type === 'error') {
          finished = true;
          socket.close();
        }
      };
      socket.onerror = () => {
        socket.close();
      };
      socket.onclose = () => {
        if (finished) {
          return;
        }
        attempt += 1;
        if (attempt < maxAttempt) {
          connect();
          return;
        }
        onEvent({ type: 'error', message: 'WebSocket 连接异常，请稍后重试' });
      };
    };
    connect();
  };

  return { sendQuery };
}
