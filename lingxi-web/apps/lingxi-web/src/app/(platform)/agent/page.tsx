"use client";

import { useEffect, useState } from "react";
import { AgentsPage } from "@/components/pages/agents-page";
import { apiGet } from "@/lib/api";
import { asList } from "@/lib/format";

/**
 * 智能中心 — 交互基准：灵犀前端 AgentsPage
 * 配置：PUT /agents/{code}/config；日志：GET /agents/run-logs（页内已对接）
 */
export default function AgentRoutePage() {
  const [apiCount, setApiCount] = useState<number | null>(null);
  const [logCount, setLogCount] = useState<number | null>(null);
  useEffect(() => {
    void apiGet("/agents")
      .then((res) => setApiCount(asList(res).length))
      .catch(() => setApiCount(null));
    void apiGet("/agents/run-logs?pageSize=1")
      .then((res) => {
        const total = res && typeof res === "object" && "total" in (res as object)
          ? Number((res as { total?: number }).total ?? 0)
          : asList(res).length;
        setLogCount(total);
      })
      .catch(() => setLogCount(null));
  }, []);

  return (
    <div className="flex w-full flex-col gap-3">
      {apiCount != null ? (
        <div className="rounded-lg border border-primary-line bg-primary-soft px-4 py-2 text-[12px] text-primary">
          智能体目录 <b className="num">{apiCount}</b> · 运行日志{" "}
          <b className="num">{logCount ?? "—"}</b>
          （配置 Sheet「保存」与日志表已对接 B-API）
        </div>
      ) : null}
      <AgentsPage />
    </div>
  );
}
