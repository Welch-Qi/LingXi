"use client";

import { AnalyticsPage } from "@/components/pages/analytics-page";

/**
 * 经营分析 — 交互基准：灵犀前端 AnalyticsPage
 * GET /decision/dashboard 驱动 KPI/地图/排行/漏斗/趋势；Sage 走 POST /decision/ask（扩展白名单 + answer）
 */
export default function DecisionRoutePage() {
  return <AnalyticsPage />;
}
