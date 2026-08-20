import type { Agent, DashboardMetric, FlowEvent, Metric, RoleOption, Tenant } from "@/types"

export const tenants: Tenant[] = [
  { id: "nova", name: "NovaTech 出海事业部", plan: "Enterprise", region: "亚太" },
  { id: "aurora", name: "Aurora Home 全球业务", plan: "Growth", region: "欧洲" },
  { id: "atlas", name: "Atlas Tools 国际站", plan: "Pro", region: "北美" },
]
export const roles: RoleOption[] = [
  { id: "admin", name: "CEO", scope: "经营全局、业务成果与关键决策" },
  { id: "product", name: "产品总监", scope: "市场趋势、产品开发与产品创意" },
  { id: "marketing", name: "营销总监", scope: "内容生产、分发与投放管理" },
  { id: "sales", name: "销售总监", scope: "客户、跟进、商机与成交" },
  { id: "agent", name: "智能体架构师", scope: "智能体配置、运行与审计" },
]
export const metrics: Metric[] = [
  { label: "AI 接管业务动作", value: "1,284", change: "+18.6%", trend: "up" },
  { label: "新增有效线索", value: "326", change: "+24.2%", trend: "up" },
  { label: "内容触达", value: "2.46M", change: "+12.8%", trend: "up" },
  { label: "预估商机金额", value: "$184K", change: "+9.4%", trend: "up" },
]
export const dashboardMetrics: DashboardMetric[] = [
  { key: "newCustomer", label: "新增客户数", year: "18,642", today: "326", change: "+24.2%", trend: "up", color: "primary", spark: [40, 46, 44, 52, 58, 55, 63, 68] },
  { key: "profiled", label: "客户建档数", year: "14,208", today: "268", change: "+19.6%", trend: "up", color: "info", spark: [30, 34, 33, 38, 42, 40, 46, 50] },
  { key: "highIntent", label: "高意向客户数", year: "5,436", today: "112", change: "+15.3%", trend: "up", color: "warning", spark: [20, 22, 25, 24, 28, 30, 29, 33] },
  { key: "dealt", label: "成交客户数", year: "2,180", today: "38", change: "+12.8%", trend: "up", color: "success", spark: [12, 14, 13, 16, 18, 17, 20, 22] },
  { key: "impression", label: "曝光数", year: "24.6M", today: "486K", change: "+28.4%", trend: "up", color: "primary", spark: [60, 65, 70, 68, 76, 82, 88, 96] },
  { key: "click", label: "点击转化数", year: "1.86M", today: "32.4K", change: "+21.7%", trend: "up", color: "violet", spark: [25, 28, 30, 34, 38, 42, 47, 53] },
]
export const growthTrend = [
  { week: "W1", impression: 62, click: 34, profiled: 20 },
  { week: "W2", impression: 68, click: 41, profiled: 26 },
  { week: "W3", impression: 74, click: 47, profiled: 33 },
  { week: "W4", impression: 82, click: 52, profiled: 38 },
  { week: "W5", impression: 88, click: 61, profiled: 46 },
  { week: "W6", impression: 96, click: 68, profiled: 52 },
  { week: "W7", impression: 108, click: 79, profiled: 61 },
  { week: "W8", impression: 121, click: 88, profiled: 70 },
]
export const agents: Agent[] = [
  { id: "analyst", name: "Sage", title: "经营决策专家", domain: "经营分析", status: "运行中", medal: "金牌", task: "分析全球营销漏斗瓶颈", progress: 76, successRate: 97, todayOutput: "8 份洞察", accent: "purple" },
  { id: "market", name: "Atlas", title: "市场分析师", domain: "产品开发", status: "运行中", medal: "金牌", task: "扫描德国户外储能趋势", progress: 68, successRate: 94, todayOutput: "12 条机会", accent: "blue" },
  { id: "content", name: "Muse", title: "内容创意师", domain: "内容营销", status: "运行中", medal: "银牌", task: "生成便携储能多语种素材", progress: 42, successRate: 91, todayOutput: "38 份内容", accent: "amber" },
  { id: "sales", name: "Echo", title: "营销客服专家", domain: "销售转化", status: "需关注", medal: "铜牌", task: "跟进 8 位高意向采购商", progress: 81, successRate: 96, todayOutput: "47 次跟进", accent: "cyan" },
]
export const flowEvents: FlowEvent[] = [
  { id: "f1", time: "10:42", agent: "sales", title: "高意向客户已识别", detail: "NordHaus GmbH 连续查看 P2000 产品与报价页", result: "已触发 WhatsApp 跟进" },
  { id: "f2", time: "10:18", agent: "content", title: "素材完成并自动分发", detail: "《停电时如何保持家庭供电》德语短视频", result: "TikTok / Instagram 已发布" },
  { id: "f3", time: "09:36", agent: "market", title: "新机会进入验证池", detail: "德国 Balcony Storage 搜索热度连续 4 周增长", result: "机会评分 92" },
  { id: "f4", time: "09:12", agent: "sales", title: "询盘完成自动接待", detail: "来自波兰的批发客户咨询 MOQ 与交期", result: "已生成初版报价" },
]
