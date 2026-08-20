// Config Center mock data

export const brandInfo = {
  name: "NovaTech 出海事业部",
  logoUrl: "/images/agent-analyst.png",
  slogan: "智能链接全球市场",
  industry: "新能源 / 储能设备",
  tonality: "专业、可信赖、技术创新",
  founded: "2019",
  website: "www.novatech-global.com",
}

export const operationPrinciples = [
  { id: "p1", title: "广告合规底线", content: "所有投放内容须通过平台广告政策合规审查，禁止夸大效果描述（如「100% 节省电费」）。" },
  { id: "p2", title: "品牌传播规范", content: "全渠道使用统一品牌名称与 Logo，禁止第三方未授权改色或变形使用品牌视觉资产。" },
  { id: "p3", title: "数据隐私准则", content: "客户数据仅用于本系统内部运营，禁止导出至未授权第三方平台，符合 GDPR 要求。" },
  { id: "p4", title: "AI 内容审核", content: "AI 生成内容发布前须经人工审核，确保品牌调性一致且不包含违规信息。" },
]

export const platformAccounts = [
  { id: "tiktok", platform: "TikTok", accountName: "@novatech_energy", status: "已连接", apiKey: "ttk_****_8a2f", updatedAt: "2024-12-01" },
  { id: "instagram", platform: "Instagram", accountName: "@novatech.global", status: "已连接", apiKey: "ig_****_c4d1", updatedAt: "2024-11-28" },
  { id: "facebook", platform: "Facebook", accountName: "NovaTech Energy", status: "已连接", apiKey: "fb_****_77e3", updatedAt: "2024-11-20" },
  { id: "youtube", platform: "YouTube", accountName: "NovaTech Official", status: "已连接", apiKey: "yt_****_b9a2", updatedAt: "2024-11-15" },
  { id: "linkedin", platform: "LinkedIn", accountName: "NovaTech Energy", status: "未连接", apiKey: "", updatedAt: "" },
  { id: "twitter", platform: "X / Twitter", accountName: "@novatech_en", status: "已连接", apiKey: "tw_****_3f8c", updatedAt: "2024-10-30" },
]

export const contentSpec = {
  primaryColor: "#1d4ed8",
  secondaryColor: "#f59e0b",
  fontHeading: "Inter / Montserrat",
  fontBody: "Inter / Noto Sans",
  logoUsage: "Logo 最小使用尺寸 32px，须保留安全区域（Logo 高度的 0.25 倍），不可拉伸变形。",
  aiStyleConstraints: [
    "语气专业但易于理解，避免过度技术术语",
    "强调节能环保与经济效益双重价值",
    "每条内容结尾包含明确行动号召（CTA）",
    "多语言内容须经母语审校后发布",
  ],
}

export const budgetConfig = [
  { id: "tiktok", platform: "TikTok", monthlyBudget: 12000, spent: 8640, currency: "USD" },
  { id: "instagram", platform: "Instagram", monthlyBudget: 8000, spent: 5120, currency: "USD" },
  { id: "facebook", platform: "Facebook", monthlyBudget: 6000, spent: 4800, currency: "USD" },
  { id: "youtube", platform: "YouTube", monthlyBudget: 5000, spent: 2100, currency: "USD" },
  { id: "linkedin", platform: "LinkedIn", monthlyBudget: 3000, spent: 0, currency: "USD" },
]

export const salesStages = [
  { id: "s1", order: 1, name: "潜在客户", description: "完成首次接触，建立初步意向", rule: "首次询盘 / 官网注册" },
  { id: "s2", order: 2, name: "意向客户", description: "明确产品需求，进入报价沟通", rule: "查看产品页 ≥3 次 / 主动询价" },
  { id: "s3", order: 3, name: "商机客户", description: "报价已发出，等待决策", rule: "已发送正式报价单" },
  { id: "s4", order: 4, name: "成交客户", description: "合同签署或首单已支付", rule: "收到首付款确认" },
  { id: "s5", order: 5, name: "复购客户", description: "完成至少 2 次以上采购", rule: "第二次订单支付完成" },
]

export const customerTierRules = [
  { tier: "高意向", color: "green", criteria: ["主动询价 ≥2 次", "访问产品页 ≥5 次", "查看报价页", "来自重点市场（DE/FR/NL）"] },
  { tier: "中意向", color: "amber", criteria: ["主动询价 1 次", "访问产品页 2–4 次", "点击邮件链接"] },
  { tier: "低意向", color: "red", criteria: ["仅访问首页", "无主动询价", "来自非重点市场"] },
]

export const humanHandoffRules = [
  { id: "h1", trigger: "报价金额 > $10,000", action: "转交资深顾问", enabled: true },
  { id: "h2", trigger: "客户明确要求转人工", action: "立即转接在线顾问", enabled: true },
  { id: "h3", trigger: "同一问题 AI 回复 ≥3 次未解决", action: "转接客服主管", enabled: true },
  { id: "h4", trigger: "投诉关键词检测", action: "转接售后处理团队", enabled: false },
  { id: "h5", trigger: "VIP 客户标识触发", action: "优先转接专属顾问", enabled: true },
]

export const languageConfig = {
  systemLanguage: "中文（简体）",
  contentLanguages: ["德语", "法语", "英语", "荷兰语", "波兰语"],
  defaultAiOutputLanguage: "英语",
}

