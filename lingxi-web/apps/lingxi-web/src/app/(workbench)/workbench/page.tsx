"use client";

import { useRouter } from "next/navigation";
import { DashboardPage } from "@/components/pages/dashboard-page";
import { PAGE_ROUTES, type PageId } from "@/types/nav";

/**
 * 超级工作台 — 交互基准：灵犀前端 DashboardPage
 * API：设计页以 mock 呈现 KPI/智能体/增长图；待办与简报见改造清单 GAP。
 * 导航 onNavigate 映射到 App Router。
 */
export default function WorkbenchPage() {
  const router = useRouter();
  return (
    <DashboardPage
      onNavigate={(page: PageId) => {
        router.push(PAGE_ROUTES[page]);
      }}
    />
  );
}
