"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  Boxes,
  ChevronDown,
  Command,
  Database,
  Globe2,
  LogOut,
  MessageSquareText,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { cx } from "@lingxi/ui";
import { logout, rememberWorkspace } from "@/lib/auth";
import {
  isWorkspaceRole,
  ROLE_HOME,
  ROLE_NAV,
  ROLE_OPTIONS,
  roleLabel,
  TENANTS,
  type WorkspaceRole,
} from "@/lib/workspace";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Command;
  badge?: string;
};

const BIZ_NAV: NavItem[] = [
  { href: "/workbench", label: "超级工作台", icon: Command },
  { href: "/decision", label: "经营分析", icon: Globe2 },
  { href: "/market", label: "产品开发", icon: Target },
  { href: "/marketing", label: "内容营销", icon: Sparkles },
  { href: "/sales", label: "销售转化", icon: MessageSquareText, badge: "8" },
];

const PLATFORM_NAV: NavItem[] = [
  { href: "/agent", label: "智能中心", icon: Bot },
  { href: "/mdata", label: "数据中心", icon: Database },
  { href: "/knowledge", label: "知识中心", icon: BookOpen },
  { href: "/config", label: "配置中心", icon: Settings },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/workbench": {
    title: "超级工作台",
    subtitle: "全球业务信号、任务进展与经营成果总览",
  },
  "/decision": {
    title: "经营分析",
    subtitle: "全球关键指标、销量热度地图与营销漏斗深度分析",
  },
  "/market": {
    title: "产品开发",
    subtitle: "市场趋势、产品开发机会与产品创意闭环",
  },
  "/marketing": {
    title: "内容营销",
    subtitle: "内容生产、分发与投放运营闭环",
  },
  "/sales": {
    title: "销售转化",
    subtitle: "从客户接待到成交的全链路管理",
  },
  "/mdata": {
    title: "数据中心",
    subtitle: "统一沉淀产品、内容、客户与跟进数据",
  },
  "/agent": {
    title: "智能中心",
    subtitle: "配置、治理并审计您的硅基团队（二期能力，一期已内置于各业务模块中提前呈现）",
  },
  "/knowledge": {
    title: "知识中心",
    subtitle: "模板库、话术库与提示词库，沉淀并复用团队最佳实践",
  },
  "/config": {
    title: "配置中心",
    subtitle: "企业公约、运营配置、员工管理与权限管理",
  },
};

function resolveMeta(pathname: string) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const hit = Object.keys(PAGE_META).find((k) => pathname.startsWith(k));
  return hit ? PAGE_META[hit] : { title: "灵犀", subtitle: "Lingxi Brain" };
}

