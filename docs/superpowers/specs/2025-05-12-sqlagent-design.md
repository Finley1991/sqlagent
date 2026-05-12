# 智能数据分析系统设计文档

**日期:** 2025-05-12  
**版本:** 1.0  
**状态:** 待审阅

---

## 1. 项目概述

### 1.1 目标
构建一个基于自然语言的智能数据分析系统，用户可以通过对话方式查询数据库，并实时获得可视化图表展示。

### 1.2 核心功能
| 功能 | 描述 |
|------|------|
| 自然语言查询 | 用户用中文/英文描述数据需求 |
| 智能 SQL 生成 | LLM 自动将自然语言转换为 SQL |
| 会话管理 | 支持多会话，历史记录保留 |
| 上下文记忆 | 连续对话保持上下文 |
| 实时可视化 | 查询结果自动渲染为图表 |

### 1.3 技术约束
- **大模型:** 阿里云百炼 Qwen3
- **后端框架:** FastAPI + LangChain
- **数据库:** SQLite3（预定义示例）
- **前端框架:** React + TypeScript
- **部署:** 本地开发环境

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              前端 (React)                                │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────────┐ ┌─────────────────────────────┐ │
│ │  左侧：会话    │ │    中间：对话区    │ │     右侧：可视化展示区       │ │
│ │               │ │                   │ │                             │ │
│ │ • 会话列表    │ │ • 消息气泡        │ │ • ECharts 图表              │ │
│ │ • 新建会话    │ │ • 代码高亮        │ │ • 柱状图/折线图/饼图        │ │
│ │ • 重命名/删除 │ │ • 加载状态        │ │ • 数据表格                  │ │
│ │ • 历史记录    │ │ • 流式输出        │ │ • 图表类型切换              │ │
│ └───────────────┘ └───────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket / REST API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           后端 (FastAPI)                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐   │
│  │   API 路由层    │  │   服务逻辑层    │  │      数据访问层         │   │
│  ├────────────────┤  ├────────────────┤  ├────────────────────────┤   │
│  │ /ws/chat       │  │ ChatService      │  │ SessionRepository     │   │
│  │ /api/sessions  │  │ SessionService   │  │ SQLiteConnection      │   │
│  │ /api/health    │  │ ChartService     │  │                       │   │
│  └────────────────┘  └────────────────┘  └────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     LangChain Agent 层                          │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ • Qwen3Chat (阿里云百炼)                                        │   │
│  │ • SQL Agent (自然语言 → SQL)                                    │   │
│  │ • Chart Config Generator (SQL结果 → 图表配置)                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 模块依赖关系

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端 UI    │────▶│  WebSocket  │────▶│  FastAPI    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                   │ ChatService │      │SessionService│    │ChartService │
                   └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
                          │                    │                    │
                          ▼                    ▼                    ▼
                   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                   │  SQL Agent  │      │ Session DB  │      │   ECharts   │
                   │  (LangChain)│      │  (SQLite)   │      │   Config    │
                   └──────┬──────┘      └─────────────┘      └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Qwen3 API  │
                   │(阿里云百炼) │
                   └─────────────┘
```

---

## 3. 详细模块设计

### 3.1 数据库层（SQLite）

#### 3.1.1 示例数据库 Schema

预定义一个 **电商销售数据库**，包含以下表：

```sql
-- 产品表
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock_quantity INTEGER DEFAULT 0
);

-- 订单表
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending'
);

-- 订单详情表
CREATE TABLE order_items (
    item_id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL
);

-- 客户表
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    customer_name TEXT NOT NULL,
    email TEXT,
    city TEXT,
    register_date DATE
);
```

#### 3.1.2 会话持久化表

```sql
-- 会话表
CREATE TABLE chat_sessions (
    session_id TEXT PRIMARY KEY,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 消息历史表
CREATE TABLE chat_messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,  -- 'user' 或 'assistant'
    content TEXT NOT NULL,
    sql_query TEXT,      -- 如果是AI回复，记录生成的SQL
    chart_config TEXT,   -- 如果是AI回复，记录图表配置
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
);
```

### 3.2 后端模块（FastAPI）

#### 3.2.1 模块结构

```
backend/app/
├── __init__.py
├── main.py                 # FastAPI 应用入口
├── config.py               # 配置类 (Pydantic Settings)
├── dependencies.py         # 依赖注入
├── api/
│   ├── __init__.py
│   ├── chat.py             # WebSocket 路由 (/ws/chat)
│   └── sessions.py         # REST API (/api/sessions/*)
├── core/
│   ├── __init__.py
│   ├── llm.py              # Qwen3Chat 封装类
│   ├── agent.py            # SQL Agent 创建函数
│   ├── prompts.py          # Prompt 模板常量
│   └── exceptions.py       # 自定义异常
├── db/
│   ├── __init__.py
│   ├── base.py             # SQLAlchemy Base
│   ├── session.py          # 异步会话管理
│   ├── models.py           # ORM 模型
│   └── database.py         # 业务数据库连接工具
├── services/
│   ├── __init__.py
│   ├── chat_service.py     # 核心对话逻辑
│   ├── session_service.py  # 会话CRUD
│   └── chart_service.py    # 图表配置生成
└── schemas/
    ├── __init__.py
    ├── chat.py             # Pydantic 消息模型
    └── session.py          # Pydantic 会话模型
