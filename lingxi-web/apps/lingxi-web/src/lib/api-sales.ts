import { apiGet, apiPost } from "@/lib/api"
import { pickRows } from "@/lib/format"
import type {
  Customer,
  Customer360,
  CustomerStage,
  DealRecord,
  IntentLevel,
  LifecycleCard,
  ReceptionLead,
} from "@/types"

const FOLLOWER_USER_IDS: Record<string, number> = {
  林晓: 10086001,
  赵磊: 10086002,
  "Echo AI": 10086003,
}

const DEFAULT_OWNER_USER_ID = 10086001

const COUNTRY_LABELS: Record<string, string> = {
  DE: "德国",
  FR: "法国",
  GB: "英国",
  UK: "英国",
  PL: "波兰",
  ES: "西班牙",
  IT: "意大利",
  NL: "荷兰",
  NO: "挪威",
  CA: "加拿大",
  US: "美国",
}

const SOURCE_LABELS: Record<string, string> = {
  WEB: "官网",
  WEBSITE: "官网",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  WHATSAPP: "WhatsApp",
  YOUTUBE: "YouTube",
  DEALER: "经销商",
  RECEPTION: "官网",
  OFFLINE: "线下展会",
}

const STAGE_LABELS: Record<string, string> = {
  DISCOVER: "需求发现",
  QUALIFY: "需求确认",
  PROPOSAL: "方案报价",
  QUOTE: "初版报价",
  NEGOTIATE: "商务谈判",
  WON: "已成交",
  LOST: "已流失",
  NEW: "新线索",
  POOL: "公海",
  ASSIGNED: "已分配",
  FOLLOWING: "跟进中",
  CONVERTED: "已转化",
}

const LIFECYCLE_STAGES: CustomerStage[] = [
  "潜在客户",
  "意向客户",
  "成交客户",
  "忠诚客户",
  "沉睡/流失客户",
]

export interface SalesCustomerView extends Customer {
  leadId?: string
  apiCustomerId?: string
}

export interface DealTrendPoint {
  date: string
  deals: number
  amount: number
}

export interface DealKpi {
  label: string
  value: string
}

function parseTags(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === "object") return raw as Record<string, unknown>
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return {}
}

function asIntent(raw: unknown, score?: unknown): IntentLevel {
  const text = String(raw ?? "")
  if (text === "高" || text === "中" || text === "低") return text
  const n = typeof score === "number" ? score : Number(score)
  if (Number.isFinite(n)) {
    if (n >= 70) return "高"
    if (n >= 40) return "中"
    return "低"
  }
  return "中"
}

function mapCountry(raw: unknown): string {
  const value = String(raw ?? "").trim()
  if (!value) return "—"
  const upper = value.toUpperCase()
  return COUNTRY_LABELS[upper] ?? value
}

function mapSource(raw: unknown): string {
  const value = String(raw ?? "").trim()
  if (!value) return "官网"
  const upper = value.toUpperCase()
  return SOURCE_LABELS[upper] ?? value
}

function mapStageLabel(raw: unknown): string {
  const key = String(raw ?? "").toUpperCase()
  return STAGE_LABELS[key] ?? (key ? key : "新线索")
}

function formatInstant(raw: unknown): string {
  if (!raw) return "—"
  const text = String(raw)
  if (text.includes("T")) {
    const d = new Date(text)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
    }
  }
  return text
}

function createdBucketFrom(raw: unknown): Customer["createdBucket"] {
  if (!raw) return "本月"
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return "本月"
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7))
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  if (d >= startOfDay) return "今日"
  const yesterday = new Date(startOfDay)
  yesterday.setDate(startOfDay.getDate() - 1)
  if (d >= yesterday) return "昨日"
  if (d >= startOfWeek) return "本周"
  if (d >= startOfMonth) return "本月"
  return "本月"
}

function avatarFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || "??"
}

export function leadToLifecycle(status: unknown, hasWonOpp?: boolean): CustomerStage {
  const s = String(status ?? "").toUpperCase()
  if (hasWonOpp || s === "CONVERTED" || s === "WON") return "成交客户"
  if (s === "FOLLOWING" || s === "ASSIGNED") return "意向客户"
  if (s === "LOST" || s === "DORMANT") return "沉睡/流失客户"
  if (s === "LOYAL") return "忠诚客户"
  return "潜在客户"
}

export function mapSession(row: Record<string, unknown>): ReceptionLead {
  const name = String(row.contactName || "")
  return {
    id: String(row.id ?? row.bizCode ?? ""),
    name,
    avatarText: String(row.avatarText || avatarFrom(name)),
    market: mapCountry(row.market),
    source: mapSource(row.source),
    intent: asIntent(row.intentLevel, row.score),
    product: String(row.product || "待确认"),
    waiting: String(row.waiting || "在线"),
    unread: Number(row.unreadCount ?? 0),
    summary: String(row.lastSummary || ""),
    conversation: [],
  }
}

