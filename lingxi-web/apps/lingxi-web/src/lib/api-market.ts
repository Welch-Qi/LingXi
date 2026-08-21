import { apiGet } from "@/lib/api";
import { pickRows } from "@/lib/format";
import type { CategoryPlayer, ProductOpportunity, SubTrend } from "@/types";

const WEEKS = 8;

function asStr(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asNum(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatGrowth(first: number, last: number): string {
  if (first <= 0) return last > 0 ? "+100%" : "0%";
  const pct = Math.round(((last - first) / first) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

/** Group paginated search-trend rows into chart-ready sub-trends (max 4 series). */
export function mapSearchTrendRows(rows: Record<string, unknown>[]): SubTrend[] {
  const byKeyword = new Map<string, { date: string; value: number }[]>();

  for (const row of rows) {
    const keyword = asStr(row.keyword) || asStr(row.subCategory) || "未知品类";
    const date = asStr(row.metricDate) || asStr(row.date);
    const value = asNum(row.indexValue ?? row.index ?? row.heatValue);
    const points = byKeyword.get(keyword) ?? [];
    points.push({ date, value });
    byKeyword.set(keyword, points);
  }

  const trends: SubTrend[] = [];
  for (const [subCategory, points] of byKeyword) {
    points.sort((a, b) => a.date.localeCompare(b.date));
    const slice = points.slice(-WEEKS);
    const series = slice.map((p) => p.value);
    while (series.length < WEEKS) {
      series.unshift(series[0] ?? 0);
    }
    const first = series[0] ?? 0;
    const last = series[series.length - 1] ?? 0;
    trends.push({
      subCategory,
      index: last,
      growth: formatGrowth(first, last),
      series: series.slice(-WEEKS),
    });
  }

  return trends.sort((a, b) => b.index - a.index).slice(0, 4);
}

export interface HotKeywordView {
  keyword: string;
  heatScore: number;
  trend: string;
  region: string;
  category: string;
}

export function mapHotKeywordRow(row: Record<string, unknown>): HotKeywordView {
  return {
    keyword: asStr(row.keyword, "—"),
    heatScore: asNum(row.heatScore ?? row.index),
    trend: asStr(row.trend, "FLAT"),
    region: asStr(row.region),
    category: asStr(row.category),
  };
}

export interface RegionHeatView {
  region: string;
  heatValue: number;
  trendCount: number;
}

export function mapRegionHeatRow(row: Record<string, unknown>): RegionHeatView {
  return {
    region: asStr(row.region, "—"),
    heatValue: asNum(row.heatValue),
    trendCount: asNum(row.trendCount),
  };
}

const DEFAULT_PLAYERS: CategoryPlayer[] = [{ name: "市场待分析", share: 100 }];

/** Map backend MktOpportunity row to product-page card shape. */
export function mapOpportunityRow(row: Record<string, unknown>): ProductOpportunity {
  const id = asStr(row.bizCode) || asStr(row.id) || "OP-?";
  const title = asStr(row.title) || asStr(row.productHint) || "市场机会";
  const summary = asStr(row.summary);
  const score = asNum(row.score);
  const market = asStr(row.targetMarket) || "—";
  const feature = asStr(row.productHint) || title;

  return {
    id,
    subCategory: title,
    players: DEFAULT_PLAYERS,
    competition: summary || "基于搜索指数与竞品格局的综合评估",
    painPoints: summary ? [summary.slice(0, 80)] : ["待补充用户痛点"],
    pleasurePoints: ["搜索需求上升", "差异化切入空间"],
    description: summary || `针对 ${market} 市场的 ${title} 机会扫描结果。`,
    feature,
    competitiveness: `机会评分 ${score}，状态 ${asStr(row.status, "OPEN")}`,
    score,
    trend: score,
    market,
  };
}

export async function fetchSearchTrends(category?: string, region?: string): Promise<SubTrend[]> {
  const params = new URLSearchParams({ pageNo: "1", pageSize: "100" });
  if (category) params.set("keyword", category);
  if (region) params.set("region", region);
  const res = await apiGet<unknown>(`/market/search-trends?${params}`);
  const rows = pickRows(res);
  return mapSearchTrendRows(rows);
}

export async function fetchHotKeywords(category?: string): Promise<HotKeywordView[]> {
  const params = new URLSearchParams({ pageNo: "1", pageSize: "10" });
  if (category) params.set("category", category);
  const res = await apiGet<unknown>(`/market/hot-keywords?${params}`);
  return pickRows(res).map(mapHotKeywordRow);
}

export async function fetchRisingKeywords(category?: string): Promise<HotKeywordView[]> {
  const params = new URLSearchParams({ pageNo: "1", pageSize: "10" });
  if (category) params.set("category", category);
  const res = await apiGet<unknown>(`/market/rising-keywords?${params}`);
  return pickRows(res).map(mapHotKeywordRow);
}

export async function fetchRegionHeat(keyword?: string): Promise<RegionHeatView[]> {
  const params = new URLSearchParams({ pageNo: "1", pageSize: "20" });
  if (keyword) params.set("keyword", keyword);
  const res = await apiGet<unknown>(`/market/region-heat?${params}`);
  return pickRows(res).map(mapRegionHeatRow);
}

export async function fetchOpportunities(): Promise<ProductOpportunity[]> {
  const res = await apiGet<unknown>("/market/opportunities");
  return pickRows(res).map(mapOpportunityRow);
}