```

#### 3.2.2 LLM 封装设计

```python
# core/llm.py
from langchain_community.chat_models import ChatOpenAI
from typing import AsyncIterator, Optional

class Qwen3Chat:
    """阿里云百炼 Qwen3 封装
    
    使用兼容 OpenAI API 的接口接入百炼平台
    """
    
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1",
        model: str = "qwen3-235b-a22b",
        temperature: float = 0.1
    ):
        self.llm = ChatOpenAI(
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            streaming=True
        )
    
    async def astream(self, messages: list) -> AsyncIterator[str]:
        """流式输出"""
        async for chunk in self.llm.astream(messages):
            yield chunk.content
    
    async def ainvoke(self, messages: list) -> str:
        """非流式调用"""
        response = await self.llm.ainvoke(messages)
        return response.content
```

#### 3.2.3 SQL Agent 设计

```python
# core/agent.py
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain.agents import AgentType

def create_data_analyst_agent(
    llm: Qwen3Chat,
    db_path: str,
    verbose: bool = False
) -> AgentExecutor:
    """创建数据分析 Agent
    
    功能：
    1. 理解自然语言查询意图
    2. 生成并执行 SQL
    3. 解释查询结果
    """
    
    # 包装 SQLite 数据库
    db = SQLDatabase.from_uri(f"sqlite:///{db_path}")
    
    # 创建 SQL Agent
    agent = create_sql_agent(
        llm=llm.llm,
        db=db,
        agent_type=AgentType.OPENAI_FUNCTIONS,
        verbose=verbose,
        handle_parsing_errors=True,
        # 限制只读查询
        extra_tools=[],
        prefix="""你是一个专业的数据分析助手。用户会用自然语言询问关于电商数据的问题。

你的任务是：
1. 理解用户的问题
2. 生成合适的 SQL 查询
3. 执行查询并解释结果

重要规则：
- 只能执行 SELECT 查询，禁止任何数据修改操作
- 如果用户问题涉及多张表，使用 JOIN 关联
- 对聚合结果提供数据洞察
- 如果无法回答，礼貌地解释原因

数据库表结构：
{table_info}
"""
    )
    
    return agent
```

#### 3.2.4 图表配置服务

```python
# services/chart_service.py
from typing import Dict, Any, List
import pandas as pd

class ChartService:
    """根据 SQL 查询结果生成 ECharts 配置"""
    
    @staticmethod
    def detect_chart_type(df: pd.DataFrame) -> str:
        """根据数据特征推荐图表类型"""
        
        # 单列数据 + 数值 → 饼图
        if len(df.columns) == 2 and df.iloc[:, 1].dtype in ['int64', 'float64']:
            return 'pie'
        
        # 时间序列 → 折线图
        if pd.api.types.is_datetime64_any_dtype(df.iloc[:, 0]):
            return 'line'
        
        # 分类数据 + 多个数值 → 柱状图
        if len(df.columns) >= 2:
            return 'bar'
        
        return 'table'  # 默认表格
    
    @staticmethod
    def generate_echarts_config(
        df: pd.DataFrame,
        chart_type: str = 'auto'
    ) -> Dict[str, Any]:
        """生成 ECharts 配置"""
        
        if chart_type == 'auto':
            chart_type = ChartService.detect_chart_type(df)
        
        columns = df.columns.tolist()
        
        if chart_type == 'bar':
            return {
                'type': 'bar',
                'title': {'text': '数据分析结果'},
                'xAxis': {
                    'type': 'category',
                    'data': df.iloc[:, 0].tolist()
                },
                'yAxis': {'type': 'value'},
                'series': [{
                    'data': df.iloc[:, 1].tolist(),
                    'type': 'bar',
                    'name': columns[1]
                }]
            }
        
        elif chart_type == 'pie':
            return {
                'type': 'pie',
                'title': {'text': '占比分析'},
                'series': [{
                    'type': 'pie',
                    'data': [
                        {'name': row[0], 'value': row[1]}
                        for _, row in df.iterrows()
                    ]
                }]
            }
        
        elif chart_type == 'line':
            return {
                'type': 'line',
                'title': {'text': '趋势分析'},
                'xAxis': {
                    'type': 'category',
                    'data': df.iloc[:, 0].tolist()
                },
                'yAxis': {'type': 'value'},
                'series': [{
                    'data': df.iloc[:, 1].tolist(),
                    'type': 'line',
                    'smooth': True
                }]
            }
        
        else:  # table
            return {
                'type': 'table',
                'columns': columns,
                'data': df.to_dict('records')
            }
