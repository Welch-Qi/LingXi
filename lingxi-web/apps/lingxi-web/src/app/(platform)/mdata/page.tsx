"use client";

import { useEffect, useState } from "react";
import { DataAssetsPage } from "@/components/pages/data-assets-page";
import { apiGet } from "@/lib/api";
import { pickRows } from "@/lib/format";

/**
 * 数据中心 — 交互基准：灵犀前端 DataAssetsPage（客户/商品/渠道/员工）
 * 写接口：POST/PUT/DELETE mdata + users（页内 Tab 已对接，失败回退 mock）
 */
export default function MdataRoutePage() {
  const [hint, setHint] = useState<string | null>(null);
  useEffect(() => {
    void Promise.all([
      apiGet("/mdata/customers").then(pickRows).catch(() => []),
      apiGet("/mdata/products").then(pickRows).catch(() => []),
      apiGet("/mdata/channels").then(pickRows).catch(() => []),
      apiGet("/users?staffType=HUMAN").then(pickRows).catch(() => []),
    ]).then(([c, p, ch, u]) => {
      setHint(
        `后端主数据：客户 ${c.length} · 商品 ${p.length} · 渠道 ${ch.length} · 员工 ${u.length}（页内保存/删除已对接写 API）`,
      );
    });
  }, []);

  return (
    <div className="flex w-full flex-col gap-3">
      {hint ? (
        <div className="rounded-lg border border-primary-line bg-primary-soft px-4 py-2 text-[12px] text-primary">
          {hint}
        </div>
      ) : null}
      <DataAssetsPage />
    </div>
  );
}
