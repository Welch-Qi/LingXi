/** Navigation page ids from 灵犀前端 design shell (mapped to App Router elsewhere). */
export type PageId =
  | "dashboard"
  | "analytics"
  | "product"
  | "marketing"
  | "sales"
  | "data"
  | "agents"
  | "knowledge"
  | "config";

export const PAGE_ROUTES: Record<PageId, string> = {
  dashboard: "/workbench",
  analytics: "/decision",
  product: "/market",
  marketing: "/marketing",
  sales: "/sales",
  data: "/mdata",
  agents: "/agent",
  knowledge: "/knowledge",
  config: "/config",
};
