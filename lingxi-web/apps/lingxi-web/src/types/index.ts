export type Role = "admin" | "product" | "marketing" | "sales" | "agent"
export type AgentId = "market" | "content" | "sales" | "analyst"
export type AgentStatus = "运行中" | "待命" | "需关注"
export type AgentMedal = "金牌" | "银牌" | "铜牌" | "铁牌"
export type TaskStatus = "执行中" | "待审核" | "已完成" | "已排期" | "创意中" | "已审核"

export interface Tenant { id: string; name: string; plan: string; region: string }
export interface RoleOption { id: Role; name: string; scope: string }
export interface Agent { id: AgentId; name: string; title: string; domain: string; status: AgentStatus; medal: AgentMedal; task: string; progress: number; successRate: number; todayOutput: string; accent: "blue" | "amber" | "cyan" | "purple" }
export interface FlowEvent { id: string; time: string; agent: AgentId; title: string; detail: string; result: string }
export interface Metric { label: string; value: string; change: string; trend: "up" | "down" }
export interface DashboardMetric { key: string; label: string; year: string; today: string; change: string; trend: "up" | "dn" | "fl"; color: "primary" | "info" | "warning" | "success" | "violet"; spark: number[] }
export interface Opportunity { id: string; keyword: string; market: string; category: string; trend: number; score: number; evidence: string; status: string; updatedAt: string }
export type IdeaStage = "创意" | "开发" | "验证"
export interface SubTrend { subCategory: string; index: number; growth: string; series: number[] }
export interface CategoryPlayer { name: string; share: number }
export interface ProductOpportunity { id: string; subCategory: string; players: CategoryPlayer[]; competition: string; painPoints: string[]; pleasurePoints: string[]; description: string; feature: string; competitiveness: string; score: number; trend: number; market: string }
export interface ProductIdea { id: string; image: string; name: string; subCategory: string; targetCustomer: string; targetMarket: string; features: string[]; competitor: string; price: string; marketSize: string; penetration: string; stage: IdeaStage }
export interface CategoryData { trends: SubTrend[]; opportunities: ProductOpportunity[]; ideas: ProductIdea[] }
export interface ContentAsset { id: string; title: string; type: "视频" | "图文" | "文案"; channel: string; language: string; status: TaskStatus; views: number; leads: number; updatedAt: string; cover: string; summary: string; script: string[]; creator: string; tags: string[]; scriptText: string }
export interface ContentChannelStat { channel: string; delivered: boolean; impressions: number; clicks: number }
export interface ContentDistribution { id: string; title: string; type: "视频" | "图文" | "文案"; channels: ContentChannelStat[] }
export type IntentLevel = "高" | "中" | "低"
export type CustomerStage = "潜在客户" | "意向客户" | "成交客户" | "忠诚客户" | "沉睡/流失客户"
export interface Customer { id: string; name: string; company: string; market: string; source: string; intent: IntentLevel; stage: string; lifecycle: CustomerStage; intentProduct: string; follower: string; lastContact: string; createdAt: string; createdBucket: "今日" | "昨日" | "本周" | "本月" }
export interface FollowUp { id: string; customerId: string; time: string; channel: string; actor: string; content: string; result: string }
export interface ChatMessage { from: "customer" | "agent"; time: string; text: string }
export interface ReceptionLead { id: string; name: string; avatarText: string; market: string; source: string; intent: IntentLevel; product: string; waiting: string; unread: number; summary: string; conversation: ChatMessage[] }
export interface Customer360 { tags: string[]; base: { label: string; value: string }[]; communications: { time: string; channel: string; text: string }[]; follows: { time: string; actor: string; text: string; next: string }[]; deals: { time: string; product: string; amount: number; type: "首购" | "复购" }[] }
export interface LifecycleCard { stage: CustomerStage; intent: IntentLevel; total: number; monthlyNew: number; ratio: number; trend: number[]; customers: { name: string; company: string; product: string; nextAction: string }[] }
export interface DealRecord { id: string; customer: string; company: string; product: string; amount: number; time: string; consultant: string; type: "首购" | "复购" }
export interface DataAsset { id: string; name: string; type: string; records: number; quality: number; source: string; owner: string; updatedAt: string }
export interface AnalyticsKPI { key: string; label: string; month: string; today: string; change: string; icon: string }
export interface CountryRank { country: string; isoCode: string; orders: number; share: number }
export interface ProductRank { product: string; orders: number; revenue: number }
export interface FunnelStep { label: string; value: number; color: string }
export interface TrendPoint { date: string; impression: number; click: number; lead: number; order: number }
export interface AgentLog { id: string; agent: AgentId; task: string; duration: string; tokens: string; status: string; time: string }
export interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number }
export interface ListQuery { page: number; pageSize: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc"; filter?: string }
