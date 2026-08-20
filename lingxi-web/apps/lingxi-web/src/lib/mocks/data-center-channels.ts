// Data Center — Channel Master Data (DC-03): 渠道编码、渠道类型、覆盖区域、合作状态

export interface Channel {
  id: string
  code: string
  name: string
  type: "线上电商" | "线下经销" | "直营门店" | "分销代理" | "社交媒体"
  coverageRegion: string
  cooperationStatus: "合作中" | "洽谈中" | "已暂停" | "已终止"
  owner: string
  monthlyGmv: string
  updatedAt: string
}

export const channels: Channel[] = [
  { id: "ch-001", code: "CHN-2001", name: "Amazon 北美站", type: "线上电商", coverageRegion: "北美", cooperationStatus: "合作中", owner: "Michael Chen", monthlyGmv: "$486K", updatedAt: "2024-12-09" },
  { id: "ch-002", code: "CHN-2002", name: "Amazon 欧洲站", type: "线上电商", coverageRegion: "欧洲", cooperationStatus: "合作中", owner: "Anna Weber", monthlyGmv: "$312K", updatedAt: "2024-12-06" },
  { id: "ch-003", code: "CHN-2003", name: "TikTok Shop 东南亚", type: "社交媒体", coverageRegion: "东南亚", cooperationStatus: "合作中", owner: "Wei Tan", monthlyGmv: "$98K", updatedAt: "2024-12-02" },
  { id: "ch-004", code: "CHN-2004", name: "Shopify 独立站", type: "线上电商", coverageRegion: "全球", cooperationStatus: "合作中", owner: "内容营销团队", monthlyGmv: "$156K", updatedAt: "2024-12-11" },
  { id: "ch-005", code: "CHN-2005", name: "Bunnings 澳洲门店联营", type: "线下经销", coverageRegion: "大洋洲", cooperationStatus: "合作中", owner: "Jack Miller", monthlyGmv: "$74K", updatedAt: "2024-11-18" },
  { id: "ch-006", code: "CHN-2006", name: "中东光储集成分销", type: "分销代理", coverageRegion: "中东", cooperationStatus: "合作中", owner: "Omar Al-Farsi", monthlyGmv: "$210K", updatedAt: "2024-12-04" },
  { id: "ch-007", code: "CHN-2007", name: "巴西安装商联盟渠道", type: "分销代理", coverageRegion: "南美", cooperationStatus: "洽谈中", owner: "Carlos Silva", monthlyGmv: "$0", updatedAt: "2024-10-30" },
  { id: "ch-008", code: "CHN-2008", name: "英国直营体验店", type: "直营门店", coverageRegion: "欧洲", cooperationStatus: "合作中", owner: "Emily Clarke", monthlyGmv: "$42K", updatedAt: "2024-11-27" },
  { id: "ch-009", code: "CHN-2009", name: "日本商社批发渠道", type: "分销代理", coverageRegion: "东亚", cooperationStatus: "合作中", owner: "Hiroshi Sato", monthlyGmv: "$268K", updatedAt: "2024-12-10" },
  { id: "ch-010", code: "CHN-2010", name: "Instagram 品牌店铺", type: "社交媒体", coverageRegion: "全球", cooperationStatus: "已暂停", owner: "内容营销团队", monthlyGmv: "$6K", updatedAt: "2024-08-14" },
  { id: "ch-011", code: "CHN-2011", name: "南非工业渠道", type: "线下经销", coverageRegion: "非洲", cooperationStatus: "已终止", owner: "Thabo Nkosi", monthlyGmv: "$0", updatedAt: "2024-09-05" },
  { id: "ch-012", code: "CHN-2012", name: "eBay 全球店铺", type: "线上电商", coverageRegion: "全球", cooperationStatus: "合作中", owner: "运营团队", monthlyGmv: "$38K", updatedAt: "2024-11-29" },
]
