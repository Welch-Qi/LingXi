import type { AgentLog, DataAsset } from "@/types"
export const dataAssets: DataAsset[] = [
  { id: "DA-01", name: "全球市场机会库", type: "市场洞察", records: 1248, quality: 96, source: "Atlas + 外部信号", owner: "产品增长组", updatedAt: "6 分钟前" },
  { id: "DA-02", name: "多语种内容资产库", type: "内容资产", records: 3862, quality: 92, source: "Muse + 品牌素材", owner: "内容营销组", updatedAt: "12 分钟前" },
  { id: "DA-03", name: "全球客户主数据", type: "客户数据", records: 8654, quality: 89, source: "Echo + CRM", owner: "销售中心", updatedAt: "2 分钟前" },
  { id: "DA-04", name: "全渠道跟进记录", type: "行为记录", records: 24890, quality: 94, source: "WhatsApp / 邮件 / 官网", owner: "销售中心", updatedAt: "实时" },
  { id: "DA-05", name: "产品与商品中心", type: "产品数据", records: 426, quality: 98, source: "PIM / ERP", owner: "产品中心", updatedAt: "今天 08:00" },
  { id: "DA-06", name: "渠道内容效果集", type: "营销数据", records: 12046, quality: 91, source: "社媒平台", owner: "增长运营", updatedAt: "18 分钟前" },
]
export const agentLogs: AgentLog[] = [
  { id: "L-1", agent: "market", task: "德国储能趋势扫描", duration: "12m 34s", tokens: "28.4K", status: "成功", time: "10:36" },
  { id: "L-2", agent: "content", task: "德语短视频生成与分发", duration: "8m 12s", tokens: "16.7K", status: "成功", time: "10:18" },
  { id: "L-3", agent: "sales", task: "高意向客户自动跟进", duration: "42s", tokens: "2.1K", status: "成功", time: "10:12" },
  { id: "L-4", agent: "sales", task: "波兰客户初版报价", duration: "2m 08s", tokens: "4.8K", status: "人工复核", time: "09:42" },
]
