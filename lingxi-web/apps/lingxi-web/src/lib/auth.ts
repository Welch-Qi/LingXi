/**
 * Client-side auth for Casdoor OIDC + local bypass.
 * Token is stored in localStorage (Bearer). Bypass keeps X-User-* headers.
 */

export type AuthMode = "bypass" | "casdoor";

const TOKEN_KEY = "lingxi.accessToken";
const REFRESH_KEY = "lingxi.refreshToken";
const STATE_KEY = "lingxi.oauthState";
const ROLE_KEY = "lingxi.role";
const TENANT_KEY = "lingxi.tenant";

export function getAuthMode(): AuthMode {
  const mode = (process.env.NEXT_PUBLIC_AUTH_MODE || "bypass").toLowerCase();
  return mode === "casdoor" ? "casdoor" : "bypass";
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken?: string | null) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(STATE_KEY);
  } catch {
    /* ignore */
  }
}

export function saveOAuthState(state: string) {
  sessionStorage.setItem(STATE_KEY, state);
}

export function peekOAuthState(): string | null {
  return sessionStorage.getItem(STATE_KEY);
}

export function rememberWorkspace(role: string, tenant: string) {
  sessionStorage.setItem(ROLE_KEY, role);
  sessionStorage.setItem(TENANT_KEY, tenant);
}

export async function beginCasdoorLogin(returnTo = "/workbench"): Promise<void> {
  const state = `${crypto.randomUUID()}:${returnTo}`;
  saveOAuthState(state);
  const res = await fetch(`/api/v1/auth/login-url?state=${encodeURIComponent(state)}`, {
    cache: "no-store",
  });
  const json = (await res.json()) as {
    code?: number;
    message?: string;
    data?: { loginUrl?: string; state?: string };
  };
  if (!res.ok || json.code !== 0 || !json.data?.loginUrl) {
    throw new Error(json.message || "获取 Casdoor 登录地址失败");
  }
  window.location.href = json.data.loginUrl;
}

export async function exchangeCode(code: string, state?: string | null) {
  const qs = new URLSearchParams({ code });
  if (state) qs.set("state", state);
  const res = await fetch(`/api/v1/auth/callback?${qs.toString()}`, {
    method: "POST",
    cache: "no-store",
  });
  const json = (await res.json()) as {
    code?: number;
    message?: string;
    data?: {
      accessToken?: string;
      refreshToken?: string;
      expiresIn?: number;
    };
  };
  if (!res.ok || json.code !== 0 || !json.data?.accessToken) {
    throw new Error(json.message || "Casdoor 换票失败");
  }
  setTokens(json.data.accessToken, json.data.refreshToken);
  return json.data;
}

export async function logout(): Promise<void> {
  clearSession();
  if (getAuthMode() !== "casdoor") {
    window.location.href = "/";
    return;
  }
  try {
    const redirectUri = `${window.location.origin}/`;
    const res = await fetch(
      `/api/v1/auth/logout-url?redirectUri=${encodeURIComponent(redirectUri)}`,
      { cache: "no-store" },
    );
    const json = (await res.json()) as {
      code?: number;
      data?: { logoutUrl?: string };
    };
    if (json.code === 0 && json.data?.logoutUrl) {
      window.location.href = json.data.logoutUrl;
      return;
    }
  } catch {
    /* fall through */
  }
  window.location.href = "/";
}
