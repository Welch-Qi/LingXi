"use client"

import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts"
import { ArrowRight, Bot, CheckCircle2, CircleAlert, Clock3, GraduationCap, LineChart as LineChartIcon, Sparkles, Star, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LxKpi } from "@/components/lingxi-ui/lx-kpi"
import { LxAgentCard, type LxAgentProgressVariant } from "@/components/lingxi-ui/lx-agent-card"
import { LxInsightCard } from "@/components/lingxi-ui/lx-insight-card"
import { agents, dashboardMetrics, flowEvents, growthTrend } from "@/lib/mocks/dashboard"
import type { AgentId, Agent } from "@/types"
import type { PageId } from "@/types/nav"

const agentImage: Record<AgentId, string> = {
  analyst: "/images/agent-analyst.png",
  market: "/images/agent-market.png",
  content: "/images/agent-content.png",
  sales: "/images/agent-sales.png",
}
const agentPageMap: Record<AgentId, PageId> = { analyst: "analytics", market: "product", content: "marketing", sales: "sales" }
const agentProgressVariant: Record<AgentId, LxAgentProgressVariant> = { analyst: "good", market: "default", content: "default", sales: "warn" }

export function DashboardPage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return <div className="flex w-full flex-col gap-[22px]">
    {/* 问候 Banner */}
    <div
      className="flex items-center gap-4 rounded-lg border border-primary-line p-4 px-5"
      style={{ background: "linear-gradient(120deg,var(--color-primary-soft),var(--color-info-soft) 60%,var(--color-warning-soft))" }}
    >
      <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[12px] text-white shadow-primary" style={{ background: "linear-gradient(135deg,#0E7C86,#2E6BE6)" }}>
        <Star className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-ink">早上好，林总 —— 亚太区今日有 6 项待办</div>
        <div className="mt-0.5 text-[12.5px] text-slate">智能体协作网络已完成夜间任务，以下是今日重点概览</div>
      </div>
      <button onClick={() => toast.info("今日简报生成中，请稍候")} className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] font-medium text-primary hover:underline">
        查看今日简报 →
      </button>
    </div>

    {/* KPI 网格 */}
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" aria-label="经营指标">
      {dashboardMetrics.map((metric) => (
        <LxKpi
          key={metric.key}
          label={metric.label}
          value={metric.today}
          sub={<>年累计 <b className="num font-display font-semibold text-ink">{metric.year}</b></>}
          trend={metric.trend}
          delta={metric.change}
          color={metric.color}
          spark={metric.spark}
        />
      ))}
    </section>

    {/* 智能体协作网络 */}
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-[15px] font-bold">智能体协作网络</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">从市场洞察到销售成交，任务与数据持续流转</p>
        </div>
        <button onClick={() => onNavigate("agents")} className="text-[12.5px] font-medium text-primary hover:underline">管理智能体 →</button>
      </div>
      <div className="relative grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div
          className="pointer-events-none absolute left-[6%] right-[6%] top-1/2 hidden h-0.5 opacity-50 xl:block"
          style={{ background: "linear-gradient(90deg,var(--color-primary-line),var(--color-info),var(--color-success))" }}
        />
        {agents.map((agent: Agent) => (
          <LxAgentCard
            key={agent.id}
            image={agentImage[agent.id]}
            domain={agent.domain}
            title={agent.title}
            name={agent.name}
            medal={agent.medal}
            task={agent.task}
            progress={agent.progress}
            progressVariant={agentProgressVariant[agent.id]}
            busy={agent.status === "运行中"}
            meta={[{ label: "今日产出", value: agent.todayOutput }, { label: "成功率", value: `${agent.successRate}%` }]}
            actions={<>
              <Button className="flex-1" size="sm" variant="outline" onClick={() => { toast.success(`正在进入 ${agent.title} 的培训提升`); onNavigate("agents") }}>
                <GraduationCap data-icon="inline-start" />培训提升
              </Button>
              <Button className="flex-1" size="sm" onClick={() => onNavigate(agentPageMap[agent.id])}>
                <LineChartIcon data-icon="inline-start" />查看业绩
              </Button>
            </>}
          />
        ))}
      </div>
    </section>

    {/* 今日要点 */}
    <section>
      <h2 className="mb-3 font-display text-[15px] font-bold">今日要点</h2>
      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
        <LxInsightCard
          category="市场预警 · 德国"
          accent="warning"
          content={"\u201c便携储能\u201d搜索指数 7 日环比 +38%，竞品均价下降 6%，建议加快产品定价与素材迭代。"}
          sourceIcon={<Sparkles className="size-3" />}
          source="Atlas 于 2 小时前发现"
          onClick={() => onNavigate("product")}
        />
        <LxInsightCard
          category="商机提醒 · NordHaus GmbH"
          accent="success"
          content="€28K 报价等待审批，客户连续查看 P2000 产品与报价页，转化窗口期约 24 小时。"
          sourceIcon={<CircleAlert className="size-3" />}
          source="Echo 于 8 分钟前发现"
          onClick={() => onNavigate("sales")}
        />
        <LxInsightCard
          category="经营洞察 · 内容审核"
          accent="primary"
          content="3 份法语内容等待审核，计划今日 16:00 发布，逾期将影响本周投放节奏。"
          sourceIcon={<Clock3 className="size-3" />}
          source="Muse 于 24 分钟前发现"
          onClick={() => onNavigate("marketing")}
        />
      </div>
    </section>

    {/* 快捷操作 */}
    <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
      {[
        { label: "新建客户", desc: "手动录入线索并分配跟进", icon: UserPlus, bg: "bg-primary", page: "sales" as PageId },
        { label: "创建内容", desc: "启动内容生产工作台", icon: Sparkles, bg: "bg-warning", page: "marketing" as PageId },
        { label: "生成经营报告", desc: "汇总本周关键经营数据", icon: LineChartIcon, bg: "bg-info", page: "analytics" as PageId },
      ].map((action) => (
        <button
          key={action.label}
          onClick={() => onNavigate(action.page)}
          className="glass flex items-center gap-3 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-pop"
        >
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-[11px] text-white ${action.bg}`}>
            <action.icon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium">{action.label}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{action.desc}</div>
          </div>
        </button>
      ))}
    </section>

    <section className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1.4fr_1fr]">
      <div className="glass p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div><h3 className="font-display text-[14px] font-bold">增长动能</h3><p className="mt-0.5 text-[11px] text-muted-foreground">近 8 周曝光、点击转化与客户建档趋势</p></div>
          <Badge className="bg-success-soft text-success">整体 +26.4%</Badge>
        </div>
        <div className="p-5 pt-3">
          <ChartContainer config={{ impression: { label: "曝光数", color: "#0E7C86" }, click: { label: "点击转化数", color: "#F0A91A" }, profiled: { label: "客户建档数", color: "#3D9A6E" } }} className="h-56 w-full">
            <LineChart data={growthTrend} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} className="text-[10px]" />
              <YAxis axisLine={false} tickLine={false} width={28} className="text-[10px]" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line dataKey="impression" type="monotone" stroke="var(--color-impression)" strokeWidth={2.5} dot={false} />
              <Line dataKey="click" type="monotone" stroke="var(--color-click)" strokeWidth={2.5} dot={false} />
              <Line dataKey="profiled" type="monotone" stroke="var(--color-profiled)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
      </div>

      <div className="glass p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div><h3 className="font-display text-[14px] font-bold">需要人工决策</h3><p className="mt-0.5 text-[11px] text-muted-foreground">已筛选的高价值事项</p></div>
          <Badge className="bg-danger text-white">3</Badge>
        </div>
        <div className="flex flex-col gap-2.5 p-4">
          <button onClick={() => onNavigate("sales")} className="flex items-center gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-frost"><CircleAlert className="size-5 text-danger" /><div className="flex-1"><p className="text-sm font-medium">€28K 报价等待审批</p><p className="text-xs text-muted-foreground">NordHaus GmbH · 8 分钟前</p></div><ArrowRight className="size-4 text-muted-foreground" /></button>
          <button onClick={() => onNavigate("marketing")} className="flex items-center gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-frost"><Clock3 className="size-5 text-muted-foreground" /><div className="flex-1"><p className="text-sm font-medium">3 份法语内容等待审核</p><p className="text-xs text-muted-foreground">计划今日 16:00 发布</p></div><ArrowRight className="size-4 text-muted-foreground" /></button>
          <button onClick={() => onNavigate("product")} className="flex items-center gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-frost"><Sparkles className="size-5 text-primary" /><div className="flex-1"><p className="text-sm font-medium">高分产品开发机会待确认</p><p className="text-xs text-muted-foreground">Balcony Solar Storage · 评分 92</p></div><ArrowRight className="size-4 text-muted-foreground" /></button>
        </div>
      </div>
    </section>

    <div className="glass p-0">
      <div className="border-b border-border px-5 py-3.5"><h3 className="font-display text-[14px] font-bold">业务实时流</h3><p className="mt-0.5 text-[11px] text-muted-foreground">智能体之间的任务交接与成果回流</p></div>
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 xl:grid-cols-4">
        {flowEvents.map((event, index) => (
          <div key={event.id} className={`flex flex-col gap-3 p-5 ${index > 0 ? "border-t border-border xl:border-l xl:border-t-0" : ""}`}>
            <div className="flex items-center justify-between"><Badge variant="outline">{event.time}</Badge>{index === 0 ? <CheckCircle2 className="size-4 text-primary" /> : <Bot className="size-4 text-muted-foreground" />}</div>
            <div><p className="text-sm font-medium">{event.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{event.detail}</p></div>
            <p className="text-xs font-medium text-primary">{event.result}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
}
