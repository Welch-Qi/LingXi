"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Boxes,
  Building2,
  Check,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { cx } from "@lingxi/ui";
import { beginCasdoorLogin, getAuthMode, rememberWorkspace } from "@/lib/auth";
import {
  ROLE_HOME,
  ROLE_OPTIONS,
  TENANTS,
  type WorkspaceRole,
} from "@/lib/workspace";

const DATA_POINTS = [
  { v: "24/7", l: "业务信号监测" },
  { v: "36", l: "覆盖国家与地区" },
  { v: "1,284", l: "本月业务动作" },
];

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState<WorkspaceRole>("CEO");
  const [tenantId, setTenantId] = useState(TENANTS[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authMode = getAuthMode();
  const tenant = TENANTS.find((t) => t.id === tenantId) ?? TENANTS[0];

  async function enter() {
    setError(null);
    rememberWorkspace(role, tenant.name);
    try {
      sessionStorage.setItem("lingxi.tenantId", tenant.id);
    } catch {
      /* ignore */
    }
    const home = ROLE_HOME[role];
    if (authMode === "casdoor") {
      setBusy(true);
      try {
        await beginCasdoorLogin(home);
      } catch (e: unknown) {
        setBusy(false);
        setError(e instanceof Error ? e.message : String(e));
      }
      return;
    }
    router.push(home);
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <section
        className="relative hidden flex-col overflow-hidden lg:flex"
        style={{ background: "linear-gradient(150deg,#0B1B2B 0%,#0E3A4D 55%,#0E7C86 130%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 500px at 80% -10%,rgba(46,107,230,.35),transparent 60%),radial-gradient(900px 400px at 10% 110%,rgba(14,124,134,.45),transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 flex items-center gap-3 px-10 py-8">
          <div
            className="flex size-9 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg,#2E6BE6,#0E7C86)" }}
          >
            <Boxes className="size-5 text-white" />
          </div>
          <div>
            <div className="font-display text-sm font-bold text-white">Lingxi Brain</div>
            <div className="font-display text-[10px] uppercase tracking-[0.2em] text-white/50">
              Global Growth OS
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-1 items-center px-10 pb-10">
          <div className="max-w-xl">
            <span className="mb-5 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
              企业智能工作系统
            </span>
            <h1 className="max-w-lg text-balance font-display text-[40px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
              把全球增长的每一个信号，变成
              <em className="text-aurora not-italic">可执行</em>
              的业务动作
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/62">
              连接产品洞察、内容营销与销售转化，让团队在统一的数据与任务网络中协同工作。
            </p>
            <div className="mt-9 grid grid-cols-3 gap-3">
              {DATA_POINTS.map((item) => (
                <div
                  key={item.l}
                  className="rounded-md border border-white/14 bg-white/8 p-4 backdrop-blur"
                >
                  <div className="num font-display text-[22px] font-bold text-white">{item.v}</div>
                  <div className="mt-1 text-[10px] text-white/60">{item.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-frost p-6 lg:p-10">
        <div className="w-full max-w-[480px]">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-line bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="size-3.5" />
              安全工作区
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">
              欢迎回来
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              选择企业空间与角色，即刻进入对应工作台。
            </p>
          </div>

          <div className="rounded-[20px] bg-card-solid p-10 pb-8 shadow-pop">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="tenant" className="text-xs font-medium text-slate">
                  当前租户
                </label>
                <div className="group relative rounded-md border border-border-strong bg-card-solid p-3.5 transition-all duration-150 hover:border-primary-line hover:shadow-[0_2px_8px_rgba(14,124,134,.08)]">
                  <div className="flex items-center gap-3">
                    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                      <Building2 className="size-4" />
                    </div>
                    <div className="relative flex-1">
                      <select
                        id="tenant"
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                        className="h-6 w-full cursor-pointer appearance-none bg-transparent pr-6 text-[13px] font-medium text-ink outline-none"
                      >
                        {TENANTS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} · {item.plan} · {item.region}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-muted" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 text-[10px] text-muted">
                  <span>独立数据空间</span>
                  <span>租户级权限隔离</span>
                  <span className="text-amber-ink">列表 API 待补</span>
                </div>
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="text-xs font-medium text-ink">选择登录角色</legend>
                <p className="text-[11px] text-muted">系统将呈现该角色关注的业务与操作权限</p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {ROLE_OPTIONS.map((item, index) => {
                    const selected = role === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRole(item.id)}
                        className={cx(
                          "group relative flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-border p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-pop",
                          selected && "border-primary",
                          index === 4 && "sm:col-span-2",
                        )}
                      >
                        {selected ? (
                          <div
                            className="pointer-events-none absolute inset-0 rounded-md"
                            style={{
                              background:
                                "linear-gradient(0deg,var(--color-primary-soft),rgba(255,255,255,.9))",
                            }}
                          />
                        ) : null}
                        <div
                          className={cx(
                            "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-semibold",
                            item.id === "CEO" && "bg-primary-soft text-primary",
                            item.id === "PM" && "bg-secondary-soft text-secondary",
                            item.id === "CM" && "bg-accent-soft text-amber-ink",
                            item.id === "SD" && "bg-success-soft text-success",
                            item.id === "AA" && "bg-violet-soft text-violet",
                          )}
                        >
                          {item.initials}
                        </div>
                        <div className="relative z-10 min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-ink">{item.name}</span>
                            {selected ? (
                              <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-white">
                                <Check className="size-2.5" />
                              </span>
                            ) : null}
                          </div>
                          <span className="mt-0.5 block truncate text-[10px] font-normal text-muted">
                            {item.scope}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <button
                type="button"
                disabled={busy}
                onClick={() => void enter()}
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-white transition-all duration-150 hover:bg-primary-deep hover:shadow-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-line disabled:opacity-60"
              >
                <Sparkles className="size-4" />
                {busy
                  ? "跳转 Casdoor…"
                  : authMode === "casdoor"
                    ? "Casdoor 登录并进入"
                    : "一键进入工作台"}
                <ArrowRight className="size-4" />
              </button>

              {error ? <p className="text-[12.5px] text-danger">{error}</p> : null}

              <div className="flex items-center justify-center gap-2 text-[10px] text-muted">
                <Users className="size-3.5" />
                {authMode === "casdoor"
                  ? "正式鉴权 · Casdoor OIDC"
                  : "演示环境 · Dev Bypass（可切 Casdoor）"}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
