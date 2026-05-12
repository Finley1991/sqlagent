# SQL Agent 智能数据分析系统

全栈示例：FastAPI 后端（LangChain + 百炼 Qwen）+ React（Vite + WebSocket + ECharts）+ SQLite 示例库。

## 仓库结构

| 目录 | 说明 |
|------|------|
| `backend/` | FastAPI、`/api/*`、`/ws/chat/{session_id}`、示例库初始化 |
| `frontend/` | 三栏布局、会话列表、实时对话与图表 |
| `docs/` | 设计说明与 [API 契约](docs/API.md) |
| `scripts/` | 示例库脚本、`e2e_http_smoke.py` 冒烟 |

## 环境要求

- Python 3.10+
- Node.js 18+（前端）
- 阿里云百炼 `DASHSCOPE_API_KEY`（自然语言查询与 WebSocket 对话）

## 快速开始

### 1. 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env：DASHSCOPE_API_KEY=...
python scripts/init_sample_db.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

若本机 **8000** 已被占用，可改用 **8010**（与下文 `VITE_DEV_API_TARGET` 保持一致）：

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8010
```

### 2. 前端

**开发（推荐）**：通过 Vite 代理访问后端，避免 CORS；在 `frontend/` 下可选创建 `.env`：

```bash
# 可选：后端地址（Vite 仅代理 /api 与 /ws 到此地址）
VITE_DEV_API_TARGET=http://127.0.0.1:8000
```

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 <http://localhost:5173>。未设置 `VITE_API_BASE` 时，开发环境使用同源相对路径，由 Vite 转发到 `VITE_DEV_API_TARGET`。

**直连后端**（不经过代理）：设置 `VITE_API_BASE`，例如：

```bash
export VITE_API_BASE=http://127.0.0.1:8010
npm run dev
```

### 3. 冒烟（HTTP，不调用大模型）

后端启动后：

```bash
export SQLAGENT_BASE_URL=http://127.0.0.1:8000   # 与 uvicorn 端口一致
make smoke
# 或: python3 scripts/e2e_http_smoke.py
```

## 文档与测试

- REST 与 WebSocket 消息格式见 [docs/API.md](docs/API.md)。
- 后端详细说明与 SQL 安全单测见 [backend/README.md](backend/README.md)。

## Makefile

| 目标 | 说明 |
|------|------|
| `make smoke` | HTTP 健康检查 + 会话创建/读取（需已启动后端） |
| `make help` | 列出常用命令 |
