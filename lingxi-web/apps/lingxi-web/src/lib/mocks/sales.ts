import type { Customer, Customer360, DealRecord, FollowUp, LifecycleCard, ReceptionLead } from "@/types"

export const receptionLeads: ReceptionLead[] = [
  { id: "RC-2201", name: "Felix Bauer", avatarText: "FB", market: "德国", source: "官网", intent: "高", product: "P2000 阳台储能", waiting: "在线 · 2 分钟", unread: 3, summary: "咨询 50 台批量交期与欧洲仓库存", conversation: [
    { from: "customer", time: "10:38", text: "Hi, 我们想采购 50 台 P2000，欧洲仓有货吗？" },
    { from: "agent", time: "10:38", text: "您好 Felix！P2000 德国仓现货 120 台，48 小时内可发货。" },
    { from: "customer", time: "10:40", text: "批量价能给到多少？需要含税报价。" },
    { from: "agent", time: "10:41", text: "50 台享经销价 €560/台（含 19% VAT），我已生成阶梯报价单发您邮箱。" },
    { from: "customer", time: "10:42", text: "好的，我看下。质保政策是怎样的？" },
  ] },
  { id: "RC-2202", name: "Sophie Martin", avatarText: "SM", market: "法国", source: "TikTok", intent: "高", product: "便携电源 Explorer", waiting: "在线 · 6 分钟", unread: 1, summary: "房车用电场景，关注静音与太阳能补电", conversation: [
    { from: "customer", time: "09:52", text: "Bonjour，Explorer 支持太阳能边充边用吗？" },
    { from: "agent", time: "09:53", text: "支持的，最大 200W MPPT 输入，边充边放稳定运行。" },
    { from: "customer", time: "09:55", text: "夜里睡觉会有风扇噪音吗？" },
    { from: "agent", time: "09:56", text: "待机静音 <30dB，负载低于 300W 风扇不启动，适合车内过夜。" },
  ] },
  { id: "RC-2203", name: "Jakub Nowak", avatarText: "JN", market: "波兰", source: "WhatsApp", intent: "高", product: "P2000 阳台储能", waiting: "离线 · 18 分钟", unread: 0, summary: "分销商，评估首批 100 台合作", conversation: [
    { from: "customer", time: "09:20", text: "我们是波兰分销商，想谈 P2000 区域代理。" },
    { from: "agent", time: "09:21", text: "欢迎！我们提供区域独家授权与市场支持，首批建议 100 台起。" },
    { from: "customer", time: "09:24", text: "先发一份代理政策和返点方案。" },
  ] },
  { id: "RC-2204", name: "Emma Wilson", avatarText: "EW", market: "英国", source: "Instagram", intent: "中", product: "家庭应急电源", waiting: "离线 · 42 分钟", unread: 0, summary: "家庭用户，预算敏感，仍在比较", conversation: [
    { from: "customer", time: "08:36", text: "这款和竞品比贵在哪里？" },
    { from: "agent", time: "08:37", text: "我们的循环寿命 6000 次是竞品 2 倍，长期每度电成本更低。" },
  ] },
  { id: "RC-2205", name: "Diego Ruiz", avatarText: "DR", market: "西班牙", source: "Facebook", intent: "中", product: "P2000 阳台储能", waiting: "离线 · 1 小时", unread: 0, summary: "关注安装难度与补贴政策", conversation: [
    { from: "customer", time: "昨天", text: "西班牙有安装补贴吗？自己能装吗？" },
    { from: "agent", time: "昨天", text: "可申请 IDAE 补贴，阳台挂装三步即可，无需电工。" },
  ] },
]

