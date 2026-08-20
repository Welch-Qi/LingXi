"use client"
// @ts-nocheck — design dump
import { useEffect, useState } from "react"
import {
  Building2, ChevronDown, ChevronRight, CircleDollarSign, CreditCard, Globe, Languages,
  Lock, Megaphone, Palette, ShieldCheck, SlidersHorizontal, Users, Wallet, Cpu,
  CheckCircle2, XCircle, AlertCircle, MapPin,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { loadBrandSetting, saveBrandSetting } from "@/lib/bapi"
import {
  brandInfo, budgetConfig, carbonStaff, contentSpec, countryConfig, currencyConfig,
  customerTierRules, dataVisibilityRules, humanHandoffRules, languageConfig,
  operationPrinciples, paymentChannels, platformAccounts, rolePermissions,
  salesStages, siliconStaff,
} from "@/lib/mocks/config-center"

// ─── nav structure ─────────────────────────────────────────────────────────────
const NAV = [
  {
    group: "企业公约",
    icon: Building2,
    items: [
      { id: "brand", label: "品牌信息", tier: "P0" as const },
      { id: "principles", label: "经营准则", tier: "P2" as const },
    ],
  },
  {
    group: "运营配置",
    icon: SlidersHorizontal,
    items: [
      { id: "platforms", label: "平台账号管理", tier: "P2" as const },
      { id: "content-spec", label: "内容规范配置", tier: "P2" as const },
      { id: "budget", label: "投放预算配置", tier: "P2" as const },
      { id: "sales-stages", label: "销售阶段管理", tier: "P2" as const },
      { id: "customer-tiers", label: "客户分层规则", tier: "P2" as const },
      { id: "handoff", label: "转人工规则", tier: "P2" as const },
      { id: "language", label: "语言配置", tier: "P2" as const },
      { id: "country", label: "国家配置", tier: "P2" as const },
      { id: "currency", label: "币种配置", tier: "P2" as const },
      { id: "payment", label: "支付配置", tier: "P2" as const },
    ],
  },
  {
    group: "员工管理",
    icon: Users,
    items: [
      { id: "carbon-staff", label: "员工账号（碳基）", tier: "P0" as const },
      { id: "silicon-staff", label: "硅基员工", tier: "P2" as const },
    ],
  },
  {
    group: "权限管理",
    icon: Lock,
    items: [
      { id: "role-permissions", label: "角色权限", tier: "P0" as const },
      { id: "data-visibility", label: "数据可见范围", tier: "P2" as const },
    ],
  },
]

type SectionId = "brand" | "principles" | "platforms" | "content-spec" | "budget" | "sales-stages" | "customer-tiers" | "handoff" | "language" | "country" | "currency" | "payment" | "carbon-staff" | "silicon-staff" | "role-permissions" | "data-visibility"

// ─── small helpers ──────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: "P0" | "P2" }) {
  return tier === "P0"
    ? <Badge className="gap-1 bg-blue-100 text-blue-700 text-[10px]">一期</Badge>
    : <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">二期规划</Badge>
}

function SectionHeader({ title, description, tier }: { title: string; description: string; tier?: "P0" | "P2" }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {tier && <TierBadge tier={tier} />}
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
    </div>
  )
}

function SaveButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button size="sm" onClick={() => (onClick ? onClick() : toast.success("配置已保存"))} className="mt-4">
      保存配置
    </Button>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "已连接" || status === "已配置" || status === "活跃" || status === "在岗") {
    return <Badge className="gap-1 bg-green-100 text-green-700 text-[10px]"><CheckCircle2 className="size-3" />{status}</Badge>
  }
  if (status === "离职") {
    return <Badge className="gap-1 bg-zinc-100 text-zinc-500 text-[10px]"><XCircle className="size-3" />{status}</Badge>
  }
  return <Badge className="gap-1 bg-amber-100 text-amber-700 text-[10px]"><AlertCircle className="size-3" />{status}</Badge>
}

