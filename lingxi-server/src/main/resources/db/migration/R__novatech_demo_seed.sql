-- NovaTech demo seed (idempotent). See docs/NovaTech演示租户Seed规范.md
INSERT INTO lingxi_core.sys_tenant (
  id, legacy_id, biz_code, name, plan_code, industry, region, timezone, language, status, created_at, updated_at, is_deleted, version
) VALUES (
  10086, 'f0000001-1111-1111-1111-111111111101', 'nova', 'NovaTech 出海事业部', 'Enterprise',
  '新能源 / 储能设备', '亚太', 'Asia/Shanghai', 'zh-CN', 'ACTIVE', NOW(), NOW(), 0, 0
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_core.sys_user (
  id, legacy_id, tenant_id, biz_code, email, display_name, staff_type, department, title, phone, is_active, created_at, updated_at, is_deleted, version
) VALUES
  (10086001, 'f0000011-1111-1111-1111-111111111101', 10086, 'EMP-LIN', 'lin@novatech.com', '林启涛', 'HUMAN', '产品', '产品战略总监', '13800000001', TRUE, NOW(), NOW(), 0, 0),
  (10086002, 'f0000012-1111-1111-1111-111111111102', 10086, 'EMP-SU', 'su@novatech.com', '苏晓', 'HUMAN', '营销', '品牌营销总监', '13800000002', TRUE, NOW(), NOW(), 0, 0),
  (10086003, 'f0000013-1111-1111-1111-111111111103', 10086, 'EMP-HE', 'he@novatech.com', '何知远', 'HUMAN', '销售', '全球销售副总裁', '13800000003', TRUE, NOW(), NOW(), 0, 0),
  (10086007, 'f0000017-1111-1111-1111-111111111107', 10086, 'EMP-ZHOU', 'zhou@novatech.com', '周赫', 'HUMAN', '营销', '内容中台负责人', '13800000007', TRUE, NOW(), NOW(), 0, 0),
  (10086009, 'f0000019-1111-1111-1111-111111111109', 10086, 'EMP-LINXIAO', 'linxiao@novatech.com', '林晓', 'HUMAN', '销售', '大客户销售经理', '13800000009', TRUE, NOW(), NOW(), 0, 0),
  (10086010, 'f000001a-1111-1111-1111-11111111110a', 10086, 'EMP-ZHAO', 'zhaolei@novatech.com', '赵磊', 'HUMAN', '销售', '销售顾问', '13800000010', TRUE, NOW(), NOW(), 0, 0),
  (10086011, 'f000001b-1111-1111-1111-11111111110b', 10086, 'EMP-SHEN', 'product@novatech.com', '沈拓', 'HUMAN', '产品', '产品专家', '13800000011', TRUE, NOW(), NOW(), 0, 0),
  (10086021, 'f0000021-1111-1111-1111-111111111101', 10086, 'AGT-SAGE', 'sage@novatech.ai', 'Sage', 'AGENT', '智能体', '经营决策专家', NULL, TRUE, NOW(), NOW(), 0, 0),
  (10086022, 'f0000022-1111-1111-1111-111111111102', 10086, 'AGT-ATLAS', 'atlas@novatech.ai', 'Atlas', 'AGENT', '智能体', '市场分析师', NULL, TRUE, NOW(), NOW(), 0, 0),
  (10086023, 'f0000023-1111-1111-1111-111111111103', 10086, 'AGT-MUSE', 'muse@novatech.ai', 'Muse', 'AGENT', '智能体', '内容创意师', NULL, TRUE, NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_platform.cc_industry (id, tenant_id, industry_code, industry_name, created_at, updated_at, is_deleted, version)
VALUES (10086101, 10086, 'NEW_ENERGY_STORAGE', '新能源 / 储能设备', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_core.dc_customer (id, tenant_id, biz_code, name, customer_type, country, industry, website, owner_user_id, created_at, updated_at, is_deleted, version)
VALUES
  (10086201, 10086, 'CUS-1048', 'Iberia Solar SL', 'ENTERPRISE', 'ES', '新能源', 'https://iberia-solar.example', 10086009, NOW(), NOW(), 0, 0),
  (10086202, 10086, 'CUS-1042', 'Nordic Home Energy', 'ENTERPRISE', 'DE', '储能', 'https://nordic-home.example', 10086010, NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_core.dc_product (id, tenant_id, biz_code, sku, name_i18n, brand, category, hs_code, created_at, updated_at, is_deleted, version)
VALUES
  (10086301, 10086, 'PRD-P2000', 'P2000', '{"zh-CN":"P2000 阳台储能","en-US":"P2000 Balcony ESS"}'::jsonb, 'NovaTech', '储能', '8507.60', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_core.dc_channel (id, tenant_id, biz_code, name, channel_type, cover_region, created_at, updated_at, is_deleted, version)
VALUES
  (10086401, 10086, 'CH-DIRECT', '直销', 'DIRECT', 'EU', NOW(), NOW(), 0, 0),
  (10086402, 10086, 'CH-SOCIAL', '社媒获客', 'SOCIAL', 'GLOBAL', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_biz.sales_lead (id, tenant_id, biz_code, company_name, contact_name, email, country, source_channel, score, status, owner_user_id, customer_id, website, domain, pool_at, created_at, updated_at, is_deleted, version)
VALUES
  (10086501, 10086, 'LEAD-1001', 'Iberia Solar SL', 'Diego Ruiz', 'diego@iberia.example', 'ES', 'SOCIAL', 85, 'ASSIGNED', 10086003, 10086201, 'https://iberia.example', 'iberia.example', NULL, NOW(), NOW(), 0, 0),
  (10086502, 10086, 'LEAD-1002', 'Alpine Green Tech', 'Anna Keller', 'anna@alpine.example', 'DE', 'WEBSITE', 72, 'POOL', NULL, NULL, 'https://alpine.example', 'alpine.example', NOW(), NOW(), NOW(), 0, 0),
  (10086503, 10086, 'LEAD-1003', 'Nordic Home Energy', 'Erik Lund', 'erik@nordic.example', 'SE', 'EXHIBITION', 90, 'CONVERTED', 10086003, 10086202, 'https://nordic.example', 'nordic.example', NULL, NOW(), NOW(), 0, 0),
  (10086504, 10086, 'LEAD-1004', 'KRAUSE GmbH', 'Hans Krause', 'hans@krause.example', 'DE', 'WEBSITE', 88, 'POOL', NULL, NULL, 'https://krause.example', 'krause.example', NOW(), NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_biz.sales_lead_follow (id, tenant_id, lead_id, follow_type, content, next_follow_at, operator_id, created_at, updated_at, is_deleted, version)
VALUES
  (10086551, 10086, 10086501, 'CALL', '首次电话确认需求：阳台储能 50 台询价', NOW() + INTERVAL '2 day', 10086003, NOW(), NOW(), 0, 0),
  (10086552, 10086, 10086501, 'EMAIL', '已发送产品手册与报价草稿', NOW() + INTERVAL '1 day', 10086003, NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_biz.uw_inquiry_event (id, tenant_id, biz_code, title, channel, contact_name, contact_email, company_name, lead_id, status, created_at, updated_at, is_deleted, version)
VALUES
  (10087601, 10086, 'INQ-3001', '新询盘：Alpine Green Tech', 'WEBSITE', 'Anna Keller', 'anna@alpine.example', 'Alpine Green Tech', 10086502, 'NEW', NOW(), NOW(), 0, 0),
  (10087602, 10086, 'INQ-3002', '新询盘：KRAUSE GmbH', 'WEBSITE', 'Hans Krause', 'hans@krause.example', 'KRAUSE GmbH', 10086504, 'NEW', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_biz.uw_task (id, tenant_id, biz_code, title, task_type, status, priority, assignee_id, due_at, source_type, source_id, created_at, updated_at, is_deleted, version)
VALUES
  (10087701, 10086, 'TASK-4001', '跟进今日新线索 · Alpine Green Tech', 'INQUIRY', 'OPEN', 90, 10086001, NOW() + INTERVAL '1 day', 'INQUIRY', 10087601, NOW(), NOW(), 0, 0),
  (10087702, 10086, 'TASK-4002', '推进报价中的商机 · Iberia 50台阳台储能', 'OPPORTUNITY', 'OPEN', 70, 10086003, NOW() + INTERVAL '2 day', 'OPPORTUNITY', 10086601, NOW(), NOW(), 0, 0),
  (10087703, 10086, 'TASK-4003', '确认询盘：KRAUSE GmbH', 'INQUIRY', 'OPEN', 85, 10086001, NOW() + INTERVAL '1 day', 'INQUIRY', 10087602, NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

UPDATE lingxi_biz.sales_lead SET
  website = COALESCE(website, 'https://' || lower(split_part(email, '@', 2))),
  domain = COALESCE(domain, lower(split_part(email, '@', 2))),
  status = CASE WHEN owner_user_id IS NULL AND status = 'NEW' THEN 'POOL' ELSE status END,
  pool_at = CASE WHEN owner_user_id IS NULL AND pool_at IS NULL THEN NOW() ELSE pool_at END,
  updated_at = NOW()
WHERE tenant_id = 10086 AND id IN (10086501, 10086502, 10086503, 10086504);

INSERT INTO lingxi_biz.sales_opportunity (id, tenant_id, biz_code, name, customer_id, lead_id, stage, amount_minor, currency, owner_user_id, created_at, updated_at, is_deleted, version)
VALUES
  (10086601, 10086, 'OPP-2001', 'Iberia 50台阳台储能', 10086201, 10086501, 'QUOTE', 12500000, 'EUR', 10086009, NOW(), NOW(), 0, 0),
  (10086602, 10086, 'OPP-2002', 'Nordic 复购谈判', 10086202, 10086503, 'NEGOTIATE', 8800000, 'EUR', 10086010, NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_biz.mkt_hot_keyword (id, tenant_id, keyword, category, region, heat_score, trend, created_at, updated_at, is_deleted, version)
VALUES
  (10086701, 10086, 'balcony solar battery', '储能', 'DE', 92, 'UP', NOW(), NOW(), 0, 0),
  (10086702, 10086, 'home energy storage', '储能', 'EU', 88, 'UP', NOW(), NOW(), 0, 0),
  (10086703, 10086, 'portable power station', '电源', 'US', 76, 'FLAT', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_biz.mkt_search_trend (id, tenant_id, keyword, region, metric_date, index_value, created_at, updated_at, is_deleted, version)
VALUES
  (10086801, 10086, 'balcony solar battery', 'DE', CURRENT_DATE - 14, 62, NOW(), NOW(), 0, 0),
  (10086802, 10086, 'balcony solar battery', 'DE', CURRENT_DATE - 7, 78, NOW(), NOW(), 0, 0),
  (10086803, 10086, 'balcony solar battery', 'DE', CURRENT_DATE, 92, NOW(), NOW(), 0, 0),
  (10086804, 10086, 'balcony solar battery', 'ES', CURRENT_DATE, 71, NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_biz.mkt_opportunity (id, tenant_id, biz_code, title, product_hint, target_market, score, summary, status, created_at, updated_at, is_deleted, version)
VALUES
  (10086901, 10086, 'MKT-OPP-01', '德国阳台储能上升机会', 'P2000', 'DE', 91, '搜索指数两周上升约30%，建议社媒内容+线索跟进', 'OPEN', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_biz.mkg_social_account (id, tenant_id, platform, account_name, auth_status, created_at, updated_at, is_deleted, version)
VALUES
  (10087001, 10086, 'tiktok', '@novatech_energy', 'CONNECTED', NOW(), NOW(), 0, 0),
  (10087002, 10086, 'instagram', '@novatech.global', 'CONNECTED', NOW(), NOW(), 0, 0),
  (10087003, 10086, 'linkedin', 'NovaTech Energy', 'DISCONNECTED', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_biz.mkg_content_asset (id, tenant_id, biz_code, title, content_type, body, locale, status, created_at, updated_at, is_deleted, version)
VALUES
  (10087101, 10086, 'CT-8821', '阳台储能安装30秒短视频脚本', 'SCRIPT', 'Hook: 电费又涨了？… CTA: 留言获取方案', 'zh-CN', 'READY', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_biz.dm_kpi_snapshot (id, tenant_id, metric_code, metric_name, metric_value, unit, period_key, created_at, updated_at, is_deleted, version)
VALUES
  (10087201, 10086, 'revenue', '营收', 1285000, 'USD', '2026-07', NOW(), NOW(), 0, 0),
  (10087202, 10086, 'leads', '线索数', 326, 'COUNT', '2026-07', NOW(), NOW(), 0, 0),
  (10087203, 10086, 'win_rate', '成交转化率', 0.184, 'RATIO', '2026-07', NOW(), NOW(), 0, 0),
  (10087204, 10086, 'customers', '客户增长', 42, 'COUNT', '2026-07', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_platform.kc_template (id, tenant_id, biz_code, name, category, locale, body, created_at, updated_at, is_deleted, version)
VALUES
  (10087301, 10086, 'TPL-DEV-01', '储能开发信模板', 'OUTREACH', 'en-US', 'Hi {{name}}, we help European homes cut energy bills with balcony ESS…', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_platform.kc_script (id, tenant_id, biz_code, scene, locale, body, created_at, updated_at, is_deleted, version)
VALUES
  (10087401, 10086, 'SCR-FOLLOW-01', 'FOLLOW_UP', 'zh-CN', '您好，关于上次沟通的阳台储能方案，方便本周安排一次在线演示吗？', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lingxi_platform.kc_prompt (id, tenant_id, prompt_code, name, agent_domain, body, version_label, created_at, updated_at, is_deleted, version)
VALUES
  (10087501, 10086, 'prompt.market.opportunity.scan.v1', '市场机会扫描', 'market', '你是市场分析智能体。基于搜索趋势与热词，输出高潜力产品/市场组合…', 'v1', NOW(), NOW(), 0, 0),
  (10087502, 10086, 'prompt.mkg.content.generate.v1', '社媒内容生成', 'marketing', '你是社媒营销智能体。按品牌调性生成多语言短内容…', 'v1', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Decision analytics dashboard seed for NovaTech
INSERT INTO lingxi_biz.dm_kpi_snapshot (id, tenant_id, metric_code, metric_name, metric_value, unit, period_key, created_at, updated_at, is_deleted, version)
VALUES
  (10088000, 10086, 'products', '商品数', 2841, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088001, 10086, 'products', '商品数', 12, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0),
  (10088002, 10086, 'products', '商品数', 2720, 'COUNT', '2026-07', NOW(), NOW(), 0, 0),
  (10088003, 10086, 'hot', '爆品数', 186, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088004, 10086, 'hot', '爆品数', 3, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0),
  (10088005, 10086, 'hot', '爆品数', 165, 'COUNT', '2026-07', NOW(), NOW(), 0, 0),
  (10088006, 10086, 'impression', '曝光量', 24600000, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088007, 10086, 'impression', '曝光量', 486000, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0),
  (10088008, 10086, 'impression', '曝光量', 19150000, 'COUNT', '2026-07', NOW(), NOW(), 0, 0),
  (10088009, 10086, 'click', '点击量', 1860000, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088010, 10086, 'click', '点击量', 32400, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0),
  (10088011, 10086, 'click', '点击量', 1528000, 'COUNT', '2026-07', NOW(), NOW(), 0, 0),
  (10088012, 10086, 'lead', '潜客量', 18642, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088013, 10086, 'lead', '潜客量', 326, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0),
  (10088014, 10086, 'lead', '潜客量', 15000, 'COUNT', '2026-07', NOW(), NOW(), 0, 0),
  (10088015, 10086, 'order', '订单量', 3280, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088016, 10086, 'order', '订单量', 68, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0),
  (10088017, 10086, 'order', '订单量', 2760, 'COUNT', '2026-07', NOW(), NOW(), 0, 0),
  (10088018, 10086, 'deal', '成交量', 2180, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088019, 10086, 'deal', '成交量', 38, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0),
  (10088020, 10086, 'deal', '成交量', 1890, 'COUNT', '2026-07', NOW(), NOW(), 0, 0),
  (10088100, 10086, 'funnel_impression', '漏斗曝光', 24600000, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088101, 10086, 'funnel_click', '漏斗点击', 1860000, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088102, 10086, 'funnel_lead', '漏斗潜客', 186420, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088103, 10086, 'funnel_order', '漏斗订单', 3280, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088120, 10086, 'revenue', '营收', 1428000, 'USD', '2026-08', NOW(), NOW(), 0, 0),
  (10088121, 10086, 'leads', '线索数', 412, 'COUNT', '2026-08', NOW(), NOW(), 0, 0),
  (10088122, 10086, 'win_rate', '成交转化率', 0.192, 'RATIO', '2026-08', NOW(), NOW(), 0, 0),
  (10088123, 10086, 'customers', '客户增长', 48, 'COUNT', '2026-08', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO UPDATE SET metric_value = EXCLUDED.metric_value, period_key = EXCLUDED.period_key, updated_at = NOW();

INSERT INTO lingxi_biz.dm_kpi_snapshot (id, tenant_id, metric_code, metric_name, metric_value, unit, period_key, dimensions, created_at, updated_at, is_deleted, version)
VALUES
  (10088200, 10086, 'orders_by_country', '国家订单', 864, 'COUNT', '2026-08', '{"iso":"DEU","name":"德国","lead":5840,"deal":612}'::jsonb, NOW(), NOW(), 0, 0),
  (10088201, 10086, 'orders_by_country', '国家订单', 612, 'COUNT', '2026-08', '{"iso":"FRA","name":"法国","lead":3920,"deal":428}'::jsonb, NOW(), NOW(), 0, 0),
  (10088202, 10086, 'orders_by_country', '国家订单', 448, 'COUNT', '2026-08', '{"iso":"GBR","name":"英国","lead":2860,"deal":310}'::jsonb, NOW(), NOW(), 0, 0),
  (10088203, 10086, 'orders_by_country', '国家订单', 324, 'COUNT', '2026-08', '{"iso":"NLD","name":"荷兰","lead":1980,"deal":224}'::jsonb, NOW(), NOW(), 0, 0),
  (10088204, 10086, 'orders_by_country', '国家订单', 266, 'COUNT', '2026-08', '{"iso":"ITA","name":"意大利","lead":1620,"deal":182}'::jsonb, NOW(), NOW(), 0, 0),
  (10088205, 10086, 'orders_by_country', '国家订单', 218, 'COUNT', '2026-08', '{"iso":"ESP","name":"西班牙","lead":1320,"deal":148}'::jsonb, NOW(), NOW(), 0, 0),
  (10088206, 10086, 'orders_by_country', '国家订单', 184, 'COUNT', '2026-08', '{"iso":"POL","name":"波兰","lead":1080,"deal":124}'::jsonb, NOW(), NOW(), 0, 0),
  (10088207, 10086, 'orders_by_country', '国家订单', 142, 'COUNT', '2026-08', '{"iso":"SWE","name":"瑞典","lead":860,"deal":96}'::jsonb, NOW(), NOW(), 0, 0),
  (10088208, 10086, 'orders_by_country', '国家订单', 118, 'COUNT', '2026-08', '{"iso":"DNK","name":"丹麦","lead":720,"deal":80}'::jsonb, NOW(), NOW(), 0, 0),
  (10088209, 10086, 'orders_by_country', '国家订单', 104, 'COUNT', '2026-08', '{"iso":"AUT","name":"奥地利","lead":640,"deal":72}'::jsonb, NOW(), NOW(), 0, 0),
  (10088210, 10086, 'orders_by_country', '国家订单', 96, 'COUNT', '2026-08', '{"iso":"NOR","name":"挪威","lead":580,"deal":66}'::jsonb, NOW(), NOW(), 0, 0),
  (10088211, 10086, 'orders_by_country', '国家订单', 152, 'COUNT', '2026-08', '{"iso":"BEL","name":"比利时","lead":920,"deal":104}'::jsonb, NOW(), NOW(), 0, 0),
  (10088212, 10086, 'orders_by_country', '国家订单', 126, 'COUNT', '2026-08', '{"iso":"CHE","name":"瑞士","lead":760,"deal":88}'::jsonb, NOW(), NOW(), 0, 0),
  (10088213, 10086, 'orders_by_country', '国家订单', 78, 'COUNT', '2026-08', '{"iso":"USA","name":"美国","lead":480,"deal":52}'::jsonb, NOW(), NOW(), 0, 0),
  (10088214, 10086, 'orders_by_country', '国家订单', 58, 'COUNT', '2026-08', '{"iso":"CAN","name":"加拿大","lead":360,"deal":38}'::jsonb, NOW(), NOW(), 0, 0),
  (10088215, 10086, 'orders_by_country', '国家订单', 68, 'COUNT', '2026-08', '{"iso":"AUS","name":"澳大利亚","lead":420,"deal":46}'::jsonb, NOW(), NOW(), 0, 0),
  (10088216, 10086, 'orders_by_country', '国家订单', 76, 'COUNT', '2026-08', '{"iso":"FIN","name":"芬兰","lead":460,"deal":52}'::jsonb, NOW(), NOW(), 0, 0),
  (10088217, 10086, 'orders_by_country', '国家订单', 62, 'COUNT', '2026-08', '{"iso":"PRT","name":"葡萄牙","lead":380,"deal":42}'::jsonb, NOW(), NOW(), 0, 0),
  (10088218, 10086, 'orders_by_country', '国家订单', 68, 'COUNT', '2026-08', '{"iso":"CZE","name":"捷克","lead":420,"deal":46}'::jsonb, NOW(), NOW(), 0, 0),
  (10088300, 10086, 'orders_by_product', '产品订单', 724, 'COUNT', '2026-08', '{"product":"阳台储能系统 P2000","revenue":28960}'::jsonb, NOW(), NOW(), 0, 0),
  (10088301, 10086, 'orders_by_product', '产品订单', 612, 'COUNT', '2026-08', '{"product":"便携储能 Rover 1000","revenue":18360}'::jsonb, NOW(), NOW(), 0, 0),
  (10088302, 10086, 'orders_by_product', '产品订单', 486, 'COUNT', '2026-08', '{"product":"便携储能 Rover 500","revenue":9720}'::jsonb, NOW(), NOW(), 0, 0),
  (10088303, 10086, 'orders_by_product', '产品订单', 398, 'COUNT', '2026-08', '{"product":"智能灌溉控制器 AquaX","revenue":7960}'::jsonb, NOW(), NOW(), 0, 0),
  (10088304, 10086, 'orders_by_product', '产品订单', 344, 'COUNT', '2026-08', '{"product":"阳台储能系统 P1200","revenue":10320}'::jsonb, NOW(), NOW(), 0, 0),
  (10088305, 10086, 'orders_by_product', '产品订单', 286, 'COUNT', '2026-08', '{"product":"STEM 拼装机器人 BuildBot","revenue":5148}'::jsonb, NOW(), NOW(), 0, 0),
  (10088306, 10086, 'orders_by_product', '产品订单', 248, 'COUNT', '2026-08', '{"product":"智能按摩枪 PulseX Pro","revenue":7440}'::jsonb, NOW(), NOW(), 0, 0),
  (10088307, 10086, 'orders_by_product', '产品订单', 216, 'COUNT', '2026-08', '{"product":"加热工作外套 HeatTech","revenue":8640}'::jsonb, NOW(), NOW(), 0, 0),
  (10088308, 10086, 'orders_by_product', '产品订单', 186, 'COUNT', '2026-08', '{"product":"智能健身阻力器 FitCore","revenue":5580}'::jsonb, NOW(), NOW(), 0, 0),
  (10088309, 10086, 'orders_by_product', '产品订单', 164, 'COUNT', '2026-08', '{"product":"露营充电套装 CampKit","revenue":4920}'::jsonb, NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO UPDATE SET metric_value = EXCLUDED.metric_value, dimensions = EXCLUDED.dimensions, updated_at = NOW();

INSERT INTO lingxi_biz.dm_kpi_snapshot (id, tenant_id, metric_code, metric_name, metric_value, unit, period_key, created_at, updated_at, is_deleted, version)
VALUES
  (10088400, 10086, 'impression', '曝光量', 432000, 'COUNT', '2026-07-20', NOW(), NOW(), 0, 0),
  (10088401, 10086, 'click', '点击量', 27900, 'COUNT', '2026-07-20', NOW(), NOW(), 0, 0),
  (10088402, 10086, 'lead', '潜客量', 252, 'COUNT', '2026-07-20', NOW(), NOW(), 0, 0),
  (10088403, 10086, 'order', '订单量', 52, 'COUNT', '2026-07-20', NOW(), NOW(), 0, 0),
  (10088404, 10086, 'impression', '曝光量', 503194, 'COUNT', '2026-07-21', NOW(), NOW(), 0, 0),
  (10088405, 10086, 'click', '点击量', 32498, 'COUNT', '2026-07-21', NOW(), NOW(), 0, 0),
  (10088406, 10086, 'lead', '潜客量', 294, 'COUNT', '2026-07-21', NOW(), NOW(), 0, 0),
  (10088407, 10086, 'order', '订单量', 61, 'COUNT', '2026-07-21', NOW(), NOW(), 0, 0),
  (10088408, 10086, 'impression', '曝光量', 477926, 'COUNT', '2026-07-22', NOW(), NOW(), 0, 0),
  (10088409, 10086, 'click', '点击量', 30866, 'COUNT', '2026-07-22', NOW(), NOW(), 0, 0),
  (10088410, 10086, 'lead', '潜客量', 279, 'COUNT', '2026-07-22', NOW(), NOW(), 0, 0),
  (10088411, 10086, 'order', '订单量', 58, 'COUNT', '2026-07-22', NOW(), NOW(), 0, 0),
  (10088412, 10086, 'impression', '曝光量', 452198, 'COUNT', '2026-07-23', NOW(), NOW(), 0, 0),
  (10088413, 10086, 'click', '点击量', 29204, 'COUNT', '2026-07-23', NOW(), NOW(), 0, 0),
  (10088414, 10086, 'lead', '潜客量', 264, 'COUNT', '2026-07-23', NOW(), NOW(), 0, 0),
  (10088415, 10086, 'order', '订单量', 55, 'COUNT', '2026-07-23', NOW(), NOW(), 0, 0),
  (10088416, 10086, 'impression', '曝光量', 525082, 'COUNT', '2026-07-24', NOW(), NOW(), 0, 0),
  (10088417, 10086, 'click', '点击量', 33912, 'COUNT', '2026-07-24', NOW(), NOW(), 0, 0),
  (10088418, 10086, 'lead', '潜客量', 306, 'COUNT', '2026-07-24', NOW(), NOW(), 0, 0),
  (10088419, 10086, 'order', '订单量', 63, 'COUNT', '2026-07-24', NOW(), NOW(), 0, 0),
  (10088420, 10086, 'impression', '曝光量', 499200, 'COUNT', '2026-07-25', NOW(), NOW(), 0, 0),
  (10088421, 10086, 'click', '点击量', 32240, 'COUNT', '2026-07-25', NOW(), NOW(), 0, 0),
  (10088422, 10086, 'lead', '潜客量', 291, 'COUNT', '2026-07-25', NOW(), NOW(), 0, 0),
  (10088423, 10086, 'order', '订单量', 60, 'COUNT', '2026-07-25', NOW(), NOW(), 0, 0),
  (10088424, 10086, 'impression', '曝光量', 472858, 'COUNT', '2026-07-26', NOW(), NOW(), 0, 0),
  (10088425, 10086, 'click', '点击量', 30539, 'COUNT', '2026-07-26', NOW(), NOW(), 0, 0),
  (10088426, 10086, 'lead', '潜客量', 276, 'COUNT', '2026-07-26', NOW(), NOW(), 0, 0),
  (10088427, 10086, 'order', '订单量', 57, 'COUNT', '2026-07-26', NOW(), NOW(), 0, 0),
  (10088428, 10086, 'impression', '曝光量', 547430, 'COUNT', '2026-07-27', NOW(), NOW(), 0, 0),
  (10088429, 10086, 'click', '点击量', 35355, 'COUNT', '2026-07-27', NOW(), NOW(), 0, 0),
  (10088430, 10086, 'lead', '潜客量', 319, 'COUNT', '2026-07-27', NOW(), NOW(), 0, 0),
  (10088431, 10086, 'order', '订单量', 66, 'COUNT', '2026-07-27', NOW(), NOW(), 0, 0),
  (10088432, 10086, 'impression', '曝光量', 520934, 'COUNT', '2026-07-28', NOW(), NOW(), 0, 0),
  (10088433, 10086, 'click', '点击量', 33644, 'COUNT', '2026-07-28', NOW(), NOW(), 0, 0),
  (10088434, 10086, 'lead', '潜客量', 304, 'COUNT', '2026-07-28', NOW(), NOW(), 0, 0),
  (10088435, 10086, 'order', '订单量', 63, 'COUNT', '2026-07-28', NOW(), NOW(), 0, 0),
  (10088436, 10086, 'impression', '曝光量', 493978, 'COUNT', '2026-07-29', NOW(), NOW(), 0, 0),
  (10088437, 10086, 'click', '点击量', 31903, 'COUNT', '2026-07-29', NOW(), NOW(), 0, 0),
  (10088438, 10086, 'lead', '潜客量', 288, 'COUNT', '2026-07-29', NOW(), NOW(), 0, 0),
  (10088439, 10086, 'order', '订单量', 60, 'COUNT', '2026-07-29', NOW(), NOW(), 0, 0),
  (10088440, 10086, 'impression', '曝光量', 466560, 'COUNT', '2026-07-30', NOW(), NOW(), 0, 0),
  (10088441, 10086, 'click', '点击量', 30132, 'COUNT', '2026-07-30', NOW(), NOW(), 0, 0),
  (10088442, 10086, 'lead', '潜客量', 272, 'COUNT', '2026-07-30', NOW(), NOW(), 0, 0),
  (10088443, 10086, 'order', '订单量', 56, 'COUNT', '2026-07-30', NOW(), NOW(), 0, 0),
  (10088444, 10086, 'impression', '曝光量', 543130, 'COUNT', '2026-07-31', NOW(), NOW(), 0, 0),
  (10088445, 10086, 'click', '点击量', 35077, 'COUNT', '2026-07-31', NOW(), NOW(), 0, 0),
  (10088446, 10086, 'lead', '潜客量', 317, 'COUNT', '2026-07-31', NOW(), NOW(), 0, 0),
  (10088447, 10086, 'order', '订单量', 66, 'COUNT', '2026-07-31', NOW(), NOW(), 0, 0),
  (10088448, 10086, 'impression', '曝光量', 515558, 'COUNT', '2026-08-01', NOW(), NOW(), 0, 0),
  (10088449, 10086, 'click', '点击量', 33296, 'COUNT', '2026-08-01', NOW(), NOW(), 0, 0),
  (10088450, 10086, 'lead', '潜客量', 301, 'COUNT', '2026-08-01', NOW(), NOW(), 0, 0),
  (10088451, 10086, 'order', '订单量', 62, 'COUNT', '2026-08-01', NOW(), NOW(), 0, 0),
  (10088452, 10086, 'impression', '曝光量', 487526, 'COUNT', '2026-08-02', NOW(), NOW(), 0, 0),
  (10088453, 10086, 'click', '点击量', 31486, 'COUNT', '2026-08-02', NOW(), NOW(), 0, 0),
  (10088454, 10086, 'lead', '潜客量', 284, 'COUNT', '2026-08-02', NOW(), NOW(), 0, 0),
  (10088455, 10086, 'order', '订单量', 59, 'COUNT', '2026-08-02', NOW(), NOW(), 0, 0),
  (10088456, 10086, 'impression', '曝光量', 565786, 'COUNT', '2026-08-03', NOW(), NOW(), 0, 0),
  (10088457, 10086, 'click', '点击量', 36540, 'COUNT', '2026-08-03', NOW(), NOW(), 0, 0),
  (10088458, 10086, 'lead', '潜客量', 330, 'COUNT', '2026-08-03', NOW(), NOW(), 0, 0),
  (10088459, 10086, 'order', '订单量', 68, 'COUNT', '2026-08-03', NOW(), NOW(), 0, 0),
  (10088460, 10086, 'impression', '曝光量', 537600, 'COUNT', '2026-08-04', NOW(), NOW(), 0, 0),
  (10088461, 10086, 'click', '点击量', 34720, 'COUNT', '2026-08-04', NOW(), NOW(), 0, 0),
  (10088462, 10086, 'lead', '潜客量', 314, 'COUNT', '2026-08-04', NOW(), NOW(), 0, 0),
  (10088463, 10086, 'order', '订单量', 65, 'COUNT', '2026-08-04', NOW(), NOW(), 0, 0),
  (10088464, 10086, 'impression', '曝光量', 508954, 'COUNT', '2026-08-05', NOW(), NOW(), 0, 0),
  (10088465, 10086, 'click', '点击量', 32870, 'COUNT', '2026-08-05', NOW(), NOW(), 0, 0),
  (10088466, 10086, 'lead', '潜客量', 297, 'COUNT', '2026-08-05', NOW(), NOW(), 0, 0),
  (10088467, 10086, 'order', '订单量', 61, 'COUNT', '2026-08-05', NOW(), NOW(), 0, 0),
  (10088468, 10086, 'impression', '曝光量', 588902, 'COUNT', '2026-08-06', NOW(), NOW(), 0, 0),
  (10088469, 10086, 'click', '点击量', 38033, 'COUNT', '2026-08-06', NOW(), NOW(), 0, 0),
  (10088470, 10086, 'lead', '潜客量', 344, 'COUNT', '2026-08-06', NOW(), NOW(), 0, 0),
  (10088471, 10086, 'order', '订单量', 71, 'COUNT', '2026-08-06', NOW(), NOW(), 0, 0),
  (10088472, 10086, 'impression', '曝光量', 560102, 'COUNT', '2026-08-07', NOW(), NOW(), 0, 0),
  (10088473, 10086, 'click', '点击量', 36173, 'COUNT', '2026-08-07', NOW(), NOW(), 0, 0),
  (10088474, 10086, 'lead', '潜客量', 327, 'COUNT', '2026-08-07', NOW(), NOW(), 0, 0),
  (10088475, 10086, 'order', '订单量', 68, 'COUNT', '2026-08-07', NOW(), NOW(), 0, 0),
  (10088476, 10086, 'impression', '曝光量', 530842, 'COUNT', '2026-08-08', NOW(), NOW(), 0, 0),
  (10088477, 10086, 'click', '点击量', 34284, 'COUNT', '2026-08-08', NOW(), NOW(), 0, 0),
  (10088478, 10086, 'lead', '潜客量', 310, 'COUNT', '2026-08-08', NOW(), NOW(), 0, 0),
  (10088479, 10086, 'order', '订单量', 64, 'COUNT', '2026-08-08', NOW(), NOW(), 0, 0),
  (10088480, 10086, 'impression', '曝光量', 501120, 'COUNT', '2026-08-09', NOW(), NOW(), 0, 0),
  (10088481, 10086, 'click', '点击量', 32364, 'COUNT', '2026-08-09', NOW(), NOW(), 0, 0),
  (10088482, 10086, 'lead', '潜客量', 292, 'COUNT', '2026-08-09', NOW(), NOW(), 0, 0),
  (10088483, 10086, 'order', '订单量', 61, 'COUNT', '2026-08-09', NOW(), NOW(), 0, 0),
  (10088484, 10086, 'impression', '曝光量', 583066, 'COUNT', '2026-08-10', NOW(), NOW(), 0, 0),
  (10088485, 10086, 'click', '点击量', 37656, 'COUNT', '2026-08-10', NOW(), NOW(), 0, 0),
  (10088486, 10086, 'lead', '潜客量', 340, 'COUNT', '2026-08-10', NOW(), NOW(), 0, 0),
  (10088487, 10086, 'order', '订单量', 70, 'COUNT', '2026-08-10', NOW(), NOW(), 0, 0),
  (10088488, 10086, 'impression', '曝光量', 553190, 'COUNT', '2026-08-11', NOW(), NOW(), 0, 0),
  (10088489, 10086, 'click', '点击量', 35727, 'COUNT', '2026-08-11', NOW(), NOW(), 0, 0),
  (10088490, 10086, 'lead', '潜客量', 323, 'COUNT', '2026-08-11', NOW(), NOW(), 0, 0),
  (10088491, 10086, 'order', '订单量', 67, 'COUNT', '2026-08-11', NOW(), NOW(), 0, 0),
  (10088492, 10086, 'impression', '曝光量', 522854, 'COUNT', '2026-08-12', NOW(), NOW(), 0, 0),
  (10088493, 10086, 'click', '点击量', 33768, 'COUNT', '2026-08-12', NOW(), NOW(), 0, 0),
  (10088494, 10086, 'lead', '潜客量', 305, 'COUNT', '2026-08-12', NOW(), NOW(), 0, 0),
  (10088495, 10086, 'order', '订单量', 63, 'COUNT', '2026-08-12', NOW(), NOW(), 0, 0),
  (10088496, 10086, 'impression', '曝光量', 606490, 'COUNT', '2026-08-13', NOW(), NOW(), 0, 0),
  (10088497, 10086, 'click', '点击量', 39169, 'COUNT', '2026-08-13', NOW(), NOW(), 0, 0),
  (10088498, 10086, 'lead', '潜客量', 354, 'COUNT', '2026-08-13', NOW(), NOW(), 0, 0),
  (10088499, 10086, 'order', '订单量', 73, 'COUNT', '2026-08-13', NOW(), NOW(), 0, 0),
  (10088500, 10086, 'impression', '曝光量', 576000, 'COUNT', '2026-08-14', NOW(), NOW(), 0, 0),
  (10088501, 10086, 'click', '点击量', 37200, 'COUNT', '2026-08-14', NOW(), NOW(), 0, 0),
  (10088502, 10086, 'lead', '潜客量', 336, 'COUNT', '2026-08-14', NOW(), NOW(), 0, 0),
  (10088503, 10086, 'order', '订单量', 70, 'COUNT', '2026-08-14', NOW(), NOW(), 0, 0),
  (10088504, 10086, 'impression', '曝光量', 545050, 'COUNT', '2026-08-15', NOW(), NOW(), 0, 0),
  (10088505, 10086, 'click', '点击量', 35201, 'COUNT', '2026-08-15', NOW(), NOW(), 0, 0),
  (10088506, 10086, 'lead', '潜客量', 318, 'COUNT', '2026-08-15', NOW(), NOW(), 0, 0),
  (10088507, 10086, 'order', '订单量', 66, 'COUNT', '2026-08-15', NOW(), NOW(), 0, 0),
  (10088508, 10086, 'impression', '曝光量', 630374, 'COUNT', '2026-08-16', NOW(), NOW(), 0, 0),
  (10088509, 10086, 'click', '点击量', 40712, 'COUNT', '2026-08-16', NOW(), NOW(), 0, 0),
  (10088510, 10086, 'lead', '潜客量', 368, 'COUNT', '2026-08-16', NOW(), NOW(), 0, 0),
  (10088511, 10086, 'order', '订单量', 76, 'COUNT', '2026-08-16', NOW(), NOW(), 0, 0),
  (10088512, 10086, 'impression', '曝光量', 599270, 'COUNT', '2026-08-17', NOW(), NOW(), 0, 0),
  (10088513, 10086, 'click', '点击量', 38703, 'COUNT', '2026-08-17', NOW(), NOW(), 0, 0),
  (10088514, 10086, 'lead', '潜客量', 350, 'COUNT', '2026-08-17', NOW(), NOW(), 0, 0),
  (10088515, 10086, 'order', '订单量', 72, 'COUNT', '2026-08-17', NOW(), NOW(), 0, 0),
  (10088516, 10086, 'impression', '曝光量', 567706, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0),
  (10088517, 10086, 'click', '点击量', 36664, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0),
  (10088518, 10086, 'lead', '潜客量', 331, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0),
  (10088519, 10086, 'order', '订单量', 69, 'COUNT', '2026-08-18', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();

-- Marketing campaigns + content pipeline + sales reception seed
INSERT INTO lingxi_biz.mkg_campaign (id, tenant_id, biz_code, name, channels, budget, spent_pct, roas, status, period_label, created_at, updated_at, is_deleted, version)
VALUES
  (10088601, 10086, 'CMP-EU-01', '欧洲阳台储能增长计划', 'TikTok · Instagram · YouTube', '€48,000', 68, '4.8x', '投放中', '2026-Q3', NOW(), NOW(), 0, 0),
  (10088602, 10086, 'CMP-VAN-01', 'Vanlife 夏季场景营销', 'Meta · Google', '€32,000', 42, '3.6x', '投放中', '2026-Q3', NOW(), NOW(), 0, 0),
  (10088603, 10086, 'CMP-B2B-01', 'B2B 经销商招募', 'LinkedIn · Email', '€18,000', 91, '5.2x', '待复盘', '2026-Q3', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, channels = EXCLUDED.channels, budget = EXCLUDED.budget, spent_pct = EXCLUDED.spent_pct, roas = EXCLUDED.roas, status = EXCLUDED.status, updated_at = NOW();

INSERT INTO lingxi_biz.mkg_content_asset (id, tenant_id, biz_code, title, content_type, body, locale, status, views, leads, created_at, updated_at, is_deleted, version)
VALUES
  (10087101, 10086, 'CT-8821', '停电时如何保持家庭供电', 'VIDEO', '以真实停电场景切入，展示家庭储能如何 0 秒切换供电。', 'de-DE', 'PUBLISHED', 128400, 86, NOW(), NOW(), 0, 0),
  (10087102, 10086, 'CT-8822', '阳台储能 60 秒极速安装', 'VIDEO', '60 秒展示阳台储能从开箱到接入电网的完整流程。', 'de-DE', 'APPROVED', 0, 0, NOW(), NOW(), 0, 0),
  (10087103, 10086, 'CT-8820', 'P2000 Balcony Solar 使用指南', 'IMAGE', '分步图解阳台光储的安装与日常使用。', 'en-US', 'SCHEDULED', 0, 0, NOW(), NOW(), 0, 0),
  (10087104, 10086, 'CT-8819', 'Vanlife 自由用电清单', 'TEXT', '面向房车人群的用电清单，强调轻量、静音与太阳能补电。', 'fr-FR', 'PENDING_REVIEW', 0, 0, NOW(), NOW(), 0, 0),
  (10087105, 10086, 'CT-8818', '阳台储能真实回本周期', 'VIDEO', '用真实电价数据计算回本周期，建立理性购买信任。', 'de-DE', 'DRAFT', 0, 0, NOW(), NOW(), 0, 0),
  (10087106, 10086, 'CT-8817', '家庭应急电源选购指南', 'IMAGE', '系统对比不同容量应急电源的适用场景。', 'en-US', 'PUBLISHED', 45600, 42, NOW(), NOW(), 0, 0),
  (10087107, 10086, 'CT-8816', '露营电力不焦虑', 'VIDEO', '露营场景短视频，展示便携电源为多设备供电。', 'fr-FR', 'PUBLISHED', 91200, 58, NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_type = EXCLUDED.content_type, body = EXCLUDED.body, locale = EXCLUDED.locale, status = EXCLUDED.status, views = EXCLUDED.views, leads = EXCLUDED.leads, updated_at = NOW();

INSERT INTO lingxi_biz.sales_reception_session (id, tenant_id, biz_code, contact_name, avatar_text, market, source, intent_level, product, waiting, unread_count, last_summary, created_at, updated_at, is_deleted, version)
VALUES
  (10088701, 10086, 'RC-2201', 'Felix Bauer', 'FB', '德国', '官网', '高', 'P2000 阳台储能', '在线 · 2 分钟', 3, '咨询 50 台批量交期与欧洲仓库存', NOW(), NOW(), 0, 0),
  (10088702, 10086, 'RC-2202', 'Sophie Martin', 'SM', '法国', 'TikTok', '高', '便携电源 Explorer', '在线 · 6 分钟', 1, '房车用电场景，关注静音与太阳能补电', NOW(), NOW(), 0, 0),
  (10088703, 10086, 'RC-2203', 'Jakub Nowak', 'JN', '波兰', 'WhatsApp', '高', 'P2000 阳台储能', '离线 · 18 分钟', 0, '分销商，评估首批 100 台合作', NOW(), NOW(), 0, 0),
  (10088704, 10086, 'RC-2204', 'Emma Wilson', 'EW', '英国', 'Instagram', '中', '家庭应急电源', '离线 · 42 分钟', 0, '家庭用户，预算敏感，仍在比较', NOW(), NOW(), 0, 0),
  (10088705, 10086, 'RC-2205', 'Diego Ruiz', 'DR', '西班牙', 'Facebook', '中', 'P2000 阳台储能', '离线 · 1 小时', 0, '关注安装难度与补贴政策', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO UPDATE SET contact_name = EXCLUDED.contact_name, last_summary = EXCLUDED.last_summary, unread_count = EXCLUDED.unread_count, waiting = EXCLUDED.waiting, updated_at = NOW();

INSERT INTO lingxi_biz.sales_reception_message (id, tenant_id, session_id, sender_type, body, sent_at, created_at, updated_at, is_deleted, version)
VALUES
  (10088801, 10086, 10088701, 'customer', 'Hi, 我们想采购 50 台 P2000，欧洲仓有货吗？', NOW() - INTERVAL '10 minute', NOW(), NOW(), 0, 0),
  (10088802, 10086, 10088701, 'agent', '您好 Felix！P2000 德国仓现货 120 台，48 小时内可发货。', NOW() - INTERVAL '9 minute', NOW(), NOW(), 0, 0),
  (10088803, 10086, 10088701, 'customer', '批量价能给到多少？需要含税报价。', NOW() - INTERVAL '8 minute', NOW(), NOW(), 0, 0),
  (10088804, 10086, 10088701, 'agent', '50 台享经销价 €560/台（含 19% VAT），我已生成阶梯报价单发您邮箱。', NOW() - INTERVAL '7 minute', NOW(), NOW(), 0, 0),
  (10088805, 10086, 10088701, 'customer', '好的，我看下。质保政策是怎样的？', NOW() - INTERVAL '6 minute', NOW(), NOW(), 0, 0),
  (10088806, 10086, 10088702, 'customer', 'Bonjour，Explorer 支持太阳能边充边用吗？', NOW() - INTERVAL '40 minute', NOW(), NOW(), 0, 0),
  (10088807, 10086, 10088702, 'agent', '支持的，最大 200W MPPT 输入，边充边放稳定运行。', NOW() - INTERVAL '39 minute', NOW(), NOW(), 0, 0),
  (10088808, 10086, 10088702, 'customer', '夜里睡觉会有风扇噪音吗？', NOW() - INTERVAL '37 minute', NOW(), NOW(), 0, 0),
  (10088809, 10086, 10088702, 'agent', '待机静音 <30dB，负载低于 300W 风扇不启动，适合车内过夜。', NOW() - INTERVAL '36 minute', NOW(), NOW(), 0, 0),
  (10088810, 10086, 10088703, 'customer', '我们是波兰分销商，想谈 P2000 区域代理。', NOW() - INTERVAL '70 minute', NOW(), NOW(), 0, 0),
  (10088811, 10086, 10088703, 'agent', '欢迎！我们提供区域独家授权与市场支持，首批建议 100 台起。', NOW() - INTERVAL '69 minute', NOW(), NOW(), 0, 0),
  (10088812, 10086, 10088703, 'customer', '先发一份代理政策和返点方案。', NOW() - INTERVAL '66 minute', NOW(), NOW(), 0, 0),
  (10088813, 10086, 10088704, 'customer', '这款和竞品比贵在哪里？', NOW() - INTERVAL '120 minute', NOW(), NOW(), 0, 0),
  (10088814, 10086, 10088704, 'agent', '我们的循环寿命 6000 次是竞品 2 倍，长期每度电成本更低。', NOW() - INTERVAL '119 minute', NOW(), NOW(), 0, 0),
  (10088815, 10086, 10088705, 'customer', '西班牙有安装补贴吗？自己能装吗？', NOW() - INTERVAL '1 day', NOW(), NOW(), 0, 0),
  (10088816, 10086, 10088705, 'agent', '可申请 IDAE 补贴，阳台挂装三步即可，无需电工。', NOW() - INTERVAL '1 day' + INTERVAL '1 minute', NOW(), NOW(), 0, 0)
ON CONFLICT (id) DO UPDATE SET body = EXCLUDED.body, sender_type = EXCLUDED.sender_type, updated_at = NOW();
