"use client";

import { useEffect, useState } from "react";
import { ConfigCenterPage } from "@/components/pages/config-center-page";
import { apiGet } from "@/lib/api";

/**
 * 配置中心 — 交互基准：灵犀前端 ConfigCenterPage（公约/运营/员工/权限）
 * 品牌信息：GET/PUT /config/settings/brand 已对接；其余区块仍 mock
 */
export default function ConfigRoutePage() {
  const [hint, setHint] = useState<string | null>(null);
  useEffect(() => {
    void Promise.all([
      apiGet<Record<string, unknown>>("/tenants/current").catch(() => null),
      apiGet<Record<string, unknown>>("/config/industry").catch(() => null),
      apiGet<{ value?: Record<string, unknown> }>("/config/settings/brand").catch(() => null),
    ]).then(([tenant, industry, brand]) => {
      const tName =
        tenant && typeof tenant === "object"
          ? String((tenant as { name?: string; tenantName?: string }).name ?? (tenant as { tenantName?: string }).tenantName ?? "已连接")
          : "不可用";
      const ind =
        industry && typeof industry === "object" ? "行业配置可读" : "行业配置不可用";
      const brandOk = brand && typeof brand === "object" ? "品牌 KV 可读" : "品牌 KV 待写入";
      setHint(`租户：${tName} · ${ind} · ${brandOk}（品牌「保存配置」已落库；运营/权限写仍 GAP）`);
    });
  }, []);

  return (
    <div className="flex w-full flex-col gap-3">
      {hint ? (
        <div className="rounded-lg border border-primary-line bg-primary-soft px-4 py-2 text-[12px] text-primary">
          {hint}
        </div>
      ) : null}
      <ConfigCenterPage />
    </div>
  );
}
