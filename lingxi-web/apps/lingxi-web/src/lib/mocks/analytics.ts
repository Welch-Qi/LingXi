import type { AnalyticsKPI, CountryRank, FunnelStep, ProductRank, TrendPoint } from "@/types"

export const analyticsKPIs: AnalyticsKPI[] = [
  { key: "products",   label: "商品数",   month: "2,841",  today: "+12",    change: "+4.2%",  icon: "Boxes" },
  { key: "hot",        label: "爆品数",   month: "186",    today: "+3",     change: "+12.8%", icon: "Flame" },
  { key: "impression", label: "曝光量",   month: "24.6M",  today: "486K",   change: "+28.4%", icon: "Eye" },
  { key: "click",      label: "点击量",   month: "1.86M",  today: "32.4K",  change: "+21.7%", icon: "MousePointerClick" },
  { key: "lead",       label: "潜客量",   month: "18,642", today: "326",    change: "+24.2%", icon: "Users" },
  { key: "order",      label: "订单量",   month: "3,280",  today: "68",     change: "+18.6%", icon: "ShoppingCart" },
  { key: "deal",       label: "成交量",   month: "2,180",  today: "38",     change: "+15.3%", icon: "BadgeCheck" },
]

export const countryRanks: CountryRank[] = [
  { country: "德国",   isoCode: "DEU", orders: 864,  share: 26.3 },
  { country: "法国",   isoCode: "FRA", orders: 612,  share: 18.7 },
  { country: "英国",   isoCode: "GBR", orders: 448,  share: 13.7 },
  { country: "荷兰",   isoCode: "NLD", orders: 324,  share: 9.9  },
  { country: "意大利", isoCode: "ITA", orders: 266,  share: 8.1  },
  { country: "西班牙", isoCode: "ESP", orders: 218,  share: 6.6  },
  { country: "波兰",   isoCode: "POL", orders: 184,  share: 5.6  },
  { country: "瑞典",   isoCode: "SWE", orders: 142,  share: 4.3  },
  { country: "丹麦",   isoCode: "DNK", orders: 118,  share: 3.6  },
  { country: "奥地利", isoCode: "AUT", orders: 104,  share: 3.2  },
]

// ISO Alpha-3 to sales heat (0–100) for world map coloring
export const countrySalesMap: Record<string, number> = {
  DEU: 100, FRA: 72, GBR: 52, NLD: 38, ITA: 31, ESP: 25, POL: 21, SWE: 17, DNK: 14, AUT: 12,
  USA: 8, CAN: 6, AUS: 9, JPN: 5, CHN: 4, BRA: 3, IND: 3, MEX: 2, ZAF: 2, NOR: 10, FIN: 8,
  BEL: 16, CHE: 13, PRT: 7, CZE: 9, HUN: 6, ROU: 5, GRC: 4,
}

// Per-country details for map tooltip: leads / orders / deals
export interface CountryDetail { name: string; lead: number; order: number; deal: number }
export const countryDetails: Record<string, CountryDetail> = {
  DEU: { name: "德国",   lead: 5840, order: 864, deal: 612 },
  FRA: { name: "法国",   lead: 3920, order: 612, deal: 428 },
  GBR: { name: "英国",   lead: 2860, order: 448, deal: 310 },
  NLD: { name: "荷兰",   lead: 1980, order: 324, deal: 224 },
  ITA: { name: "意大利", lead: 1620, order: 266, deal: 182 },
  ESP: { name: "西班牙", lead: 1320, order: 218, deal: 148 },
  POL: { name: "波兰",   lead: 1080, order: 184, deal: 124 },
  SWE: { name: "瑞典",   lead:  860, order: 142, deal:  96 },
  DNK: { name: "丹麦",   lead:  720, order: 118, deal:  80 },
  AUT: { name: "奥地利", lead:  640, order: 104, deal:  72 },
  NOR: { name: "挪威",   lead:  580, order:  96, deal:  66 },
  BEL: { name: "比利时", lead:  920, order: 152, deal: 104 },
  CHE: { name: "瑞士",   lead:  760, order: 126, deal:  88 },
  USA: { name: "美国",   lead:  480, order:  78, deal:  52 },
  CAN: { name: "加拿大", lead:  360, order:  58, deal:  38 },
  AUS: { name: "澳大利亚", lead: 420, order: 68, deal: 46 },
  FIN: { name: "芬兰",   lead:  460, order:  76, deal:  52 },
  PRT: { name: "葡萄牙", lead:  380, order:  62, deal:  42 },
  CZE: { name: "捷克",   lead:  420, order:  68, deal:  46 },
}

export const productRanks: ProductRank[] = [
  { product: "阳台储能系统 P2000",       orders: 724,  revenue: 28960 },
  { product: "便携储能 Rover 1000",      orders: 612,  revenue: 18360 },
  { product: "便携储能 Rover 500",       orders: 486,  revenue: 9720  },
  { product: "智能灌溉控制器 AquaX",     orders: 398,  revenue: 7960  },
  { product: "阳台储能系统 P1200",       orders: 344,  revenue: 10320 },
  { product: "STEM 拼装机器人 BuildBot", orders: 286,  revenue: 5148  },
  { product: "智能按摩枪 PulseX Pro",    orders: 248,  revenue: 7440  },
  { product: "加热工作外套 HeatTech",    orders: 216,  revenue: 8640  },
  { product: "智能健身阻力器 FitCore",   orders: 186,  revenue: 5580  },
  { product: "露营充电套装 CampKit",     orders: 164,  revenue: 4920  },
]

export const funnelSteps: FunnelStep[] = [
  { label: "曝光量", value: 24600000, color: "#1e3a8a" },
  { label: "点击量", value: 1860000,  color: "#1d4ed8" },
  { label: "潜客量", value: 186420,   color: "#2563eb" },
  { label: "订单量", value: 3280,     color: "#3b82f6" },
]

// 30-day daily trend (indexed)
const base = { impression: 480, click: 31, lead: 280, order: 58 }
export const trendData: TrendPoint[] = Array.from({ length: 30 }, (_, i) => {
  const noise = () => 0.85 + Math.random() * 0.3
  const growth = 1 + i * 0.008
  return {
    date: `${i + 1}日`,
    impression: Math.round(base.impression * growth * noise()),
    click:      Math.round(base.click      * growth * noise()),
    lead:       Math.round(base.lead       * growth * noise()),
    order:      Math.round(base.order      * growth * noise()),
  }
})
