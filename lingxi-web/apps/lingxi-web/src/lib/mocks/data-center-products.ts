// Data Center — Product Master Data (DC-02): SKU、品名、规格、品牌、分类、HS编码、多语言信息
// Migrated from the "AI 智能硬件平台" admin console (structure preserved, data localized to NovaTech energy-storage domain)

export interface ProductCategory {
  id: string
  name: string
  description: string
  icon: string
  sortOrder: number
  status: "启用" | "停用"
}

export const productCategories: ProductCategory[] = [
  { id: "cat-home", name: "家用储能系统", description: "面向家庭用户的一体化储能与光伏配套方案", icon: "🏠", sortOrder: 1, status: "启用" },
  { id: "cat-portable", name: "便携式电源", description: "户外与应急场景的移动储能设备", icon: "🔋", sortOrder: 2, status: "启用" },
  { id: "cat-commercial", name: "商用储能柜", description: "工商业场景的大容量储能柜与并网设备", icon: "🏭", sortOrder: 3, status: "启用" },
  { id: "cat-solar", name: "太阳能配件", description: "光伏板、控制器与安装配件", icon: "☀️", sortOrder: 4, status: "启用" },
  { id: "cat-smart", name: "智能配件与传感器", description: "能耗监测、智能开关与配套传感设备", icon: "📡", sortOrder: 5, status: "启用" },
  { id: "cat-legacy", name: "旧款配件（停产）", description: "已停产型号的配套备件，仅供存量客户维保", icon: "📦", sortOrder: 6, status: "停用" },
]

export interface Product {
  id: string
  name: string
  nameEn: string
  sku: string
  brand: string
  hsCode: string
  categoryId: string
  price: number
  currency: string
  stock: number
  status: "在售" | "下架" | "草稿"
  image: string
  shortDescription: string
  specs: { label: string; value: string }[]
  updatedAt: string
}

