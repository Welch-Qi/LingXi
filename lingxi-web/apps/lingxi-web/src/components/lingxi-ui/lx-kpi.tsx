import type { ReactNode } from "react"
import { Sparkline } from "@/components/lingxi-ui/sparkline"

export type LxKpiColor = "primary" | "info" | "warning" | "success" | "violet"

const tickColorMap: Record<LxKpiColor, string> = {
  primary: "bg-primary",
  info: "bg-info",
  warning: "bg-warning",
  success: "bg-success",
  violet: "bg-violet",
}
const sparkColorMap: Record<LxKpiColor, string> = {
  primary: "#0e7c86",
  info: "#2e6be6",
  warning: "#f0a91a",
  success: "#3d9a6e",
  violet: "#7a5ac0",
}

export interface LxKpiProps {
  label: string
  value: string
  sub?: ReactNode
  trend?: "up" | "dn" | "fl"
  delta?: string
  color?: LxKpiColor
  spark?: number[]
  size?: "default" | "lg"
  onClick?: () => void
}

export function LxKpi({ label, value, sub, trend = "fl", delta, color = "primary", spark, size = "default", onClick }: LxKpiProps) {
  const trendClass = trend === "up" ? "bg-success-soft text-success" : trend === "dn" ? "bg-danger-soft text-danger" : "bg-frost text-slate"

  return (
    <div
      onClick={onClick}
      className={`glass p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-pop ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
        <span className={`h-[11px] w-[3px] shrink-0 rounded-sm ${tickColorMap[color]}`} />
        {label}
      </div>
      <div className={`num mt-1.5 font-display font-bold leading-[1.1] tracking-[-.02em] ${size === "lg" ? "text-[24px]" : "text-2xl"}`}>{value}</div>
      {(sub || delta) && (
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          {sub && <span>{sub}</span>}
          {delta && (
            <span className={`num rounded-full px-1.5 py-px font-display text-[10.5px] font-semibold ${trendClass}`}>{delta}</span>
          )}
        </div>
      )}
      {spark && spark.length > 0 && <Sparkline data={spark} color={sparkColorMap[color]} className="mt-2 h-[18px] w-full" />}
    </div>
  )
}
