import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { pickRows } from "@/lib/format";
import type { Customer } from "@/lib/mocks/data-center-customers";
import type { Product } from "@/lib/mocks/data-center-products";
import type { Channel } from "@/lib/mocks/data-center-channels";
import type { Employee } from "@/lib/mocks/data-center-employees";

type PageList<T> = { list?: T[]; total?: number } | T[];

function asList<T>(data: PageList<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.list ?? [];
}

function parseTags(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function parseNameI18n(raw: unknown): { zh: string; en: string } {
  const obj = parseTags(raw);
  return {
    zh: String(obj["zh-CN"] ?? obj.zh ?? ""),
    en: String(obj["en-US"] ?? obj.en ?? ""),
  };
}

function mapCustomer(row: Record<string, unknown>): Customer {
  const tags = parseTags(row.tags);
  const status = (tags.status as Customer["status"]) || "潜在客户";
  return {
    id: String(row.id),
    code: String(row.bizCode ?? ""),
    name: String(row.name ?? ""),
    nameEn: String(tags.nameEn ?? ""),
    type: (tags.type as Customer["type"]) || "终端客户",
    country: String(row.country ?? ""),
    region: String(tags.region ?? ""),
    industry: String(row.industry ?? ""),
    scale: (tags.scale as Customer["scale"]) || "小型",
    creditRating: (String(row.creditLevel ?? "BBB") as Customer["creditRating"]) || "BBB",
    status,
    contactPerson: String(tags.contactPerson ?? ""),
    email: String(tags.email ?? ""),
    updatedAt: row.updatedAt ? String(row.updatedAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

function customerPayload(c: Customer) {
  return {
    name: c.name,
    customerType: "ENTERPRISE",
    country: c.country,
    industry: c.industry,
    creditLevel: c.creditRating,
    tags: JSON.stringify({
      nameEn: c.nameEn,
      type: c.type,
      region: c.region,
      scale: c.scale,
      status: c.status,
      contactPerson: c.contactPerson,
      email: c.email,
    }),
  };
}

export async function loadCustomers(): Promise<Customer[]> {
  const data = await apiGet<PageList<Record<string, unknown>>>("/mdata/customers?pageSize=200");
  return asList(data).map(mapCustomer);
}

export async function saveCustomer(c: Customer, isNew: boolean): Promise<Customer> {
  if (isNew || c.id.startsWith("cu-")) {
    const created = await apiPost<Record<string, unknown>>("/mdata/customers", customerPayload(c));
    return mapCustomer(created);
  }
  const updated = await apiPut<Record<string, unknown>>(`/mdata/customers/${c.id}`, customerPayload(c));
  return mapCustomer(updated);
}

export async function deleteCustomer(id: string): Promise<void> {
  if (id.startsWith("cu-")) return;
  await apiDelete(`/mdata/customers/${id}`);
}

function mapProduct(row: Record<string, unknown>): Product {
  const names = parseNameI18n(row.nameI18n);
  const extra = parseTags(row.nameI18n);
  const statusRaw = String(row.status ?? "ACTIVE");
  const status: Product["status"] =
    statusRaw === "ACTIVE" || statusRaw === "在售" ? "在售" : statusRaw === "DRAFT" || statusRaw === "草稿" ? "草稿" : "下架";
  return {
    id: String(row.id),
    name: names.zh || String(row.sku ?? ""),
    nameEn: names.en,
    sku: String(row.sku ?? ""),
    brand: String(row.brand ?? ""),
    hsCode: String(row.hsCode ?? ""),
    categoryId: String(extra.categoryId ?? row.category ?? "cat-home"),
    price: Number(extra.price ?? 0),
    currency: String(extra.currency ?? "USD"),
    stock: Number(extra.stock ?? 0),
    status,
    image: String(extra.image ?? "/images/agent-analyst.png"),
    shortDescription: String(extra.shortDescription ?? ""),
    specs: Array.isArray(extra.specs) ? (extra.specs as Product["specs"]) : [],
    updatedAt: row.updatedAt ? String(row.updatedAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

function productPayload(p: Product) {
  const status =
    p.status === "在售" ? "ACTIVE" : p.status === "草稿" ? "DRAFT" : "INACTIVE";
  return {
    sku: p.sku,
    brand: p.brand,
    category: p.categoryId,
    hsCode: p.hsCode,
    status,
    nameI18n: JSON.stringify({
      "zh-CN": p.name,
      "en-US": p.nameEn,
      categoryId: p.categoryId,
      price: p.price,
      currency: p.currency,
      stock: p.stock,
      image: p.image,
      shortDescription: p.shortDescription,
      specs: p.specs,
    }),
  };
}

export async function loadProducts(): Promise<Product[]> {
  const data = await apiGet<PageList<Record<string, unknown>>>("/mdata/products?pageSize=200");
  return asList(data).map(mapProduct);
}

export async function saveProduct(p: Product, isNew: boolean): Promise<Product> {
  if (isNew || p.id.startsWith("p-") || p.id.startsWith("pr-")) {
    return mapProduct(await apiPost("/mdata/products", productPayload(p)));
  }
  return mapProduct(await apiPut(`/mdata/products/${p.id}`, productPayload(p)));
}

export async function deleteProduct(id: string): Promise<void> {
  if (id.startsWith("p-") || id.startsWith("pr-")) return;
  await apiDelete(`/mdata/products/${id}`);
}

function mapChannel(row: Record<string, unknown>): Channel {
  const statusRaw = String(row.status ?? "ACTIVE");
  const cooperationStatus: Channel["cooperationStatus"] =
    statusRaw === "ACTIVE" || statusRaw === "合作中"
      ? "合作中"
      : statusRaw === "PENDING" || statusRaw === "洽谈中"
        ? "洽谈中"
        : statusRaw === "ENDED" || statusRaw === "已终止"
          ? "已终止"
          : "已暂停";
  return {
    id: String(row.id),
    code: String(row.bizCode ?? ""),
    name: String(row.name ?? ""),
    type: (String(row.channelType ?? "线上电商") as Channel["type"]) || "线上电商",
    coverageRegion: String(row.coverRegion ?? ""),
    cooperationStatus,
    owner: "",
    monthlyGmv: "$0",
    updatedAt: row.updatedAt ? String(row.updatedAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

function channelPayload(c: Channel) {
  const status =
    c.cooperationStatus === "合作中"
      ? "ACTIVE"
      : c.cooperationStatus === "洽谈中"
        ? "PENDING"
        : c.cooperationStatus === "已终止"
          ? "ENDED"
          : "PAUSED";
  return {
    name: c.name,
    channelType: c.type,
    coverRegion: c.coverageRegion,
    status,
  };
}

export async function loadChannels(): Promise<Channel[]> {
  const data = await apiGet<PageList<Record<string, unknown>>>("/mdata/channels?pageSize=200");
  return asList(data).map(mapChannel);
}

export async function saveChannel(c: Channel, isNew: boolean): Promise<Channel> {
  if (isNew || c.id.startsWith("ch-")) {
    return mapChannel(await apiPost("/mdata/channels", channelPayload(c)));
  }
  return mapChannel(await apiPut(`/mdata/channels/${c.id}`, channelPayload(c)));
}

export async function deleteChannel(id: string): Promise<void> {
  if (id.startsWith("ch-")) return;
  await apiDelete(`/mdata/channels/${id}`);
}

function mapEmployee(row: Record<string, unknown>): Employee {
  const active = row.isActive !== false;
  return {
    id: String(row.id),
    code: String(row.bizCode ?? ""),
    name: String(row.displayName ?? ""),
    department: String(row.department ?? ""),
    role: "普通员工",
    position: String(row.title ?? ""),
    employmentStatus: active ? "在职" : "离职",
    email: String(row.email ?? ""),
    joinDate: row.createdAt ? String(row.createdAt).slice(0, 10) : "",
    updatedAt: row.updatedAt ? String(row.updatedAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

function employeePayload(e: Employee) {
  return {
    email: e.email,
    displayName: e.name,
    department: e.department,
    title: e.position,
    staffType: "HUMAN",
    isActive: e.employmentStatus !== "离职",
  };
}

export async function loadEmployees(): Promise<Employee[]> {
  const data = await apiGet<PageList<Record<string, unknown>>>("/users?staffType=HUMAN&pageSize=200");
  return asList(data).map(mapEmployee);
}

export async function saveEmployee(e: Employee, isNew: boolean): Promise<Employee> {
  if (isNew || e.id.startsWith("em-")) {
    return mapEmployee(await apiPost("/users", employeePayload(e)));
  }
  return mapEmployee(await apiPut(`/users/${e.id}`, employeePayload(e)));
}

export async function deleteEmployee(id: string): Promise<void> {
  if (id.startsWith("em-")) return;
  await apiDelete(`/users/${id}`);
}

export async function loadBrandSetting(): Promise<Record<string, unknown>> {
  const data = await apiGet<{ key: string; value: Record<string, unknown> }>("/config/settings/brand");
  return data?.value ?? {};
}

export async function saveBrandSetting(value: Record<string, unknown>): Promise<void> {
  await apiPut("/config/settings/brand", { value });
}

export async function loadAgentConfig(code: string): Promise<Record<string, unknown>> {
  const data = await apiGet<{ agentCode: string; config: Record<string, unknown> }>(`/agents/${code}/config`);
  return data?.config ?? {};
}

export async function saveAgentConfig(code: string, config: Record<string, unknown>): Promise<void> {
  await apiPut(`/agents/${code}/config`, { config });
}

export async function loadAgentRunLogs(): Promise<Record<string, unknown>[]> {
  const data = await apiGet<PageList<Record<string, unknown>>>("/agents/run-logs?pageSize=50");
  return asList(data);
}

export async function loadKnowledgeTemplates(): Promise<Record<string, unknown>[]> {
  return pickRows(await apiGet("/knowledge/templates").catch(() => []));
}

export async function updateKnowledgeTemplate(id: string | number, body: Record<string, unknown>) {
  return apiPut(`/knowledge/templates/${id}`, body);
}

export async function loadKnowledgeScripts(): Promise<Record<string, unknown>[]> {
  return pickRows(await apiGet("/knowledge/scripts").catch(() => []));
}

export async function updateKnowledgeScript(id: string | number, body: Record<string, unknown>) {
  return apiPut(`/knowledge/scripts/${id}`, body);
}

export async function loadKnowledgePrompts(): Promise<Record<string, unknown>[]> {
  return pickRows(await apiGet("/knowledge/prompts").catch(() => []));
}

export async function updateKnowledgePrompt(id: string | number, body: Record<string, unknown>) {
  return apiPut(`/knowledge/prompts/${id}`, body);
}

/** UI AgentId → Java agent_code */
export const UI_AGENT_CODE: Record<string, string> = {
  analyst: "decision_officer",
  market: "market_analyst",
  content: "social_marketer",
  sales: "sales_converter",
};
