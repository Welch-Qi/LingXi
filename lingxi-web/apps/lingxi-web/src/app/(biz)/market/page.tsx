"use client";

import { ProductPage } from "@/components/pages/product-page";

/**
 * 产品开发 — 交互基准：灵犀前端 ProductPage（趋势 / 机会 / 创意）
 * 已接入 GET /market/* 真实 API，失败回退 mock
 */
export default function MarketRoutePage() {
  return <ProductPage />;
}
