import { apiGet, apiPost } from "@/lib/api";
import { asList } from "@/lib/format";

export interface ApiAgentRow {
  id: string;
  name: string;
  description: string;
}

function mapAgentRow(row: Record<string, unknown>): ApiAgentRow {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
  };
}

/** GET /agents — 智能体目录 */
export async function loadAgents(): Promise<ApiAgentRow[]> {
  const data = await apiGet<unknown>("/agents");
  return asList<Record<string, unknown>>(data).map(mapAgentRow);
}

export interface RunAgentRequest {
  agentCode: string;
  action?: string;
  relatedObject?: string;
}

/** POST /agents/run — 触发智能体运行 */
export async function runAgent(body: RunAgentRequest): Promise<Record<string, unknown>> {
  const data = await apiPost<Record<string, unknown>>("/agents/run", {
    agentCode: body.agentCode,
    action: body.action ?? "run",
    ...(body.relatedObject ? { relatedObject: body.relatedObject } : {}),
  });
  return data ?? {};
}