// ─── section components ─────────────────────────────────────────────────────────
function BrandSection() {
  const [brand, setBrand] = useState({ ...brandInfo })

  useEffect(() => {
    void loadBrandSetting()
      .then((v) => {
        if (!v || !Object.keys(v).length) return
        setBrand((prev) => ({
          ...prev,
          name: String(v.name ?? prev.name),
          slogan: String(v.slogan ?? prev.slogan),
          industry: String(v.industry ?? prev.industry),
          tonality: String(v.tonality ?? prev.tonality),
          founded: String(v.founded ?? prev.founded),
          website: String(v.website ?? prev.website),
        }))
      })
      .catch(() => { /* keep mock */ })
  }, [])

  async function handleSave() {
    try {
      await saveBrandSetting({
        name: brand.name,
        slogan: brand.slogan,
        industry: brand.industry,
        tonality: brand.tonality,
        founded: brand.founded,
        website: brand.website,
      })
      toast.success("品牌配置已落库")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存品牌配置失败")
    }
  }

  const fields = [
    { key: "name", label: "品牌名称" },
    { key: "slogan", label: "品牌口号" },
    { key: "industry", label: "行业分类" },
    { key: "tonality", label: "品牌调性" },
    { key: "founded", label: "成立年份" },
    { key: "website", label: "官网地址" },
  ] as const

  return (
    <div>
      <SectionHeader title="品牌信息" description="企业品牌的基础标识与调性设定，贯穿所有 AI 生成内容与对外传播。" tier="P0" />
      <Card className="shadow-none">
        <CardContent className="grid grid-cols-2 gap-4 p-5">
          {fields.map(({ key, label }) => (
            <div key={key} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <Input
                className="mt-1 h-8 border-0 bg-transparent px-0 text-xs font-medium shadow-none focus-visible:ring-0"
                value={brand[key]}
                onChange={(e) => setBrand({ ...brand, [key]: e.target.value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      <SaveButton onClick={handleSave} />
    </div>
  )
}

function PrinciplesSection() {
  return (
    <div>
      <SectionHeader title="经营准则" description="约束 AI 行为与内容输出的核心准则，所有智能体必须遵守。" tier="P2" />
      <div className="flex flex-col gap-3">
        {operationPrinciples.map((p, i) => (
          <Card key={p.id} className="shadow-none">
            <CardContent className="flex gap-4 p-4">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{i + 1}</span>
              <div>
                <p className="text-xs font-semibold">{p.title}</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{p.content}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <SaveButton />
    </div>
  )
}

function PlatformsSection() {
  return (
    <div>
      <SectionHeader title="平台账号管理" description="各社交媒体平台账号的 API 密钥与授权状态。" tier="P2" />
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>平台</TableHead>
                <TableHead>账号名称</TableHead>
                <TableHead>API 密钥</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后更新</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platformAccounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.platform}</TableCell>
                  <TableCell>{a.accountName}</TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">{a.apiKey || "—"}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{a.updatedAt || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => toast.success(`正在配置 ${a.platform}`)}>
                      {a.status === "已连接" ? "重新授权" : "立即连接"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ContentSpecSection() {
  return (
    <div>
      <SectionHeader title="内容规范配置" description="品牌视觉规范与 AI 生成内容的风格约束。" tier="P2" />
      <div className="flex flex-col gap-4">
        <Card className="shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-xs">品牌色彩 & 字体</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-4 pt-0">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <span className="size-8 rounded-md border" style={{ background: contentSpec.primaryColor }} />
              <div><p className="text-[10px] text-muted-foreground">主色</p><p className="text-xs font-mono font-medium">{contentSpec.primaryColor}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <span className="size-8 rounded-md border" style={{ background: contentSpec.secondaryColor }} />
              <div><p className="text-[10px] text-muted-foreground">辅色</p><p className="text-xs font-mono font-medium">{contentSpec.secondaryColor}</p></div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] text-muted-foreground">标题字体</p>
              <p className="mt-1 text-xs font-medium">{contentSpec.fontHeading}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] text-muted-foreground">正文字体</p>
              <p className="mt-1 text-xs font-medium">{contentSpec.fontBody}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-xs">Logo 使用规范</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] leading-5 text-muted-foreground">{contentSpec.logoUsage}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-xs">AI 内容风格约束</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 p-4 pt-0">
            {contentSpec.aiStyleConstraints.map((c, i) => (
              <div key={i} className="flex gap-2.5 rounded-md border p-2.5 text-[11px]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{i + 1}</span>
                <span className="leading-5">{c}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <SaveButton />
    </div>
  )
}

function BudgetSection() {
  const totalBudget = budgetConfig.reduce((s, b) => s + b.monthlyBudget, 0)
  const totalSpent = budgetConfig.reduce((s, b) => s + b.spent, 0)
  return (
    <div>
      <SectionHeader title="投放预算配置" description="各平台本月广告投放预算与当前消耗情况。" tier="P2" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="shadow-none"><CardContent className="p-4"><p className="text-[10px] text-muted-foreground">本月总预算</p><p className="mt-1 text-lg font-semibold text-primary">${totalBudget.toLocaleString()}</p></CardContent></Card>
        <Card className="shadow-none"><CardContent className="p-4"><p className="text-[10px] text-muted-foreground">已消耗</p><p className="mt-1 text-lg font-semibold">${totalSpent.toLocaleString()} <span className="text-xs text-muted-foreground">({Math.round(totalSpent / totalBudget * 100)}%)</span></p></CardContent></Card>
      </div>
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>平台</TableHead>
                <TableHead>月预算</TableHead>
                <TableHead>已消耗</TableHead>
                <TableHead>消耗率</TableHead>
                <TableHead>币种</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetConfig.map((b) => {
                const pct = Math.round(b.spent / b.monthlyBudget * 100)
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.platform}</TableCell>
                    <TableCell>${b.monthlyBudget.toLocaleString()}</TableCell>
                    <TableCell>${b.spent.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px]">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{b.currency}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function SalesStagesSection() {
  return (
    <div>
      <SectionHeader title="销售阶段管理" description="销售流程各阶段的定义与自动流转规则。" tier="P2" />
      <div className="flex flex-col gap-3">
        {salesStages.map((s) => (
          <Card key={s.id} className="shadow-none">
            <CardContent className="flex items-start gap-4 p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{s.order}</span>
              <div className="flex-1">
                <p className="text-xs font-semibold">{s.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.description}</p>
              </div>
              <div className="rounded-md bg-muted px-2.5 py-1.5 text-[10px] text-muted-foreground">
                触发条件：{s.rule}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <SaveButton />
    </div>
  )
}

function CustomerTiersSection() {
  const colorMap: Record<string, string> = {
    green: "border-green-200 bg-green-50",
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
  }
  const labelColorMap: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  }
  return (
    <div>
      <SectionHeader title="客户分层规则" description="AI 自动为客户打分并归层的判断标准。" tier="P2" />
      <div className="grid grid-cols-3 gap-4">
        {customerTierRules.map((t) => (
          <Card key={t.tier} className={`shadow-none border ${colorMap[t.color]}`}>
            <CardHeader className="pb-2">
              <Badge className={`w-fit text-[10px] ${labelColorMap[t.color]}`}>{t.tier}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 p-4 pt-0">
              {t.criteria.map((c) => (
                <div key={c} className="flex items-start gap-1.5 text-[11px]">
                  <ChevronRight className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                  <span>{c}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <SaveButton />
    </div>
  )
}

function HandoffSection() {
  return (
    <div>
      <SectionHeader title="转人工规则" description="AI 客服触发转人工的条件与对应处置动作。" tier="P2" />
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>触发条件</TableHead>
                <TableHead>处置动作</TableHead>
                <TableHead className="text-right">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {humanHandoffRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.trigger}</TableCell>
                  <TableCell className="text-muted-foreground">{r.action}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={r.enabled ? "bg-green-100 text-green-700 text-[10px]" : "bg-zinc-100 text-zinc-500 text-[10px]"}>
                      {r.enabled ? "已启用" : "已禁用"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <SaveButton />
    </div>
  )
}

function LanguageSection() {
  return (
    <div>
      <SectionHeader title="语言配置" description="系统界面语言与 AI 生成内容的目标语言配置。" tier="P2" />
      <div className="flex flex-col gap-3">
        <Card className="shadow-none">
          <CardContent className="grid grid-cols-2 gap-4 p-5">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground">系统界面语言</p>
              <p className="mt-1 text-xs font-medium">{languageConfig.systemLanguage}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground">AI 默认输出语言</p>
              <p className="mt-1 text-xs font-medium">{languageConfig.defaultAiOutputLanguage}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-xs">内容目标语言</CardTitle><CardDescription className="text-[11px]">AI 内容生成支持的输出语言</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2 p-4 pt-0">
            {languageConfig.contentLanguages.map((l) => (
              <Badge key={l} variant="secondary" className="text-[11px]">{l}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>
      <SaveButton />
    </div>
  )
}

function CountrySection() {
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(countryConfig.filter((c) => c.enabled).map((c) => c.code)),
  )

  function toggle(code: string, name: string) {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
        toast.success(`已停用「${name}」市场`)
      } else {
        next.add(code)
        toast.success(`已启用「${name}」市场`)
      }
      return next
    })
  }

  return (
    <div>
      <SectionHeader title="国家配置" description="配置各销售目标国家/地区的启用状态、默认语言与结算币种。" tier="P2" />
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>国家 / 地区</TableHead>
                <TableHead>所属区域</TableHead>
                <TableHead>默认语言</TableHead>
                <TableHead>默认币种</TableHead>
                <TableHead>时区</TableHead>
                <TableHead className="text-right">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countryConfig.map((c) => {
                const isEnabled = enabled.has(c.code)
                return (
                  <TableRow key={c.code}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        {c.name}
                        <Badge variant="outline" className="text-[10px] font-mono">{c.code}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.region}</TableCell>
                    <TableCell>{c.defaultLanguage}</TableCell>
                    <TableCell>{c.defaultCurrency}</TableCell>
                    <TableCell className="text-muted-foreground">{c.timezone}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={isEnabled ? "outline" : "default"}
                        onClick={() => toggle(c.code, c.name)}
                      >
                        {isEnabled ? "停用" : "启用"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={() => toast.success("即将开放新增国家/地区功能")}>新增国家</Button>
      </div>
    </div>
  )
}

function CurrencySection() {
  return (
    <div>
      <SectionHeader title="币种配置" description="系统支持的结算货币与实时汇率基准（以 CNY 为基准）。" tier="P2" />
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>货币</TableHead>
                <TableHead>符号</TableHead>
                <TableHead>对 CNY 汇率</TableHead>
                <TableHead className="text-right">主结算货币</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencyConfig.map((c) => (
                <TableRow key={c.currency}>
                  <TableCell className="font-medium">{c.currency}</TableCell>
                  <TableCell>{c.symbol}</TableCell>
                  <TableCell>{c.rate.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {c.primary && <Badge className="bg-blue-100 text-blue-700 text-[10px]">主货币</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <SaveButton />
    </div>
  )
}

function PaymentSection() {
  return (
    <div>
      <SectionHeader title="支付配置" description="海外支付渠道的连接状态与支持币种。" tier="P2" />
      <div className="flex flex-col gap-3">
        {paymentChannels.map((p) => (
          <Card key={p.id} className="shadow-none">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                <CreditCard className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">{p.name}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {p.merchantId ? `商户 ID: ${p.merchantId}` : "未配置"} {p.supportedCurrencies.length > 0 ? `· 支持: ${p.supportedCurrencies.join(" / ")}` : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.success(`正在配置 ${p.name}`)}>
                {p.status === "已配置" ? "重新配置" : "立即配置"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CarbonStaffSection() {
  return (
    <div>
      <SectionHeader title="员工账号（碳基）" description="人工销售、运营、管理人员的系统账号。" tier="P0" />
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>职位</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead className="text-right">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carbonStaff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell>{s.department}</TableCell>
                  <TableCell className="text-muted-foreground">{s.email}</TableCell>
                  <TableCell className="text-right"><StatusBadge status={s.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={() => toast.success("即将开放新建员工账号功能")}>新建账号</Button>
      </div>
    </div>
  )
}

function SiliconStaffSection() {
  return (
    <div>
      <SectionHeader title="硅基员工" description="智能体的岗位注册与基本信息管理。" tier="P2" />
      <div className="grid grid-cols-2 gap-4">
        {siliconStaff.map((s) => (
          <Card key={s.id} className="shadow-none">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-blue-100">
                    <Cpu className="size-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{s.title} · {s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.domain}</p>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-md bg-muted px-2.5 py-1.5">
                  <span className="text-muted-foreground">基础模型  </span>
                  <span className="font-medium">{s.model}</span>
                </div>
                <div className="rounded-md bg-muted px-2.5 py-1.5">
                  <span className="text-muted-foreground">注册日期  </span>
                  <span className="font-medium">{s.registeredAt}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function RolePermissionsSection() {
  return (
    <div>
      <SectionHeader title="角色权限" description="基于角色的功能模块访问权限配置。" tier="P0" />
      <div className="flex flex-col gap-3">
        {rolePermissions.map((r) => (
          <Card key={r.role} className="shadow-none">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck className="size-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold">{r.role}</p>
                  <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.pages.map((p) => (
                  <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <SaveButton />
    </div>
  )
}

function DataVisibilitySection() {
  const levelColor: Record<string, string> = {
    全量: "bg-blue-100 text-blue-700",
    部门: "bg-purple-100 text-purple-700",
    个人: "bg-amber-100 text-amber-700",
  }
  return (
    <div>
      <SectionHeader title="数据可见范围" description="按员工或部门配置客户与订单数据的可见范围。" tier="P2" />
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>主体</TableHead>
                <TableHead>可见数据范围</TableHead>
                <TableHead className="text-right">可见级别</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataVisibilityRules.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.subject}</TableCell>
                  <TableCell className="text-muted-foreground">{d.scope}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={`text-[10px] ${levelColor[d.level] ?? "bg-muted text-muted-foreground"}`}>{d.level}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <SaveButton />
    </div>
  )
}

// ─── section renderer ───────────────────────────────────────────────────────────
const SECTIONS: Record<SectionId, React.ReactNode> = {
  brand: <BrandSection />,
  principles: <PrinciplesSection />,
  platforms: <PlatformsSection />,
  "content-spec": <ContentSpecSection />,
  budget: <BudgetSection />,
  "sales-stages": <SalesStagesSection />,
  "customer-tiers": <CustomerTiersSection />,
  handoff: <HandoffSection />,
  language: <LanguageSection />,
  country: <CountrySection />,
  currency: <CurrencySection />,
  payment: <PaymentSection />,
  "carbon-staff": <CarbonStaffSection />,
  "silicon-staff": <SiliconStaffSection />,
  "role-permissions": <RolePermissionsSection />,
  "data-visibility": <DataVisibilitySection />,
}

// ─── main page ──────────────────────────────────────────────────────────────────
export function ConfigCenterPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("brand")
  // groups open by default — only the group containing the active section is expanded initially
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = NAV.find(g => g.items.some(i => i.id === "brand"))?.group ?? NAV[0].group
    return new Set([initial])
  })

  function toggleGroup(groupName: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) { next.delete(groupName) } else { next.add(groupName) }
      return next
    })
  }

  function selectItem(id: string, groupName: string) {
    setActiveSection(id as SectionId)
    // ensure the group stays open when an item is selected
    setOpenGroups(prev => new Set([...prev, groupName]))
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-[11px] text-muted-foreground">
        标注<span className="mx-1 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">一期</span>为当前已上线的 P0 能力，
        <span className="mx-1 inline-flex items-center rounded border px-1.5 py-0.5 text-muted-foreground">二期规划</span>为提前建设、后续持续完善的能力。
      </p>
      <div className="flex gap-5">
        {/* left nav — accordion */}
        <aside className="w-52 shrink-0">
          <nav className="flex flex-col gap-0.5">
            {NAV.map((group) => {
              const isOpen = openGroups.has(group.group)
              return (
                <div key={group.group}>
                  {/* group header — clickable toggle */}
                  <button
                    onClick={() => toggleGroup(group.group)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-colors hover:bg-muted"
                  >
                    <group.icon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-foreground">{group.group}</span>
                    {isOpen
                      ? <ChevronDown className="size-3.5 text-muted-foreground" />
                      : <ChevronRight className="size-3.5 text-muted-foreground" />
                    }
                  </button>
                  {/* sub-items — only shown when group is open */}
                  {isOpen && (
                    <div className="mb-1 ml-3 flex flex-col gap-0.5 border-l border-border pl-3">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => selectItem(item.id, group.group)}
                          className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                            activeSection === item.id
                              ? "bg-blue-50 font-medium text-blue-700"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className={`size-1.5 shrink-0 rounded-full ${item.tier === "P0" ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        {/* main content */}
        <main className="min-w-0 flex-1">
          {SECTIONS[activeSection]}
        </main>
      </div>
    </div>
  )
}