export const customers: Customer[] = [
  { id: "CU-1048", name: "Felix Bauer", company: "NordHaus GmbH", market: "德国", source: "官网", intent: "高", stage: "报价中", lifecycle: "意向客户", intentProduct: "P2000 阳台储能", follower: "林晓", lastContact: "8 分钟前", createdAt: "今天 10:18", createdBucket: "今日" },
  { id: "CU-1047", name: "Sophie Martin", company: "Maison Libre", market: "法国", source: "TikTok", intent: "高", stage: "需求确认", lifecycle: "意向客户", intentProduct: "便携电源 Explorer", follower: "林晓", lastContact: "22 分钟前", createdAt: "今天 09:52", createdBucket: "今日" },
  { id: "CU-1046", name: "Jakub Nowak", company: "Volt Trade", market: "波兰", source: "WhatsApp", intent: "高", stage: "初版报价", lifecycle: "意向客户", intentProduct: "P2000 阳台储能", follower: "赵磊", lastContact: "35 分钟前", createdAt: "昨天 16:20", createdBucket: "昨日" },
  { id: "CU-1045", name: "Emma Wilson", company: "Green Living", market: "英国", source: "Instagram", intent: "中", stage: "培育中", lifecycle: "潜在客户", intentProduct: "家庭应急电源", follower: "Echo AI", lastContact: "今天 09:10", createdAt: "本周一 14:02", createdBucket: "本周" },
  { id: "CU-1044", name: "Diego Ruiz", company: "Sol y Casa", market: "西班牙", source: "Facebook", intent: "中", stage: "需求确认", lifecycle: "意向客户", intentProduct: "P2000 阳台储能", follower: "赵磊", lastContact: "昨天 18:42", createdAt: "本周二 11:20", createdBucket: "本周" },
  { id: "CU-1043", name: "Olivia Smith", company: "Camp North", market: "加拿大", source: "YouTube", intent: "低", stage: "新线索", lifecycle: "潜在客户", intentProduct: "便携电源 Explorer", follower: "Echo AI", lastContact: "3 天前", createdAt: "上周三 15:20", createdBucket: "本月" },
  { id: "CU-1042", name: "Lars Berg", company: "Nordic Power", market: "挪威", source: "官网", intent: "高", stage: "已成交", lifecycle: "成交客户", intentProduct: "P2000 阳台储能", follower: "林晓", lastContact: "本周三", createdAt: "本月 03 日", createdBucket: "本月" },
  { id: "CU-1041", name: "Marco Rossi", company: "Casa Verde", market: "意大利", source: "经销商", intent: "高", stage: "复购中", lifecycle: "忠诚客户", intentProduct: "整套光储方案", follower: "赵磊", lastContact: "昨天", createdAt: "上月 21 日", createdBucket: "本月" },
]

export const customer360: Record<string, Customer360> = {
  "CU-1048": {
    tags: ["高意向", "批量采购", "德国市场", "价格敏感度低"],
    base: [{ label: "客户名称", value: "Felix Bauer" }, { label: "所属公司", value: "NordHaus GmbH" }, { label: "所在市场", value: "德国" }, { label: "来源渠道", value: "官网表单" }, { label: "意向产品", value: "P2000 阳台储能" }, { label: "跟进人", value: "林晓" }],
    communications: [{ time: "今天 10:42", channel: "WhatsApp", text: "确认 50 台批量报价与交期" }, { time: "今天 09:56", channel: "官网", text: "浏览 P2000 产品页 6 分钟并下载规格书" }, { time: "昨天 17:32", channel: "邮件", text: "发送阶梯报价与案例资料" }],
    follows: [{ time: "今天 10:45", actor: "林晓", text: "客户认可价格，索取合同模板", next: "发送合同并约定预付款" }, { time: "昨天 17:40", actor: "Echo AI", text: "自动跟进报价阅读情况", next: "提醒销售今日回访" }],
    deals: [],
  },
  "CU-1042": {
    tags: ["已成交", "挪威市场", "口碑推荐"],
    base: [{ label: "客户名称", value: "Lars Berg" }, { label: "所属公司", value: "Nordic Power" }, { label: "所在市场", value: "挪威" }, { label: "来源渠道", value: "官网" }, { label: "意向产品", value: "P2000 阳台储能" }, { label: "跟进人", value: "林晓" }],
    communications: [{ time: "本周三", channel: "邮件", text: "确认收货并反馈安装顺利" }, { time: "上周五", channel: "电话", text: "沟通付款与物流细节" }],
    follows: [{ time: "本周三", actor: "林晓", text: "客户满意，愿意推荐同行", next: "邀请参与客户案例" }],
    deals: [{ time: "本周三", product: "P2000 阳台储能 ×30", amount: 16800, type: "首购" }],
  },
}

