import { create } from 'zustand';
import { ChartConfig, ChatMessage, PanelSizes, SessionItem } from '../types';

interface ChatState {
  sessions: SessionItem[];
  currentSessionId: string | null;
  messagesBySession: Record<string, ChatMessage[]>;
  chartBySession: Record<string, ChartConfig | null>;
  isLoadingBySession: Record<string, boolean>;
  panelSizes: PanelSizes;
  setCurrentSession: (sessionId: string) => void;
  setSessions: (sessions: SessionItem[]) => void;
  addSession: (session: SessionItem) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  setMessages: (sessionId: string, messages: ChatMessage[]) => void;
  addMessage: (sessionId: string, role: ChatMessage['role'], content: string, sqlQuery?: string) => void;
  setChartConfig: (sessionId: string, config: ChartConfig | null) => void;
  setLoading: (sessionId: string, loading: boolean) => void;
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
  chartBySession: { [seedSessionId]: null },
  isLoadingBySession: { [seedSessionId]: false },
  panelSizes: { left: 22, center: 48, right: 30 },

  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),

  setSessions: (sessions) =>
    set((state) => {
      const keepCurrent = sessions.find((item) => item.id === state.currentSessionId)?.id ?? sessions[0]?.id ?? null;
      return {
        sessions,
        currentSessionId: keepCurrent
      };
    }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSessionId: session.id,
      messagesBySession: { ...state.messagesBySession, [session.id]: [] },
      chartBySession: { ...state.chartBySession, [session.id]: null },
      isLoadingBySession: { ...state.isLoadingBySession, [session.id]: false }
    })),

  updateSessionTitle: (sessionId, title) =>
    set((state) => ({
      sessions: state.sessions.map((session) => (session.id === sessionId ? { ...session, title } : session))
    })),

  deleteSession: (sessionId) =>
    set((state) => {
      const sessions = state.sessions.filter((session) => session.id !== sessionId);
      const nextCurrent = state.currentSessionId === sessionId ? sessions[0]?.id ?? null : state.currentSessionId;
      const messagesBySession = { ...state.messagesBySession };
      const chartBySession = { ...state.chartBySession };
      const isLoadingBySession = { ...state.isLoadingBySession };
      delete messagesBySession[sessionId];
      delete chartBySession[sessionId];
      delete isLoadingBySession[sessionId];
      return {
        sessions,
        currentSessionId: nextCurrent,
        messagesBySession,
        chartBySession,
        isLoadingBySession
      };
    }),

  setMessages: (sessionId, messages) =>
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: messages
      }
    })),

  addMessage: (sessionId, role, content, sqlQuery) =>
    set((state) => {
      const list = state.messagesBySession[sessionId] ?? [];
      const nextMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role,
        content,
        createdAt: nowISO(),
        sqlQuery
      };
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: [...list, nextMessage]
        }
      };
    }),

  setChartConfig: (sessionId, config) =>
    set((state) => ({
      chartBySession: {
        ...state.chartBySession,
        [sessionId]: config
      }
    })),

  setLoading: (sessionId, loading) =>
    set((state) => ({
      isLoadingBySession: {
        ...state.isLoadingBySession,
        [sessionId]: loading
      }
    })),

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
    setSessions: state.setSessions,
    addSession: state.addSession,
    updateSessionTitle: state.updateSessionTitle,
    deleteSession: state.deleteSession,
    setMessages: state.setMessages,
    addMessage: state.addMessage,
    setChartConfig: state.setChartConfig,
    setLoading: state.setLoading,
    setPanelSizes: state.setPanelSizes
  }));

export const usePanelSizes = () => useChatStore((state) => state.panelSizes);
export const useCurrentChart = () => {
  const currentSessionId = useChatStore((state) => state.currentSessionId);
  return useChatStore((state) => (currentSessionId ? state.chartBySession[currentSessionId] ?? null : null));
};
export const useCurrentLoading = () => {
  const currentSessionId = useChatStore((state) => state.currentSessionId);
  return useChatStore((state) => (currentSessionId ? state.isLoadingBySession[currentSessionId] ?? false : false));
};
