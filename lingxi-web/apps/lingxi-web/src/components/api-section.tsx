"use client";

export function PageFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[22px]">
      <div>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.02em]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}
