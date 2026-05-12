import { create } from 'zustand';
import { ChatMessage, PanelSizes, SessionItem } from '../types';

interface ChatState {
  sessions: SessionItem[];
  currentSessionId: string | null;
  messagesBySession: Record<string, ChatMessage[]>;
  panelSizes: PanelSizes;
  setCurrentSession: (sessionId: string) => void;
  addSession: (title: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  addMessage: (sessionId: string, role: ChatMessage['role'], content: string) => void;
  setPanelSizes: (sizes: Partial<PanelSizes>) => void;
}

const nowISO = () => new Date().toISOString();

const seedSessionId = 'session-1';

export const useChatStore = create<ChatState>((set) => ({
  sessions: [{ id: seedSessionId, title: '默认会话', createdAt: nowISO() }],
  currentSessionId: seedSessionId,
  messagesBySession: {
    [seedSessionId]: [{ id: 'msg-welcome', role: 'assistant', content: '你好，我是 SQL Agent。', createdAt: nowISO() }]
  },
  panelSizes: { left: 22, center: 48, right: 30 },

  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),

  addSession: (title) =>
    set((state) => {
      const id = `session-${Date.now()}`;
      return {
        sessions: [{ id, title: title.trim() || '新会话', createdAt: nowISO() }, ...state.sessions],
        currentSessionId: id,
        messagesBySession: { ...state.messagesBySession, [id]: [] }
      };
    }),

  updateSessionTitle: (sessionId, title) =>
    set((state) => ({
      sessions: state.sessions.map((session) => (session.id === sessionId ? { ...session, title } : session))
    })),

  deleteSession: (sessionId) =>
    set((state) => {
      const sessions = state.sessions.filter((session) => session.id !== sessionId);
      const nextCurrent = state.currentSessionId === sessionId ? sessions[0]?.id ?? null : state.currentSessionId;
      const messagesBySession = { ...state.messagesBySession };
      delete messagesBySession[sessionId];
      return {
        sessions,
        currentSessionId: nextCurrent,
        messagesBySession
      };
    }),

  addMessage: (sessionId, role, content) =>
    set((state) => {
      const list = state.messagesBySession[sessionId] ?? [];
      const nextMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role,
        content,
        createdAt: nowISO()
      };
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: [...list, nextMessage]
        }
      };
    }),

  setPanelSizes: (sizes) =>
    set((state) => {
      const next = { ...state.panelSizes, ...sizes };
      return { panelSizes: next };
    })
}));

export const useCurrentMessages = () => {
  const currentSessionId = useChatStore((state) => state.currentSessionId);
  return useChatStore((state) => (currentSessionId ? state.messagesBySession[currentSessionId] ?? [] : []));
};

export const useCurrentSession = () => {
  const currentSessionId = useChatStore((state) => state.currentSessionId);
  return useChatStore((state) => state.sessions.find((session) => session.id === currentSessionId) ?? null);
};

export const useStoreActions = () =>
  useChatStore((state) => ({
    setCurrentSession: state.setCurrentSession,
    addSession: state.addSession,
    updateSessionTitle: state.updateSessionTitle,
    deleteSession: state.deleteSession,
    addMessage: state.addMessage,
    setPanelSizes: state.setPanelSizes
  }));

export const usePanelSizes = () => useChatStore((state) => state.panelSizes);
