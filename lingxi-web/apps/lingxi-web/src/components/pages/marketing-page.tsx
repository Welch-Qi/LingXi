"use client"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ArrowDownUp, ArrowRight, CheckCircle2, Clock, FileText, Film, Globe, ImageIcon, Link2, Megaphone, PlusCircle, Radio, Search, Send, Sparkles, Tag, Trash2, Upload, User, Video, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { apiDelete, apiGet, apiPost } from "@/lib/api"
import { mapCampaign, mapSocialAccount, SOCIAL_PLATFORMS, type CampaignCard, type SocialAccount, type SocialPlatform } from "@/lib/api-marketing"
import { pickRows } from "@/lib/format"
import { channels, contentAssets as initialAssets, distribution } from "@/lib/mocks/marketing"
import type { ContentAsset, TaskStatus } from "@/types"
import { LxKpi } from "@/components/lingxi-ui/lx-kpi"

/* ── static data ─────────────────────────────────────────── */
const performance = [{ day: "周一", reach: 18, leads: 32 }, { day: "周二", reach: 26, leads: 38 }, { day: "周三", reach: 23, leads: 44 }, { day: "周四", reach: 34, leads: 52 }, { day: "周五", reach: 42, leads: 61 }, { day: "周六", reach: 38, leads: 55 }, { day: "周日", reach: 48, leads: 68 }]
const fallbackCampaigns = [{ name: "欧洲阳台储能增长计划", channels: "TikTok · Instagram · YouTube", budget: "€48,000", spent: 68, roas: "4.8x", status: "投放中" }, { name: "Vanlife 夏季场景营销", channels: "Meta · Google", budget: "€32,000", spent: 42, roas: "3.6x", status: "投放中" }, { name: "B2B 经销商招募", channels: "LinkedIn · Email", budget: "€18,000", spent: 91, roas: "5.2x", status: "待复盘" }]
const stages = [{ id: "production", label: "内容生产", icon: FileText }, { id: "distribution", label: "内容分发", icon: Send }, { id: "campaign", label: "投放管理", icon: Megaphone }]
const fmt = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}w` : n.toLocaleString()

const STATUS_FROM_API: Record<string, TaskStatus> = {
  DRAFT: "创意中",
  READY: "已完成",
  PENDING_REVIEW: "待审核",
  APPROVED: "已审核",
  SCHEDULED: "已排期",
  PUBLISHED: "已完成",
}

function mapContentType(t?: string): ContentAsset["type"] {
  const u = (t || "").toUpperCase()
  if (u === "VIDEO") return "视频"
  if (u === "IMAGE") return "图文"
  return "文案"
}

function mapLocale(locale?: string): string {
  const l = (locale || "").toLowerCase()
  if (l.startsWith("de")) return "德语"
  if (l.startsWith("fr")) return "法语"
  if (l.startsWith("en")) return "英语"
  return "中文"
}

function mapAsset(row: Record<string, unknown>): ContentAsset {
  const statusRaw = String(row.status || "DRAFT")
  const status = STATUS_FROM_API[statusRaw] || (STATUS_FROM_API[statusRaw.toUpperCase()] ?? "创意中")
  const body = String(row.body || "")
  const bizCode = String(row.bizCode || row.id || "")
  return {
    id: String(row.id ?? bizCode),
    title: String(row.title || "未命名内容"),
    type: mapContentType(String(row.contentType || "")),
    channel: "TikTok",
    language: mapLocale(String(row.locale || "")),
    status,
    views: Number(row.views ?? 0),
    leads: Number(row.leads ?? 0),
    updatedAt: "刚刚",
    cover: mapContentType(String(row.contentType || "")) === "视频" ? "/images/content-blackout.png" : "/images/product-solar.png",
    summary: body.slice(0, 80) + (body.length > 80 ? "…" : ""),
    script: ["AI 内容"],
    creator: "内容创意师 Muse",
    tags: [bizCode, statusRaw].filter(Boolean),
    scriptText: body,
  }
}

/* ── per content-type config ─────────────────────────────── */
const imageModels = ["GPT-4o", "DALL·E 3", "Midjourney", "Stable Diffusion XL"]
const videoModels = ["GPT-4o", "Sora", "Kling AI", "Runway Gen-3"]

const imageScripts = [
  { id: "ip1", name: "产品主图展示型", desc: "干净背景、多角度产品细节，突出设计感与工艺" },
  { id: "ip2", name: "场景生活方式型", desc: "真实家居或户外场景，产品融入自然生活" },
  { id: "ip3", name: "对比信任型", desc: "使用前后对比，用视觉差异量化产品价值" },
  { id: "ip4", name: "信息图表型", desc: "数据可视化配图，适合参数说明与功能拆解" },
]
const videoScripts = [
  { id: "vp1", name: "痛点唤醒型", desc: "开场展示痛点场景，引出产品解决方案，行动号召结尾" },
  { id: "vp2", name: "数据信任型", desc: "用真实数据建立信任，量化产品价值，理性驱动转化" },
  { id: "vp3", name: "生活方式型", desc: "聚焦用户生活场景，情感共鸣，软性种草" },
  { id: "vp4", name: "教程指南型", desc: "分步骤教学，降低上手门槛，适合工具类内容" },
]

const sampleMaterials = [
  { id: "m1", name: "P2000 产品主图", type: "图片", cover: "/images/product-solar.png" },
  { id: "m2", name: "停电场景视频素材", type: "视频", cover: "/images/content-blackout.png" },
  { id: "m3", name: "阳台安装实拍", type: "图片", cover: "/images/content-balcony.png" },
  { id: "m4", name: "房车生活场景", type: "视频", cover: "/images/content-vanlife.png" },
  { id: "m5", name: "产品规格参数表", type: "文档", cover: "/images/product-power.png" },
]

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  "创意中": { label: "创意中", variant: "outline" },
  "执行中": { label: "生产中", variant: "outline" },
  "待审核": { label: "待审核", variant: "secondary" },
  "已审核": { label: "已审核", variant: "default" },
  "已完成": { label: "已完成", variant: "secondary" },
  "已排期": { label: "已排期", variant: "outline" },
}
const publishChannelOptions = ["TikTok", "Instagram", "YouTube", "LinkedIn", "Facebook", "Twitter/X", "WhatsApp", "微信视频号"]

/* ── image preview placeholder ───────────────────────────── */
function ImagePreview({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 aspect-square max-w-[300px] mx-auto">
        <Image unoptimized src="/images/product-solar.png" alt={title} fill className="object-cover" />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-xs font-semibold text-white leading-snug">{title}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {["/images/content-balcony.png", "/images/product-power.png", "/images/product-health.png"].map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <Image unoptimized src={src} alt="" fill className="object-cover opacity-80" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-center text-[11px] text-muted-foreground">AI 生成图集 · 4 张 · 已优化构图与色彩</div>
    </div>
  )
}

/* ── video preview placeholder ───────────────────────────── */
function VideoPreview({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video">
        <Image unoptimized src="/images/content-blackout.png" alt={title} fill className="object-cover opacity-70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Video className="size-5 text-white" />
          </div>
          <p className="text-[11px] font-medium text-white">视频预览</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full w-1/3 bg-primary" />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><Film className="size-3.5" />脚本已生成 · 4 个分镜</span>
        <span>时长预估：45s</span>
      </div>
      <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-center text-[11px] text-muted-foreground">AI 生成视频分镜草稿 · 点击可逐帧编辑</div>
    </div>
  )
}

/* ── component ───────────────────────────────────────────── */
export function MarketingPage() {
  const [tab, setTab] = useState("production")
  const [search, setSearch] = useState("")
  const [sortDesc, setSortDesc] = useState(true)
  const [detail, setDetail] = useState<ContentAsset | null>(null)
  const [assets, setAssets] = useState<ContentAsset[]>(initialAssets)
  const [campaigns, setCampaigns] = useState<CampaignCard[]>(fallbackCampaigns)
  const [lastGeneratedId, setLastGeneratedId] = useState<string>("")
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialError, setSocialError] = useState<string | null>(null)
  const [bindPlatform, setBindPlatform] = useState<SocialPlatform>("TIKTOK")
  const [bindAccountName, setBindAccountName] = useState("")
  const [binding, setBinding] = useState(false)

  const reloadAssets = useCallback(async () => {
    try {
      const data = await apiGet<unknown>("/marketing/contents")
      const rows = pickRows(data)
      if (rows.length) {
        setAssets(rows.map(mapAsset))
      }
    } catch {
      /* keep mock */
    }
  }, [])

  const reloadCampaigns = useCallback(async () => {
    try {
      const data = await apiGet<unknown>("/marketing/campaigns")
      const rows = pickRows(data)
      if (rows.length) {
        setCampaigns(rows.map(mapCampaign))
      }
    } catch {
      /* keep mock */
    }
  }, [])

  const reloadSocialAccounts = useCallback(async () => {
    setSocialLoading(true)
    setSocialError(null)
    try {
      const data = await apiGet<unknown>("/marketing/social-accounts")
      setSocialAccounts(pickRows(data).map(mapSocialAccount))
    } catch (e: unknown) {
      setSocialError(e instanceof Error ? e.message : "社媒账号加载失败")
      setSocialAccounts([])
    } finally {
      setSocialLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadAssets()
    void reloadCampaigns()
    void reloadSocialAccounts()
  }, [reloadAssets, reloadCampaigns, reloadSocialAccounts])

  /* new-content wizard */
  const [showCreate, setShowCreate] = useState(false)
  const [contentType, setContentType] = useState<"图片" | "视频">("图片")
  const [selMaterials, setSelMaterials] = useState<string[]>([])
  const [scriptMode, setScriptMode] = useState<"preset" | "custom">("preset")
  const [selScript, setSelScript] = useState("ip1")
  const [customScript, setCustomScript] = useState("")
  const [selModel, setSelModel] = useState("GPT-4o")
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [generatedText, setGeneratedText] = useState("")
  const [newTitle, setNewTitle] = useState("")

  /* publish sheet */
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState<ContentAsset | null>(null)
  const [pubContentType, setPubContentType] = useState<"图片" | "视频">("视频")
  const [pubSelectedId, setPubSelectedId] = useState<string>("")
  const [pubChannels, setPubChannels] = useState<string[]>([])
  const [pubTime, setPubTime] = useState("")
  const [pubDesc, setPubDesc] = useState("")
  const [pubKeywords, setPubKeywords] = useState("")

  /* derived: current preset scripts & models */
  const presetScripts = contentType === "图片" ? imageScripts : videoScripts
  const allModels = contentType === "图片" ? imageModels : videoModels

  /* open publish sheet (pre-selects item if provided) */
  function openPublish(item?: ContentAsset) {
    if (item) {
      setPublishTarget(item)
      setPubContentType(item.type === "视频" ? "视频" : "图片")
      setPubSelectedId(item.id)
    } else {
      setPublishTarget(null)
      setPubSelectedId("")
      setPubContentType("视频")
    }
    setPubChannels([]); setPubTime(""); setPubDesc(""); setPubKeywords("")
    setPublishOpen(true)
  }

  /* switch content type in create view — reset script selection */
  function switchContentType(t: "图片" | "视频") {
    setContentType(t)
    setSelScript(t === "图片" ? "ip1" : "vp1")
    setSelModel("GPT-4o")
    setGenerated(false)
    setGeneratedText("")
  }

  /* submit-for-review */
  async function submitForReview(item: ContentAsset) {
    try {
      const row = await apiPost<Record<string, unknown>>(`/marketing/contents/${item.id}/submit-review`)
      setAssets((prev) => prev.map((a) => a.id === item.id ? mapAsset(row) : a))
      toast.success(`《${item.title}》已提交审核`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "提交审核失败")
    }
  }

  /* approve */
  async function approve(item: ContentAsset) {
    try {
      const row = await apiPost<Record<string, unknown>>(`/marketing/contents/${item.id}/approve`)
      setAssets((prev) => prev.map((a) => a.id === item.id ? mapAsset(row) : a))
      toast.success(`《${item.title}》已审核通过`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "审核失败")
    }
  }

  /* generate content — 对接 POST /marketing/contents/generate，失败则本地草稿 */
  async function handleGenerate() {
    if (!newTitle.trim()) { toast.error("请填写内容主题"); return }
    setGenerating(true)
    setGenerated(false)
    setGeneratedText("")
    try {
      const data = await apiPost<{
        asset?: { id?: number | string; body?: string; bizCode?: string; status?: string }
        generatedBy?: string
        agentStatus?: string
      }>("/marketing/contents/generate", {
        title: newTitle.trim(),
        locale: "zh-CN",
        contentType: contentType === "视频" ? "VIDEO" : contentType === "图片" ? "IMAGE" : "TEXT",
      })
      const body = String(data.asset?.body ?? "")
      const by = data.generatedBy === "social_marketer" ? "Agent Muse" : "本地兜底"
      if (data.asset?.id != null) {
        setLastGeneratedId(String(data.asset.id))
      }
      setGeneratedText(
        body ||
          `【${newTitle}】\n\n（未返回正文）`,
      )
      setGenerated(true)
      await reloadAssets()
      toast.success(`已生成并落库 · ${by}${data.asset?.bizCode ? ` · ${data.asset.bizCode}` : ""}`)
    } catch (e: unknown) {
      const scriptName = scriptMode === "preset"
        ? presetScripts.find((p) => p.id === selScript)?.name
        : "自定义脚本"
      setGeneratedText(`【${newTitle}】\n\n以「${scriptName}」框架，结合 ${selMaterials.length} 份素材，使用 ${selModel} 生成的${contentType}内容草稿：\n\n在全球能源价格持续攀升的背景下，越来越多的欧洲家庭开始寻找安全、可靠的备用电源方案。本内容围绕用户的真实需求展开——展示阳台储能产品的核心价值：安装简便、响应即时、App 可视化管理。通过真实场景与产品演示相结合的方式，帮助目标用户建立购买信任，并通过限时优惠与免费勘测的行动号召，推动高意向用户进入成交漏斗。\n\n预计触达：12 万人 · 目标渗透市场：德国 · 建议投放渠道：TikTok、Instagram`)
      setGenerated(true)
      toast.message("后端生成失败，已使用本地预览草稿", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setGenerating(false)
    }
  }

  /* create & submit — 资产已在 generate 时落库，此处提交审核 */
  async function handleCreateSubmit() {
    if (!generated) { toast.error("请先一键生成内容"); return }
    try {
      if (lastGeneratedId) {
        await apiPost(`/marketing/contents/${lastGeneratedId}/submit-review`)
      }
      await reloadAssets()
      toast.success("内容已提交审核，待内容主管审阅")
    } catch (e: unknown) {
      toast.message("已生成，提交审核失败", {
        description: e instanceof Error ? e.message : String(e),
      })
      await reloadAssets()
    }
    setShowCreate(false)
    setNewTitle(""); setSelMaterials([]); setGenerated(false); setGeneratedText(""); setCustomScript(""); setLastGeneratedId("")
  }

  /* bind social account */
  async function handleBindAccount() {
    if (!bindAccountName.trim()) {
      toast.error("请填写账号名称")
      return
    }
    setBinding(true)
    try {
      await apiPost<Record<string, unknown>>("/marketing/social-accounts", {
        platform: bindPlatform,
        accountName: bindAccountName.trim(),
      })
      setBindAccountName("")
      await reloadSocialAccounts()
      toast.success("社媒账号已绑定")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "绑定失败")
    } finally {
      setBinding(false)
    }
  }

  /* unbind social account */
  async function handleUnbindAccount(account: SocialAccount) {
    try {
      await apiDelete(`/marketing/social-accounts/${account.id}`)
      setSocialAccounts((prev) => prev.filter((a) => a.id !== account.id))
      toast.success(`已解绑 ${account.platformLabel} · ${account.accountName}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "解绑失败")
    }
  }

  /* publish */
  async function handlePublish() {
    if (!pubChannels.length) { toast.error("请至少选择一个发布渠道"); return }
    if (!pubTime) { toast.error("请选择发布时间"); return }
    const targetId = pubSelectedId || publishTarget?.id
    if (!targetId) { toast.error("请选择要发布的内容"); return }
    try {
      const scheduledAt = new Date(pubTime).toISOString()
      await apiPost(`/marketing/contents/${targetId}/publish`, {
        channels: pubChannels,
        scheduledAt,
        description: pubDesc,
        keywords: pubKeywords,
      })
      await reloadAssets()
      toast.success(`内容已安排发布至 ${pubChannels.join("、")}`)
      setPublishOpen(false); setPublishTarget(null); setPubSelectedId(""); setPubChannels([]); setPubTime(""); setPubDesc(""); setPubKeywords("")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "发布失败")
    }
  }

  const rows = assets.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sortDesc ? b.views - a.views : a.views - b.views)

  /* publishable items for the sheet picker */
  const publishableItems = assets.filter((a) => ["已审核", "待审核", "已完成", "已排期"].includes(a.status))

  /* ── create view ─────────────────────────────────────────── */
  if (showCreate) return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">内容生产工作台</h2>
          <p className="text-[11px] text-muted-foreground">选择内容类型、素材与脚本，一键生成内容草稿</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}><X />返回列表</Button>
      </div>

      {/* content type selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">内容类型</span>
        <div className="flex rounded-lg border p-1 gap-1">
          {(["图片", "视频"] as const).map((t) => (
            <button key={t} onClick={() => switchContentType(t)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[11px] font-medium transition-colors ${contentType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {t === "图片" ? <ImageIcon className="size-3.5" /> : <Film className="size-3.5" />}{t}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {contentType === "图片" ? "适合 Instagram、Pinterest 等图文渠道" : "适合 TikTok、YouTube、Reels 等视频渠道"}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* left: config */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* title */}
          <Card className="shadow-none">
            <CardHeader className="py-3"><CardTitle className="text-sm">内容主题</CardTitle></CardHeader>
            <CardContent className="pb-4">
              <Input className="text-xs" placeholder="输入内容标题，例如：停电时如何保持家庭供电…" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </CardContent>
          </Card>
          {/* materials */}
          <Card className="shadow-none">
            <CardHeader className="py-3"><CardTitle className="text-sm">基础内容素材 <span className="font-normal text-muted-foreground">（可多选）</span></CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2 pb-4">
              {sampleMaterials.map((m) => {
                const sel = selMaterials.includes(m.id)
                return (
                  <button key={m.id} onClick={() => setSelMaterials((p) => sel ? p.filter((x) => x !== m.id) : [...p, m.id])}
                    className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${sel ? "border-primary bg-primary/5" : "hover:bg-muted/60"}`}>
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image unoptimized src={m.cover} alt={m.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1"><div className="text-xs font-medium">{m.name}</div><div className="text-[10px] text-muted-foreground">{m.type}</div></div>
                    {sel && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
                  </button>
                )
              })}
              <button className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-[11px] text-muted-foreground hover:bg-muted/60">
                <Upload className="size-3.5" />上传本地素材
              </button>
            </CardContent>
          </Card>
          {/* model */}
          <Card className="shadow-none">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">选择大模型
                <span className="ml-2 text-[10px] font-normal text-muted-foreground">（{contentType === "图片" ? "图片生成模型" : "视频生成模型"}）</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 pb-4">
              {allModels.map((m) => (
                <button key={m} onClick={() => setSelModel(m)}
                  className={`rounded-lg border px-3 py-1.5 text-[11px] transition-colors ${selModel === m ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{m}</button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* middle: script */}
        <div className="col-span-4 flex flex-col gap-4">
          <Card className="shadow-none flex-1">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">内容创作脚本</CardTitle>
              <CardDescription className="text-[11px]">
                {contentType === "图片" ? "选择图片内容创作框架或自定义" : "选择视频脚本框架或自定义"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pb-4">
              <div className="flex rounded-lg border p-1 gap-1">
                <button onClick={() => setScriptMode("preset")}
                  className={`flex-1 rounded-md py-1.5 text-[11px] transition-colors ${scriptMode === "preset" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>预置脚本</button>
                <button onClick={() => setScriptMode("custom")}
                  className={`flex-1 rounded-md py-1.5 text-[11px] transition-colors ${scriptMode === "custom" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>自定义脚本</button>
              </div>
              {scriptMode === "preset"
                ? presetScripts.map((p) => {
                  const sel = selScript === p.id
                  return (
                    <button key={p.id} onClick={() => setSelScript(p.id)}
                      className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors ${sel ? "border-primary bg-primary/5" : "hover:bg-muted/60"}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${sel ? "text-primary" : ""}`}>{p.name}</span>
                        {sel && <CheckCircle2 className="size-3.5 text-primary" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                    </button>
                  )
                })
                : <Textarea className="min-h-[200px] text-[11px]" placeholder="请输入您的自定义创作脚本，描述内容结构、主要卖点、目标受众与行动号召…" value={customScript} onChange={(e) => setCustomScript(e.target.value)} />
              }
            </CardContent>
          </Card>
        </div>

        {/* right: preview */}
        <div className="col-span-3 flex flex-col gap-4">
          <Card className="shadow-none flex-1 flex flex-col">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">内容预览</CardTitle>
              <CardDescription className="text-[11px]">AI 生成的{contentType}内容草稿</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 pb-4">
              <Button className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating
                  ? <><span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />生成中…</>
                  : <><Sparkles />一键生成</>}
              </Button>

              {/* generating state */}
              {generating && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                  <span className="size-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <p className="text-xs font-medium text-foreground">内容生成中，请等待</p>
                  <p className="text-[10px] text-muted-foreground">{selModel} 正在处理您的{contentType}创作请求…</p>
                </div>
              )}

              {/* generated: image preview */}
              {!generating && generated && contentType === "图片" && (
                <div className="flex flex-1 flex-col gap-3 overflow-auto">
                  <ImagePreview title={newTitle} />
                  <div className="rounded-lg bg-muted/60 p-3 text-[11px] leading-relaxed whitespace-pre-line text-muted-foreground">{generatedText.split("\n\n").slice(2).join("\n\n")}</div>
                </div>
              )}

              {/* generated: video preview */}
              {!generating && generated && contentType === "视频" && (
                <div className="flex flex-1 flex-col gap-3 overflow-auto">
                  <VideoPreview title={newTitle} />
                  <div className="rounded-lg bg-muted/60 p-3 text-[11px] leading-relaxed whitespace-pre-line text-muted-foreground">{generatedText.split("\n\n").slice(2).join("\n\n")}</div>
                </div>
              )}

              {/* empty state */}
              {!generating && !generated && (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed text-[11px] text-muted-foreground">
                  点击「一键生成」获取{contentType}内容草稿
                </div>
              )}

              {generated && !generating && (
                <Button variant="outline" className="w-full" onClick={handleCreateSubmit}><Send />提交审核</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  /* ── main view ───────────────────────────────────────────── */
  return <div className="flex w-full flex-col gap-4">
    <div className="glass flex items-center justify-between p-3.5">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-violet to-primary opacity-60 blur-[3px]" />
          <Image unoptimized src="/images/agent-content.png" alt="内容创意师 Muse" width={38} height={38} className="relative size-9 rounded-xl object-cover object-top ring-2 ring-background" />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-success ring-2 ring-background">
            <span className="size-1.5 rounded-full bg-white" />
          </span>
        </div>
        <div>
          <div className="text-xs font-semibold text-ink">内容增长工作流</div>
          <div className="text-[10px] text-muted-foreground">Muse 正在协调创作、分发与投放任务</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center gap-1.5">
            <button
              onClick={() => setTab(stage.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-medium transition-all ${
                tab === stage.id
                  ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_var(--primary)]"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              <stage.icon className="size-3.5" />0{index + 1} {stage.label}
            </button>
            {index < 2 && <div className="h-px w-4 bg-border" />}
          </div>
        ))}
      </div>
    </div>

    {/* production tab */}
    {tab === "production" && <><section className="grid grid-cols-4 gap-3">
      {[
        { l: "生产中", v: "46", s: "视频 18 · 图文 28", c: "primary" as const },
        { l: "待审核", v: "12", s: "3 项即将到期", c: "warning" as const },
        { l: "本月完成", v: "386", s: "环比 +28%", c: "success" as const },
        { l: "多语种版本", v: "1,248", s: "覆盖 12 种语言", c: "info" as const },
      ].map((x) => (
        <LxKpi key={x.l} label={x.l} value={x.v} sub={x.s} color={x.c} />
      ))}
    </section>
      <Card className="shadow-none">
        <CardHeader className="flex-row items-center justify-between py-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-1.5"><Link2 className="size-3.5 text-primary" />社媒账号管理</CardTitle>
            <CardDescription className="text-[11px]">绑定 Facebook / Instagram / LinkedIn / TikTok 账号，用于内容分发与投放</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => void reloadSocialAccounts()} disabled={socialLoading}>
            {socialLoading ? "加载中…" : "刷新"}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pb-4">
          {socialError && (
            <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-center text-[11px] text-muted-foreground">
              {socialError} · 请检查后端服务或稍后重试
            </div>
          )}
          {!socialError && socialAccounts.length === 0 && !socialLoading && (
            <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-center text-[11px] text-muted-foreground">
              暂无已绑定社媒账号，请在下方添加
            </div>
          )}
          {socialAccounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {socialAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium">{account.platformLabel}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{account.accountName}</div>
                  </div>
                  <Badge variant={account.authStatus === "CONNECTED" ? "default" : "secondary"} className="text-[10px]">
                    {account.authStatusLabel}
                  </Badge>
                  <Button size="sm" variant="ghost" className="size-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => void handleUnbindAccount(account)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">平台</Label>
              <Select value={bindPlatform} onValueChange={(v) => v && setBindPlatform(v as SocialPlatform)}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 min-w-[180px]">
              <Label className="text-[11px] text-muted-foreground">账号名称</Label>
              <Input className="h-8 text-xs" placeholder="例如：@novatech_de 或品牌主页名" value={bindAccountName} onChange={(e) => setBindAccountName(e.target.value)} />
            </div>
            <Button size="sm" onClick={() => void handleBindAccount()} disabled={binding}>
              {binding ? "绑定中…" : <><PlusCircle />绑定账号</>}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-none"><CardHeader className="flex-row items-center justify-between py-3"><div><CardTitle className="text-sm">内容生产队列</CardTitle><CardDescription className="text-[11px]">策划、创作、审核与版本状态</CardDescription></div><div className="flex gap-2"><div className="relative"><Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" /><Input className="h-8 w-48 pl-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索内容" /></div><Button size="sm" variant="outline" onClick={() => setSortDesc(!sortDesc)}><ArrowDownUp />浏览量</Button><Button size="sm" onClick={() => setShowCreate(true)}><PlusCircle />新建内容</Button></div></CardHeader>
        <CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>封面</TableHead><TableHead>内容主题</TableHead><TableHead>类型</TableHead><TableHead>语言</TableHead><TableHead>目标渠道</TableHead><TableHead>状态</TableHead><TableHead>更新时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{rows.map((item) => {
          const sb = statusBadge[item.status] ?? { label: item.status, variant: "outline" as const }
          return <TableRow key={item.id}><TableCell><div className="relative h-9 w-14 overflow-hidden rounded-md bg-muted"><Image unoptimized src={item.cover} alt={item.title} fill className="object-cover" /></div></TableCell><TableCell><div className="font-medium">{item.title}</div><div className="text-[10px] text-muted-foreground">{item.id}</div></TableCell><TableCell>{item.type}</TableCell><TableCell>{item.language}</TableCell><TableCell>{item.channel}</TableCell>
            <TableCell><Badge variant={sb.variant}>{sb.label}</Badge></TableCell>
            <TableCell className="text-[11px] text-muted-foreground">{item.updatedAt}</TableCell>
            <TableCell><div className="flex items-center justify-end gap-1">
              {item.status === "创意中" && <Button size="sm" variant="outline" onClick={() => submitForReview(item)}>提交审核</Button>}
              {item.status === "待审核" && <Button size="sm" variant="outline" onClick={() => approve(item)}>审核通过</Button>}
              {item.status === "已审核" && <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600" onClick={() => openPublish(item)}><Radio data-icon="inline-start" />一键发布</Button>}
              <Button size="sm" variant="ghost" onClick={() => setDetail(item)}>详情<ArrowRight data-icon="inline-end" /></Button>
            </div></TableCell>
          </TableRow>
        })}</TableBody></Table></CardContent></Card></>}

    {/* distribution tab */}
    {tab === "distribution" && <><div className="flex items-center justify-end">
      <Button onClick={() => openPublish()}><Radio data-icon="inline-start" />内容发布</Button>
    </div>
      <div className="grid grid-cols-12 gap-4"><Card className="col-span-8 shadow-none"><CardHeader><CardTitle className="text-sm">渠道分发效果</CardTitle><CardDescription className="text-[11px]">近 7 日触达与线索贡献</CardDescription></CardHeader><CardContent><ChartContainer config={{ reach: { label: "触达（万）", color: "#2563eb" }, leads: { label: "线索", color: "#10b981" } }} className="h-56 w-full"><BarChart data={performance}><CartesianGrid vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="reach" fill="var(--color-reach)" radius={[3, 3, 0, 0]} /><Bar dataKey="leads" fill="var(--color-leads)" radius={[3, 3, 0, 0]} /></BarChart></ChartContainer></CardContent></Card><Card className="col-span-4 shadow-none"><CardHeader><CardTitle className="text-sm">分发任务</CardTitle><CardDescription className="text-[11px]">今日渠道排期与完成情况</CardDescription></CardHeader><CardContent className="flex flex-col gap-4">{[{ c: "TikTok", n: 24, p: 82 }, { c: "Instagram", n: 18, p: 64 }, { c: "YouTube", n: 8, p: 50 }, { c: "LinkedIn", n: 12, p: 91 }].map((x) => <div key={x.c}><div className="mb-1.5 flex justify-between text-[11px]"><span>{x.c}</span><span>{x.n} 项 · {x.p}%</span></div><Progress value={x.p} /></div>)}</CardContent></Card></div>
      <Card className="shadow-none"><CardHeader className="py-3"><CardTitle className="text-sm">内容渠道投放矩阵</CardTitle><CardDescription className="text-[11px]">各内容在各渠道是否投放，以及曝光量与点击量（演示数据，暂无专门端点）</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>内容主题</TableHead><TableHead>类型</TableHead>{channels.map((c) => <TableHead key={c} className="text-center">{c}</TableHead>)}<TableHead className="text-right">总曝光量</TableHead><TableHead className="text-right">总点击量</TableHead></TableRow></TableHeader><TableBody>{distribution.map((d) => { const imp = d.channels.reduce((s, c) => s + c.impressions, 0); const clk = d.channels.reduce((s, c) => s + c.clicks, 0); return <TableRow key={d.id}><TableCell><div className="font-medium">{d.title}</div><div className="text-[10px] text-muted-foreground">{d.id}</div></TableCell><TableCell>{d.type}</TableCell>{d.channels.map((c) => <TableCell key={c.channel} className="text-center">{c.delivered ? <CheckCircle2 className="mx-auto size-4 text-primary" /> : <X className="mx-auto size-4 text-muted-foreground/40" />}</TableCell>)}<TableCell className="text-right font-medium">{fmt(imp)}</TableCell><TableCell className="text-right font-medium text-primary">{fmt(clk)}</TableCell></TableRow> })}</TableBody></Table></CardContent></Card></>}

    {/* campaign tab */}
    {tab === "campaign" && <div className="grid grid-cols-3 gap-4">{campaigns.map((campaign) => <Card key={campaign.name} className="shadow-none"><CardHeader><div className="flex items-start justify-between"><div className="flex size-9 items-center justify-center rounded-lg bg-muted"><Megaphone className="size-4" /></div><Badge variant={campaign.status === "投放中" ? "default" : "secondary"}>{campaign.status}</Badge></div><CardTitle className="pt-3 text-sm">{campaign.name}</CardTitle><CardDescription className="text-[11px]">{campaign.channels}</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div><div className="mb-2 flex justify-between text-[11px]"><span>预算消耗</span><b>{campaign.spent}%</b></div><Progress value={campaign.spent} /></div><div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-muted p-3"><div className="text-[10px] text-muted-foreground">计划预算</div><b className="mt-1 block text-sm">{campaign.budget}</b></div><div className="rounded-lg bg-muted p-3"><div className="text-[10px] text-muted-foreground">ROAS</div><b className="mt-1 block text-sm">{campaign.roas}</b></div></div><Button variant="outline" onClick={() => toast.success("投放数据已更新")}><Megaphone />查看投放明细</Button></CardContent></Card>)}</div>}

    {/* detail sheet */}
    <Sheet open={!!detail} onOpenChange={(open) => !open && setDetail(null)}><SheetContent className="flex w-[520px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]"><div className="relative h-[50vh] w-full shrink-0 bg-muted">{detail && <Image unoptimized src={detail.cover} alt={detail.title} fill className="object-cover" />}</div><div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">{detail && <><SheetHeader className="p-0"><SheetTitle className="text-base">{detail.title}</SheetTitle><SheetDescription className="text-[11px]">{detail.id} · {detail.type} · {detail.language}</SheetDescription></SheetHeader><div className="grid grid-cols-3 gap-2">{[{ l: "状态", v: (statusBadge[detail.status]?.label ?? detail.status) }, { l: "浏览量", v: fmt(detail.views) }, { l: "线索", v: `${detail.leads}` }].map((x) => <div key={x.l} className="rounded-md bg-muted p-2.5 text-center"><div className="text-[10px] text-muted-foreground">{x.l}</div><b className="mt-1 block text-xs">{x.v || "—"}</b></div>)}</div><div className="flex items-start gap-2"><User className="mt-0.5 size-3.5 shrink-0 text-primary" /><div><div className="text-[10px] text-muted-foreground">内容创作师</div><div className="mt-0.5 text-xs font-medium">{detail.creator}</div></div></div><div className="flex items-start gap-2"><Tag className="mt-0.5 size-3.5 shrink-0 text-primary" /><div><div className="mb-1.5 text-[10px] text-muted-foreground">内容标签</div><div className="flex flex-wrap gap-1.5">{detail.tags?.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div></div></div><div><div className="mb-2 flex items-center gap-1.5 text-xs font-medium"><FileText className="size-3.5 text-primary" />创造脚本</div><p className="text-[11px] leading-[1.75] text-muted-foreground">{detail.scriptText ?? detail.summary}</p></div>
      <div className="flex gap-2">{(detail.status === "已审核" || detail.status === "已完成") && <Button className="flex-1" onClick={() => { setDetail(null); openPublish(detail) }}><Radio data-icon="inline-start" />一键发布</Button>}<Button variant="outline" className="flex-1" onClick={() => { setDetail(null); toast.success("内容已进入分发排期") }}><Send data-icon="inline-start" />进入分发排期</Button></div></>}</div></SheetContent></Sheet>

    {/* publish sheet */}
    <Sheet open={publishOpen} onOpenChange={(open) => { setPublishOpen(open); if (!open) setPublishTarget(null) }}>
        <SheetContent className="w-[500px] overflow-auto sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>内容发布</SheetTitle>
            <SheetDescription className="text-[11px]">配置发布渠道、时间与关键信息</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-5 p-5 pt-2">
            {/* content type + picker */}
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="text-xs font-medium">选择发布内容</div>
              {/* type switch */}
              <div className="flex gap-2">
                {(["图片", "视频"] as const).map((t) => (
                  <button key={t} onClick={() => { setPubContentType(t); setPubSelectedId("") }}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] transition-colors ${pubContentType === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {t === "图片" ? <ImageIcon className="size-3" /> : <Film className="size-3" />}{t}内容
                  </button>
                ))}
              </div>
              {/* content picker */}
              <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                {publishableItems
                  .filter((a) => pubContentType === "视频" ? a.type === "视频" : a.type !== "视频")
                  .map((a) => {
                    const isSel = pubSelectedId === a.id || (!pubSelectedId && publishTarget?.id === a.id)
                    return (
                      <button key={a.id} onClick={() => setPubSelectedId(a.id)}
                        className={`flex items-center gap-2.5 rounded-lg border p-2 text-left transition-colors ${isSel ? "border-primary bg-primary/5" : "hover:bg-muted/60"}`}>
                        <div className="relative size-8 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image unoptimized src={a.cover} alt={a.title} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11px] font-medium">{a.title}</div>
                          <div className="text-[10px] text-muted-foreground">{a.id} · {(statusBadge[a.status]?.label ?? a.status)}</div>
                        </div>
                        {isSel && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
                      </button>
                    )
                  })}
                {publishableItems.filter((a) => pubContentType === "视频" ? a.type === "视频" : a.type !== "视频").length === 0 && (
                  <div className="py-3 text-center text-[11px] text-muted-foreground">暂无可发布的{pubContentType}内容</div>
                )}
              </div>
            </div>

            <div><div className="mb-2 text-xs font-medium flex items-center gap-1.5"><Globe className="size-3.5 text-primary" />发布渠道 <span className="text-muted-foreground font-normal">（可多选）</span></div><div className="flex flex-wrap gap-2">{publishChannelOptions.map((c) => { const sel = pubChannels.includes(c); return <button key={c} onClick={() => setPubChannels((p) => sel ? p.filter((x) => x !== c) : [...p, c])} className={`rounded-lg border px-3 py-1.5 text-[11px] transition-colors ${sel ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{c}</button> })}</div></div>
            <div><div className="mb-2 text-xs font-medium flex items-center gap-1.5"><Clock className="size-3.5 text-primary" />发布时间</div><Input type="datetime-local" className="text-xs" value={pubTime} onChange={(e) => setPubTime(e.target.value)} /></div>
            <div><div className="mb-2 text-xs font-medium flex items-center gap-1.5"><FileText className="size-3.5 text-primary" />内容说明</div><Textarea className="text-[11px] min-h-[80px]" placeholder="简要描述本次发布的目标与注意事项…" value={pubDesc} onChange={(e) => setPubDesc(e.target.value)} /></div>
            <div><div className="mb-2 text-xs font-medium flex items-center gap-1.5"><Tag className="size-3.5 text-primary" />内容关键字</div><Input className="text-xs" placeholder="输入关键字，用逗号分隔，如：储能,阳台,德国,新能源" value={pubKeywords} onChange={(e) => setPubKeywords(e.target.value)} /></div>
            <Button className="w-full" onClick={handlePublish}><Radio />确认发布</Button>
          </div>
        </SheetContent>
    </Sheet>
  </div>
}
