"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { Activity, CheckCircle2, GraduationCap, ListChecks, Play, Rocket, Settings2, ShieldCheck, Wrench, Zap } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { loadAgents, runAgent } from "@/lib/api-agent"
import { loadAgentConfig, loadAgentRunLogs, saveAgentConfig, UI_AGENT_CODE } from "@/lib/bapi"
import { agents as mockAgents } from "@/lib/mocks/dashboard"
import { agentLogs as mockAgentLogs } from "@/lib/mocks/data-assets"
import type { Agent, AgentId } from "@/types"

interface AgentConfig {
  image: string
  skills: string[]
  responsibilities: string[]
  businessMentor: { name: string; title: string }
  itMentor: { name: string; title: string }
}

const agentVisualConfig: Record<AgentId, AgentConfig> = {
  analyst: {
    image: "/images/agent-analyst.png",
    skills: ["经营分析", "数据洞察", "漏斗诊断", "决策建议", "预测预警"],
    responsibilities: ["实时监控全球经营指标并识别异常信号", "分析营销漏斗各环节的转化瓶颈", "输出可执行的经营决策建议与增长洞察"],
    businessMentor: { name: "郑思远", title: "首席增长官 CGO" },
    itMentor: { name: "吴昊", title: "数据智能平台总监" },
  },
  market: {
    image: "/images/agent-market.png",
    skills: ["趋势监测", "竞品分析", "用户洞察", "品类选品", "市场预测"],
    responsibilities: ["扫描目标市场的品类趋势与政策信号", "输出细分市场的产品开发机会与竞争分析", "为产品创意提供数据依据与优先级建议"],
    businessMentor: { name: "林启涛", title: "产品战略总监" },
    itMentor: { name: "陈昱", title: "数据平台架构师" },
  },
  content: {
    image: "/images/agent-content.png",
    skills: ["多语创作", "品牌校验", "脚本策划", "渠道分发", "素材生成"],
    responsibilities: ["围绕产品卖点批量生产多语种内容", "保障内容合规与品牌调性一致", "按渠道特性完成内容分发与排期"],
    businessMentor: { name: "苏晓", title: "品牌营销总监" },
    itMentor: { name: "周赫", title: "内容中台负责人" },
  },
  sales: {
    image: "/images/agent-sales.png",
    skills: ["意图识别", "全渠道接待", "销售跟进", "客户建档", "成交转化"],
    responsibilities: ["7×24 接待潜客并识别采购意图", "自动建档并推进高意向客户跟进", "协同人工顾问完成成交与复购转化"],
    businessMentor: { name: "何知远", title: "全球销售副总裁" },
    itMentor: { name: "李维", title: "CRM 系统架构师" },
  },
}

const medalStyle: Record<string, string> = {
  金牌: "bg-amber-100 text-amber-700",
  银牌: "bg-slate-200 text-slate-700",
  铜牌: "bg-orange-100 text-orange-700",
  铁牌: "bg-zinc-200 text-zinc-600",
}

type UiLog = { id: string; agent: string; task: string; duration: string; tokens: string; status: string; time: string }

function mapMockLog(log: (typeof mockAgentLogs)[number]): UiLog {
  return {
    id: log.id,
    agent: log.agent,
    task: log.task,
    duration: log.duration,
    tokens: log.tokens,
    status: log.status,
    time: log.time,
  }
}

function mapRunLog(row: Record<string, unknown>): UiLog {
  const created = row.createdAt ? String(row.createdAt) : ""
  const time = created.includes("T") ? created.slice(11, 16) : created.slice(0, 16)
  const ms = typeof row.durationMs === "number" ? row.durationMs : Number(row.durationMs ?? 0)
  const duration = ms >= 60000 ? `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s` : `${ms || 0}ms`
  return {
    id: String(row.id ?? Math.random()),
    agent: String(row.agentCode ?? ""),
    task: String(row.action ?? "run"),
    duration,
    tokens: String(row.relatedObject ?? "—"),
    status: String(row.status ?? "UNKNOWN"),
    time: time || "—",
  }
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  return value.filter((item): item is string => typeof item === "string")
}

function parseMentor(value: unknown): { name: string; title: string } | null {
  if (!value || typeof value !== "object") return null
  const obj = value as Record<string, unknown>
  if (typeof obj.name !== "string") return null
  return { name: obj.name, title: String(obj.title ?? "") }
}

