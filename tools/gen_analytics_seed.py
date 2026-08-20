from datetime import date, timedelta
from pathlib import Path

rows = []
cards = [
    ("products", "商品数", 2841, 12, 2720, "COUNT"),
    ("hot", "爆品数", 186, 3, 165, "COUNT"),
    ("impression", "曝光量", 24600000, 486000, 19150000, "COUNT"),
    ("click", "点击量", 1860000, 32400, 1528000, "COUNT"),
    ("lead", "潜客量", 18642, 326, 15000, "COUNT"),
    ("order", "订单量", 3280, 68, 2760, "COUNT"),
    ("deal", "成交量", 2180, 38, 1890, "COUNT"),
]
base_id = 10088000
for i, (code, name, month, day, prev, unit) in enumerate(cards):
    rows.append((base_id + i * 3, code, name, month, unit, "2026-08"))
    rows.append((base_id + i * 3 + 1, code, name, day, unit, "2026-08-18"))
    rows.append((base_id + i * 3 + 2, code, name, prev, unit, "2026-07"))

funnel = [
    ("funnel_impression", "漏斗曝光", 24600000),
    ("funnel_click", "漏斗点击", 1860000),
    ("funnel_lead", "漏斗潜客", 186420),
    ("funnel_order", "漏斗订单", 3280),
]
for j, (c, n, v) in enumerate(funnel):
    rows.append((10088100 + j, c, n, v, "COUNT", "2026-08"))

classic = [
    ("revenue", "营收", 1428000, "USD"),
    ("leads", "线索数", 412, "COUNT"),
    ("win_rate", "成交转化率", 0.192, "RATIO"),
    ("customers", "客户增长", 48, "COUNT"),
]
for j, (c, n, v, u) in enumerate(classic):
    rows.append((10088120 + j, c, n, v, u, "2026-08"))

countries = [
    ("DEU", "德国", 864, 5840, 612),
    ("FRA", "法国", 612, 3920, 428),
    ("GBR", "英国", 448, 2860, 310),
    ("NLD", "荷兰", 324, 1980, 224),
    ("ITA", "意大利", 266, 1620, 182),
    ("ESP", "西班牙", 218, 1320, 148),
    ("POL", "波兰", 184, 1080, 124),
    ("SWE", "瑞典", 142, 860, 96),
    ("DNK", "丹麦", 118, 720, 80),
    ("AUT", "奥地利", 104, 640, 72),
    ("NOR", "挪威", 96, 580, 66),
    ("BEL", "比利时", 152, 920, 104),
    ("CHE", "瑞士", 126, 760, 88),
    ("USA", "美国", 78, 480, 52),
    ("CAN", "加拿大", 58, 360, 38),
    ("AUS", "澳大利亚", 68, 420, 46),
    ("FIN", "芬兰", 76, 460, 52),
    ("PRT", "葡萄牙", 62, 380, 42),
    ("CZE", "捷克", 68, 420, 46),
]
dim_rows = []
for j, (iso, name, orders, lead, deal) in enumerate(countries):
    dim = '{"iso":"%s","name":"%s","lead":%d,"deal":%d}' % (iso, name, lead, deal)
    dim_rows.append((10088200 + j, "orders_by_country", "国家订单", orders, "COUNT", "2026-08", dim))

products = [
    ("阳台储能系统 P2000", 724, 28960),
    ("便携储能 Rover 1000", 612, 18360),
    ("便携储能 Rover 500", 486, 9720),
    ("智能灌溉控制器 AquaX", 398, 7960),
    ("阳台储能系统 P1200", 344, 10320),
    ("STEM 拼装机器人 BuildBot", 286, 5148),
    ("智能按摩枪 PulseX Pro", 248, 7440),
    ("加热工作外套 HeatTech", 216, 8640),
    ("智能健身阻力器 FitCore", 186, 5580),
    ("露营充电套装 CampKit", 164, 4920),
]
for j, (prod, orders, rev) in enumerate(products):
    dim = '{"product":"%s","revenue":%d}' % (prod, rev)
    dim_rows.append((10088300 + j, "orders_by_product", "产品订单", orders, "COUNT", "2026-08", dim))

trend_rows = []
base = {"impression": 480000, "click": 31000, "lead": 280, "order": 58}
names = {"impression": "曝光量", "click": "点击量", "lead": "潜客量", "order": "订单量"}
tid = 10088400
for i in range(30):
    d = date(2026, 7, 20) + timedelta(days=i)
    growth = 1 + i * 0.008
    noise = 0.9 + ((i * 37) % 10) / 50.0
    for k, code in enumerate(["impression", "click", "lead", "order"]):
        val = round(base[code] * growth * noise)
        trend_rows.append((tid + i * 4 + k, code, names[code], val, "COUNT", d.isoformat()))

parts = []
parts.append("-- Decision analytics dashboard seed for NovaTech")
parts.append(
    "INSERT INTO lingxi_biz.dm_kpi_snapshot (id, tenant_id, metric_code, metric_name, metric_value, unit, period_key, created_at, updated_at, is_deleted, version)"
)
parts.append("VALUES")
parts.append(
    ",\n".join(
        f"  ({i}, 10086, '{c}', '{n}', {v}, '{u}', '{p}', NOW(), NOW(), 0, 0)"
        for i, c, n, v, u, p in rows
    )
)
parts.append(
    "ON CONFLICT (id) DO UPDATE SET metric_value = EXCLUDED.metric_value, period_key = EXCLUDED.period_key, updated_at = NOW();"
)
parts.append("")
parts.append(
    "INSERT INTO lingxi_biz.dm_kpi_snapshot (id, tenant_id, metric_code, metric_name, metric_value, unit, period_key, dimensions, created_at, updated_at, is_deleted, version)"
)
parts.append("VALUES")
parts.append(
    ",\n".join(
        f"  ({i}, 10086, '{c}', '{n}', {v}, '{u}', '{p}', '{dim}'::jsonb, NOW(), NOW(), 0, 0)"
        for i, c, n, v, u, p, dim in dim_rows
    )
)
parts.append(
    "ON CONFLICT (id) DO UPDATE SET metric_value = EXCLUDED.metric_value, dimensions = EXCLUDED.dimensions, updated_at = NOW();"
)
parts.append("")
parts.append(
    "INSERT INTO lingxi_biz.dm_kpi_snapshot (id, tenant_id, metric_code, metric_name, metric_value, unit, period_key, created_at, updated_at, is_deleted, version)"
)
parts.append("VALUES")
parts.append(
    ",\n".join(
        f"  ({i}, 10086, '{c}', '{n}', {v}, '{u}', '{p}', NOW(), NOW(), 0, 0)"
        for i, c, n, v, u, p in trend_rows
    )
)
parts.append(
    "ON CONFLICT (id) DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();"
)

out = Path(__file__).resolve().parents[1] / "lingxi-server" / "src" / "main" / "resources" / "db" / "migration" / "_analytics_seed_fragment.sql"
out.write_text("\n".join(parts) + "\n", encoding="utf-8")
print(out, "bytes", out.stat().st_size)
