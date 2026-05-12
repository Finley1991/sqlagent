export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface SessionItem {
  id: string;
  title: string;
  createdAt: string;
}

export interface PanelSizes {
  left: number;
  center: number;
  right: number;
}
