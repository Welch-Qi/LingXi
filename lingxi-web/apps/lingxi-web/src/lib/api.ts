import { unwrap } from "@lingxi/request";
import { getAccessToken, getAuthMode } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/v1";

/** Dev bypass headers — only used when AUTH_MODE=bypass or no Bearer yet. */
const BYPASS_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "X-User-Id": "10086001",
  "X-Tenant-Id": "10086",
  "X-Username": "linqitao",
  "X-Roles": "role_admin",
};

function url(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = typeof window !== "undefined" ? getAccessToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    return { ...headers, ...(extra as Record<string, string>) };
  }
  if (getAuthMode() === "bypass") {
    return { ...BYPASS_HEADERS, ...(extra as Record<string, string>) };
  }
  return { ...headers, ...(extra as Record<string, string>) };
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(url(path), {
    headers: buildHeaders(),
    cache: "no-store",
  });
  return unwrap<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: "POST",
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  return unwrap<T>(res);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: "PUT",
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  return unwrap<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(url(path), {
    method: "DELETE",
    headers: buildHeaders(),
    cache: "no-store",
  });
  return unwrap<T>(res);
}
