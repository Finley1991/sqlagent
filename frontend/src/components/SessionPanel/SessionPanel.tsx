import { useState } from 'react';
import { useChatStore, useStoreActions } from '../../stores/chatStore';
import { Button } from '../UI/Button';

export function SessionPanel() {
  const [newTitle, setNewTitle] = useState('');
  const sessions = useChatStore((state) => state.sessions);
  const currentSessionId = useChatStore((state) => state.currentSessionId);
  const { addSession, setCurrentSession } = useStoreActions();

  return (
    <div className="flex h-full flex-col bg-panel p-4">
      <h2 className="mb-3 text-lg font-semibold">聊天管理</h2>
      <div className="mb-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="新会话名称"
          className="w-full rounded-md border border-borderSoft bg-panelSoft px-2 py-1 text-sm outline-none"
        />
        <Button
          onClick={() => {
            addSession(newTitle || '新会话');
            setNewTitle('');
          }}
        >
          新建
        </Button>
      </div>
      <div className="space-y-2 overflow-y-auto">
        {sessions.map((session) => (
          <button
            key={session.id}
            className={`w-full rounded-md px-2 py-2 text-left text-sm ${
              session.id === currentSessionId ? 'bg-blue-900/40 border border-blue-700' : 'bg-panelSoft'
            }`}
            onClick={() => setCurrentSession(session.id)}
          >
            <div className="font-medium">{session.title}</div>
            <div className="text-xs text-slate-400">{new Date(session.createdAt).toLocaleString()}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
