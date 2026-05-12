# SQL Agent - 后端服务

基于 FastAPI + LangChain + 阿里云百炼 Qwen3 的自然语言数据查询服务。

> **当前阶段**: Phase 1 — 后端基础架构（无 WebSocket / 无图表 / 无会话管理，这些在 Phase 2+ 实现）

## 快速开始

### 1. 安装依赖

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 配置 API Key

```bash
cp .env.example .env
# 编辑 .env，填入 DASHSCOPE_API_KEY
```

API Key 获取：<https://bailian.console.aliyun.com/>

### 3. 初始化示例数据库

```bash
python scripts/init_sample_db.py
```

输出示例：
```
[OK] 示例数据库已生成: backend/data/sample.db
     products=10, customers=10, orders=183, order_items=384
```

### 4. 启动服务

```bash
uvicorn app.main:app --reload --port 8000
```

访问 <http://localhost:8000/docs> 查看自动生成的 OpenAPI 文档。

## API 端点

### `POST /api/query` — 自然语言查询

请求：

```json
{ "question": "销售额最高的 3 个商品是什么" }
```

响应：

```json
{
  "question": "销售额最高的 3 个商品是什么",
  "sql": "SELECT product_name, SUM(quantity * unit_price) AS revenue FROM order_items JOIN products USING(product_id) GROUP BY product_id ORDER BY revenue DESC LIMIT 3",
  "columns": ["product_name", "revenue"],
  "rows": [["MacBook Air M3", 123456.0], ["iPhone 15 Pro", 98765.0], ["戴森吹风机", 54321.0]],
  "explanation": "销售额前三的商品是 MacBook Air M3、iPhone 15 Pro 和戴森吹风机..."
}
```

### `GET /api/health` — 健康检查

## 示例数据库 Schema

电商销售场景，包含 4 张表：

| 表 | 说明 |
|---|---|
| `products` | 商品（10 条） |
| `customers` | 客户（10 条） |
| `orders` | 订单（覆盖 2024 全年） |
| `order_items` | 订单明细 |

## 验收测试

### SQL 安全校验

```bash
python tests/test_sql_safety.py
```

应输出 `[OK] SQL 安全校验全部用例通过`。

### 端到端冒烟测试

启动服务后：

```bash
curl -X POST http://localhost:8000/api/query \
  -H 'Content-Type: application/json' \
  -d '{"question": "今年每个月有多少订单"}'
```

## 项目结构

```
backend/
├── app/
│   ├── main.py              # FastAPI 入口
│   ├── config.py            # 配置（读取 .env）
│   ├── api/query.py         # /api/query 路由
│   ├── core/
│   │   ├── llm.py           # Qwen3 LLM 封装
│   │   ├── agent.py         # SQL Agent（NL → SQL → 解释）
│   │   └── sql_safety.py    # 只读 SQL 校验
│   └── schemas/query.py     # 请求/响应 Pydantic 模型
├── data/sample.db           # 示例数据库（运行 init 脚本生成）
├── scripts/init_sample_db.py
├── tests/test_sql_safety.py
├── requirements.txt
└── .env.example
```
