import Image from "next/image"
import type { ReactNode } from "react"

export type LxAgentMedal = "金牌" | "银牌" | "铜牌" | "铁牌"
export type LxAgentProgressVariant = "default" | "good" | "warn"

const domainGradient: Record<string, string> = {
  经营分析: "linear-gradient(135deg,#0E7C86,#2E6BE6)",
  产品开发: "linear-gradient(135deg,#2E6BE6,#7A5AC0)",
  内容营销: "linear-gradient(135deg,#F0A91A,#E4644C)",
  销售转化: "linear-gradient(135deg,#3D9A6E,#0E7C86)",
}

const medalClass: Record<LxAgentMedal, string> = {
  金牌: "bg-warning-soft text-amber-ink",
  银牌: "bg-frost text-muted-foreground border border-border",
  铜牌: "bg-bronze-bg text-bronze-ink",
  铁牌: "bg-frost text-muted-foreground border border-border",
}

const progressGradient: Record<LxAgentProgressVariant, string> = {
  default: "linear-gradient(90deg,#0E7C86,#2E6BE6)",
  good: "linear-gradient(90deg,#3D9A6E,#0E7C86)",
  warn: "linear-gradient(90deg,#F0A91A,#E4644C)",
}

export interface LxAgentCardProps {
  icon?: ReactNode
  image?: string
  domain: string
  title: string
  name: string
  medal: LxAgentMedal
  task: string
  progress: number
  progressVariant?: LxAgentProgressVariant
  busy?: boolean
  meta: { label: string; value: string }[]
  actions?: ReactNode
}

export function LxAgentCard({ icon, image, domain, title, name, medal, task, progress, progressVariant = "default", busy, meta, actions }: LxAgentCardProps) {
  return (
    <div
      className={`relative flex flex-col gap-3.5 rounded-md border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-line hover:shadow-pop ${
        busy ? "border-primary-line" : "border-border bg-frost"
      }`}
      style={busy ? { background: "linear-gradient(0deg, var(--color-primary-soft), var(--color-frost))" } : undefined}
    >
      <div className="flex items-start gap-3">
        {image ? (
          <div className="relative size-[38px] shrink-0 overflow-hidden rounded-full shadow-agent ring-2 ring-background">
            <Image unoptimized src={image} alt={`${title} ${name}`} fill className="object-cover object-top" />
            {busy && <span className="absolute inset-0 rounded-full ring-2 ring-primary-line" />}
          </div>
        ) : (
          <div
            className="flex size-[34px] shrink-0 items-center justify-center rounded-[11px] text-white shadow-agent"
            style={{ background: domainGradient[domain] ?? domainGradient["经营分析"] }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-medium leading-tight">{title}</h3>
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 font-display text-[9.5px] font-bold tracking-[.06em] ${medalClass[medal]}`}>{medal}</span>
          </div>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground">{name} · {domain}</p>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-medium">当前任务</span>
          <span className="num text-muted-foreground">{progress}%</span>
        </div>
        <p className="mb-2 text-xs leading-[1.5] text-slate">{task}</p>
        <div className="h-[5px] w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: progressGradient[progressVariant] }} />
        </div>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-3 border-t border-dashed border-border pt-2.5 text-[11px] text-muted-foreground">
        {meta.map((m) => (
          <span key={m.label}>
            {m.label} <b className="num font-display font-semibold text-ink">{m.value}</b>
          </span>
        ))}
      </div>

      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
