// Data Center — Customer Master Data (DC-01): 客户编码、名称、类型、国家区域、行业、规模、信用等级

export interface Customer {
  id: string
  code: string
  name: string
  nameEn: string
  type: "终端客户" | "代理商" | "经销商" | "战略伙伴"
  country: string
  region: string
  industry: string
  scale: "大型" | "中型" | "小型"
  creditRating: "AAA" | "AA" | "A" | "BBB" | "BB"
  status: "合作中" | "潜在客户" | "暂停合作" | "已终止"
  contactPerson: string
  email: string
  updatedAt: string
}

export const customers: Customer[] = [
  {
    id: "cu-001", code: "CUS-10001", name: "北美绿电零售集团", nameEn: "NorthGrid Retail Energy Group",
    type: "战略伙伴", country: "美国", region: "北美", industry: "能源零售", scale: "大型",
    creditRating: "AAA", status: "合作中", contactPerson: "Michael Chen", email: "michael.chen@northgrid.com", updatedAt: "2024-12-08",
  },
  {
    id: "cu-002", code: "CUS-10002", name: "德国阳光家居连锁", nameEn: "SonnenHaus Retail GmbH",
    type: "经销商", country: "德国", region: "欧洲", industry: "家居零售", scale: "中型",
    creditRating: "AA", status: "合作中", contactPerson: "Anna Weber", email: "a.weber@sonnenhaus.de", updatedAt: "2024-12-01",
  },
  {
    id: "cu-003", code: "CUS-10003", name: "东南亚新能源贸易", nameEn: "SEA NewEnergy Trading",
    type: "代理商", country: "新加坡", region: "东南亚", industry: "能源贸易", scale: "中型",
    creditRating: "A", status: "合作中", contactPerson: "Wei Tan", email: "wei.tan@seanewenergy.sg", updatedAt: "2024-11-20",
  },
  {
    id: "cu-004", code: "CUS-10004", name: "澳洲户外装备连锁", nameEn: "OutbackGear Australia",
    type: "经销商", country: "澳大利亚", region: "大洋洲", industry: "户外零售", scale: "中型",
    creditRating: "AA", status: "合作中", contactPerson: "Jack Miller", email: "jack@outbackgear.au", updatedAt: "2024-11-15",
  },
  {
    id: "cu-005", code: "CUS-10005", name: "中东光储集成商", nameEn: "Gulf Solar Integration LLC",
    type: "战略伙伴", country: "阿联酋", region: "中东", industry: "系统集成", scale: "大型",
    creditRating: "AAA", status: "合作中", contactPerson: "Omar Al-Farsi", email: "omar@gulfsolar.ae", updatedAt: "2024-12-05",
  },
  {
    id: "cu-006", code: "CUS-10006", name: "巴西太阳能安装商联盟", nameEn: "Aliança Solar Brasil",
    type: "代理商", country: "巴西", region: "南美", industry: "工程安装", scale: "小型",
    creditRating: "BBB", status: "潜在客户", contactPerson: "Carlos Silva", email: "carlos@aliancasolar.com.br", updatedAt: "2024-10-28",
  },
  {
    id: "cu-007", code: "CUS-10007", name: "英国家庭能源顾问", nameEn: "UK HomeEnergy Advisors",
    type: "终端客户", country: "英国", region: "欧洲", industry: "能源咨询", scale: "小型",
    creditRating: "A", status: "合作中", contactPerson: "Emily Clarke", email: "emily@ukhomeenergy.co.uk", updatedAt: "2024-11-30",
  },
  {
    id: "cu-008", code: "CUS-10008", name: "日本商社能源事业部", nameEn: "Japan Trading Energy Division",
    type: "战略伙伴", country: "日本", region: "东亚", industry: "综合商社", scale: "大型",
    creditRating: "AAA", status: "合作中", contactPerson: "Hiroshi Sato", email: "sato@jtenergy.co.jp", updatedAt: "2024-12-10",
  },
  {
    id: "cu-009", code: "CUS-10009", name: "南非工业储能承包商", nameEn: "SA Industrial Storage Contractors",
    type: "经销商", country: "南非", region: "非洲", industry: "工业工程", scale: "中型",
    creditRating: "BB", status: "暂停合作", contactPerson: "Thabo Nkosi", email: "thabo@saisc.co.za", updatedAt: "2024-09-10",
  },
  {
    id: "cu-010", code: "CUS-10010", name: "加拿大离网系统经销", nameEn: "Canada Off-Grid Systems",
    type: "经销商", country: "加拿大", region: "北美", industry: "离网系统", scale: "小型",
    creditRating: "A", status: "合作中", contactPerson: "Sarah Johnson", email: "sarah@caoffgrid.ca", updatedAt: "2024-11-25",
  },
  {
    id: "cu-011", code: "CUS-10011", name: "法国零售能源联盟", nameEn: "Alliance Énergie Retail France",
    type: "经销商", country: "法国", region: "欧洲", industry: "能源零售", scale: "中型",
    creditRating: "AA", status: "潜在客户", contactPerson: "Pierre Dubois", email: "pierre@energiefr.com", updatedAt: "2024-10-05",
  },
  {
    id: "cu-012", code: "CUS-10012", name: "印度太阳能项目开发商", nameEn: "India Solar Projects Ltd.",
    type: "战略伙伴", country: "印度", region: "南亚", industry: "项目开发", scale: "大型",
    creditRating: "A", status: "已终止", contactPerson: "Raj Kumar", email: "raj@indiasolarprojects.in", updatedAt: "2024-07-12",
  },
]
