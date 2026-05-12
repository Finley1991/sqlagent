import { FormEvent, useState } from 'react';
import { useCurrentMessages, useCurrentSession, useStoreActions } from '../../stores/chatStore';
import { Button } from '../UI/Button';

export function ChatPanel() {
  const [input, setInput] = useState('');
  const session = useCurrentSession();
  const messages = useCurrentMessages();
  const { addMessage } = useStoreActions();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!session || !input.trim()) {
      return;
    }
    addMessage(session.id, 'user', input.trim());
    addMessage(session.id, 'assistant', '（Phase 3 骨架）后续将在 Phase 4 接入 WebSocket 实时回答。');
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
          </div>
        ))}
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
