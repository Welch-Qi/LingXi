"use client";

import { Wrench } from "lucide-react";
import { DomainBanner } from "@/components/domain-banner";

export default function ServicePage() {
  return (
    <>
      <DomainBanner
        tone="accent"
        icon={<Wrench className="h-[18px] w-[18px]" />}
        title="服务域 · 二期交付"
        detail="一期范围不含工单 / 回访主链路。请按主链路联调：市场看清 → 内容触达 → 线索转化 → 数据决策。"
        href="/workbench"
        linkLabel="返回工作台 →"
      />
      <div className="glass max-w-xl p-6">
        <h2 className="font-display text-[15px] font-bold text-ink">占位说明</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          服务交付能力已列入产品路线，本期迁移批次（B0–B7）按决议不纳入。页面保留入口以便导航完整。
        </p>
      </div>
    </>
  );
}