export function mapMessage(row: Record<string, unknown>): ReceptionLead["conversation"][number] {
  const from = String(row.senderType || "customer") === "agent" ? "agent" : "customer"
  return {
    from,
    time: String(row.time || formatInstant(row.sentAt)),
    text: String(row.body || row.text || ""),
  }
}

export function mapLeadToCustomer(row: Record<string, unknown>): SalesCustomerView {
  const customerId = row.customerId != null ? String(row.customerId) : undefined
  const tags = parseTags(row.tags)
  const name = String(row.contactName || tags.contactPerson || row.name || "未命名")
  const company = String(row.companyName || tags.company || "—")
  const follower = String(tags.follower || "林晓")
  return {
    id: customerId ?? String(row.id ?? row.bizCode ?? ""),
    leadId: String(row.id ?? ""),
    apiCustomerId: customerId,
    name,
    company,
    market: mapCountry(row.country ?? tags.market),
    source: mapSource(row.sourceChannel ?? tags.source),
    intent: asIntent(tags.intent, row.score),
    stage: mapStageLabel(row.status),
    lifecycle: leadToLifecycle(row.status),
    intentProduct: String(tags.intentProduct || row.remark || "待确认"),
    follower,
    lastContact: formatInstant(row.updatedAt ?? row.claimedAt),
    createdAt: formatInstant(row.createdAt),
    createdBucket: createdBucketFrom(row.createdAt),
  }
}

export function mapCustomerRow(row: Record<string, unknown>): SalesCustomerView {
  const tags = parseTags(row.tags)
  const name = String(row.name || "未命名")
  return {
    id: String(row.id ?? row.bizCode ?? ""),
    apiCustomerId: row.id != null ? String(row.id) : undefined,
    name,
    company: String(tags.company || tags.companyName || name),
    market: mapCountry(row.country ?? tags.market),
    source: mapSource(tags.source),
    intent: asIntent(tags.intent, tags.score),
    stage: String(tags.stage || "新线索"),
    lifecycle: leadToLifecycle(tags.lifecycle ?? tags.status),
    intentProduct: String(tags.intentProduct || "待确认"),
    follower: String(tags.follower || "林晓"),
    lastContact: formatInstant(row.updatedAt),
    createdAt: formatInstant(row.createdAt),
    createdBucket: createdBucketFrom(row.createdAt),
  }
}

export function mapCustomer360Payload(data: Record<string, unknown>): Customer360 {
  const customer = (data.customer ?? {}) as Record<string, unknown>
  const leads = pickRows(data.leads)
  const opportunities = pickRows(data.opportunities)
  const tagsObj = parseTags(customer.tags)
  const lead = leads[0]
  const won = opportunities.filter((o) => String(o.stage ?? "").toUpperCase() === "WON")

  const tags = [
    asIntent(tagsObj.intent, lead?.score) + "意向",
    mapCountry(customer.country ?? lead?.country),
    mapSource(lead?.sourceChannel),
    String(customer.customerType || "企业客户"),
  ].filter((t) => t && t !== "—")

  const base = [
    { label: "客户名称", value: String(customer.name ?? lead?.contactName ?? "—") },
    { label: "所属公司", value: String(lead?.companyName ?? tagsObj.company ?? "—") },
    { label: "所在市场", value: mapCountry(customer.country ?? lead?.country) },
    { label: "来源渠道", value: mapSource(lead?.sourceChannel ?? tagsObj.source) },
    { label: "意向产品", value: String(tagsObj.intentProduct ?? lead?.remark ?? "待确认") },
    { label: "跟进人", value: String(tagsObj.follower ?? "林晓") },
  ]

  const communications = leads.slice(0, 3).map((l) => ({
    time: formatInstant(l.updatedAt),
    channel: mapSource(l.sourceChannel),
    text: String(l.remark || `线索 ${String(l.bizCode ?? "")} 状态 ${mapStageLabel(l.status)}`),
  }))

  const follows = leads.slice(0, 3).map((l) => ({
    time: formatInstant(l.claimedAt ?? l.updatedAt),
    actor: String(tagsObj.follower ?? "销售"),
    text: String(l.remark || "跟进中"),
    next: mapStageLabel(l.status) === "已分配" ? "安排首次回访" : "推进商机阶段",
  }))

  const deals = won.map((o) => ({
    time: formatInstant(o.updatedAt ?? o.expectedClose),
    product: String(o.name ?? "商机"),
    amount: Number(o.amountMinor ?? 0) / 100,
    type: "首购" as const,
  }))

  return { tags, base, communications, follows, deals }
}

export function mapOpportunityToDeal(
  row: Record<string, unknown>,
  customerName?: string,
  company?: string,
): DealRecord {
  const amountMinor = Number(row.amountMinor ?? 0)
  return {
    id: String(row.bizCode ?? row.id ?? ""),
    customer: customerName ?? String(row.name ?? "客户"),
    company: company ?? "—",
    product: String(row.name ?? "商机"),
    amount: amountMinor / 100,
    time: formatInstant(row.updatedAt ?? row.expectedClose),
    consultant: String(row.ownerUserId ?? "销售"),
    type: "首购",
  }
}

