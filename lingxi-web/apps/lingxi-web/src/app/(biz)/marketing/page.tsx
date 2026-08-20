"use client";

import { MarketingPage } from "@/components/pages/marketing-page";

/**
 * 内容营销 — 交互基准：灵犀前端 MarketingPage（生产/分发/投放）
 * 已接后端：文本生成可走 POST /marketing/contents/generate（见页内「同步落库」增强）
 * GAP：审核流、媒体模型、投放 ROAS — 见改造清单
 */
export default function MarketingRoutePage() {
  return <MarketingPage />;
}
