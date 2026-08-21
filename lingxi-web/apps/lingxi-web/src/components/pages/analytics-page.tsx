"use client"
import { useState, useRef, useEffect, type ElementType, type MouseEvent } from "react"
import Image from "next/image"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { BadgeCheck, Boxes, Eye, Flame, MessageSquare, MousePointerClick, Send, ShoppingCart, Sparkles, Users, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { analyticsKPIs, countryDetails as mockCountryDetails, countryRanks as mockCountryRanks, countrySalesMap as mockCountrySalesMap, funnelSteps as mockFunnelSteps, productRanks as mockProductRanks, trendData as mockTrendData } from "@/lib/mocks/analytics"
import { apiGet, apiPost } from "@/lib/api"
import { formatAskReply, inferMetricCode, parseDecisionDashboard, type DecisionAskPayload } from "@/lib/api-decision"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"

const iconMap: Record<string, ElementType> = {
  Boxes, Flame, Eye, MousePointerClick, Users, ShoppingCart, BadgeCheck,
}

function heatColor(val: number) {
  if (!val) return "#94a3b8"   // 未销售 — 中灰，与蓝色区域高对比
  if (val >= 80) return "#1e3a8a"  // 极高 — 海军蓝
  if (val >= 50) return "#1d4ed8"  // 高   — 深蓝
  if (val >= 25) return "#3b82f6"  // 中   — 标准蓝
  if (val >= 10) return "#93c5fd"  // 低   — 浅蓝
  return "#bfdbfe"                 // 极低 — 淡蓝
}

// ISO 3166-1 numeric → alpha-3 mapping for the countries we care about
const numToAlpha3: Record<number, string> = {
  276: "DEU", 250: "FRA", 826: "GBR", 528: "NLD", 380: "ITA",
  724: "ESP", 616: "POL", 752: "SWE", 208: "DNK", 40: "AUT",
  840: "USA", 124: "CAN", 36: "AUS", 392: "JPN", 156: "CHN",
  76: "BRA", 356: "IND", 484: "MEX", 710: "ZAF", 578: "NOR",
  246: "FIN", 56: "BEL", 756: "CHE", 620: "PRT", 203: "CZE",
  348: "HUN", 642: "ROU", 300: "GRC",
}

interface ChatMsg { role: "user" | "ai"; text: string }
const starters = [
  "本月哪个国家成交转化率最高？",
  "德国市场的营销漏斗哪个环节流失最多？",
  "爆品成因分析：P2000 为何持续领跑？",
]
const aiReply = (q: string): string => {
  if (q.includes("德国")) return "德国市场点击到留资转化率约 10.2%，高于欧洲均值；但留资到意向环节流失达 68%，建议加强 DTC 邮件培育序列，重点触达「已点击未留资」人群，预计可提升 15–20 个百分点。"
  if (q.includes("爆品") || q.includes("P2000")) return "P2000 阳台储能连续 6 周占据订单榜首，核心驱动因素：① 德国屋顶光伏补贴政策利好；② Muse 智能体在 TikTok DE 投放的「60 秒极速安装」系列内容曝光量超 800 万，点击转化率达 4.8%；③ 竞品平均价位高出 23%，价格竞争力显著。"
  if (q.includes("转化")) return "本月成交转化率前三：德国 2.4%、奥地利 1.9%、荷兰 1.7%。德国市场得益于本地化内容策略与快速响应的 Echo 智能体跟进，成交周期平均缩短至 8.3 天。"
  return `根据最近 30 天数据分析：整体营销漏斗曝光到成交转化率约 0.089%，较上月提升 0.012 ppts。订单量增速 +18.6% 领先于潜客量增速 +24.2%，说明线索质量在持续提升。建议重点关注留资到意向阶段，当前流失率 71%，是最大优化空间。`
}

export function AnalyticsPage() {
  const [chatOpen, setChatOpen] = useState(false)
  const [mapTooltip, setMapTooltip] = useState<{ x: number; y: number; alpha3: string } | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "ai", text: "你好！我是经营决策专家，可以帮你分析全球经营数据、定位增长机会、解读营销漏斗。请告诉我你最想了解什么？" }
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [kpis, setKpis] = useState(analyticsKPIs)
  const [countryRanks, setCountryRanks] = useState(mockCountryRanks)
  const [productRanks, setProductRanks] = useState(mockProductRanks)
  const [funnelSteps, setFunnelSteps] = useState(mockFunnelSteps)
  const [trendData, setTrendData] = useState(mockTrendData)
  const [countrySalesMap, setCountrySalesMap] = useState(mockCountrySalesMap)
  const [countryDetails, setCountryDetails] = useState(mockCountryDetails)
  const [updatedHint, setUpdatedHint] = useState("数据更新于 2 分钟前")

  useEffect(() => {
    void apiGet<Record<string, unknown>>("/decision/dashboard")
      .then((raw) => {
        const dash = parseDecisionDashboard(raw)
        if (dash.kpis?.length) setKpis(dash.kpis)
        if (dash.countryRanks?.length) setCountryRanks(dash.countryRanks)
        if (dash.productRanks?.length) setProductRanks(dash.productRanks)
        if (dash.funnel?.length) setFunnelSteps(dash.funnel)
        if (dash.trend?.length) setTrendData(dash.trend)
        if (dash.countryHeat) setCountrySalesMap(dash.countryHeat)
        if (dash.countryDetails) setCountryDetails(dash.countryDetails)
        if (dash.updatedAtHint) setUpdatedHint(dash.updatedAtHint)
      })
      .catch(() => { /* keep mock */ })
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, typing])

  function sendMsg(text: string) {
    if (!text.trim()) return
    const userMsg: ChatMsg = { role: "user", text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setTyping(true)
    void (async () => {
      const metricCode = inferMetricCode(text)
      try {
        const data = await apiPost<DecisionAskPayload>("/decision/ask", { metricCode, question: text.trim() })
        setMessages(prev => [...prev, { role: "ai", text: formatAskReply(data, text, aiReply) }])
      } catch {
        setMessages(prev => [...prev, { role: "ai", text: aiReply(text) }])
      } finally {
        setTyping(false)
      }
    })()
  }

  return (
    <div className="flex w-full flex-col gap-4">

      {/* ── Top bar: AI agent avatar ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setChatOpen(true)}
          className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5 shadow-none transition-colors hover:border-primary hover:bg-primary/5"
          aria-label="打开经营决策专家"
        >
          <div className="relative">
            <Image unoptimized src="/images/agent-analyst.png" alt="经营决策专家" width={40} height={40} className="size-10 rounded-xl object-cover object-top" />
            <span className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-card"><span className="size-2 rounded-full bg-emerald-500" /></span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5"><span className="text-sm font-semibold">经营决策专家</span><Badge variant="secondary" className="text-[9px]">AI</Badge></div>
            <p className="text-[11px] text-muted-foreground">点击进入智能问数分析</p>
          </div>
          <MessageSquare className="ml-2 size-4 text-muted-foreground group-hover:text-primary" />
        </button>
        <div className="flex-1" />
        <Badge variant="outline" className="text-xs">{updatedHint}</Badge>
      </div>

      {/* ── KPI cards ── */}
      <section className="grid grid-cols-7 gap-3" aria-label="关键经营指标">
        {kpis.map((kpi) => {
          const Icon = iconMap[kpi.icon]
          return (
            <Card key={kpi.key} className="shadow-none">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
                  {Icon && <Icon className="size-3.5 text-muted-foreground" />}
                </div>
                <div>
                  <div className="text-2xl font-semibold tracking-tight text-foreground">{kpi.month}</div>
                  <div className="text-[10px] text-muted-foreground">本月</div>
                </div>
                <div className="flex items-center justify-between border-t pt-1.5">
                  <span className="text-[10px] text-muted-foreground">今日 <b className="font-medium text-foreground">{kpi.today}</b></span>
                  <Badge variant="secondary" className="text-[9px]">{kpi.change}</Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* ── World map + country top 10 ── */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <Card className="shadow-none overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">全球销量热度地图</CardTitle>
            <CardDescription className="text-[11px]">颜色越深代表订单量越高</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative" onMouseLeave={() => setMapTooltip(null)}>
              <ComposableMap
                projectionConfig={{ scale: 155, center: [10, 15] }}
                style={{ width: "100%", height: "420px" }}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const numId = Number(geo.id)
                      const alpha3 = numToAlpha3[numId]
                      const heat = alpha3 ? (countrySalesMap[alpha3] ?? 0) : 0
                      const hasData = alpha3 ? !!countryDetails[alpha3] : false
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={heatColor(heat)}
                          stroke="#ffffff"
                          strokeWidth={0.6}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: hasData ? "#f59e0b" : heatColor(heat), outline: "none", cursor: hasData ? "pointer" : "default" },
                            pressed: { outline: "none" },
                          }}
                          onMouseEnter={(e: MouseEvent<SVGPathElement>) => {
                            if (!alpha3 || !countryDetails[alpha3]) return
                            const parent = (e.currentTarget as SVGElement).closest(".relative")!.getBoundingClientRect()
                            setMapTooltip({ x: e.clientX - parent.left, y: e.clientY - parent.top, alpha3 })
                          }}
                          onMouseMove={(e: MouseEvent<SVGPathElement>) => {
                            if (!alpha3 || !countryDetails[alpha3]) return
                            const parent = (e.currentTarget as SVGElement).closest(".relative")!.getBoundingClientRect()
                            setMapTooltip(prev => prev ? { ...prev, x: e.clientX - parent.left, y: e.clientY - parent.top } : null)
                          }}
                          onMouseLeave={() => setMapTooltip(null)}
                        />
                      )
                    })
                  }
                </Geographies>
              </ComposableMap>

              {/* hover tooltip */}
              {mapTooltip && countryDetails[mapTooltip.alpha3] && (() => {
                const d = countryDetails[mapTooltip.alpha3]
                return (
                  <div
                    className="pointer-events-none absolute z-10 min-w-[140px] rounded-lg border bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur-sm"
                    style={{ left: mapTooltip.x + 12, top: mapTooltip.y - 8 }}
                  >
                    <p className="mb-1.5 text-xs font-semibold">{d.name}</p>
                    <div className="flex flex-col gap-1">
                      {[
                        { label: "潜客量", value: d.lead.toLocaleString(), color: "#f59e0b" },
                        { label: "订单量", value: d.order.toLocaleString(), color: "#1d4ed8" },
                        { label: "成交量", value: d.deal.toLocaleString(), color: "#10b981" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between gap-4 text-[11px]">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <span className="inline-block size-1.5 rounded-full" style={{ background: color }} />
                            {label}
                          </span>
                          <span className="font-medium tabular-nums">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* legend */}
            <div className="flex items-center gap-3 px-5 pb-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1"><span className="inline-block size-3 rounded-sm" style={{ background: "#94a3b8" }} />未销售</div>
              {[{ c: "#bfdbfe", l: "极低" }, { c: "#93c5fd", l: "低" }, { c: "#3b82f6", l: "中" }, { c: "#1d4ed8", l: "高" }, { c: "#1e3a8a", l: "极高" }].map(({ c, l }) => (
                <div key={c} className="flex items-center gap-1">
                  <span className="inline-block size-3 rounded-sm" style={{ background: c }} />{l}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">订单 Top10 · 国家</CardTitle>
            <CardDescription className="text-[11px]">本月各国订单量排名</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryRanks} layout="vertical" margin={{ left: 0, right: 32, top: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="country" width={52} tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} 单`, "订单量"]} />
                <Bar dataKey="orders" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {countryRanks.map((_, i) => (
                    <Cell key={i} fill={i < 3 ? "#1e3a8a" : i < 6 ? "#1d4ed8" : "#3b82f6"} />
                  ))}
                  <LabelList dataKey="orders" position="right" style={{ fontSize: 10, fill: "#64748b" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Product top 10 + funnel ── */}
      <div className="grid grid-cols-[1.2fr_1fr] gap-4">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">订单 Top10 · 产品</CardTitle>
            <CardDescription className="text-[11px]">本月各商品订单量排名</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={productRanks.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 32, top: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="product" width={164} tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} 单`, "订单量"]} />
                <Bar dataKey="orders" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {productRanks.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={i < 3 ? "#1e3a8a" : i < 6 ? "#1d4ed8" : "#3b82f6"} />
                  ))}
                  <LabelList dataKey="orders" position="right" style={{ fontSize: 10, fill: "#64748b" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">营销转化��斗</CardTitle>
            <CardDescription className="text-[11px]">曝光 → 点击 → 潜客 → 订单，各阶段转化率</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 p-4 pt-2">
            {funnelSteps.map((step, i) => {
              const prev = i > 0 ? funnelSteps[i - 1].value : null
              const rate = prev ? ((step.value / prev) * 100).toFixed(1) : null
              const widthPct = 100 - i * 14  // 100% → 86% → 72% → 58%
              const fmtVal = step.value >= 1_000_000
                ? `${(step.value / 1_000_000).toFixed(2)}M`
                : step.value >= 1_000
                ? `${(step.value / 1_000).toFixed(1)}K`
                : step.value.toLocaleString()
              return (
                <div key={step.label} className="flex flex-col items-center">
                  {/* conversion arrow between steps */}
                  {i > 0 && rate && (
                    <div className="flex items-center gap-1.5 py-1 text-[10px] text-muted-foreground">
                      <div className="h-3 w-px bg-border" />
                      <span className="rounded-full border bg-background px-2 py-0.5 font-medium text-foreground">转化 {rate}%</span>
                      <div className="h-3 w-px bg-border" />
                    </div>
                  )}
                  {/* funnel bar */}
                  <div
                    className="flex h-12 items-center justify-between rounded px-4"
                    style={{ width: `${widthPct}%`, background: step.color }}
                  >
                    <span className="text-sm font-semibold text-white">{step.label}</span>
                    <span className="text-sm font-bold text-white">{fmtVal}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── 30-day trend ── */}
      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">近 30 天核心指标趋势</CardTitle>
              <CardDescription className="text-[11px]">曝光量、点击量、潜客量、订单量日维度走势</CardDescription>
            </div>
            <div className="flex gap-3 text-[10px] text-muted-foreground">
              {[{ label: "曝光", color: "#3b82f6" }, { label: "点击", color: "#8b5cf6" }, { label: "潜客", color: "#f59e0b" }, { label: "订单", color: "#10b981" }].map(l => (
                <span key={l.label} className="flex items-center gap-1"><span className="inline-block size-2 rounded-full" style={{ background: l.color }} />{l.label}</span>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <defs>
                {[{ key: "impression", color: "#3b82f6" }, { key: "click", color: "#8b5cf6" }, { key: "lead", color: "#f59e0b" }, { key: "order", color: "#10b981" }].map(({ key, color }) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} interval={4} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={36} />
              <Tooltip />
              <Area dataKey="impression" stroke="#3b82f6" strokeWidth={2} fill="url(#grad-impression)" dot={false} />
              <Area dataKey="click"      stroke="#8b5cf6" strokeWidth={2} fill="url(#grad-click)"      dot={false} />
              <Area dataKey="lead"       stroke="#f59e0b" strokeWidth={2} fill="url(#grad-lead)"       dot={false} />
              <Area dataKey="order"      stroke="#10b981" strokeWidth={2} fill="url(#grad-order)"      dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── AI chat panel ── */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex w-[400px] flex-col overflow-hidden rounded-2xl border bg-[var(--color-card-solid)] shadow-2xl">
          {/* header */}
          <div className="flex items-center gap-3 border-b bg-primary/5 px-4 py-3">
            <Image unoptimized src="/images/agent-analyst.png" alt="经营决策专家" width={32} height={32} className="size-8 rounded-lg object-cover object-top" />
            <div className="flex-1">
              <div className="flex items-center gap-2"><span className="text-sm font-semibold">经营决策专家</span><Sparkles className="size-3.5 text-primary" /></div>
              <p className="text-[10px] text-muted-foreground">智能问数分析</p>
            </div>
            <button onClick={() => setChatOpen(false)} className="rounded-md p-1 hover:bg-muted" aria-label="关闭">
              <X className="size-4" />
            </button>
          </div>
          {/* messages */}
          <div className="flex max-h-72 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-3.5 py-2.5">
                  {[0, 1, 2].map(i => <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {/* quick starts */}
          {messages.length <= 1 && (
            <div className="flex flex-col gap-1.5 px-4 pb-2">
              {starters.map(s => (
                <button key={s} onClick={() => sendMsg(s)} className="rounded-lg border px-3 py-2 text-left text-[11px] text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
          {/* input */}
          <div className="flex items-center gap-2 border-t p-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) sendMsg(input) }}
              placeholder="输入问题，按回车发送…"
              className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/60"
            />
            <Button size="icon" onClick={() => sendMsg(input)} disabled={!input.trim()} aria-label="发送">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
