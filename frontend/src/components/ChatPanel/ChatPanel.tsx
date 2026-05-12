import { FormEvent, useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useCurrentLoading, useCurrentMessages, useCurrentSession, useStoreActions } from '../../stores/chatStore';
import { Button } from '../UI/Button';
import { MarkdownBubble } from './MarkdownBubble';

export function ChatPanel() {
  const [input, setInput] = useState('');
  const session = useCurrentSession();
  const messages = useCurrentMessages();
  const isLoading = useCurrentLoading();
  const { addMessage, setChartConfig, setLoading } = useStoreActions();
  const { sendQuery } = useWebSocket(session?.id ?? null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!session || !input.trim()) {
      return;
    }
    const question = input.trim();
    addMessage(session.id, 'user', question);
    setLoading(session.id, true);
    let sqlText = '';
    sendQuery(question, (eventPayload) => {
      if (eventPayload.type === 'sql') {
        sqlText = eventPayload.content;
      }
      if (eventPayload.type === 'text') {
        addMessage(session.id, 'assistant', eventPayload.content, sqlText || undefined);
      }
      if (eventPayload.type === 'chart') {
        setChartConfig(session.id, eventPayload.config);
      }
      if (eventPayload.type === 'error') {
        addMessage(session.id, 'assistant', `请求失败：${eventPayload.message}`);
        setLoading(session.id, false);
      }
      if (eventPayload.type === 'complete') {
        setLoading(session.id, false);
      }
    });
    setInput('');
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-900/95">
      <header className="border-b border-borderSoft/80 bg-slate-900/80 px-4 py-3 backdrop-blur-sm">
        <h2 className="text-lg font-semibold tracking-tight text-slate-100">问答区域</h2>
        <p className="mt-0.5 text-sm text-slate-400">当前会话：{session?.title ?? '未选择'}</p>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[min(92%,42rem)] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'border-blue-600/40 bg-gradient-to-br from-blue-600 to-blue-700 text-slate-50'
                  : 'border-borderSoft bg-slate-800/90 text-slate-100'
              }`}
            >
              {msg.role === 'assistant' ? (
                <MarkdownBubble content={msg.content} />
              ) : (
                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
              )}
              {msg.sqlQuery ? (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">SQL</p>
                  <pre className="max-h-48 overflow-x-auto overflow-y-auto rounded-lg bg-slate-950/90 p-3 font-mono text-xs leading-relaxed text-emerald-300/95 ring-1 ring-slate-700/80">
                    {msg.sqlQuery}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" aria-hidden />
            正在生成回答…
          </div>
        ) : null}
      </div>
      <form className="flex gap-2 border-t border-borderSoft/80 bg-slate-900/90 p-4 backdrop-blur-sm" onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          className="flex-1 rounded-xl border border-borderSoft bg-slate-800/90 px-3 py-2.5 text-sm text-slate-100 outline-none ring-sky-500/0 transition-shadow placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/30"
        />
        <Button type="submit">发送</Button>
      </form>
    </div>
  );
}