export const countryConfig = [
  { code: "DE", name: "德国", region: "西欧", enabled: true, defaultLanguage: "德语", defaultCurrency: "EUR", timezone: "UTC+1" },
  { code: "FR", name: "法国", region: "西欧", enabled: true, defaultLanguage: "法语", defaultCurrency: "EUR", timezone: "UTC+1" },
  { code: "NL", name: "荷兰", region: "西欧", enabled: true, defaultLanguage: "荷兰语", defaultCurrency: "EUR", timezone: "UTC+1" },
  { code: "GB", name: "英国", region: "西欧", enabled: true, defaultLanguage: "英语", defaultCurrency: "GBP", timezone: "UTC+0" },
  { code: "PL", name: "波兰", region: "中东欧", enabled: true, defaultLanguage: "波兰语", defaultCurrency: "PLN", timezone: "UTC+1" },
  { code: "US", name: "美国", region: "北美", enabled: false, defaultLanguage: "英语", defaultCurrency: "USD", timezone: "UTC-5" },
  { code: "AU", name: "澳大利亚", region: "大洋洲", enabled: false, defaultLanguage: "英语", defaultCurrency: "USD", timezone: "UTC+10" },
]

export const currencyConfig = [
  { currency: "EUR", symbol: "€", rate: 7.82, primary: true },
  { currency: "USD", symbol: "$", rate: 7.25, primary: false },
  { currency: "GBP", symbol: "£", rate: 9.14, primary: false },
  { currency: "PLN", symbol: "zł", rate: 1.76, primary: false },
  { currency: "CNY", symbol: "¥", rate: 1.0, primary: false },
]

export const paymentChannels = [
  { id: "paypal", name: "PayPal", status: "已配置", merchantId: "PP_NovaTech_****", supportedCurrencies: ["USD", "EUR", "GBP"] },
  { id: "stripe", name: "Stripe", status: "已配置", merchantId: "acct_****_nova", supportedCurrencies: ["USD", "EUR", "GBP", "PLN"] },
  { id: "wise", name: "Wise Business", status: "未配置", merchantId: "", supportedCurrencies: [] },
]

export const carbonStaff = [
  { id: "u1", name: "林启涛", role: "产品战略总监", department: "产品", email: "lin@novatech.com", status: "活跃" },
  { id: "u2", name: "苏晓", role: "品牌营销总监", department: "营销", email: "su@novatech.com", status: "活跃" },
  { id: "u3", name: "何知远", role: "全球销售副总裁", department: "销售", email: "he@novatech.com", status: "活跃" },
  { id: "u4", name: "郑思远", role: "首席增长官 CGO", department: "管理", email: "zheng@novatech.com", status: "活跃" },
  { id: "u5", name: "陈昱", role: "数据平台架构师", department: "技术", email: "chen@novatech.com", status: "活跃" },
  { id: "u6", name: "李维", role: "CRM 系统架构师", department: "技术", email: "li@novatech.com", status: "活跃" },
  { id: "u7", name: "周赫", role: "内容中台负责人", department: "营销", email: "zhou@novatech.com", status: "活跃" },
  { id: "u8", name: "吴昊", role: "数据智能平台总监", department: "技术", email: "wu@novatech.com", status: "离职" },
]

export const siliconStaff = [
  { id: "sage", name: "Sage", title: "经营决策专家", domain: "经营分析", registeredAt: "2024-09-01", status: "在岗", model: "GPT-4o" },
  { id: "atlas", name: "Atlas", title: "市场分析师", domain: "产品开发", registeredAt: "2024-09-01", status: "在岗", model: "Claude 3.5" },
  { id: "muse", name: "Muse", title: "内容创意师", domain: "内容营销", registeredAt: "2024-09-01", status: "在岗", model: "GPT-4o" },
  { id: "echo", name: "Echo", title: "营销客服专家", domain: "销售转化", registeredAt: "2024-09-01", status: "在岗", model: "Claude 3.5" },
]

export const rolePermissions = [
  {
    role: "管理员",
    desc: "全功能访问，含配置中心与员工管理",
    pages: ["超级工作台", "经营分析", "产品开发", "内容营销", "销售转化", "智能中心", "数据中心", "配置中心"],
  },
  {
    role: "运营",
    desc: "内容生产、分发与投放管理",
    pages: ["超级工作台", "经营分析", "内容营销", "数据中心"],
  },
  {
    role: "销售",
    desc: "客户接待、跟进与成交管理",
    pages: ["超级工作台", "经营分析", "销售转化", "数据中心"],
  },
  {
    role: "产品",
    desc: "市场趋势与产品开发机会",
    pages: ["超级工作台", "经营分析", "产品开发", "数据中心"],
  },
]

export const dataVisibilityRules = [
  { id: "dv1", subject: "林启涛（产品总监）", scope: "全部产品数据", level: "全量" },
  { id: "dv2", subject: "苏晓（营销总监）", scope: "内容与渠道数据", level: "部门" },
  { id: "dv3", subject: "何知远（销售副总裁）", scope: "全部客户与订单", level: "全量" },
  { id: "dv4", subject: "销售团队", scope: "自己名下客户数据", level: "个人" },
  { id: "dv5", subject: "运营团队", scope: "内容与投放数据，不含客户隐私", level: "部门" },
]
