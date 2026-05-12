import { useEffect, useState } from 'react';
import { createSession, fetchSessionDetail, fetchSessions, removeSession, renameSession } from '../../services/api';
import { useChatStore, useStoreActions } from '../../stores/chatStore';
import { Button } from '../UI/Button';

export function SessionPanel() {
  const [newTitle, setNewTitle] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const sessions = useChatStore((state) => state.sessions);
  const currentSessionId = useChatStore((state) => state.currentSessionId);
  const { addSession, setCurrentSession, setSessions, deleteSession, updateSessionTitle, setMessages, setChartConfig } =
    useStoreActions();

  useEffect(() => {
    void (async () => {
      try {
        const remoteSessions = await fetchSessions();
        setSessions(remoteSessions);
      } catch {
        // 后端未就绪时保留本地初始会话，避免阻塞页面渲染
      }
    })();
  }, [setSessions]);

  useEffect(() => {
    if (!currentSessionId) {
      return;
    }
    void (async () => {
      try {
        const detail = await fetchSessionDetail(currentSessionId);
        setMessages(currentSessionId, detail.messages);
        setChartConfig(currentSessionId, detail.chart);
      } catch {
        // 忽略会话详情加载失败，用户可继续本地输入
      }
    })();
  }, [currentSessionId, setChartConfig, setMessages]);

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
          onClick={async () => {
            try {
              const created = await createSession(newTitle || '新会话');
              addSession(created);
              setCurrentSession(created.id);
              setNewTitle('');
            } catch {
              // 后端不可用时不新增，避免状态不一致
            }
          }}
        >
          新建
        </Button>
      </div>
      <div className="space-y-2 overflow-y-auto">
        {sessions.map((session) => (
          <div key={session.id} className={`rounded-md px-2 py-2 text-left text-sm ${session.id === currentSessionId ? 'bg-blue-900/40 border border-blue-700' : 'bg-panelSoft'}`}>
            <button className="w-full text-left" onClick={() => setCurrentSession(session.id)}>
              <div className="font-medium">{session.title}</div>
              <div className="text-xs text-slate-400">{new Date(session.createdAt).toLocaleString()}</div>
            </button>
            <div className="mt-2 flex gap-2">
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={async () => {
                  if (renamingId === session.id) {
                    const value = renameText.trim();
                    if (value) {
                      try {
                        await renameSession(session.id, value);
                        updateSessionTitle(session.id, value);
                      } catch {
                        // 忽略失败
                      }
                    }
                    setRenamingId(null);
                    return;
                  }
                  setRenamingId(session.id);
                  setRenameText(session.title);
                }}
              >
                {renamingId === session.id ? '保存' : '重命名'}
              </Button>
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={async () => {
                  try {
                    await removeSession(session.id);
                    deleteSession(session.id);
                  } catch {
                    // 忽略失败
                  }
                }}
              >
                删除
              </Button>
            </div>
            {renamingId === session.id ? (
              <input
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                className="mt-2 w-full rounded-md border border-borderSoft bg-slate-800 px-2 py-1 text-xs"
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
