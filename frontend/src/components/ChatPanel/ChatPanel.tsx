import { FormEvent, useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useCurrentLoading, useCurrentMessages, useCurrentSession, useStoreActions } from '../../stores/chatStore';
import { Button } from '../UI/Button';

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
    <div className="flex h-full flex-col bg-slate-900">
      <header className="border-b border-borderSoft px-4 py-3">
        <h2 className="text-lg font-semibold">问答区域</h2>
        <p className="text-sm text-slate-400">当前会话：{session?.title ?? '未选择'}</p>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'ml-auto bg-blue-700' : 'bg-slate-800'}`}>
            {msg.content}
            {msg.sqlQuery ? (
              <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-2 text-xs text-emerald-300">{msg.sqlQuery}</pre>
            ) : null}
          </div>
        ))}
        {isLoading ? <div className="text-xs text-slate-400">正在生成回答...</div> : null}
      </div>
      <form className="flex gap-2 border-t border-borderSoft p-4" onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          className="flex-1 rounded-md border border-borderSoft bg-slate-800 px-3 py-2 text-sm outline-none"
        />
        <Button type="submit">发送</Button>
      </form>
    </div>
  );
}
