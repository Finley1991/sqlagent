export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sqlQuery?: string;
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

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'table';
  title?: { text: string };
  xAxis?: { type: string; data: Array<string | number> };
  yAxis?: { type: string };
  series?: Array<Record<string, unknown>>;
  columns?: string[];
  data?: Array<Record<string, unknown>>;
}