function mergeConfigFromApi(agentId: AgentId, apiCfg: Record<string, unknown>): AgentConfig {
  const base = agentVisualConfig[agentId]
  const skills = parseStringArray(apiCfg.skills) ?? base.skills
  const responsibilities = parseStringArray(apiCfg.responsibilities) ?? base.responsibilities
  const businessMentor = parseMentor(apiCfg.businessMentor) ?? base.businessMentor
  const itMentor = parseMentor(apiCfg.itMentor) ?? base.itMentor
  return { ...base, skills, responsibilities, businessMentor, itMentor }
}

export function AgentsPage() {
  const [agents] = useState<Agent[]>(mockAgents)
  const [apiAgentCount, setApiAgentCount] = useState<number | null>(null)
  const [configAgent, setConfigAgent] = useState<Agent | null>(null)
  const [drawerConfig, setDrawerConfig] = useState<AgentConfig | null>(null)
  const [logs, setLogs] = useState<UiLog[]>(() => mockAgentLogs.map(mapMockLog))
  const [persistedHint, setPersistedHint] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  const refreshLogs = useCallback(async () => {
    try {
      const rows = await loadAgentRunLogs()
      if (rows.length) setLogs(rows.map(mapRunLog))
    } catch {
      /* keep current logs */
    }
  }, [])

  useEffect(() => {
    void loadAgents()
      .then((rows) => setApiAgentCount(rows.length))
      .catch(() => { /* keep mock count */ })
    void refreshLogs()
  }, [refreshLogs])

  useEffect(() => {
    if (!configAgent) {
      setPersistedHint(null)
      setDrawerConfig(null)
      return
    }
    const code = UI_AGENT_CODE[configAgent.id] ?? configAgent.id
    setDrawerConfig(agentVisualConfig[configAgent.id])
    void loadAgentConfig(code)
      .then((cfg) => {
        if (cfg && Object.keys(cfg).length) {
          setDrawerConfig(mergeConfigFromApi(configAgent.id, cfg))
          setPersistedHint(`已加载落库配置（enabled=${String(cfg.enabled ?? true)}）`)
        } else {
          setPersistedHint("尚无落库配置，保存后将写入 ac_agent_config")
        }
      })
      .catch(() => setPersistedHint("配置接口暂不可用，仍可浏览设计稿信息"))
  }, [configAgent])

  async function handleSaveConfig() {
    if (!configAgent) return
    const code = UI_AGENT_CODE[configAgent.id] ?? configAgent.id
    const base = drawerConfig ?? agentVisualConfig[configAgent.id]
    try {
      await saveAgentConfig(code, {
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048,
        skills: base.skills,
        responsibilities: base.responsibilities,
        businessMentor: base.businessMentor,
        itMentor: base.itMentor,
        uiAgentId: configAgent.id,
      })
      toast.success(`「${configAgent.title}」配置已落库`)
      setPersistedHint("配置已保存")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存智能体配置失败")
    }
  }

  async function handleRunAgent() {
    if (!configAgent || running) return
    const code = UI_AGENT_CODE[configAgent.id] ?? configAgent.id
    setRunning(true)
    try {
      const resp = await runAgent({ agentCode: code, action: "run" })
      const status = String(resp.status ?? "SUCCESS")
      toast.success(`已触发运行（${status}）`)
      await refreshLogs()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "触发智能体运行失败")
    } finally {
      setRunning(false)
    }
  }

  const onlineCount = apiAgentCount ?? agents.length
  const activeDrawerConfig = configAgent
    ? (drawerConfig ?? agentVisualConfig[configAgent.id])
    : null

  return (
    <div className="flex w-full flex-col gap-4">
      <section className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium text-muted-foreground">AGENT OPERATIONS / 智能中心</div>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold">智能体运行中心</h1>
            <Badge className="gap-1 bg-amber-100 text-amber-700 text-[10px]">
              <Rocket className="size-3" />
              二期能力 · 超前建设
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            一期智能体能力已内置于市场/营销/销售各业务模块中自动运行，本页面为二期智能体集中管理能力的提前呈现
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-[10px]">
          <span className="size-1.5 rounded-full bg-primary" />
          {onlineCount} 个智能体在线
        </Badge>
      </section>
      <section className="grid grid-cols-4 gap-4">
        {agents.map((a) => (
          <Card key={a.id} className="overflow-hidden shadow-none">
            <CardContent className="flex flex-col items-center gap-3 p-5">
              <div className="relative size-24 overflow-hidden rounded-full ring-2 ring-border">
                <Image unoptimized src={agentVisualConfig[a.id].image} alt={`${a.title} ${a.name}`} fill className="object-cover object-top" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {a.title} · {a.name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{a.domain}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] ${medalStyle[a.medal]}`}>{a.medal}</Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {a.status}
                </Badge>
              </div>
              <div className="w-full">
                <div className="mb-1.5 flex justify-between text-[10px]">
                  <span>任务成功率</span>
                  <b>{a.successRate}%</b>
                </div>
                <Progress value={a.successRate} className="h-1.5" />
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {agentVisualConfig[a.id].skills.slice(0, 3).map((c) => (
                  <Badge key={c} variant="outline" className="text-[9px]">
                    {c}
                  </Badge>
                ))}
              </div>
              <div className="grid w-full grid-cols-2 gap-2">
                <div className="rounded-md bg-muted p-2 text-center">
                  <p className="text-[9px] text-muted-foreground">今日产出</p>
                  <p className="mt-1 text-xs font-medium">{a.todayOutput}</p>
                </div>
                <div className="rounded-md bg-muted p-2 text-center">
                  <p className="text-[9px] text-muted-foreground">任务进度</p>
                  <p className="mt-1 text-xs font-medium">{a.progress}%</p>
                </div>
              </div>
              <Button className="w-full" variant="outline" onClick={() => setConfigAgent(a)}>
                <Settings2 data-icon="inline-start" />
                配置智能体
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid grid-cols-4 gap-3">
        {[
          { l: "今日任务", v: "97", s: "84 已完成", i: Zap },
          { l: "平均成功率", v: "93.7%", s: "较上周 +2.4%", i: CheckCircle2 },
          { l: "运行时长", v: "71.4h", s: "本周累计", i: Activity },
          { l: "安全检查", v: "100%", s: "无高风险事件", i: ShieldCheck },
        ].map((x) => (
          <Card key={x.l} className="shadow-none">
            <CardContent className="flex justify-between p-3">
              <div>
                <p className="text-[10px] text-muted-foreground">{x.l}</p>
                <p className="mt-1 text-lg font-semibold">{x.v}</p>
                <p className="text-[9px] text-muted-foreground">{x.s}</p>
              </div>
              <x.i className="size-4 text-primary" />
            </CardContent>
          </Card>
        ))}
      </section>
      <Card className="shadow-none">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">最近运行记录</CardTitle>
          <CardDescription className="text-[11px]">任务执行、状态与耗时（优先读 GET /agents/run-logs）</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>智能体</TableHead>
                <TableHead>动作</TableHead>
                <TableHead>关联对象</TableHead>
                <TableHead>结果</TableHead>
                <TableHead>耗时</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground">{l.time}</TableCell>
                  <TableCell>{l.agent}</TableCell>
                  <TableCell className="font-medium">{l.task}</TableCell>
                  <TableCell>{l.tokens}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{l.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!configAgent} onOpenChange={(open) => !open && setConfigAgent(null)}>
        <SheetContent className="w-[460px] sm:max-w-[460px]">
          <SheetHeader>
            <SheetTitle>配置智能体</SheetTitle>
            <SheetDescription>维护智能体的身份、职责、技能与导师；保存写入租户配置表</SheetDescription>
          </SheetHeader>
          {configAgent && activeDrawerConfig && (
            <div className="flex flex-col gap-5 overflow-auto p-4">
              {persistedHint ? <p className="text-[11px] text-muted-foreground">{persistedHint}</p> : null}
              <div className="flex items-center gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-full ring-2 ring-border">
                  <Image unoptimized src={activeDrawerConfig.image} alt={configAgent.name} fill className="object-cover object-top" />
                </div>
                <div>
                  <p className="text-base font-semibold">
                    {configAgent.title} · {configAgent.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">业务域：{configAgent.domain}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge className={`text-[10px] ${medalStyle[configAgent.medal]}`}>{configAgent.medal}</Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {configAgent.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <ListChecks className="size-3.5 text-primary" />
                  工作职责
                </div>
                <ul className="flex flex-col gap-2">
                  {activeDrawerConfig.responsibilities.map((r, i) => (
                    <li key={i} className="flex gap-2.5 rounded-md border p-2.5 text-[11px] leading-5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <Wrench className="size-3.5 text-primary" />
                  技能列表
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeDrawerConfig.skills.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <GraduationCap className="size-3.5 text-primary" />
                  导师配置
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: "业务导师", m: activeDrawerConfig.businessMentor },
                    { l: "IT 导师", m: activeDrawerConfig.itMentor },
                  ].map((x) => (
                    <div key={x.l} className="rounded-lg border p-3">
                      <p className="text-[10px] text-muted-foreground">{x.l}</p>
                      <p className="mt-1 text-sm font-medium">{x.m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{x.m.title}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveConfig}>
                  保存配置到后端
                </Button>
                <Button className="flex-1" variant="secondary" disabled={running} onClick={handleRunAgent}>
                  <Play data-icon="inline-start" />
                  {running ? "运行中…" : "运行智能体"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