```

#### 3.2.5 WebSocket 聊天服务

```python
# api/chat.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import json

class ConnectionManager:
    """WebSocket 连接管理"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        del self.active_connections[client_id]
    
    async def send_message(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/chat/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str):
    """WebSocket 聊天端点
    
    消息格式：
    - 客户端 → 服务端: {"type": "query", "content": "销售额最高的产品是什么"}
    - 服务端 → 客户端: 
      {"type": "sql", "content": "SELECT ..."}  # 生成的 SQL
      {"type": "text", "content": "..."}         # 解释文本（流式）
      {"type": "chart", "config": {...}}         # 图表配置
      {"type": "complete"}                         # 完成标记
    """
    client_id = str(uuid.uuid4())
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "query":
                # 1. 保存用户消息
                await save_message(session_id, "user", data["content"])
                
                # 2. 获取历史上下文
                history = await get_session_history(session_id)
                
                # 3. 调用 Agent 处理
                async for event in process_query(data["content"], history):
                    await manager.send_message(client_id, event)
                
                # 4. 标记完成
                await manager.send_message(client_id, {"type": "complete"})
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)
```

### 3.3 前端模块（React）

#### 3.3.1 模块结构

```
frontend/src/
├── components/
│   ├── Layout/
│   │   ├── ThreeColumnLayout.tsx      # 三栏布局容器
│   │   └── ResizableSplit.tsx           # 可拖拽分割条
│   ├── SessionPanel/
│   │   ├── SessionList.tsx              # 会话列表
│   │   ├── SessionItem.tsx              # 会话项
│   │   └── NewSessionButton.tsx         # 新建会话按钮
│   ├── ChatPanel/
│   │   ├── ChatContainer.tsx            # 对话容器
│   │   ├── MessageList.tsx              # 消息列表
│   │   ├── MessageItem.tsx                # 单条消息
│   │   ├── CodeBlock.tsx                  # 代码高亮块
│   │   ├── ChatInput.tsx                  # 输入框
│   │   └── LoadingIndicator.tsx           # 加载动画
│   └── ChartPanel/
│       ├── ChartContainer.tsx           # 图表容器
│       ├── EChartsRenderer.tsx          # ECharts 渲染器
│       ├── ChartTypeSelector.tsx        # 图表类型切换
│       └── DataTable.tsx                # 数据表格
├── hooks/
│   ├── useWebSocket.ts                  # WebSocket Hook
│   ├── useChat.ts                       # 聊天逻辑 Hook
│   └── useSessions.ts                   # 会话管理 Hook
├── stores/
│   └── chatStore.ts                     # Zustand 状态管理
├── services/
│   ├── api.ts                           # REST API 调用
│   └── websocket.ts                     # WebSocket 封装
├── types/
│   └── index.ts                         # TypeScript 类型定义
├── utils/
│   └── helpers.ts
├── App.tsx
└── main.tsx
```

#### 3.3.2 状态管理设计 (Zustand)

```typescript
// stores/chatStore.ts
import { create } from 'zustand'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sqlQuery?: string
  chartConfig?: ChartConfig
  isStreaming?: boolean
}

interface Session {
  id: string
  title: string
  messages: Message[]
  createdAt: string
}

interface ChatState {
  // 会话列表
  sessions: Session[]
  currentSessionId: string | null
  
  // 加载状态
  isLoading: boolean
  
  // Actions
  setCurrentSession: (id: string) => void
  addMessage: (sessionId: string, message: Message) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void
  createSession: () => void
  deleteSession: (id: string) => void
  renameSession: (id: string, title: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  
  setCurrentSession: (id) => set({ currentSessionId: id }),
  
  addMessage: (sessionId, message) => set((state) => ({
    sessions: state.sessions.map(s => 
      s.id === sessionId 
        ? { ...s, messages: [...s.messages, message] }
        : s
    )
  })),
  
  // ... 其他 actions
}))
```

#### 3.3.3 WebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback, useState } from 'react'

interface WSMessage {
  type: 'sql' | 'text' | 'chart' | 'complete' | 'error'
  content?: string
  config?: ChartConfig
}

export function useWebSocket(sessionId: string) {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  
  useEffect(() => {
    const wsUrl = `ws://localhost:8000/ws/chat/${sessionId}`
    ws.current = new WebSocket(wsUrl)
    
    ws.current.onopen = () => setIsConnected(true)
    ws.current.onclose = () => setIsConnected(false)
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setLastMessage(data)
    }
    
    return () => {
      ws.current?.close()
    }
  }, [sessionId])
  
  const sendMessage = useCallback((content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'query', content }))
    }
  }, [])
  
  return { isConnected, lastMessage, sendMessage }
}
```

#### 3.3.4 图表渲染组件

```typescript
// components/ChartPanel/EChartsRenderer.tsx
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface EChartsRendererProps {
  config: ChartConfig
  onTypeChange?: (type: string) => void
}

export function EChartsRenderer({ config, onTypeChange }: EChartsRendererProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  
  useEffect(() => {
    if (!chartRef.current) return
    
    // 初始化或复用图表实例
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }
    
    // 设置配置
    chartInstance.current.setOption(config, true)
    
    return () => {
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [config])
  
  return (
    <div className="chart-container">
      <ChartTypeSelector 
        currentType={config.type} 
        onChange={onTypeChange}
        options={['bar', 'line', 'pie', 'table']}
      />
      {config.type === 'table' ? (
        <DataTable columns={config.columns} data={config.data} />
      ) : (
        <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
      )}
    </div>
  )
}
```

---

## 4. 数据流详细设计

### 4.1 完整对话流程

```sequence
用户                        前端                        后端                     SQL Agent               Qwen3
 |                           |                           |                         |                      |
 |---"查询销售额"------------>|                           |                         |                      |
 |                           |---WebSocket: query------->|                         |                      |
 |                           |                           |---创建消息记录---------->|                      |
 |                           |                           |---获取历史上下文------->|                      |
 |                           |                           |---调用 Agent------------>|                      |
 |                           |                           |                         |---Schema + 问题------->|
 |                           |                           |                         |<--生成的 SQL----------|
 |                           |<--WebSocket: sql-----------|<---返回 SQL--------------|                      |
 |                           |                           |---执行 SQL-------------|                      |
 |                           |                           |<--查询结果--------------|                      |
 |                           |                           |---调用 LLM 解释结果------>|                      |
 |                           |<--WebSocket: text(chunk)--|<---流式返回解释----------|                      |
 |                           |<--WebSocket: text(chunk)--|<---流式返回解释----------|                      |
 |                           |---生成图表配置------------>|                         |                      |
 |                           |<--WebSocket: chart--------|<---返回 ECharts 配置------|                      |
 |                           |<--WebSocket: complete------|<---标记完成-------------|                      |
 |<---显示结果----------------|                           |                         |                      |
```

### 4.2 上下文记忆策略

| 层级 | 实现方式 | 说明 |
|------|----------|------|
| **单次对话** | `chat_messages` 表 | 记录用户和 AI 的完整对话历史 |
| **会话级记忆** | LangChain `RunnableWithMessageHistory` | 加载最近 N 条消息作为上下文 |
| **窗口管理** | Token 计数 + 滑动窗口 | 超出长度时移除最早的消息 |
| **系统提示** | 固定的 Schema 描述 | 每次请求都注入数据库结构信息 |

```python
# 上下文加载示例
def get_session_context(session_id: str, max_messages: int = 10) -> list:
    """获取会话的最近消息作为上下文"""
    messages = db.query(
        "SELECT role, content FROM chat_messages "
        "WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
        (session_id, max_messages)
    )
    
    # 反转顺序（从早到晚）
    return [
        HumanMessage(content=m['content']) if m['role'] == 'user' 
        else AIMessage(content=m['content'])
        for m in reversed(messages)
    ]
```

---

## 5. API 接口设计

### 5.1 WebSocket 接口

| 端点 | 描述 | 消息格式 |
|------|------|----------|
| `WS /ws/chat/{session_id}` | 实时聊天 | 见下表 |

**客户端 → 服务端:**

```json
{
  "type": "query",
  "content": "今年每个月的销售额是多少"
}
```

**服务端 → 客户端:**

```json
// 1. 生成的 SQL
{"type": "sql", "content": "SELECT strftime('%Y-%m', order_date) as month, SUM(total_amount) FROM orders WHERE strftime('%Y', order_date) = '2024' GROUP BY month"}

// 2. 解释文本（流式，可能多条）
{"type": "text", "content": "根据查询结果，"}
{"type": "text", "content": "2024年1月的销售额是..."}

// 3. 图表配置
{"type": "chart", "config": {"type": "line", "title": {...}, "series": [...]}}

// 4. 完成标记
{"type": "complete"}

// 错误
{"type": "error", "message": "数据库查询失败"}
```

### 5.2 REST API 接口

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/sessions` | 获取所有会话列表 |
| POST | `/api/sessions` | 创建新会话 |
| GET | `/api/sessions/{id}` | 获取会话详情（含消息历史） |
| PUT | `/api/sessions/{id}` | 更新会话（重命名） |
| DELETE | `/api/sessions/{id}` | 删除会话 |
| GET | `/api/health` | 健康检查 |

---

## 6. 安全与异常处理

### 6.1 SQL 安全

| 风险 | 防护措施 |
|------|----------|
| SQL 注入 | LangChain SQLDatabase 自动转义 |
| 数据修改 | 禁止非 SELECT 语句（正则匹配） |
| 敏感数据 | 示例数据使用虚构数据 |

```python
# SQL 安全校验
FORBIDDEN_KEYWORDS = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE']

def is_safe_query(sql: str) -> bool:
    """检查 SQL 是否只包含 SELECT 语句"""
    upper_sql = sql.upper()
    return not any(kw in upper_sql for kw in FORBIDDEN_KEYWORDS)
```

### 6.2 异常处理策略

| 异常类型 | 处理方式 | 用户提示 |
|----------|----------|----------|
| SQL 生成失败 | 返回友好提示 | "我不太理解这个问题，请换个方式提问" |
| SQL 执行错误 | 捕获异常，不暴露细节 | "查询执行失败，请检查问题是否涉及正确的表和字段" |
| LLM API 错误 | 重试 + 降级 | "服务暂时不可用，请稍后重试" |
| WebSocket 断开 | 自动重连机制 | 显示重连状态 |

---

## 7. 技术依赖

### 7.1 后端依赖 (requirements.txt)

```
# Web 框架
fastapi==0.111.0
uvicorn[standard]==0.30.0
websockets==12.0

# LangChain 生态
langchain==0.2.0
langchain-community==0.2.0
langchain-openai==0.1.0

# 数据库
sqlalchemy==2.0.30
aiosqlite==0.20.0

# 数据与图表
pandas==2.2.2
pydantic==2.7.0
pydantic-settings==2.2.0

# 工具
python-dotenv==1.0.0
```

### 7.2 前端依赖 (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "echarts": "^5.5.0",
    "react-markdown": "^9.0.0",
    "prismjs": "^1.29.0",
    "axios": "^1.7.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 8. 开发计划概览

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| **Phase 1** | 后端基础架构：FastAPI + SQLite + SQL Agent | 2h |
| **Phase 2** | 后端核心功能：WebSocket + 图表服务 + 会话管理 | 2h |
| **Phase 3** | 前端基础：React + 布局 + 状态管理 | 2h |
| **Phase 4** | 前端功能：对话UI + WebSocket + 图表渲染 | 2h |
| **Phase 5** | 集成测试与调试 | 1h |

---

## 9. 验收标准

| 功能 | 验收标准 |
|------|----------|
| 自然语言查询 | 用户输入中文问题，系统正确生成并执行 SQL |
| 会话管理 | 可创建、切换、重命名、删除会话 |
| 上下文记忆 | 连续提问能引用之前的上下文 |
| 实时可视化 | 查询结果自动渲染为图表，支持类型切换 |
| 流式输出 | AI 回复实时显示，无卡顿 |

---

**文档结束**

请审阅此设计文档。如无问题，我将进入实现计划阶段，创建详细的任务清单和代码实现步骤。
