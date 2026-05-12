# SQL Agent HTTP / WebSocket API

基路径：后端根 URL，例如 `http://127.0.0.1:8000`。下文路径均相对该根。

## REST

### `GET /api/health`

响应示例：

```json
{ "status": "ok", "model": "qwen-turbo" }
```

### `POST /api/query`

请求体（JSON）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `question` | string | 自然语言问题 |

响应：由实现返回 NL→SQL 执行结果（见 OpenAPI `/docs` 或源码 `app/api/query.py`）。

### 会话

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/sessions` | 会话列表 |
| `POST` | `/api/sessions` | 创建会话；body：`{ "title": string \| null }` |
| `GET` | `/api/sessions/{session_id}` | 会话详情与消息历史 |
| `PUT` | `/api/sessions/{session_id}` | 重命名；body：`{ "title": string }` |
| `DELETE` | `/api/sessions/{session_id}` | 删除会话 |

## WebSocket：`/ws/chat/{session_id}`

### 客户端 → 服务端

```json
{ "type": "query", "content": "按城市统计订单总额" }
```

### 服务端 → 客户端（事件顺序因实现可能略有差异，以流式为准）

| `type` | 字段 | 说明 |
|--------|------|------|
| `sql` | `content` | 生成的 SQL 文本 |
| `text` | `content` | 自然语言解释 |
| `chart` | `config` | ECharts 配置对象 |
| `complete` | — | 本轮结束 |
| `error` | `message` | 错误说明 |

## 开发代理（Vite）

开发时可将前端 `GET/POST` 到同源 `/api/*`，并将 `ws(s)://{host}/ws/...` 交给 Vite 代理到 `VITE_DEV_API_TARGET` 所指向的后端，详见仓库根目录 [README.md](../README.md)。
