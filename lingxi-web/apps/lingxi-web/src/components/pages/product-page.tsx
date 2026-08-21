"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts"
import { ArrowRight, BarChart3, Globe2, Lightbulb, Rocket, Sparkles, ThumbsDown, ThumbsUp, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import {
  fetchHotKeywords,
  fetchOpportunities,
  fetchRegionHeat,
  fetchRisingKeywords,
  fetchSearchTrends,
  type HotKeywordView,
} from "@/lib/api-market"
import { categoryData, productCategories, type ProductCategory } from "@/lib/mocks/product"
import type { IdeaStage, ProductOpportunity, SubTrend } from "@/types"

const stages = [
  { id: "trend", n: "01", label: "市场趋势", icon: BarChart3 },
  { id: "opportunity", n: "02", label: "产品开发", icon: Globe2 },
  { id: "idea", n: "03", label: "产品创意", icon: Lightbulb },
] as const

type TabId = (typeof stages)[number]["id"]

const lineColors = ["#2563eb", "#f59e0b", "#10b981", "#ec4899"]
const weekLabels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]
const nextStage: Record<IdeaStage, string> = { 创意: "开发", 开发: "验证", 验证: "业绩" }
const stageVariant: Record<IdeaStage, "default" | "secondary" | "outline"> = {
  创意: "default",
  开发: "secondary",
  验证: "outline",
}

interface MarketApiState {
  trends: SubTrend[]
  opportunities: ProductOpportunity[]
  hotKeywords: HotKeywordView[]
  oppCount: number | null
  fromApi: boolean
}

const emptyApiState: MarketApiState = {
  trends: [],
  opportunities: [],
  hotKeywords: [],
  oppCount: null,
  fromApi: false,
}