export function buildLifecycleCards(leads: Record<string, unknown>[]): LifecycleCard[] {
  const grouped = new Map<CustomerStage, Record<string, unknown>[]>()
  for (const stage of LIFECYCLE_STAGES) grouped.set(stage, [])
  for (const lead of leads) {
    const stage = leadToLifecycle(lead.status)
    grouped.get(stage)?.push(lead)
  }
  const total = leads.length || 1
  return LIFECYCLE_STAGES.map((stage) => {
    const rows = grouped.get(stage) ?? []
    const monthlyNew = rows.filter((r) => createdBucketFrom(r.createdAt) === "本月").length
    return {
      stage,
      intent: rows.length ? asIntent(null, rows[0].score) : "低",
      total: rows.length,
      monthlyNew,
      ratio: Math.round((rows.length / total) * 100),
      trend: rows.length
        ? Array.from({ length: 7 }, (_, i) => Math.max(1, Math.round(rows.length * (0.5 + i * 0.08))))
        : [0, 0, 0, 0, 0, 0, 0],
      customers: rows.slice(0, 5).map((r) => ({
        name: String(r.contactName || "未命名"),
        company: String(r.companyName || "—"),
        product: String(parseTags(r.tags).intentProduct || r.remark || "待确认"),
        nextAction: mapStageLabel(r.status) === "跟进中" ? "发送报价并催预付款" : "预约产品演示",
      })),
    }
  })
}

export function buildDealTrend(opportunities: Record<string, unknown>[]): DealTrendPoint[] {
  const won = opportunities.filter((o) => String(o.stage ?? "").toUpperCase() === "WON")
  const buckets = ["第1周", "第2周", "第3周", "第4周"]
  const counts = [0, 0, 0, 0]
  const amounts = [0, 0, 0, 0]
  for (const o of won) {
    const d = new Date(String(o.updatedAt ?? o.expectedClose ?? Date.now()))
    const week = Number.isNaN(d.getTime()) ? 0 : Math.min(3, Math.floor((d.getDate() - 1) / 7))
    counts[week] += 1
    amounts[week] += Number(o.amountMinor ?? 0) / 100000
  }
  return buckets.map((date, i) => ({ date, deals: counts[i], amount: Math.round(amounts[i]) }))
}

export function buildDealKpis(opportunities: Record<string, unknown>[]): DealKpi[] {
  const won = opportunities.filter((o) => String(o.stage ?? "").toUpperCase() === "WON")
  const totalAmount = won.reduce((sum, o) => sum + Number(o.amountMinor ?? 0) / 100, 0)
  const avg = won.length ? totalAmount / won.length : 0
  return [
    { label: "本月成交客户", value: String(won.length) },
    { label: "本月成交金额", value: totalAmount >= 1000 ? `€${Math.round(totalAmount / 1000)}K` : fmtMoney(totalAmount) },
    { label: "复购占比", value: "—" },
    { label: "客单价", value: won.length ? fmtMoney(Math.round(avg)) : "—" },
  ]
}

function fmtMoney(n: number): string {
  return `€${n.toLocaleString()}`
}

export async function fetchLeads(pageSize = 200): Promise<Record<string, unknown>[]> {
  const data = await apiGet<unknown>(`/sales/leads?pageSize=${pageSize}`)
  return pickRows(data)
}

export async function fetchOpportunities(pageSize = 200): Promise<Record<string, unknown>[]> {
  const data = await apiGet<unknown>(`/sales/opportunities?pageSize=${pageSize}`)
  return pickRows(data)
}

export async function fetchCustomer360(id: string): Promise<Customer360> {
  const data = await apiGet<Record<string, unknown>>(`/sales/customers/${id}/360`)
  return mapCustomer360Payload(data)
}

export interface CreateCustomerPayload {
  name: string
  company: string
  market: string
  source: string
  intent: IntentLevel
  intentProduct: string
  follower: string
  phone: string
  email: string
  industry: string
  notes: string
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<SalesCustomerView> {
  const body = {
    name: payload.name.trim(),
    customerType: "ENTERPRISE",
    country: payload.market,
    industry: payload.industry || undefined,
    tags: JSON.stringify({
      company: payload.company.trim(),
      market: payload.market,
      source: payload.source,
      intent: payload.intent,
      intentProduct: payload.intentProduct,
      follower: payload.follower,
      email: payload.email,
      phone: payload.phone,
      notes: payload.notes,
      stage: "新线索",
      lifecycle: "潜在客户",
    }),
  }
  const created = await apiPost<Record<string, unknown>>("/sales/customers", body)
  return mapCustomerRow(created)
}

export async function assignLead(leadId: string, follower: string): Promise<void> {
  const ownerUserId = FOLLOWER_USER_IDS[follower] ?? DEFAULT_OWNER_USER_ID
  await apiPost(`/sales/leads/${leadId}/assignment`, { ownerUserId })
}