export const lifecycleCards: LifecycleCard[] = [
  { stage: "潜在客户", intent: "低", total: 4820, monthlyNew: 386, ratio: 42, trend: [20, 24, 22, 28, 32, 30, 36], customers: [{ name: "Olivia Smith", company: "Camp North", product: "便携电源", nextAction: "推送场景内容培育" }, { name: "Tomas Novak", company: "EcoHome", product: "阳台储能", nextAction: "邀请参加线上答疑" }] },
  { stage: "意向客户", intent: "高", total: 1240, monthlyNew: 168, ratio: 18, trend: [12, 16, 18, 20, 24, 26, 28], customers: [{ name: "Felix Bauer", company: "NordHaus GmbH", product: "P2000 阳台储能", nextAction: "发送合同并催预付款" }, { name: "Sophie Martin", company: "Maison Libre", product: "便携电源 Explorer", nextAction: "预约产品演示" }] },
  { stage: "成交客户", intent: "高", total: 862, monthlyNew: 38, ratio: 8, trend: [4, 5, 6, 5, 7, 8, 9], customers: [{ name: "Lars Berg", company: "Nordic Power", product: "P2000 ×30", nextAction: "跟踪安装与验收" }] },
  { stage: "忠诚客户", intent: "高", total: 486, monthlyNew: 22, ratio: 5, trend: [2, 3, 3, 4, 4, 5, 6], customers: [{ name: "Marco Rossi", company: "Casa Verde", product: "整套光储方案", nextAction: "推荐配件复购" }] },
  { stage: "沉睡/流失客户", intent: "低", total: 2680, monthlyNew: 96, ratio: 27, trend: [30, 28, 26, 24, 22, 20, 18], customers: [{ name: "Anna Kraus", company: "Solar Home", product: "阳台储能", nextAction: "唤醒专属优惠触达" }] },
]

export const dealTrend = [
  { date: "第1周", deals: 6, amount: 42 }, { date: "第2周", deals: 9, amount: 68 }, { date: "第3周", deals: 8, amount: 61 }, { date: "第4周", deals: 12, amount: 88 },
]

export const dealRecords: DealRecord[] = [
  { id: "OR-9012", customer: "Lars Berg", company: "Nordic Power", product: "P2000 阳台储能 ×30", amount: 16800, time: "本周三 14:20", consultant: "林晓", type: "首购" },
  { id: "OR-9011", customer: "Marco Rossi", company: "Casa Verde", product: "整套光储方案 ×1", amount: 9800, time: "本周三 11:05", consultant: "赵磊", type: "复购" },
  { id: "OR-9010", customer: "Hans Weber", company: "GreenTech", product: "P2000 阳台储能 ×20", amount: 11200, time: "本周二 16:48", consultant: "林晓", type: "首购" },
  { id: "OR-9009", customer: "Julie Dubois", company: "Maison Eco", product: "便携电源 Explorer ×50", amount: 24500, time: "本周二 10:12", consultant: "赵磊", type: "首购" },
  { id: "OR-9008", customer: "Marco Rossi", company: "Casa Verde", product: "储能扩展电池 ×2", amount: 3600, time: "本周一 15:30", consultant: "赵磊", type: "复购" },
  { id: "OR-9007", customer: "Peter Jensen", company: "Nordic Living", product: "P2000 阳台储能 ×15", amount: 8400, time: "上周五 17:22", consultant: "林晓", type: "首购" },
]

export const followUps: FollowUp[] = [
  { id: "FU-1", customerId: "CU-1048", time: "今天 10:42", channel: "WhatsApp", actor: "Echo AI", content: "检测到客户再次查看报价，自动发送交期与欧洲仓库存说明。", result: "客户已读" },
  { id: "FU-2", customerId: "CU-1048", time: "今天 09:56", channel: "官网", actor: "行为追踪", content: "查看 P2000 产品页 6 分钟，并下载规格书。", result: "意向升至高" },
  { id: "FU-3", customerId: "CU-1048", time: "昨天 17:32", channel: "邮件", actor: "林晓", content: "发送 50 台阶梯报价与案例资料。", result: "邮件已打开 3 次" },
]
