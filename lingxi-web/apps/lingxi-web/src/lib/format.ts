export function formatNumber(value: unknown, digits = 0): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { list?: unknown }).list)) {
    return (data as { list: T[] }).list;
  }
  return [];
}

export function pickRows(data: unknown): Record<string, unknown>[] {
  return asList<Record<string, unknown>>(data);
}
