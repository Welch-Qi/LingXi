"use client";

import { useEffect, useState } from "react";
import { KnowledgeCenterPage } from "@/components/pages/knowledge-center-page";
import { apiGet } from "@/lib/api";
import { pickRows } from "@/lib/format";

/**
 * 知识中心 — 交互基准：灵犀前端 KnowledgeCenterPage（模板/话术/提示词）
 * 写接口：POST/PUT/DELETE；页内编辑已对接 PUT（失败回退 toast）
 */
export default function KnowledgeRoutePage() {
  const [hint, setHint] = useState<string | null>(null);
  useEffect(() => {
    void Promise.all([
      apiGet("/knowledge/templates").then(pickRows).catch(() => []),
      apiGet("/knowledge/scripts").then(pickRows).catch(() => []),
      apiGet("/knowledge/prompts").then(pickRows).catch(() => []),
    ]).then(([t, s, p]) => {
      setHint(
        `后端知识库：模板 ${t.length} · 话术 ${s.length} · 提示词 ${p.length}（编辑已对接 PUT）`,
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
      <KnowledgeCenterPage />
    </div>
  );
}
