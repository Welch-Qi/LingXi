import type { CategoryData, Opportunity } from "@/types"

export const productCategories = ["智能电子", "服装", "玩具", "保健", "体育"] as const
export type ProductCategory = (typeof productCategories)[number]

export const categoryData: Record<ProductCategory, CategoryData> = {
  智能电子: {
    trends: [
      { subCategory: "阳台光储", index: 92, growth: "+43%", series: [42, 47, 53, 61, 70, 79, 88, 92] },
      { subCategory: "便携电源", index: 86, growth: "+31%", series: [38, 42, 48, 55, 62, 71, 80, 86] },
      { subCategory: "智能节水", index: 78, growth: "+26%", series: [30, 35, 41, 48, 56, 64, 72, 78] },
      { subCategory: "宠物智能", index: 71, growth: "+22%", series: [28, 32, 38, 44, 52, 60, 66, 71] },
    ],
    opportunities: [
      { id: "OP-2408", subCategory: "阳台光储", players: [{ name: "Anker SOLIX", share: 28 }, { name: "EcoFlow", share: 22 }, { name: "Zendure", share: 14 }, { name: "其他", share: 36 }], competition: "头部集中度中等，模块化扩容与本地安装服务是主要缺口", painPoints: ["扩容需整机更换", "安装依赖专业电工", "阳台承重与合规不清晰"], pleasurePoints: ["即插即用", "App 家庭负载预测", "静音无风扇"], description: "针对德国阳台光储市场，保留即插即用与家庭能耗可视化的爽点，改进扩容需整机更换、安装复杂的痛点。", feature: "模块化扩容 + 一体化合规安装包", competitiveness: "扩容成本降低 40%，安装工时缩短 60%", score: 92, trend: 92, market: "德国" },
      { id: "OP-2401", subCategory: "便携电源", players: [{ name: "Jackery", share: 31 }, { name: "Bluetti", share: 19 }, { name: "Goal Zero", share: 12 }, { name: "其他", share: 38 }], competition: "价格战激烈，轻量化与静音散热尚有差异化空间", painPoints: ["机身偏重", "满载噪音大", "车载快充慢"], pleasurePoints: ["露营场景适配", "多口快充", "太阳能补电"], description: "面向 Vanlife 人群，保留露营多设备供电爽点，改进机身重、噪音大的痛点。", feature: "轻量石墨烯电芯 + 静音液冷", competitiveness: "同容量减重 25%，噪音低于 32dB", score: 88, trend: 86, market: "法国" },
    ],
    ideas: [
      { id: "ID-31", image: "/images/product-solar.png", name: "FlexGrid Balcony 2K", subCategory: "阳台光储", targetCustomer: "欧洲公寓家庭 / DIY 用户", targetMarket: "德国、荷兰、奥地利", features: ["模块化扩容", "阳台即插即用", "家庭负载预测"], competitor: "Anker SOLIX、EcoFlow", price: "€899", marketSize: "€129M", penetration: "6.8%", stage: "创意" },
      { id: "ID-32", image: "/images/product-power.png", name: "Nomad Power Mini", subCategory: "便携电源", targetCustomer: "Vanlife / 户外露营人群", targetMarket: "法国、西班牙、意大利", features: ["静音液冷", "轻量机身", "车载快充"], competitor: "Jackery、Bluetti", price: "€549", marketSize: "€86M", penetration: "9.2%", stage: "开发" },
      { id: "ID-33", image: "/images/product-smarthome.png", name: "AquaSense Home", subCategory: "智能节水", targetCustomer: "带庭院的独栋家庭", targetMarket: "西班牙、葡萄牙", features: ["天气联动", "分区节水", "耗水分析"], competitor: "Rachio、Gardena", price: "€159", marketSize: "€48M", penetration: "4.5%", stage: "验证" },
    ],
  },
  服装: {
    trends: [
      { subCategory: "户外加热服", index: 84, growth: "+34%", series: [30, 36, 43, 51, 60, 70, 78, 84] },
      { subCategory: "机能通勤", index: 76, growth: "+25%", series: [34, 38, 44, 50, 58, 66, 72, 76] },
      { subCategory: "运动瑜伽", index: 69, growth: "+18%", series: [36, 40, 45, 50, 56, 62, 66, 69] },
    ],
    opportunities: [
      { id: "OP-3301", subCategory: "户外加热服", players: [{ name: "ORORO", share: 26 }, { name: "Venustas", share: 18 }, { name: "Milwaukee", share: 15 }, { name: "其他", share: 41 }], competition: "专业工种品牌主导，日常时尚化与轻薄化是空白", painPoints: ["加热区偏硬", "续航短", "外观工业化"], pleasurePoints: ["快速升温", "分区控温", "可水洗"], description: "面向北欧户外工作者，保留快速升温爽点，改进续航短、外观笨重的痛点。", feature: "石墨烯柔性发热 + 8 小时续航", competitiveness: "升温快 30%，机身减重 20%", score: 83, trend: 84, market: "挪威" },
    ],
    ideas: [
      { id: "ID-41", image: "/images/product-apparel.png", name: "ThermoFlex Pro Jacket", subCategory: "户外加热服", targetCustomer: "户外工种 / 极寒通勤人群", targetMarket: "挪威、瑞典、芬兰", features: ["柔性石墨烯发热", "8 小时续航", "整机可水洗"], competitor: "ORORO、Venustas", price: "€219", marketSize: "€64M", penetration: "5.2%", stage: "创意" },
      { id: "ID-42", image: "/images/product-apparel.png", name: "UrbanShell 机能夹克", subCategory: "机能通勤", targetCustomer: "都市通勤白领", targetMarket: "德国、英国", features: ["三层防水", "隐藏收纳", "反光安全"], competitor: "Arc'teryx、The North Face", price: "€289", marketSize: "€52M", penetration: "3.8%", stage: "开发" },
    ],
  },
  玩具: {
    trends: [
      { subCategory: "STEM 教育", index: 88, growth: "+38%", series: [32, 38, 46, 54, 63, 73, 82, 88] },
      { subCategory: "解压玩具", index: 74, growth: "+21%", series: [36, 40, 46, 52, 59, 66, 71, 74] },
      { subCategory: "亲子桌游", index: 66, growth: "+16%", series: [34, 37, 42, 47, 53, 59, 63, 66] },
    ],
    opportunities: [
      { id: "OP-5501", subCategory: "STEM 教育", players: [{ name: "LEGO", share: 34 }, { name: "Makeblock", share: 16 }, { name: "Sphero", share: 11 }, { name: "其他", share: 39 }], competition: "巨头主导积木，编程可玩性与课程配套仍有机会", painPoints: ["课程零散", "上手门槛高", "复用率低"], pleasurePoints: ["动手编程", "成就反馈", "亲子共玩"], description: "面向 6-12 岁家庭，保留动手编程爽点，改进课程零散、上手难的痛点。", feature: "模块化机器人 + 分龄课程体系", competitiveness: "复购率提升 35%，完课率翻倍", score: 87, trend: 88, market: "美国" },
    ],
    ideas: [
      { id: "ID-51", image: "/images/product-toy.png", name: "BotBlocks 编程机器人", subCategory: "STEM 教育", targetCustomer: "6-12 岁儿童家庭", targetMarket: "美国、加拿大、英国", features: ["模块化拼搭", "图形化编程", "分龄课程"], competitor: "LEGO、Makeblock", price: "$129", marketSize: "$142M", penetration: "7.1%", stage: "创意" },
      { id: "ID-52", image: "/images/product-toy.png", name: "SensoryCube 解压方块", subCategory: "解压玩具", targetCustomer: "青少年 / 上班族", targetMarket: "美国、德国", features: ["多重触感", "静音操作", "口袋便携"], competitor: "Fidget Cube", price: "$24", marketSize: "$38M", penetration: "9.6%", stage: "验证" },
    ],
  },
  保健: {
    trends: [
      { subCategory: "筋膜按摩", index: 82, growth: "+29%", series: [34, 39, 45, 52, 60, 68, 76, 82] },
      { subCategory: "睡眠健康", index: 77, growth: "+24%", series: [32, 36, 42, 49, 57, 65, 72, 77] },
      { subCategory: "体态矫正", index: 68, growth: "+17%", series: [34, 38, 43, 48, 54, 60, 65, 68] },
    ],
    opportunities: [
      { id: "OP-6601", subCategory: "筋膜按摩", players: [{ name: "Theragun", share: 29 }, { name: "Hyperice", share: 21 }, { name: "Bob and Brad", share: 13 }, { name: "其他", share: 37 }], competition: "高端品牌溢价高，智能化与静音是中端突破口", painPoints: ["噪音大", "缺乏个性方案", "续航一般"], pleasurePoints: ["深层放松", "多档位", "便携"], description: "面向居家健身人群，保留深层放松爽点，改进噪音大、方案单一的痛点。", feature: "AI 力度识别 + 静音无刷电机", competitiveness: "噪音降低 45%，方案个性化", score: 84, trend: 82, market: "美国" },
    ],
    ideas: [
      { id: "ID-61", image: "/images/product-health.png", name: "PulseCare AI 筋膜枪", subCategory: "筋膜按摩", targetCustomer: "居家健身 / 康复人群", targetMarket: "美国、德国、日本", features: ["AI 力度识别", "静音无刷", "12 档位"], competitor: "Theragun、Hyperice", price: "$189", marketSize: "$96M", penetration: "6.3%", stage: "创意" },
      { id: "ID-62", image: "/images/product-health.png", name: "SleepWave 睡眠仪", subCategory: "睡眠健康", targetCustomer: "失眠 / 高压人群", targetMarket: "美国、英国", features: ["脑波助眠", "白噪音", "睡眠报告"], competitor: "Dodow、Hatch", price: "$149", marketSize: "$72M", penetration: "4.9%", stage: "开发" },
    ],
  },
  体育: {
    trends: [
      { subCategory: "居家健身", index: 85, growth: "+33%", series: [32, 37, 44, 52, 61, 70, 79, 85] },
      { subCategory: "智能跳绳", index: 73, growth: "+23%", series: [34, 38, 44, 50, 57, 64, 70, 73] },
      { subCategory: "户外骑行", index: 67, growth: "+15%", series: [36, 39, 44, 49, 54, 60, 64, 67] },
    ],
    opportunities: [
      { id: "OP-7701", subCategory: "居家健身", players: [{ name: "Tonal", share: 24 }, { name: "Bowflex", share: 19 }, { name: "Tempo", share: 12 }, { name: "其他", share: 45 }], competition: "大件器械主导，轻量智能训练设备仍有空间", painPoints: ["占地大", "价格高", "训练枯燥"], pleasurePoints: ["数据反馈", "省空间", "课程互动"], description: "面向小户型健身人群，保留数据反馈爽点，改进占地大、价格高的痛点。", feature: "便携电子阻力 + 互动课程", competitiveness: "占地减少 80%，价格仅为大件 1/5", score: 83, trend: 85, market: "美国" },
    ],
    ideas: [
      { id: "ID-71", image: "/images/product-sports.png", name: "FlexTrain 智能阻力器", subCategory: "居家健身", targetCustomer: "小户型健身爱好者", targetMarket: "美国、德国、澳大利亚", features: ["电子阻力", "力量数据", "互动课程"], competitor: "Tonal、Tempo", price: "$299", marketSize: "$118M", penetration: "5.6%", stage: "创意" },
      { id: "ID-72", image: "/images/product-sports.png", name: "PaceRope 智能跳绳", subCategory: "智能跳绳", targetCustomer: "都市减脂人群", targetMarket: "美国、英国、日本", features: ["计数传感", "卡路里统计", "App 挑战"], competitor: "Tangram", price: "$49", marketSize: "$44M", penetration: "8.3%", stage: "验证" },
    ],
  },
}

export const opportunities: Opportunity[] = [
  { id: "OP-2408", keyword: "Balcony Solar Storage", market: "德国", category: "户外储能", trend: 86, score: 92, evidence: "搜索量 4 周增长 43%，头部商品缺少模块化扩容能力。", status: "优先验证", updatedAt: "今天 10:36" },
]
