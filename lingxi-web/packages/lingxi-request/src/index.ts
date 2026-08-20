export type ApiResult<T> = {
  code: string;
  message: string;
  data: T;
  traceId?: string;
};

export async function unwrap<T>(res: Response): Promise<T> {
  const raw = await res.text();
  const contentType = res.headers.get("content-type") || "";
  let body: ApiResult<T> | null = null;

  if (contentType.includes("application/json") || raw.trim().startsWith("{")) {
    try {
      body = JSON.parse(raw) as ApiResult<T>;
    } catch {
      throw new Error(`接口返回无法解析的 JSON（HTTP ${res.status}）`);
    }
  }

  if (!body) {
    const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 80);
    if (!res.ok) {
      throw new Error(
        res.status === 500 && /internal server error/i.test(snippet)
          ? "后端服务不可用或代理失败（请确认 lingxi-server :8080 与数据库隧道已启动）"
          : `请求失败 HTTP ${res.status}${snippet ? `：${snippet}` : ""}`,
      );
    }
    throw new Error(`接口未返回 JSON${snippet ? `：${snippet}` : ""}`);
  }

  if (body.code !== "0") {
    throw new Error(body.message || "request failed");
  }
  return body.data;
}
