/** M6 营销域 API 类型与 mapper（内联，不修改 src/types/index.ts） */

export type SocialPlatform = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK"

export interface SocialAccount {
  id: string
  platform: SocialPlatform
  platformLabel: string
  accountName: string
  authStatus: string
  authStatusLabel: string
  externalRef: string
}

export const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "TIKTOK", label: "TikTok" },
]

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok",
}

const AUTH_STATUS_LABELS: Record<string, string> = {
  CONNECTED: "已连接",
  DISCONNECTED: "未连接",
  PENDING: "待授权",
  EXPIRED: "已过期",
}

export function mapSocialAccount(row: Record<string, unknown>): SocialAccount {
  const platform = String(row.platform || "TIKTOK").toUpperCase() as SocialPlatform
  const authStatus = String(row.authStatus || "DISCONNECTED")
  return {
    id: String(row.id ?? ""),
    platform,
    platformLabel: PLATFORM_LABELS[platform] ?? platform,
    accountName: String(row.accountName || ""),
    authStatus,
    authStatusLabel: AUTH_STATUS_LABELS[authStatus] ?? authStatus,
    externalRef: String(row.externalRef || ""),
  }
}

export interface CampaignCard {
  name: string
  channels: string
  budget: string
  spent: number
  roas: string
  status: string
}

export function mapCampaign(row: Record<string, unknown>): CampaignCard {
  return {
    name: String(row.name || ""),
    channels: String(row.channels || ""),
    budget: String(row.budget || ""),
    spent: Number(row.spentPct ?? 0),
    roas: String(row.roas || ""),
    status: String(row.status || "投放中"),
  }
}
