"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cx } from "@lingxi/ui";

export function DomainBanner({
  title,
  detail,
  href,
  linkLabel = "查看详情 →",
  icon,
  tone = "primary",
}: {
  title: string;
  detail: string;
  href?: string;
  linkLabel?: string;
  icon: ReactNode;
  tone?: "primary" | "accent" | "success" | "secondary";
}) {
  const tones = {
    primary:
      "border-primary-line bg-[linear-gradient(120deg,var(--color-primary-soft),var(--color-secondary-soft)_60%,var(--color-accent-soft))]",
    accent:
      "border-[rgba(240,169,26,.25)] bg-[linear-gradient(120deg,var(--color-accent-soft),var(--color-secondary-soft)_70%)]",
    success:
      "border-[rgba(61,154,110,.25)] bg-[linear-gradient(120deg,var(--color-success-soft),var(--color-primary-soft)_70%)]",
    secondary:
      "border-[rgba(46,107,230,.22)] bg-[linear-gradient(120deg,var(--color-secondary-soft),var(--color-violet-soft)_70%)]",
  };
  const iconBg = {
    primary: "bg-[linear-gradient(135deg,#0E7C86,#2E6BE6)] shadow-[0_4px_12px_rgba(14,124,134,.25)]",
    accent: "bg-[linear-gradient(135deg,#F0A91A,#E4644C)]",
    success: "bg-[linear-gradient(135deg,#3D9A6E,#0E7C86)]",
    secondary: "bg-[linear-gradient(135deg,#2E6BE6,#7A5AC0)]",
  };

  return (
    <div className={cx("flex items-center gap-3.5 rounded-lg border px-5 py-4", tones[tone])}>
      <div
        className={cx(
          "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] text-white",
          iconBg[tone],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-ink">{title}</div>
        <div className="mt-0.5 text-[12.5px] text-slate">{detail}</div>
      </div>
      {href ? (
        <Link
          href={href}
          className="ml-auto shrink-0 text-[12.5px] font-medium text-primary hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
