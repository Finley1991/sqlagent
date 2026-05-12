import { ChartConfig, ChatMessage, SessionItem } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8010';

interface SessionResponse {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SessionDetailResponse {
  session: SessionResponse;
  messages: Array<{
    message_id: number;
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    sql_query?: string | null;
    chart_config?: ChartConfig | null;
    created_at: string;
  }>;
}

const toSessionItem = (s: SessionResponse): SessionItem => ({
  id: s.session_id,
  title: s.title,
  createdAt: s.created_at
});

export async function fetchSessions(): Promise<SessionItem[]> {
  const response = await fetch(`${API_BASE}/api/sessions`);
  if (!response.ok) {
    throw new Error('获取会话列表失败');
  }
  const data = (await response.json()) as SessionResponse[];
  return data.map(toSessionItem);
}

export async function createSession(title?: string): Promise<SessionItem> {
  const response = await fetch(`${API_BASE}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title ?? null })
  });
  if (!response.ok) {
    throw new Error('创建会话失败');
  }
  const data = (await response.json()) as SessionResponse;
  return toSessionItem(data);
}

export async function renameSession(sessionId: string, title: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  if (!response.ok) {
    throw new Error('重命名会话失败');
  }
}

export async function removeSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error('删除会话失败');
  }
}

export async function fetchSessionDetail(
  sessionId: string
): Promise<{ messages: ChatMessage[]; chart: ChartConfig | null }> {
  const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error('获取会话详情失败');
  }
  const data = (await response.json()) as SessionDetailResponse;
  const messages: ChatMessage[] = data.messages.map((m) => ({
    id: `msg-${m.message_id}`,
    role: m.role,
    content: m.content,
    createdAt: m.created_at,
    sqlQuery: m.sql_query ?? undefined
  }));
  const assistant = [...data.messages].reverse().find((m) => m.chart_config);
  return { messages, chart: assistant?.chart_config ?? null };
}

export function wsUrl(sessionId: string): string {
  return `${API_BASE.replace('http://', 'ws://').replace('https://', 'wss://')}/ws/chat/${sessionId}`;
}
