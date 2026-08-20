import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const TONE_TICK: Record<string, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-accent",
  success: "bg-success",
  violet: "bg-violet",
};

const TONE_STROKE: Record<string, string> = {
  primary: "#0E7C86",
  secondary: "#2E6BE6",
  accent: "#F0A91A",
  success: "#3D9A6E",
  violet: "#7A5AC0",
};

export function LxBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "danger" | "accent" | "violet";
}) {
  const tones: Record<string, string> = {
    neutral: "border border-border bg-frost text-slate",
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    accent: "bg-accent-soft text-amber-ink",
    violet: "bg-violet-soft text-violet",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 font-display text-[10.5px] font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function LxChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-card px-3 py-1.5 text-[12.5px] text-slate transition-all duration-150 hover:border-primary-line hover:text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function LxButton({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
}) {
  const variants = {
    primary:
      "rounded-md bg-primary px-[22px] py-[11px] text-sm font-medium text-white hover:bg-primary-deep hover:shadow-primary",
    ghost: "bg-transparent text-slate hover:bg-frost hover:text-ink",
    outline:
      "rounded-md border border-border-strong bg-card text-slate hover:border-primary-line hover:text-primary",
  };
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-1.5 font-display transition-all duration-150 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-line disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Sparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const w = 120;
  const h = 18;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(max - min, 1);
  const pts = data
    .map((v, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="mt-2 h-[18px] w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LxKpi({
  label,
  value,
  hint,
  delta,
  tone = "primary",
  spark,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  tone?: "primary" | "secondary" | "accent" | "success" | "violet";
  spark?: number[];
}) {
  const up = delta?.startsWith("+");
  const dn = delta?.startsWith("-");
  const sparkData =
    spark && spark.length > 1
      ? spark
      : [8, 10, 9, 12, 11, 14, 13, 16, 15];
  return (
    <div className="glass cursor-pointer px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-pop">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted">
        <span className={cx("h-[11px] w-[3px] shrink-0 rounded-sm", TONE_TICK[tone])} />
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] num">
        {value}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
        {hint ? <span className="font-display font-semibold num">{hint}</span> : null}
        {delta ? (
          <span
            className={cx(
              "rounded-full px-1.5 py-px font-display text-[10.5px] font-semibold num",
              up && "bg-success-soft text-success",
              dn && "bg-danger-soft text-danger",
              !up && !dn && "bg-frost text-slate",
            )}
          >
            {delta}
          </span>
        ) : null}
      </div>
      <Sparkline data={sparkData} color={TONE_STROKE[tone]} />
    </div>
  );
}

export function LxAgentCard({
  name,
  role,
  task,
  progress,
  metaLeftLabel,
  metaLeftValue,
  metaRightLabel,
  metaRightValue,
  grade = "gold",
  busy,
  barTone,
  gradient,
  icon,
}: {
  name: string;
  role: string;
  task: string;
  progress: number;
  metaLeftLabel: string;
  metaLeftValue: string;
  metaRightLabel: string;
  metaRightValue: string;
  grade?: "gold" | "silver" | "bronze";
  busy?: boolean;
  barTone?: "good" | "normal" | "warn";
  gradient: string;
  icon: ReactNode;
}) {
  const gradeClass =
    grade === "gold"
      ? "bg-accent-soft text-amber-ink"
      : grade === "silver"
        ? "border border-border bg-frost text-muted"
        : "bg-bronze-bg text-bronze-ink";
  const barClass =
    barTone ?? (progress >= 70 ? "good" : progress >= 50 ? "normal" : "warn");
  return (
    <div
      className={cx(
        "relative z-[1] cursor-pointer rounded-md border border-border bg-frost p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-line hover:shadow-pop",
        busy &&
          "border-primary-line bg-[linear-gradient(0deg,var(--color-primary-soft),var(--color-frost))]",
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] text-white shadow-agent"
          style={{ background: gradient }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-ink">{name}</div>
          <div className="text-[10.5px] text-muted">{role}</div>
        </div>
        <span
          className={cx(
            "rounded-full px-1.5 py-0.5 font-display text-[9.5px] font-bold tracking-[0.06em]",
            gradeClass,
          )}
        >
          {grade === "gold" ? "金牌" : grade === "silver" ? "银牌" : "铜牌"}
        </span>
      </div>
      <div className="mt-[11px] text-[12px] leading-[1.5] text-slate">{task}</div>
      <div className="mt-[9px] flex items-center gap-2">
        <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-border">
          <i
            className={cx(
              "block h-full rounded-full",
              barClass === "good" &&
                "bg-[linear-gradient(90deg,var(--color-success),var(--color-primary))]",
              barClass === "warn" &&
                "bg-[linear-gradient(90deg,#F0A91A,#E4644C)]",
              barClass === "normal" &&
                "bg-[linear-gradient(90deg,var(--color-primary),var(--color-secondary))]",
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <span className="font-display text-[11px] font-semibold text-slate num">
          {progress}%
        </span>
      </div>
      <div className="mt-2.5 flex justify-between border-t border-dashed border-border pt-2.5 text-[11px] text-muted">
        <span>
          {metaLeftLabel}{" "}
          <b className="font-display font-semibold text-ink num">{metaLeftValue}</b>
        </span>
        <span>
          {metaRightLabel}{" "}
          <b className="font-display font-semibold text-ink num">{metaRightValue}</b>
        </span>
      </div>
    </div>
  );
}

export function LxInsightCard({
  tag,
  body,
  source,
  accent = "accent",
  avatarColor,
  avatar,
}: {
  tag: string;
  body: string;
  source: string;
  accent?: "accent" | "success" | "primary" | "secondary";
  avatarColor: string;
  avatar: ReactNode;
}) {
  const border: Record<string, string> = {
    accent: "border-l-accent",
    success: "border-l-success",
    primary: "border-l-primary",
    secondary: "border-l-secondary",
  };
  return (
    <div
      className={cx(
        "glass cursor-pointer border-l-[3px] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop",
        border[accent],
      )}
    >
      <div className="text-[11px] font-medium text-muted">{tag}</div>
      <div className="mt-1.5 text-[13.5px] font-medium leading-[1.55] text-ink">{body}</div>
      <div className="mt-2.5 flex items-center gap-2">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-[7px] text-white"
          style={{ background: avatarColor }}
        >
          {avatar}
        </span>
        <span className="text-[11.5px] text-muted">{source}</span>
      </div>
    </div>
  );
}

export function LxTable({
  columns,
  rows,
  empty = "暂无数据",
  toolbar,
}: {
  columns: {
    key: string;
    title: string;
    className?: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[];
  rows: Record<string, unknown>[];
  empty?: string;
  toolbar?: ReactNode;
}) {
  return (
    <div className="glass overflow-hidden">
      {toolbar ? (
        <div className="flex items-center gap-2.5 border-b border-border px-[18px] py-3.5">
          {toolbar}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-frost/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cx(
                    "whitespace-nowrap px-[18px] py-[11px] text-[11px] font-medium text-muted",
                    c.className,
                  )}
                >
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-[18px] py-10 text-center text-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={String(row.id ?? i)}
                  className="border-b border-border transition-colors last:border-0 hover:bg-frost"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cx("px-[18px] py-[13px] text-[13px] text-ink", c.className)}
                    >
                      {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LxPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function LxSection({
  title,
  hint,
  children,
  action,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="flex flex-col">
      <div className="mb-3 flex items-baseline gap-2.5">
        <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
        {hint ? <span className="text-[12px] text-muted">{hint}</span> : null}
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function LxEmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="glass px-6 py-10 text-center">
      <div className="font-display text-[15px] font-semibold text-ink">{title}</div>
      {detail ? <p className="mt-2 text-[13px] text-muted">{detail}</p> : null}
    </div>
  );
}

export function LxLoading() {
  return (
    <div className="glass flex items-center justify-center px-6 py-12 text-[13px] text-muted">
      加载中…
    </div>
  );
}

export function LxError({ message }: { message: string }) {
  return (
    <div className="glass border-danger/30 px-6 py-4 text-[13px] text-danger">{message}</div>
  );
}
