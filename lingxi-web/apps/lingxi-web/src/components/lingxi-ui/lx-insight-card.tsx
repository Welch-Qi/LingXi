import type { ReactNode } from "react"

export type LxInsightAccent = "warning" | "success" | "primary" | "danger"

const accentBorder: Record<LxInsightAccent, string> = {
  warning: "border-l-warning",
  success: "border-l-success",
  primary: "border-l-primary",
  danger: "border-l-danger",
}
const sourceBg: Record<LxInsightAccent, string> = {
  warning: "bg-warning",
  success: "bg-success",
  primary: "bg-primary",
  danger: "bg-danger",
}

export interface LxInsightCardProps {
  category: string
  accent?: LxInsightAccent
  content: string
  sourceIcon: ReactNode
  source: string
  onClick?: () => void
}

export function LxInsightCard({ category, accent = "warning", content, sourceIcon, source, onClick }: LxInsightCardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass border-l-[3px] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop ${accentBorder[accent]} ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="text-[11px] font-medium text-muted-foreground">{category}</div>
      <div className="mt-1.5 text-[13.5px] font-medium leading-[1.55]">{content}</div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className={`flex h-5 w-5 items-center justify-center rounded-[7px] text-white ${sourceBg[accent]}`}>{sourceIcon}</span>
        <span className="text-[11.5px] text-muted-foreground">{source}</span>
      </div>
    </div>
  )
}
