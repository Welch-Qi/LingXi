import type { AnalyticsKPI, CountryRank, FunnelStep, ProductRank, TrendPoint } from "@/types"
import type { CountryDetail } from "@/lib/mocks/analytics"

export interface DecisionDashboardPayload {
  kpis?: AnalyticsKPI[]
  countryRanks?: CountryRank[]
  productRanks?: ProductRank[]
  funnel?: FunnelStep[]
  trend?: TrendPoint[]
  countryHeat?: Record<string, number>
  countryDetails?: Record<string, CountryDetail>
  updatedAtHint?: string
}

export interface DecisionAskPayload {
  metricCode?: string
  value?: unknown
  periodKey?: string
  answer?: string
  message?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value
  if (value == null) return fallback
  return String(value)
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

function parseKpis(raw: unknown): AnalyticsKPI[] | undefined {
  const items = asArray(raw)
  if (!items.length) return undefined
  return items.map((item) => {
    const row = asRecord(item) ?? {}
    return {
      key: asString(row.key),
      label: asString(row.label),
      month: asString(row.month),
      today: asString(row.today),
      change: asString(row.change),
      icon: asString(row.icon, "Boxes"),
    }
  })
}

function parseCountryRanks(raw: unknown): CountryRank[] | undefined {
  const items = asArray(raw)
  if (!items.length) return undefined
  return items.map((item) => {
    const row = asRecord(item) ?? {}
    return {
      country: asString(row.country),
      isoCode: asString(row.isoCode),
      orders: asNumber(row.orders),
      share: asNumber(row.share),
    }
  })
}

function parseProductRanks(raw: unknown): ProductRank[] | undefined {
  const items = asArray(raw)
  if (!items.length) return undefined
  return items.map((item) => {
    const row = asRecord(item) ?? {}
    return {
      product: asString(row.product),
      orders: asNumber(row.orders),
      revenue: asNumber(row.revenue),
    }
  })
}

function parseFunnel(raw: unknown): FunnelStep[] | undefined {
  const items = asArray(raw)
  if (!items.length) return undefined
  return items.map((item) => {
    const row = asRecord(item) ?? {}
    return {
      label: asString(row.label),
      value: asNumber(row.value),
      color: asString(row.color, "#3b82f6"),
    }
  })
}

function parseTrend(raw: unknown): TrendPoint[] | undefined {
  const items = asArray(raw)
  if (!items.length) return undefined
  return items.map((item) => {
    const row = asRecord(item) ?? {}
    return {
      date: asString(row.date),
      impression: asNumber(row.impression),
      click: asNumber(row.click),
      lead: asNumber(row.lead),
      order: asNumber(row.order),
    }
  })
}

function parseCountryHeat(raw: unknown): Record<string, number> | undefined {
  const record = asRecord(raw)
  if (!record) return undefined
  const heat: Record<string, number> = {}
  for (const [iso, value] of Object.entries(record)) {
    heat[iso] = asNumber(value)
  }
  return Object.keys(heat).length ? heat : undefined
}

function parseCountryDetails(raw: unknown): Record<string, CountryDetail> | undefined {
  const record = asRecord(raw)
  if (!record) return undefined
  const details: Record<string, CountryDetail> = {}
  for (const [iso, value] of Object.entries(record)) {
    const row = asRecord(value)
    if (!row) continue
    details[iso] = {
      name: asString(row.name, iso),
      lead: asNumber(row.lead),
      order: asNumber(row.order),
      deal: asNumber(row.deal),
    }
  }
  return Object.keys(details).length ? details : undefined
}

/** Defensively parse GET /decision/dashboard payload (already unwrapped by apiGet). */
export function parseDecisionDashboard(raw: Record<string, unknown>): DecisionDashboardPayload {
  return {
    kpis: parseKpis(raw.kpis),
    countryRanks: parseCountryRanks(raw.countryRanks),
    productRanks: parseProductRanks(raw.productRanks),
    funnel: parseFunnel(raw.funnel),
    trend: parseTrend(raw.trend),
    countryHeat: parseCountryHeat(raw.countryHeat),
    countryDetails: parseCountryDetails(raw.countryDetails),
    updatedAtHint: raw.updatedAtHint != null ? asString(raw.updatedAtHint) : undefined,
  }
}

/** Infer metricCode from natural-language question (mirrors backend aliases). */
export function inferMetricCode(question: string): string {
  const lower = question.toLowerCase()
  if (lower.includes("营收") || lower.includes("revenue") || question.includes("成交金额")) return "revenue"
  if (question.includes("曝光")) return "impression"
  if (question.includes("点击")) return "click"
  if (question.includes("订单")) return "order"
  if (question.includes("成交") && !question.includes("转化")) return "deal"
  if (question.includes("转化") || lower.includes("win")) return "win_rate"
  if (question.includes("爆品")) return "hot"
  if (question.includes("商品")) return "products"
  if (question.includes("客户") || lower.includes("customer")) return "customers"
  if (question.includes("线索") || lower.includes("lead") || question.includes("潜客")) return "lead"
  return "leads"
}

/** Build chat reply from POST /decision/ask response with local fallback. */
export function formatAskReply(
  data: DecisionAskPayload,
  question: string,
  fallback: (q: string) => string,
): string {
  const answer = data.answer ?? data.message
  if (answer) {
    return `${answer}\n\n——\n${fallback(question)}`
  }
  if (data.value != null) {
    const metric = data.metricCode ?? "metric"
    const period = data.periodKey ? `（${data.periodKey}）` : ""
    return `【${metric}】${String(data.value)}${period}\n\n——\n${fallback(question)}`
  }
  return fallback(question)
}