function Menu({
  open,
  onClose,
  align = "end",
  children,
}: {
  open: boolean;
  onClose: () => void;
  align?: "start" | "end";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cx(
        "absolute top-[calc(100%+6px)] z-40 min-w-[200px] rounded-[12px] border border-border bg-card-solid p-1.5 shadow-pop",
        align === "end" ? "right-0" : "left-0",
      )}
    >
      {children}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = resolveMeta(pathname);
  const isHome = pathname === "/";
  const isAuthCallback = pathname.startsWith("/auth/");
  const [role, setRole] = useState<WorkspaceRole>("CEO");
  const [tenantId, setTenantId] = useState(TENANTS[0].id);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  useEffect(() => {
    try {
      const r = sessionStorage.getItem("lingxi.role") || "CEO";
      setRole(isWorkspaceRole(r) ? r : "CEO");
      const t = sessionStorage.getItem("lingxi.tenantId") || TENANTS[0].id;
      setTenantId(TENANTS.some((x) => x.id === t) ? t : TENANTS[0].id);
    } catch {
      /* ignore */
    }
  }, [pathname]);

  if (isHome || isAuthCallback) {
    return (
      <>
        <div className="aurora" aria-hidden="true" />
        {children}
      </>
    );
  }

  const allowed = new Set(ROLE_NAV[role]);
  const bizItems = BIZ_NAV.filter((i) => allowed.has(i.href));
  const platItems = PLATFORM_NAV.filter((i) => allowed.has(i.href));
  const tenant = TENANTS.find((t) => t.id === tenantId) ?? TENANTS[0];
  const roleMeta = ROLE_OPTIONS.find((r) => r.id === role) ?? ROLE_OPTIONS[0];

  function applyRole(next: WorkspaceRole) {
    setRole(next);
    rememberWorkspace(next, tenant.name);
    try {
      sessionStorage.setItem("lingxi.tenantId", tenant.id);
    } catch {
      /* ignore */
    }
    setRoleOpen(false);
    if (!ROLE_NAV[next].includes(pathname)) {
      router.push(ROLE_HOME[next]);
    }
  }

  function applyTenant(id: string) {
    const t = TENANTS.find((x) => x.id === id) ?? TENANTS[0];
    setTenantId(t.id);
    rememberWorkspace(role, t.name);
    try {
      sessionStorage.setItem("lingxi.tenantId", t.id);
    } catch {
      /* ignore */
    }
    setTenantOpen(false);
  }

  function renderNav(items: NavItem[]) {
    return items.map((item) => {
      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cx(
            "relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] transition-all duration-150",
            active
              ? "bg-primary-soft font-medium text-primary"
              : "text-slate hover:bg-frost hover:text-ink",
          )}
        >
          <Icon className={cx("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-75")} />
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <span className="ml-auto rounded-full bg-danger px-[7px] py-px font-display text-[10.5px] font-semibold text-white">
              {item.badge}
            </span>
          ) : null}
        </Link>
      );
    });
  }

  return (
    <>
      <div className="aurora" aria-hidden="true" />
      <div className="grid min-h-screen grid-cols-[224px_1fr] pt-[3px] max-[768px]:grid-cols-1">
        <aside className="sticky top-[3px] flex h-[calc(100vh-3px)] shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar px-3.5 py-5 backdrop-blur-xl max-[768px]:hidden">
          <Link href="/" className="mb-5 flex items-center gap-2.5 px-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#2E6BE6,#0E7C86)] text-white">
              <Boxes className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-display text-[15px] font-bold leading-tight text-ink">
                Lingxi Brain
              </div>
              <div className="font-display text-[10px] uppercase tracking-[0.12em] text-muted">
                Growth OS
              </div>
            </div>
          </Link>

          <nav className="flex flex-1 flex-col" aria-label="主导航">
            {bizItems.length > 0 ? (
              <>
                <div className="mb-1.5 mt-1 px-2.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted">
                  业务 · Business
                </div>
                <div className="flex flex-col gap-1">{renderNav(bizItems)}</div>
              </>
            ) : null}
            {platItems.length > 0 ? (
              <>
                <div className="mx-1 my-3 border-t border-border" />
                <div className="mb-1.5 px-2.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted">
                  平台 · Platform
                </div>
                <div className="flex flex-col gap-1">{renderNav(platItems)}</div>
              </>
            ) : null}
          </nav>

          <button
            type="button"
            onClick={() => void logout()}
            className="mt-auto flex items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 text-left text-[13px] text-muted transition-all duration-150 hover:bg-danger-soft hover:text-danger"
          >
            <LogOut className="h-3.5 w-3.5" />
            退出当前工作区
          </button>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-[3px] z-20 flex items-center gap-3.5 border-b border-border bg-sidebar px-7 py-3.5 backdrop-blur-xl max-[768px]:flex-wrap">
            <div className="min-w-0">
              <h1 className="font-display text-[16px] font-bold leading-tight text-ink">
                {meta.title}
              </h1>
              <p className="mt-0.5 text-[12px] text-muted">{meta.subtitle}</p>
            </div>

            <div className="relative ml-auto hidden max-w-[420px] flex-1 xl:block">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="w-60 rounded-full border border-transparent bg-frost py-2 pr-3 pl-9 text-[13px] text-ink outline-none transition-all placeholder:text-muted focus:border-primary-line focus:bg-card-solid focus:shadow-[0_0_0_3px_var(--color-primary-soft)]"
                placeholder="搜索客户、内容、任务…"
              />
            </div>

            <div className="flex items-center gap-2.5 max-[768px]:ml-auto">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setTenantOpen((v) => !v);
                    setRoleOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-border-strong bg-card-solid px-3 py-1.5 text-[12.5px] text-slate transition-colors hover:border-primary-line hover:text-primary"
                >
                  <span className="pulse-dot" />
                  {tenant.name}
                  <ChevronDown className="h-3 w-3" />
                </button>
                <Menu open={tenantOpen} onClose={() => setTenantOpen(false)}>
                  <div className="px-2.5 py-1.5 text-[11px] font-medium text-muted">切换租户</div>
                  {TENANTS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTenant(t.id)}
                      className={cx(
                        "flex w-full flex-col rounded-[8px] px-2.5 py-2 text-left text-[13px] hover:bg-frost",
                        t.id === tenant.id && "bg-primary-soft text-primary",
                      )}
                    >
                      <span className="font-medium">{t.name}</span>
                      <span className="text-[11px] text-muted">
                        {t.plan} · {t.region}
                      </span>
                    </button>
                  ))}
                  <div className="mt-1 border-t border-border px-2.5 py-2 text-[10px] text-muted">
                    多租户列表 API 待补 · 见改造清单
                  </div>
                </Menu>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setRoleOpen((v) => !v);
                    setTenantOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-border-strong bg-card-solid px-3 py-1.5 text-[12.5px] text-slate transition-colors hover:border-primary-line hover:text-primary"
                >
                  <Users className="h-3.5 w-3.5" />
                  {roleLabel(role)}
                  <ChevronDown className="h-3 w-3" />
                </button>
                <Menu open={roleOpen} onClose={() => setRoleOpen(false)}>
                  <div className="px-2.5 py-1.5 text-[11px] font-medium text-muted">
                    切换角色视角
                  </div>
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => applyRole(r.id)}
                      className={cx(
                        "flex w-full flex-col rounded-[8px] px-2.5 py-2 text-left text-[13px] hover:bg-frost",
                        r.id === role && "bg-primary-soft text-primary",
                      )}
                    >
                      <span className="font-medium">{r.name}</span>
                      <span className="text-[11px] text-muted">{r.scope}</span>
                    </button>
                  ))}
                </Menu>
              </div>

              <ThemeToggle />

              <button
                type="button"
                aria-label="通知"
                className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-border bg-card-solid text-slate transition-colors hover:border-primary-line hover:text-primary"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-[7px] right-2 h-1.5 w-1.5 rounded-full bg-danger" />
              </button>

              <div
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] font-display text-[13px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#2E6BE6,#0E7C86)" }}
                title={roleMeta.name}
              >
                {roleMeta.name.slice(0, 1)}
              </div>
            </div>
          </header>

          <main className="flex w-full flex-1 flex-col gap-[22px] px-7 pt-6 pb-12">
            {children}
          </main>

          <footer className="flex items-center gap-2 border-t border-border bg-sidebar px-7 py-3 text-xs text-muted backdrop-blur-xl">
            <span className="pulse-dot" />
            <span className="font-medium text-success">4 智能体在线</span>
            <span className="ml-auto">区域：亚太 · UTC+8</span>
          </footer>
        </div>
      </div>
    </>
  );
}
