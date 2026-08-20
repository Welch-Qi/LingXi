// Knowledge Center mock data — 模板库 / 话术库 / 提示词库

export const templates = [
  { id: "t1", name: "营销开发信模板 · 首次触达", category: "营销开发信", language: "英语", updatedAt: "2024-12-02", usageCount: 342 },
  { id: "t2", name: "营销开发信模板 · 展会跟进", category: "营销开发信", language: "德语", updatedAt: "2024-11-28", usageCount: 198 },
  { id: "t3", name: "标准报价单模板 · 储能设备", category: "报价单", language: "英语", updatedAt: "2024-11-25", usageCount: 276 },
  { id: "t4", name: "分销代理合同模板", category: "合同", language: "英语", updatedAt: "2024-11-18", usageCount: 64 },
  { id: "t5", name: "跟进邮件模板 · 报价后 3 天未回复", category: "跟进邮件", language: "法语", updatedAt: "2024-11-15", usageCount: 421 },
  { id: "t6", name: "跟进邮件模板 · 样品寄送通知", category: "跟进邮件", language: "英语", updatedAt: "2024-11-10", usageCount: 156 },
  { id: "t7", name: "售后服务条款模板", category: "合同", language: "英语", updatedAt: "2024-10-30", usageCount: 89 },
  { id: "t8", name: "营销开发信模板 · 老客户复购", category: "营销开发信", language: "荷兰语", updatedAt: "2024-10-22", usageCount: 112 },
]

export const scripts = [
  { id: "s1", scene: "首次开发信 · 询盘响应", language: "英语", summary: "针对官网询盘的标准首次响应话术，突出产品核心卖点与快速报价承诺", usageCount: 528, updatedAt: "2024-12-01" },
  { id: "s2", scene: "报价异议处理 · 价格过高", language: "英语", summary: "客户认为报价偏高时的价值重申与阶梯折扣引导话术", usageCount: 314, updatedAt: "2024-11-27" },
  { id: "s3", scene: "催单跟进 · 报价后未成交", language: "德语", summary: "报价发出后 5-7 天未回复客户的温和催单与限时优惠话术", usageCount: 267, updatedAt: "2024-11-20" },
  { id: "s4", scene: "售后安抚 · 物流延迟投诉", language: "英语", summary: "物流延迟场景下的安抚话术与补偿方案说明", usageCount: 143, updatedAt: "2024-11-12" },
  { id: "s5", scene: "转人工前置话术 · 大额订单", language: "法语", summary: "订单金额超过阈值时引导客户接入资深顾问的过渡话术", usageCount: 98, updatedAt: "2024-11-05" },
  { id: "s6", scene: "复购激活 · 老客户唤醒", language: "英语", summary: "针对 90 天未下单老客户的唤醒话术，结合历史购买偏好推荐", usageCount: 176, updatedAt: "2024-10-28" },
]

export const prompts = [
  { id: "p1", agent: "market" as const, scene: "细分市场趋势扫描", summary: "输入目标国家与品类，输出政策信号、竞品格局与产品机会评分", version: "v2.3", updatedAt: "2024-12-03" },
  { id: "p2", agent: "market" as const, scene: "竞品定价对比分析", summary: "抓取竞品在目标市场的定价区间并生成差异化定价建议", version: "v1.8", updatedAt: "2024-11-26" },
  { id: "p3", agent: "content" as const, scene: "多语种社媒文案生成", summary: "基于产品卖点与平台特性批量生成 5 语种短视频脚本与图文文案", version: "v3.1", updatedAt: "2024-12-02" },
  { id: "p4", agent: "content" as const, scene: "品牌合规内容校验", summary: "对 AI 生成内容进行品牌调性与广告合规双重校验并给出修改建议", version: "v2.0", updatedAt: "2024-11-19" },
  { id: "p5", agent: "sales" as const, scene: "客户意图识别与分层", summary: "基于对话内容实时识别采购意图强度并自动打标客户分层", version: "v2.5", updatedAt: "2024-11-30" },
  { id: "p6", agent: "sales" as const, scene: "报价单智能生成", summary: "根据客户历史沟通与产品选型自动生成个性化报价单草稿", version: "v1.6", updatedAt: "2024-11-14" },
  { id: "p7", agent: "analyst" as const, scene: "经营异常信号诊断", summary: "扫描全球经营指标波动并输出根因假设与应对建议", version: "v2.1", updatedAt: "2024-12-01" },
  { id: "p8", agent: "analyst" as const, scene: "营销漏斗瓶颈分析", summary: "定位转化漏斗中的薄弱环节并给出可执行的优化方向", version: "v1.9", updatedAt: "2024-11-22" },
]
