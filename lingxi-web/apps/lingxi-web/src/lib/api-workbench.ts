import { apiGet, apiPost } from "@/lib/api"
import { pickRows } from "@/lib/format"
import { dashboardMetrics } from "@/lib/mocks/dashboard"
import type { DashboardMetric } from "@/types"

export interface WorkbenchTask {
  id: string
  bizCode: string
  title: string
  status: string
  taskType: string
  priority: number
  assigneeId: number | null
  dueAt: string | null
  sourceType: string | null
}

export interface WorkbenchInquiry {
  id: string
  bizCode: string
  title: string
  channel: string
  contactName: string
  contactEmail: string
  companyName: string
  status: string
  leadId: string | null
}

export interface WorkbenchDashboard {
  displayName: string
  taskCount: number
  inquiryCount: number
  kpiCount: number
  summary: string
  tasks: WorkbenchTask[]
}

function str(value: unknown): string {
  return value == null ? "" : String(value)
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function mapTask(row: Record<string, unknown>): WorkbenchTask {
  return {
    id: str(row.id ?? row.bizCode),
    bizCode: str(row.bizCode),
    title: str(row.title) || "未命名任务",
    status: str(row.status) || "OPEN",
    taskType: str(row.taskType) || "GENERAL",
    priority: num(row.priority) ?? 50,
    assigneeId: num(row.assigneeId),
    dueAt: row.dueAt == null ? null : str(row.dueAt),
    sourceType: row.sourceType == null ? null : str(row.sourceType),
  }
}

export function mapInquiry(row: Record<string, unknown>): WorkbenchInquiry {
  return {
    id: str(row.id ?? row.bizCode),
    bizCode: str(row.bizCode),
    title: str(row.title) || "新询盘",
    channel: str(row.channel) || "未知渠道",
    contactName: str(row.contactName),
    contactEmail: str(row.contactEmail),
    companyName: str(row.companyName),
    status: str(row.status) || "NEW",
    leadId: row.leadId == null ? null : str(row.leadId),
  }
}

export function mapDashboard(data: Record<string, unknown>): WorkbenchDashboard {
  const embeddedTasks = pickRows(data.tasks).map(mapTask)
  return {
    displayName: str(data.displayName) || "林总",
    taskCount: num(data.taskCount) ?? embeddedTasks.length,
    inquiryCount: num(data.inquiryCount) ?? 0,
    kpiCount: num(data.kpiCount) ?? 0,
    summary: str(data.summary),
    tasks: embeddedTasks,
  }
}

/** Merge real dashboard counts into KPI grid; fall back to mock metrics on missing fields. */
export function mapDashboardMetrics(data: WorkbenchDashboard | null): DashboardMetric[] {
  if (!data) return dashboardMetrics

  const overrides: Record<string, Partial<DashboardMetric>> = {
    newCustomer: { today: String(data.taskCount), label: "待办任务", change: "实时", trend: "fl" },
    profiled: { today: String(data.inquiryCount), label: "未确认询盘", change: "实时", trend: "fl" },
    highIntent: { today: String(data.kpiCount), label: "KPI 指标", change: "实时", trend: "fl" },
  }

  return dashboardMetrics.map((metric) => {
    const patch = overrides[metric.key]
    return patch ? { ...metric, ...patch } : metric
  })
}

export async function fetchWorkbenchDashboard(): Promise<WorkbenchDashboard | null> {
  try {
    const data = await apiGet<Record<string, unknown>>("/workbench/dashboard")
    return mapDashboard(data)
  } catch {
    return null
  }
}

export async function fetchWorkbenchTasks(status?: string): Promise<WorkbenchTask[]> {
  try {
    const query = status ? `?status=${encodeURIComponent(status)}` : ""
    const data = await apiGet<Record<string, unknown>>(`/workbench/tasks${query}`)
    return pickRows(data).map(mapTask)
  } catch {
    return []
  }
}

export async function completeWorkbenchTask(taskId: string): Promise<boolean> {
  try {
    await apiPost(`/workbench/tasks/${encodeURIComponent(taskId)}/complete`)
    return true
  } catch {
    return false
  }
}

export async function fetchWorkbenchInquiries(status?: string): Promise<WorkbenchInquiry[]> {
  try {
    const query = status ? `?status=${encodeURIComponent(status)}` : ""
    const data = await apiGet<Record<string, unknown>>(`/workbench/inquiries${query}`)
    return pickRows(data).map(mapInquiry)
  } catch {
    return []
  }
}

export async function acknowledgeWorkbenchInquiry(inquiryId: string): Promise<boolean> {
  try {
    await apiPost(`/workbench/inquiries/${encodeURIComponent(inquiryId)}/acknowledge`)
    return true
  } catch {
    return false
  }
}

export function formatDueAt(dueAt: string | null): string {
  if (!dueAt) return "无截止时间"
  const date = new Date(dueAt)
  if (Number.isNaN(date.getTime())) return dueAt
  return date.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function taskStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case "OPEN": return "待处理"
    case "IN_PROGRESS": return "进行中"
    case "DONE": return "已完成"
    case "CANCELLED": return "已取消"
    default: return status
  }
}

export function inquiryStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case "NEW": return "新询盘"
    case "ACKED": return "已确认"
    default: return status
  }
}
