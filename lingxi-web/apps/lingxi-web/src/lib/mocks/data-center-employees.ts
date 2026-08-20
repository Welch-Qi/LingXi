// Data Center — Employee Master Data (DC-04): 员工编码、姓名、组织架构、角色、岗位、在职状态

export interface Employee {
  id: string
  code: string
  name: string
  department: string
  role: "管理员" | "业务负责人" | "普通员工"
  position: string
  employmentStatus: "在职" | "试用期" | "离职"
  email: string
  joinDate: string
  updatedAt: string
}

export const employees: Employee[] = [
  { id: "em-001", code: "EMP-30001", name: "陈曦", department: "NovaTech 出海事业部 / 管理层", role: "管理员", position: "CEO", employmentStatus: "在职", email: "chen.xi@novatech.com", joinDate: "2019-03-01", updatedAt: "2024-12-01" },
  { id: "em-002", code: "EMP-30002", name: "林悦", department: "NovaTech 出海事业部 / 市场部", role: "业务负责人", position: "市场总监", employmentStatus: "在职", email: "lin.yue@novatech.com", joinDate: "2020-06-15", updatedAt: "2024-11-20" },
  { id: "em-003", code: "EMP-30003", name: "王浩", department: "NovaTech 出海事业部 / 销售部", role: "业务负责人", position: "销售总监", employmentStatus: "在职", email: "wang.hao@novatech.com", joinDate: "2020-09-01", updatedAt: "2024-12-05" },
  { id: "em-004", code: "EMP-30004", name: "赵敏", department: "NovaTech 出海事业部 / 内容营销组", role: "普通员工", position: "内容运营专员", employmentStatus: "在职", email: "zhao.min@novatech.com", joinDate: "2022-04-11", updatedAt: "2024-11-15" },
  { id: "em-005", code: "EMP-30005", name: "刘洋", department: "NovaTech 出海事业部 / 销售部", role: "普通员工", position: "海外销售代表", employmentStatus: "在职", email: "liu.yang@novatech.com", joinDate: "2021-11-08", updatedAt: "2024-12-08" },
  { id: "em-006", code: "EMP-30006", name: "孙婷", department: "NovaTech 出海事业部 / 产品部", role: "业务负责人", position: "产品经理", employmentStatus: "在职", email: "sun.ting@novatech.com", joinDate: "2021-02-20", updatedAt: "2024-11-28" },
  { id: "em-007", code: "EMP-30007", name: "周杰", department: "NovaTech 出海事业部 / 数据与技术组", role: "普通员工", position: "数据分析师", employmentStatus: "在职", email: "zhou.jie@novatech.com", joinDate: "2023-01-16", updatedAt: "2024-12-02" },
  { id: "em-008", code: "EMP-30008", name: "吴佳", department: "NovaTech 出海事业部 / 客户服务组", role: "普通员工", position: "客户成功专员", employmentStatus: "试用期", email: "wu.jia@novatech.com", joinDate: "2024-10-14", updatedAt: "2024-12-10" },
  { id: "em-009", code: "EMP-30009", name: "郑宇", department: "NovaTech 出海事业部 / 市场部", role: "普通员工", position: "增长营销专员", employmentStatus: "在职", email: "zheng.yu@novatech.com", joinDate: "2022-08-01", updatedAt: "2024-11-19" },
  { id: "em-010", code: "EMP-30010", name: "何静", department: "NovaTech 出海事业部 / 销售部", role: "普通员工", position: "渠道经理", employmentStatus: "在职", email: "he.jing@novatech.com", joinDate: "2020-12-03", updatedAt: "2024-11-30" },
  { id: "em-011", code: "EMP-30011", name: "马超", department: "NovaTech 出海事业部 / 数据与技术组", role: "普通员工", position: "系统工程师", employmentStatus: "离职", email: "ma.chao@novatech.com", joinDate: "2020-05-18", updatedAt: "2024-09-01" },
  { id: "em-012", code: "EMP-30012", name: "杨帆", department: "NovaTech 出海事业部 / 内容营销组", role: "普通员工", position: "多语言内容专员", employmentStatus: "在职", email: "yang.fan@novatech.com", joinDate: "2023-05-22", updatedAt: "2024-12-06" },
]