export const products: Product[] = [
  {
    id: "p-001",
    name: "NovaHome 10 家用储能一体机",
    nameEn: "NovaHome 10 Home ESS",
    sku: "NH10-2024",
    brand: "NovaTech",
    hsCode: "8507.60",
    categoryId: "cat-home",
    price: 3299,
    currency: "USD",
    stock: 128,
    status: "在售",
    image: "/images/agent-analyst.png",
    shortDescription: "10kWh 容量，支持光伏并网与离网双模式，APP 远程监控。",
    specs: [
      { label: "电池容量", value: "10 kWh" },
      { label: "额定功率", value: "5 kW" },
      { label: "循环寿命", value: "6000 次" },
      { label: "保修年限", value: "10 年" },
    ],
    updatedAt: "2024-12-02",
  },
  {
    id: "p-002",
    name: "NovaHome 15 Plus 大容量储能",
    nameEn: "NovaHome 15 Plus High-Capacity ESS",
    sku: "NH15P-2024",
    brand: "NovaTech",
    hsCode: "8507.60",
    categoryId: "cat-home",
    price: 4599,
    currency: "USD",
    stock: 64,
    status: "在售",
    image: "/images/agent-analyst.png",
    shortDescription: "15kWh 大容量版本，可扩展至 30kWh，适合中大型家庭。",
    specs: [
      { label: "电池容量", value: "15 kWh" },
      { label: "额定功率", value: "7.6 kW" },
      { label: "循环寿命", value: "6000 次" },
      { label: "保修年限", value: "10 年" },
    ],
    updatedAt: "2024-11-18",
  },
  {
    id: "p-003",
    name: "PowerGo 600 便携电源",
    nameEn: "PowerGo 600 Portable Power Station",
    sku: "PG600-2024",
    brand: "PowerGo",
    hsCode: "8507.60",
    categoryId: "cat-portable",
    price: 599,
    currency: "USD",
    stock: 342,
    status: "在售",
    image: "/images/agent-market.png",
    shortDescription: "600W 输出，599Wh 容量，露营与应急场景首选。",
    specs: [
      { label: "容量", value: "599 Wh" },
      { label: "输出功率", value: "600 W" },
      { label: "重量", value: "6.8 kg" },
      { label: "充满时间", value: "1.5 h（AC）" },
    ],
    updatedAt: "2024-12-05",
  },
  {
    id: "p-004",
    name: "PowerGo 1200 Pro 便携电源",
    nameEn: "PowerGo 1200 Pro Portable Power Station",
    sku: "PG1200P-2024",
    brand: "PowerGo",
    hsCode: "8507.60",
    categoryId: "cat-portable",
    price: 999,
    currency: "USD",
    stock: 156,
    status: "在售",
    image: "/images/agent-market.png",
    shortDescription: "1200W 输出，支持双向快充，配套太阳能板可扩展。",
    specs: [
      { label: "容量", value: "1024 Wh" },
      { label: "输出功率", value: "1200 W" },
      { label: "重量", value: "11.5 kg" },
      { label: "充满时间", value: "1 h（AC）" },
    ],
    updatedAt: "2024-11-22",
  },
  {
    id: "p-005",
    name: "CommCube 50 商用储能柜",
    nameEn: "CommCube 50 Commercial ESS Cabinet",
    sku: "CC50-2024",
    brand: "CommCube",
    hsCode: "8507.60",
    categoryId: "cat-commercial",
    price: 18999,
    currency: "USD",
    stock: 12,
    status: "在售",
    image: "/images/agent-sales.png",
    shortDescription: "50kWh 商用级储能柜，支持多机并联与智能调度。",
    specs: [
      { label: "电池容量", value: "50 kWh" },
      { label: "额定功率", value: "25 kW" },
      { label: "防护等级", value: "IP65" },
      { label: "保修年限", value: "8 年" },
    ],
    updatedAt: "2024-10-30",
  },
  {
    id: "p-006",
    name: "CommCube 100 商用储能柜",
    nameEn: "CommCube 100 Commercial ESS Cabinet",
    sku: "CC100-2024",
    brand: "CommCube",
    hsCode: "8507.60",
    categoryId: "cat-commercial",
    price: 32999,
    currency: "USD",
    stock: 5,
    status: "在售",
    image: "/images/agent-sales.png",
    shortDescription: "100kWh 大容量商用储能柜，工商业峰谷调节首选。",
    specs: [
      { label: "电池容量", value: "100 kWh" },
      { label: "额定功率", value: "50 kW" },
      { label: "防护等级", value: "IP65" },
      { label: "保修年限", value: "8 年" },
    ],
    updatedAt: "2024-09-15",
  },
  {
    id: "p-007",
    name: "SunPanel 400 单晶硅光伏板",
    nameEn: "SunPanel 400 Monocrystalline Solar Panel",
    sku: "SP400-2024",
    brand: "SunPanel",
    hsCode: "8541.43",
    categoryId: "cat-solar",
    price: 189,
    currency: "USD",
    stock: 890,
    status: "在售",
    image: "/images/agent-analyst.png",
    shortDescription: "400W 单晶硅光伏板，转换效率 21.5%，适配主流储能设备。",
    specs: [
      { label: "输出功率", value: "400 W" },
      { label: "转换效率", value: "21.5%" },
      { label: "尺寸", value: "1722×1134×30 mm" },
      { label: "保修年限", value: "25 年" },
    ],
    updatedAt: "2024-11-08",
  },
  {
    id: "p-008",
    name: "SmartMeter Pro 能耗监测终端",
    nameEn: "SmartMeter Pro Energy Monitor",
    sku: "SM-PRO-2024",
    brand: "SmartMeter",
    hsCode: "9028.30",
    categoryId: "cat-smart",
    price: 129,
    currency: "USD",
    stock: 456,
    status: "在售",
    image: "/images/agent-content.png",
    shortDescription: "实时监测家庭用电与光伏发电数据，APP 联动告警。",
    specs: [
      { label: "监测精度", value: "±1%" },
      { label: "连接方式", value: "Wi-Fi / Zigbee" },
      { label: "适配电压", value: "110–240 V" },
      { label: "保修年限", value: "2 年" },
    ],
    updatedAt: "2024-12-10",
  },
  {
    id: "p-009",
    name: "NovaHome 8 家用储能（老款）",
    nameEn: "NovaHome 8 Home ESS (Legacy)",
    sku: "NH8-2022",
    brand: "NovaTech",
    hsCode: "8507.60",
    categoryId: "cat-home",
    price: 2799,
    currency: "USD",
    stock: 0,
    status: "下架",
    image: "/images/agent-analyst.png",
    shortDescription: "已被 NovaHome 10 替代，停止销售仅保留维保备件。",
    specs: [
      { label: "电池容量", value: "8 kWh" },
      { label: "额定功率", value: "4 kW" },
      { label: "循环寿命", value: "4000 次" },
      { label: "保修年限", value: "8 年" },
    ],
    updatedAt: "2024-06-01",
  },
  {
    id: "p-010",
    name: "CommCube 200 商用储能柜（预售）",
    nameEn: "CommCube 200 Commercial ESS Cabinet (Pre-order)",
    sku: "CC200-2025",
    brand: "CommCube",
    hsCode: "8507.60",
    categoryId: "cat-commercial",
    price: 58999,
    currency: "USD",
    stock: 0,
    status: "草稿",
    image: "/images/agent-sales.png",
    shortDescription: "200kWh 新一代商用储能柜，预计 2025Q2 上市，详情待完善。",
    specs: [
      { label: "电池容量", value: "200 kWh" },
      { label: "额定功率", value: "100 kW" },
      { label: "防护等级", value: "待定" },
      { label: "保修年限", value: "待定" },
    ],
    updatedAt: "2024-12-12",
  },
]
