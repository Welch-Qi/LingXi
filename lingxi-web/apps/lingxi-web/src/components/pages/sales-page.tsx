"use client"
// @ts-nocheck — design dump; sheet/map callbacks typed loosely
import { useCallback, useEffect, useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { ArrowLeft, ArrowRight, Building2, CalendarDays, CircleUser, Headset, Mail, MessageSquare, Phone, PhoneCall, Repeat, Save, Search, ShoppingBag, Target, TrendingUp, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { apiGet, apiPost } from "@/lib/api"
import { customer360, customers, dealRecords, dealTrend, lifecycleCards, receptionLeads as mockReception } from "@/lib/mocks/sales"
import type { Customer, IntentLevel, LifecycleCard, ReceptionLead } from "@/types"

const stages = [{ id: "reception", label: "客户接待", icon: Headset }, { id: "profile", label: "客户档案", icon: CircleUser }, { id: "follow", label: "客户跟进", icon: Target }, { id: "deal", label: "客户成交", icon: ShoppingBag }]
const buckets = ["全部", "今日", "昨日", "本周", "本月"] as const
const intents = ["全部", "高", "中", "低"] as const
const intentColor = (i: IntentLevel) => i === "高" ? "bg-primary text-primary-foreground" : i === "中" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
const fmtMoney = (n: number) => `€${n.toLocaleString()}`

const markets = ["德国", "法国", "英国", "波兰", "西班牙", "意大利", "荷兰", "挪威", "加拿大", "美国"]
const sources = ["官网", "TikTok", "Instagram", "Facebook", "WhatsApp", "YouTube", "经销商", "线下展会"]
const followers = ["林晓", "赵磊", "Echo AI"]

interface NewProfileForm { name: string; company: string; market: string; source: string; intent: IntentLevel; intentProduct: string; follower: string; phone: string; email: string; industry: string; notes: string }
const blankProfileForm: NewProfileForm = { name: "", company: "", market: "德国", source: "官网", intent: "中", intentProduct: "", follower: "林晓", phone: "", email: "", industry: "", notes: "" }

function mapSession(row: Record<string, unknown>): ReceptionLead {
  const intentRaw = String(row.intentLevel || "中")
  const intent = (intentRaw === "高" || intentRaw === "中" || intentRaw === "低" ? intentRaw : "中") as IntentLevel
  return {
    id: String(row.id ?? row.bizCode ?? ""),
    name: String(row.contactName || ""),
    avatarText: String(row.avatarText || "??"),
    market: String(row.market || ""),
    source: String(row.source || ""),
    intent,
    product: String(row.product || ""),
    waiting: String(row.waiting || ""),
    unread: Number(row.unreadCount ?? 0),
    summary: String(row.lastSummary || ""),
    conversation: [],
  }
}

function mapMessage(row: Record<string, unknown>): ReceptionLead["conversation"][number] {
  const from = String(row.senderType || "customer") === "agent" ? "agent" : "customer"
  return {
    from,
    time: String(row.time || ""),
    text: String(row.body || row.text || ""),
  }
}

export function SalesPage() {
  const [tab, setTab] = useState("reception")
  const [receptionLeads, setReceptionLeads] = useState<ReceptionLead[]>(mockReception)
  const [activeLead, setActiveLead] = useState<ReceptionLead>(mockReception[0])
  const [composer, setComposer] = useState("")
  const [sending, setSending] = useState(false)
  const [bucket, setBucket] = useState<(typeof buckets)[number]>("全部")
  const [intent, setIntent] = useState<(typeof intents)[number]>("全部")
  const [search, setSearch] = useState("")
  const [c360, setC360] = useState<Customer | null>(null)
  const [activeCard, setActiveCard] = useState<LifecycleCard | null>(lifecycleCards[1])
  const [customerList, setCustomerList] = useState<Customer[]>(customers)
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<NewProfileForm>(blankProfileForm)

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const rows = await apiGet<Record<string, unknown>[]>(`/sales/sessions/${sessionId}/messages`)
      if (Array.isArray(rows)) {
        const conversation = rows.map(mapMessage)
        setActiveLead((prev) => prev.id === sessionId ? { ...prev, conversation, unread: 0 } : prev)
        setReceptionLeads((prev) => prev.map((l) => l.id === sessionId ? { ...l, conversation, unread: 0 } : l))
      }
    } catch {
      /* keep existing conversation */
    }
  }, [])

  const loadSessions = useCallback(async () => {
    try {
      const rows = await apiGet<Record<string, unknown>[]>("/sales/sessions")
      if (Array.isArray(rows) && rows.length) {
        const mapped = rows.map(mapSession)
        setReceptionLeads(mapped)
        setActiveLead((prev) => {
          const still = mapped.find((m) => m.id === prev.id)
          return still || mapped[0]
        })
        const first = mapped[0]
        if (first) void loadMessages(first.id)
      }
    } catch {
      /* keep mock */
    }
  }, [loadMessages])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  async function selectLead(lead: ReceptionLead) {
    setActiveLead(lead)
    setComposer("")
    if (lead.conversation.length === 0 || /^\d+$/.test(lead.id)) {
      await loadMessages(lead.id)
    }
  }

  async function sendReply() {
    const text = composer.trim()
    if (!text) { toast.error("请输入回复内容"); return }
    if (!/^\d+$/.test(activeLead.id)) {
      toast.message("当前为本地演示会话，未落库")
      return
    }
    setSending(true)
    try {
      const data = await apiPost<{ message?: Record<string, unknown> }>(`/sales/sessions/${activeLead.id}/messages`, {
        body: text,
        senderType: "agent",
      })
      const msg = data.message ? mapMessage(data.message) : { from: "agent" as const, time: "刚刚", text }
      setActiveLead((prev) => ({ ...prev, conversation: [...prev.conversation, msg], unread: 0, waiting: "在线 · 刚刚" }))
      setReceptionLeads((prev) => prev.map((l) => l.id === activeLead.id
        ? { ...l, conversation: [...(l.conversation || []), msg], unread: 0, waiting: "在线 · 刚刚", summary: text.slice(0, 40) }
        : l))
      setComposer("")
      toast.success("回复已发送")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "发送失败")
    } finally {
      setSending(false)
    }
  }

  async function convertToLead() {
    if (!/^\d+$/.test(activeLead.id)) {
      toast.success(`已将 ${activeLead.name} 转为客户档案（本地演示）`)
      return
    }
    try {
      const data = await apiPost<{ created?: boolean; lead?: { bizCode?: string } }>(`/sales/sessions/${activeLead.id}/conversion`, {
        companyName: `${activeLead.name} · ${activeLead.market}`,
      })
      toast.success(data.created
        ? `已建档线索 ${data.lead?.bizCode || ""}`
        : `${activeLead.name} 已有关联线索`)
      await loadSessions()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "转建档失败")
    }
  }

  const filteredCustomers = useMemo(() => customerList.filter((c) => (bucket === "全部" || c.createdBucket === bucket) && (intent === "全部" || c.intent === intent) && (c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase()))), [customerList, bucket, intent, search])

  function openCreateProfile() {
    setProfileForm(blankProfileForm)
    setShowCreateProfile(true)
  }

  function saveNewProfile() {
    if (!profileForm.name.trim() || !profileForm.company.trim()) {
      toast.error("请填写客户名称与所属公司")
      return
    }
    const newCustomer: Customer = {
      id: `CU-${1049 + customerList.length}`,
      name: profileForm.name.trim(),
      company: profileForm.company.trim(),
      market: profileForm.market,
      source: profileForm.source,
      intent: profileForm.intent,
      stage: "新线索",
      lifecycle: "潜在客户",
      intentProduct: profileForm.intentProduct.trim() || "待确认",
      follower: profileForm.follower,
      lastContact: "刚刚",
      createdAt: "今天 · 刚刚",
      createdBucket: "今日",
    }
    setCustomerList((prev) => [newCustomer, ...prev])
    setShowCreateProfile(false)
    toast.success(`已为 ${newCustomer.name} 创建客户档案`)
  }

  return <div className="flex w-full flex-col gap-4">
    <Card className="shadow-none"><CardContent className="flex items-center justify-between p-3"><div className="flex items-center gap-3"><img src="/images/agent-sales.png" alt="营销客服专家 Echo" width={38} height={38} className="size-9 rounded-lg object-cover object-top" /><div><div className="text-xs font-semibold">销售转化工作流</div><div className="text-[10px] text-muted-foreground">Echo 正在接待潜客并推进成交闭环</div></div></div><div className="flex items-center gap-2">{stages.map((stage, index) => <div key={stage.id} className="flex items-center gap-2"><button onClick={() => setTab(stage.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] ${tab === stage.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><stage.icon className="size-3.5" />0{index + 1} {stage.label}</button>{index < 3 && <ArrowRight className="size-3.5 text-muted-foreground" />}</div>)}</div></CardContent></Card>

    {tab === "reception" && <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-4 shadow-none"><CardHeader className="py-3"><CardTitle className="text-sm">接待潜客列表</CardTitle><CardDescription className="text-[11px]">Echo 实时接待，点击查看对话流</CardDescription></CardHeader><CardContent className="flex flex-col gap-1 p-2">{receptionLeads.map((lead) => <button key={lead.id} onClick={() => void selectLead(lead)} className={`flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${activeLead.id === lead.id ? "bg-primary/10" : "hover:bg-muted"}`}><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">{lead.avatarText}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between"><span className="truncate text-xs font-medium">{lead.name}</span><span className={`rounded px-1.5 py-0.5 text-[9px] ${intentColor(lead.intent)}`}>{lead.intent}意向</span></div><div className="truncate text-[10px] text-muted-foreground">{lead.summary}</div><div className="mt-0.5 flex items-center justify-between text-[9px] text-muted-foreground"><span>{lead.market} · {lead.source}</span><span>{lead.waiting}</span></div></div>{lead.unread > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">{lead.unread}</span>}</button>)}</CardContent></Card>
      <Card className="col-span-8 shadow-none"><CardHeader className="flex-row items-center justify-between border-b py-3"><div><CardTitle className="text-sm">{activeLead.name} · {activeLead.product}</CardTitle><CardDescription className="text-[11px]">{activeLead.market} · 来源 {activeLead.source} · {activeLead.waiting}</CardDescription></div><Button size="sm" onClick={() => void convertToLead()}><UserPlus />转客户建档</Button></CardHeader><CardContent className="flex flex-col gap-3 p-4">{activeLead.conversation.map((m, i) => <div key={i} className={`flex ${m.from === "agent" ? "justify-end" : "justify-start"}`}><div className={`max-w-[70%] rounded-lg px-3 py-2 text-[11px] leading-5 ${m.from === "agent" ? "bg-primary text-primary-foreground" : "bg-muted"}`}><div className="mb-0.5 flex items-center gap-1.5 text-[9px] opacity-70">{m.from === "agent" ? <Headset className="size-2.5" /> : <CircleUser className="size-2.5" />}{m.from === "agent" ? "Echo AI" : activeLead.name} · {m.time}</div>{m.text}</div></div>)}<div className="mt-2 flex gap-2"><Input className="h-9 text-xs" value={composer} onChange={(e) => setComposer(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void sendReply() }} placeholder="输入回复，Echo 将辅助生成话术…" /><Button size="sm" disabled={sending} onClick={() => void sendReply()}><MessageSquare />发送</Button></div></CardContent></Card>
    </div>}

    {tab === "profile" && showCreateProfile && <Card className="shadow-none">
      <CardHeader className="flex-row items-center justify-between py-3 border-b">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="size-7" onClick={() => setShowCreateProfile(false)} aria-label="返回客户档案列表"><ArrowLeft className="size-4" /></Button>
          <div><CardTitle className="text-sm">新建客户档案</CardTitle><CardDescription className="text-[11px]">录入基础信息，完成客户建档后自动进入潜在客户生命周期</CardDescription></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCreateProfile(false)}>取消</Button>
          <Button size="sm" onClick={saveNewProfile}><Save />保存档案</Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 p-5">
        <div className="flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">客户名称 *</Label><Input className="h-9 text-xs" value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} placeholder="例如 Felix Bauer" /></div>
        <div className="flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">所属公司 *</Label><Input className="h-9 text-xs" value={profileForm.company} onChange={(e) => setProfileForm((f) => ({ ...f, company: e.target.value }))} placeholder="例如 NordHaus GmbH" /></div>
        <div className="flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">所在市场</Label><Select value={profileForm.market} onValueChange={(v) => v && setProfileForm((f) => ({ ...f, market: v }))}><SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger><SelectContent>{markets.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">来源渠道</Label><Select value={profileForm.source} onValueChange={(v) => v && setProfileForm((f) => ({ ...f, source: v }))}><SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger><SelectContent>{sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">意向等级</Label><div className="flex gap-2">{(["高", "中", "低"] as IntentLevel[]).map((i) => <button key={i} type="button" onClick={() => setProfileForm((f) => ({ ...f, intent: i }))} className={`flex-1 rounded-md py-2 text-[11px] font-medium transition-colors ${profileForm.intent === i ? intentColor(i) : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>{i}意向</button>)}</div></div>
        <div className="flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">意向产品</Label><Input className="h-9 text-xs" value={profileForm.intentProduct} onChange={(e) => setProfileForm((f) => ({ ...f, intentProduct: e.target.value }))} placeholder="例如 P2000 阳台储能" /></div>
        <div className="flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">跟进人</Label><Select value={profileForm.follower} onValueChange={(v) => v && setProfileForm((f) => ({ ...f, follower: v }))}><SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger><SelectContent>{followers.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">联系电话</Label><div className="relative"><Phone className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input className="h-9 pl-8 text-xs" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+49 176 xxxx xxxx" /></div></div>
        <div className="flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">邮箱地址</Label><div className="relative"><Mail className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input className="h-9 pl-8 text-xs" value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@company.com" /></div></div>
        <div className="flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">所属行业/规模</Label><div className="relative"><Building2 className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input className="h-9 pl-8 text-xs" value={profileForm.industry} onChange={(e) => setProfileForm((f) => ({ ...f, industry: e.target.value }))} placeholder="选填，例如所属行业、规模" /></div></div>
        <div className="col-span-2 flex flex-col gap-1.5"><Label className="text-[11px] text-muted-foreground">备注说明</Label><Textarea className="min-h-20 text-xs" value={profileForm.notes} onChange={(e) => setProfileForm((f) => ({ ...f, notes: e.target.value }))} placeholder="记录客户背景、需求要点或特殊注意事项…" /></div>
      </CardContent>
    </Card>}

    {tab === "profile" && !showCreateProfile && <Card className="shadow-none"><CardHeader className="flex-row items-center justify-between py-3"><div><CardTitle className="text-sm">客户档案</CardTitle><CardDescription className="text-[11px]">按建档日期与意向等级筛选客户</CardDescription></div><div className="flex items-center gap-2"><div className="relative"><Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" /><Input className="h-8 w-44 pl-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索客户/公司" /></div><Button size="sm" onClick={openCreateProfile}><UserPlus />客户建档</Button></div></CardHeader><CardContent className="flex flex-col gap-3 p-4 pt-0"><div className="flex flex-wrap items-center gap-4"><div className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-muted-foreground" /><span className="text-[11px] text-muted-foreground">建档日期</span>{buckets.map((b) => <button key={b} onClick={() => setBucket(b)} className={`rounded-md px-2.5 py-1 text-[11px] ${bucket === b ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{b}</button>)}</div><div className="flex items-center gap-1.5"><Target className="size-3.5 text-muted-foreground" /><span className="text-[11px] text-muted-foreground">意向等级</span>{intents.map((i) => <button key={i} onClick={() => setIntent(i)} className={`rounded-md px-2.5 py-1 text-[11px] ${intent === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i}</button>)}</div></div>
      <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>客户</TableHead><TableHead>市场</TableHead><TableHead>来源</TableHead><TableHead>意向等级</TableHead><TableHead>意向产品</TableHead><TableHead>跟进人</TableHead><TableHead>建档时间</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{filteredCustomers.map((c) => <TableRow key={c.id}><TableCell><div className="font-medium">{c.name}</div><div className="text-[10px] text-muted-foreground">{c.company}</div></TableCell><TableCell>{c.market}</TableCell><TableCell>{c.source}</TableCell><TableCell><span className={`rounded px-1.5 py-0.5 text-[10px] ${intentColor(c.intent)}`}>{c.intent}</span></TableCell><TableCell>{c.intentProduct}</TableCell><TableCell>{c.follower}</TableCell><TableCell className="text-[11px] text-muted-foreground">{c.createdAt}</TableCell><TableCell className="text-right"><button onClick={() => setC360(c)} className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300"><CircleUser className="size-3.5" />客户360</button></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>}

    {tab === "follow" && <><div className="grid grid-cols-5 gap-3">{lifecycleCards.map((card) => { const isActive = activeCard?.stage === card.stage; return <button key={card.stage} onClick={() => setActiveCard(card)} className="text-left"><Card className={`h-full transition-all ${isActive ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30" : "shadow-none hover:border-primary/50"}`}><CardContent className="flex flex-col gap-2 p-4"><div className="flex items-center justify-between"><span className={`text-xs font-semibold ${isActive ? "text-primary" : ""}`}>{card.stage}</span><span className={`rounded px-1.5 py-0.5 text-[9px] ${intentColor(card.intent)}`}>{card.intent}意向</span></div><div className={`text-2xl font-semibold ${isActive ? "text-primary" : ""}`}>{card.total.toLocaleString()}</div><div className="flex justify-between text-[10px] text-muted-foreground"><span>本月新增 +{card.monthlyNew}</span><span>占盘 {card.ratio}%</span></div><ChartContainer config={{ v: { label: "趋势", color: isActive ? "hsl(var(--primary))" : "#94a3b8" } }} className="h-10 w-full"><AreaChart data={card.trend.map((v, i) => ({ i, v }))}><Area dataKey="v" stroke="var(--color-v)" fill="var(--color-v)" fillOpacity={isActive ? 0.2 : 0.08} strokeWidth={isActive ? 2 : 1.5} /></AreaChart></ChartContainer></CardContent></Card></button> })}</div>
      {activeCard && <Card className="shadow-none"><CardHeader className="py-3"><div className="flex items-center gap-2"><div className="h-4 w-1 rounded-full bg-primary" /><CardTitle className="text-sm">{activeCard.stage} · 客户列表</CardTitle></div><CardDescription className="text-[11px]">共 {activeCard.total.toLocaleString()} 位 · 本月新增 {activeCard.monthlyNew} · 附 AI 建议动作</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>客户</TableHead><TableHead>公司</TableHead><TableHead>意向产品</TableHead><TableHead>建议下一步动作</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{activeCard.customers.map((c) => <TableRow key={c.name}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.company}</TableCell><TableCell>{c.product}</TableCell><TableCell className="text-[11px] text-muted-foreground">{c.nextAction}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => toast.success(`已为 ${c.name} 创建跟进任务`)}><PhoneCall data-icon="inline-start" />跟进</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>}</>}

    {tab === "deal" && <><Card className="shadow-none"><CardHeader className="py-3"><CardTitle className="text-sm">最近 30 天成交趋势</CardTitle><CardDescription className="text-[11px]">成交单数与成交金额（千欧）</CardDescription></CardHeader><CardContent><ChartContainer config={{ deals: { label: "成交单数", color: "#2563eb" }, amount: { label: "金额（千€）", color: "#f59e0b" } }} className="h-52 w-full"><LineChart data={dealTrend}><CartesianGrid vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><Line dataKey="deals" stroke="var(--color-deals)" strokeWidth={2.5} dot={false} /><Line dataKey="amount" stroke="var(--color-amount)" strokeWidth={2.5} dot={false} /></LineChart></ChartContainer></CardContent></Card>
      <div className="grid grid-cols-4 gap-3">{[{ l: "本月成交客户", v: "38", i: Users }, { l: "本月成交金额", v: "€184K", i: TrendingUp }, { l: "复购占比", v: "32%", i: Repeat }, { l: "客单价", v: "€4,842", i: ShoppingBag }].map((x) => <Card key={x.l} className="shadow-none"><CardContent className="flex justify-between p-4"><div><p className="text-[11px] text-muted-foreground">{x.l}</p><p className="mt-1 text-xl font-semibold">{x.v}</p></div><x.i className="size-4 text-primary" /></CardContent></Card>)}</div>
      <Card className="shadow-none"><CardHeader className="py-3"><CardTitle className="text-sm">本月成交客户列表</CardTitle><CardDescription className="text-[11px]">客户名称、购买商品、订单金额、成交时间、销售顾问、首购/复购</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>客户名称</TableHead><TableHead>购买商品</TableHead><TableHead className="text-right">订单金额</TableHead><TableHead>成交时间</TableHead><TableHead>销售顾问</TableHead><TableHead>类型</TableHead></TableRow></TableHeader><TableBody>{dealRecords.map((d) => <TableRow key={d.id}><TableCell><div className="font-medium">{d.customer}</div><div className="text-[10px] text-muted-foreground">{d.company}</div></TableCell><TableCell>{d.product}</TableCell><TableCell className="text-right font-medium">{fmtMoney(d.amount)}</TableCell><TableCell className="text-[11px] text-muted-foreground">{d.time}</TableCell><TableCell>{d.consultant}</TableCell><TableCell><Badge variant={d.type === "复购" ? "default" : "secondary"}>{d.type}</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></>}

    <Sheet open={!!c360} onOpenChange={(open) => !open && setC360(null)}><SheetContent className="w-[460px] overflow-auto sm:max-w-[460px]"><SheetHeader><SheetTitle>{c360?.name} · 客户360</SheetTitle><SheetDescription>{c360?.company} · {c360?.market}</SheetDescription></SheetHeader>{c360 && (() => { const d = customer360[c360.id] ?? customer360["CU-1048"]; return <div className="flex flex-col gap-4 p-4"><section><div className="mb-2 text-xs font-medium">客户标签</div><div className="flex flex-wrap gap-1.5">{d.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div></section><section><div className="mb-2 text-xs font-medium">客户基础信息</div><div className="grid grid-cols-2 gap-2">{d.base.map((b) => <div key={b.label} className="rounded-md bg-muted p-2.5"><div className="text-[10px] text-muted-foreground">{b.label}</div><div className="mt-0.5 text-[11px] font-medium">{b.value}</div></div>)}</div></section><section><div className="mb-2 text-xs font-medium">沟通记录</div><div className="flex flex-col gap-2">{d.communications.map((c, i) => <div key={i} className="rounded-md border p-2.5 text-[11px]"><div className="flex justify-between text-[10px] text-muted-foreground"><span>{c.channel}</span><span>{c.time}</span></div><div className="mt-1 leading-5">{c.text}</div></div>)}</div></section><section><div className="mb-2 text-xs font-medium">跟进记录</div><div className="flex flex-col gap-2">{d.follows.map((f, i) => <div key={i} className="rounded-md border p-2.5 text-[11px]"><div className="flex justify-between text-[10px] text-muted-foreground"><span>{f.actor}</span><span>{f.time}</span></div><div className="mt-1 leading-5">{f.text}</div><div className="mt-1 text-[10px] text-primary">下一步：{f.next}</div></div>)}</div></section><section><div className="mb-2 text-xs font-medium">成交记录</div>{d.deals.length ? <div className="flex flex-col gap-2">{d.deals.map((deal, i) => <div key={i} className="flex items-center justify-between rounded-md border p-2.5 text-[11px]"><div><div className="font-medium">{deal.product}</div><div className="text-[10px] text-muted-foreground">{deal.time}</div></div><div className="text-right"><div className="font-medium">{fmtMoney(deal.amount)}</div><Badge variant={deal.type === "复购" ? "default" : "secondary"}>{deal.type}</Badge></div></div>)}</div> : <div className="rounded-md border border-dashed p-4 text-center text-[11px] text-muted-foreground">暂无成交记录</div>}</section></div> })()}</SheetContent></Sheet>
  </div>
}