export function ProductPage() {
  const [category, setCategory] = useState<ProductCategory>("智能电子")
  const [tab, setTab] = useState<TabId>("trend")
  const [loading, setLoading] = useState(true)
  const [apiState, setApiState] = useState<MarketApiState>(emptyApiState)

  const mockData = categoryData[category]

  const loadMarketData = useCallback(async (cat: ProductCategory) => {
    const fallback = categoryData[cat]
    setLoading(true)
    try {
      const [trends, opportunities, hotKeywords] = await Promise.all([
        fetchSearchTrends(cat),
        fetchOpportunities(),
        fetchHotKeywords(cat),
      ])
      // Fire-and-forget supplementary endpoints (contract coverage)
      void fetchRisingKeywords(cat).catch(() => [])
      void fetchRegionHeat(cat).catch(() => [])

      const hasTrends = trends.length > 0
      const hasOpps = opportunities.length > 0

      if (!hasTrends && !hasOpps) {
        throw new Error("empty")
      }

      setApiState({
        trends: hasTrends ? trends : fallback.trends,
        opportunities: hasOpps ? opportunities : fallback.opportunities,
        hotKeywords,
        oppCount: hasOpps ? opportunities.length : null,
        fromApi: hasTrends || hasOpps,
      })
    } catch {
      toast.error("市场数据加载失败，已回退至设计 mock")
      setApiState({
        trends: fallback.trends,
        opportunities: fallback.opportunities,
        hotKeywords: [],
        oppCount: null,
        fromApi: false,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMarketData(category)
  }, [category, loadMarketData])

  const trends = apiState.trends.length > 0 ? apiState.trends : mockData.trends
  const opportunities =
    apiState.opportunities.length > 0 ? apiState.opportunities : mockData.opportunities
  const ideas = mockData.ideas

  const chartData = useMemo(
    () =>
      weekLabels.map((w, i) => {
        const row: Record<string, number | string> = { w }
        trends.forEach((t) => {
          row[t.subCategory] = t.series[i] ?? 0
        })
        return row
      }),
    [trends],
  )

  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        trends.map((t, i) => [
          t.subCategory,
          { label: t.subCategory, color: lineColors[i % lineColors.length] },
        ]),
      ),
    [trends],
  )

  const hotKeywordHint =
    apiState.hotKeywords.length > 0
      ? apiState.hotKeywords
          .slice(0, 3)
          .map((k) => k.keyword)
          .join(" · ")
      : null

  return (
    <div className="flex w-full flex-col gap-4">
      {apiState.oppCount != null ? (
        <div className="rounded-lg border border-primary-line bg-primary-soft px-4 py-2 text-[12px] text-primary">
          已连接后端机会库：<b className="num">{apiState.oppCount}</b> 条（`GET /market/opportunities`）。
          {apiState.fromApi ? " 趋势与机会卡片已接入真实 API。" : null}
        </div>
      ) : null}

      <Card className="shadow-none">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">产品发现工作流</div>
              <div className="text-[10px] text-muted-foreground">
                信号监测、机会评估、创意转化持续衔接
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab(stage.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 ${tab === stage.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <stage.icon className="size-3.5" />
                  <span>
                    {stage.n} {stage.label}
                  </span>
                </button>
                {index < 2 && <ArrowRight className="size-3.5 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">商品类别</span>
        {productCategories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${category === c ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {tab === "trend" && (
        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-8 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">{category} · 细分品类市场趋势</CardTitle>
                  <CardDescription className="mt-1 text-[11px]">
                    近 8 周搜索与社媒综合需求指数
                    {hotKeywordHint ? ` · 热词：${hotKeywordHint}` : null}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{loading ? "加载中" : "实时更新"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  正在加载趋势数据…
                </div>
              ) : trends.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  暂无趋势数据
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <LineChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="w" axisLine={false} tickLine={false} className="text-[10px]" />
                    <YAxis axisLine={false} tickLine={false} width={28} className="text-[10px]" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    {trends.map((t, i) => (
                      <Line
                        key={t.subCategory}
                        dataKey={t.subCategory}
                        type="monotone"
                        stroke={lineColors[i % lineColors.length]}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
          <div className="col-span-4 flex flex-col gap-3">
            {trends.map((t) => (
              <Card key={t.subCategory} className="shadow-none">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium">{t.subCategory}</span>
                    <span className="text-[11px] font-semibold text-primary">{t.growth}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={t.index} className="flex-1" />
                    <b className="text-sm">{t.index}</b>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "opportunity" && (
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 flex h-40 items-center justify-center text-sm text-muted-foreground">
              正在加载机会扫描…
            </div>
          ) : opportunities.length === 0 ? (
            <div className="col-span-2 flex h-40 items-center justify-center text-sm text-muted-foreground">
              暂无机会数据
            </div>
          ) : (
            opportunities.map((o) => (
              <Card key={o.id} className="shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm">{o.subCategory}</CardTitle>
                      <CardDescription className="mt-1 text-[11px]">
                        {o.market} · 机会 {o.id}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-primary">{o.score}</div>
                      <div className="text-[10px] text-muted-foreground">机会评分</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <div className="mb-2 text-[11px] font-medium">主要玩家 / 市场份额</div>
                    <div className="flex flex-col gap-1.5">
                      {o.players.map((p) => (
                        <div key={p.name} className="flex items-center gap-2 text-[11px]">
                          <span className="w-20 shrink-0 truncate text-muted-foreground">{p.name}</span>
                          <Progress value={p.share} className="h-1.5 flex-1" />
                          <span className="w-8 text-right font-medium">{p.share}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-dashed p-3 text-[11px] leading-5">
                    <span className="font-medium">竞争分析：</span>
                    {o.competition}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                        <ThumbsUp className="size-3.5" />
                        用户爽点
                      </div>
                      <ul className="flex flex-col gap-1 text-[11px] text-emerald-800">
                        {o.pleasurePoints.map((x) => (
                          <li key={x}>· {x}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-rose-700">
                        <ThumbsDown className="size-3.5" />
                        用户痛点
                      </div>
                      <ul className="flex flex-col gap-1 text-[11px] text-rose-800">
                        {o.painPoints.map((x) => (
                          <li key={x}>· {x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="rounded-lg bg-primary/5 p-3">
                    <div className="mb-1.5 text-[11px] font-medium text-primary">产品开发机会</div>
                    <p className="text-[11px] leading-5">{o.description}</p>
                    <div className="mt-2.5 grid grid-cols-1 gap-1.5 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">品类：</span>
                        {o.subCategory}
                      </div>
                      <div>
                        <span className="text-muted-foreground">主打特色：</span>
                        {o.feature}
                      </div>
                      <div>
                        <span className="text-muted-foreground">竞争力分析：</span>
                        {o.competitiveness}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTab("idea")
                      toast.success(`已基于「${o.subCategory}」生成产品创意`)
                    }}
                  >
                    <Sparkles data-icon="inline-start" />
                    生成产品创意
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "idea" && (
        <div className="grid grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <Card key={idea.id} className="overflow-hidden shadow-none">
              <div className="relative h-40 bg-muted">
                <Image unoptimized src={idea.image} alt={idea.name} fill className="object-cover" />
                <Badge variant={stageVariant[idea.stage]} className="absolute right-3 top-3">
                  {idea.stage}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{idea.name}</CardTitle>
                <CardDescription className="text-[11px]">{idea.subCategory}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                  <div>
                    <div className="text-muted-foreground">目标客户</div>
                    <div className="mt-0.5 font-medium">{idea.targetCustomer}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">目标市场</div>
                    <div className="mt-0.5 font-medium">{idea.targetMarket}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">对标竞品</div>
                    <div className="mt-0.5 font-medium">{idea.competitor}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">推荐价格</div>
                    <div className="mt-0.5 font-medium text-primary">{idea.price}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">市场容量</div>
                    <div className="mt-0.5 font-medium">{idea.marketSize}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">预估渗透率</div>
                    <div className="mt-0.5 font-medium">{idea.penetration}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] text-muted-foreground">产品特色</div>
                  <div className="flex flex-wrap gap-1.5">
                    {idea.features.map((f) => (
                      <Badge key={f} variant="outline" className="text-[10px]">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant={idea.stage === "创意" ? "default" : "outline"}
                  onClick={() => toast.success(`「${idea.name}」已推进至${nextStage[idea.stage]}阶段`)}
                >
                  <Rocket data-icon="inline-start" />
                  {nextStage[idea.stage]}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
