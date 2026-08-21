import { apiPost } from "@/lib/api";

export async function createKnowledgeTemplate(body: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>("/knowledge/templates", body);
}

export async function createKnowledgeScript(body: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>("/knowledge/scripts", body);
}

export async function createKnowledgePrompt(body: Record<string, unknown>) {
  return apiPost<Record<string, unknown>>("/knowledge/prompts", body);
}
