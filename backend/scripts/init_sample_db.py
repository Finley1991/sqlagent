"""初始化示例电商销售数据库

用法:
    cd backend
    python scripts/init_sample_db.py

将在 data/sample.db 创建 4 张表并插入示例数据：
    - products       商品表
    - customers      客户表
    - orders         订单表
    - order_items    订单详情表
"""
from __future__ import annotations

import os
import sqlite3
from datetime import date, timedelta
from pathlib import Path
import random

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "sample.db"

SCHEMA_SQL = """
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    product_id     INTEGER PRIMARY KEY,
    product_name   TEXT    NOT NULL,
    category       TEXT    NOT NULL,
    price          REAL    NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE customers (
    customer_id    INTEGER PRIMARY KEY,
    customer_name  TEXT    NOT NULL,
    email          TEXT,
    city           TEXT,
    register_date  DATE
);

CREATE TABLE orders (
    order_id       INTEGER PRIMARY KEY,
    customer_id    INTEGER NOT NULL,
    order_date     DATE    NOT NULL,
    total_amount   REAL    NOT NULL,
    status         TEXT    NOT NULL DEFAULT 'completed',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE order_items (
    item_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id       INTEGER NOT NULL,
    product_id     INTEGER NOT NULL,
    quantity       INTEGER NOT NULL,
    unit_price     REAL    NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
"""

PRODUCTS = [
    (1, "iPhone 15 Pro",    "电子产品", 8999.00, 120),
    (2, "MacBook Air M3",   "电子产品", 9499.00,  60),
    (3, "AirPods Pro 2",    "电子产品", 1899.00, 300),
    (4, "Nike 跑步鞋",       "运动户外", 799.00,  200),
    (5, "Adidas 卫衣",       "服装",     499.00,  150),
    (6, "戴森吹风机",        "家用电器", 2990.00,  80),
    (7, "小米空气净化器",     "家用电器", 1299.00, 100),
    (8, "Kindle Paperwhite", "图书",     999.00,  220),
    (9, "乐高积木套装",       "玩具",    1599.00,  90),
    (10, "星巴克咖啡豆 1kg",  "食品",     189.00, 500),
]

CUSTOMERS = [
    (1,  "张伟",  "zhangwei@example.com",  "北京",  "2023-01-15"),
    (2,  "李娜",  "lina@example.com",      "上海",  "2023-02-20"),
    (3,  "王芳",  "wangfang@example.com",  "广州",  "2023-03-10"),
    (4,  "刘强",  "liuqiang@example.com",  "深圳",  "2023-04-05"),
    (5,  "陈静",  "chenjing@example.com",  "杭州",  "2023-05-18"),
    (6,  "杨光",  "yangguang@example.com", "成都",  "2023-06-22"),
    (7,  "赵敏",  "zhaomin@example.com",   "武汉",  "2023-07-30"),
    (8,  "孙磊",  "sunlei@example.com",    "西安",  "2023-08-12"),
    (9,  "周婷",  "zhouting@example.com",  "南京",  "2023-09-25"),
    (10, "吴昊",  "wuhao@example.com",     "重庆",  "2023-10-08"),
]


def _generate_orders(seed: int = 42) -> tuple[list, list]:
    """生成订单及订单详情。覆盖 2024 全年 12 个月的数据。"""
    random.seed(seed)
    orders: list[tuple] = []
    items: list[tuple] = []

    order_id = 1
    item_id = 1
    start = date(2024, 1, 1)

    for day_offset in range(0, 365, 3):
        order_date = start + timedelta(days=day_offset)
        n_orders = random.randint(1, 3)

        for _ in range(n_orders):
            customer_id = random.randint(1, len(CUSTOMERS))
            n_items = random.randint(1, 3)
            chosen = random.sample(PRODUCTS, n_items)

            total = 0.0
            order_item_buf: list[tuple] = []
            for prod in chosen:
                quantity = random.randint(1, 3)
                unit_price = prod[3]
                total += quantity * unit_price
                order_item_buf.append(
                    (item_id, order_id, prod[0], quantity, unit_price)
                )
                item_id += 1

            orders.append(
                (order_id, customer_id, order_date.isoformat(), round(total, 2), "completed")
            )
            items.extend(order_item_buf)
            order_id += 1

    return orders, items


def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(SCHEMA_SQL)
        conn.executemany(
            "INSERT INTO products VALUES (?,?,?,?,?)", PRODUCTS
        )
        conn.executemany(
            "INSERT INTO customers VALUES (?,?,?,?,?)", CUSTOMERS
        )

        orders, items = _generate_orders()
        conn.executemany(
            "INSERT INTO orders VALUES (?,?,?,?,?)", orders
        )
        conn.executemany(
            "INSERT INTO order_items VALUES (?,?,?,?,?)", items
        )
        conn.commit()
        print(f"[OK] 示例数据库已生成: {DB_PATH}")
        print(f"     products={len(PRODUCTS)}, customers={len(CUSTOMERS)}, "
              f"orders={len(orders)}, order_items={len(items)}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
