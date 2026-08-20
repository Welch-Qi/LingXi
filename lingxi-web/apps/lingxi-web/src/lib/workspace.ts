/**
 * Workspace chrome aligned with 灵犀前端 design baseline.
 * Role codes match login sessionStorage (CEO/PM/CM/SD/AA).
 */

export type WorkspaceRole = "CEO" | "PM" | "CM" | "SD" | "AA";

export type TenantOption = {
  id: string;
  name: string;
  plan: string;
  region: string;
};

export const TENANTS: TenantOption[] = [
  { id: "nova", name: "NovaTech 出海事业部", plan: "Enterprise", region: "亚太" },
  { id: "aurora", name: "Aurora Home 全球业务", plan: "Growth", region: "欧洲" },
  { id: "atlas", name: "Atlas Tools 国际站", plan: "Pro", region: "北美" },
];

export const ROLE_OPTIONS: {
  id: WorkspaceRole;
  name: string;
  scope: string;
  initials: string;
}[] = [
  { id: "CEO", name: "CEO", scope: "经营全局、业务成果与关键决策", initials: "CE" },
  { id: "PM", name: "产品总监", scope: "市场趋势、产品开发与产品创意", initials: "PM" },
  { id: "CM", name: "营销总监", scope: "内容生产、分发与投放管理", initials: "CM" },
  { id: "SD", name: "销售总监", scope: "客户、跟进、商机与成交", initials: "SD" },
  { id: "AA", name: "智能体架构师", scope: "智能体配置、运行与审计", initials: "AA" },
];

/** Routes visible per role (design access matrix). */
export const ROLE_NAV: Record<WorkspaceRole, string[]> = {
  CEO: [
    "/workbench",
    "/decision",
    "/market",
    "/marketing",
    "/sales",
    "/agent",
    "/mdata",
    "/knowledge",
    "/config",
  ],
  PM: ["/workbench", "/decision", "/market", "/mdata", "/knowledge"],
  CM: ["/workbench", "/decision", "/marketing", "/mdata", "/knowledge"],
  SD: ["/workbench", "/decision", "/sales", "/mdata", "/knowledge"],
  AA: ["/workbench", "/agent", "/mdata", "/knowledge"],
};

export const ROLE_HOME: Record<WorkspaceRole, string> = {
  CEO: "/workbench",
  PM: "/market",
  CM: "/marketing",
  SD: "/sales",
  AA: "/agent",
};

export function isWorkspaceRole(v: string): v is WorkspaceRole {
  return v === "CEO" || v === "PM" || v === "CM" || v === "SD" || v === "AA";
}

export function roleLabel(role: string): string {
  const hit = ROLE_OPTIONS.find((r) => r.id === role);
  return hit?.name ?? role;
}
