"use client"
// @ts-nocheck — design dump
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { BookOpen, FileText, MessageSquareQuote, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  loadKnowledgePrompts,
  loadKnowledgeScripts,
  loadKnowledgeTemplates,
  updateKnowledgePrompt,
  updateKnowledgeScript,
  updateKnowledgeTemplate,
} from "@/lib/bapi"
import { templates as mockTemplates, scripts as mockScripts, prompts as mockPrompts } from "@/lib/mocks/knowledge-center"

const agentMeta: Record<string, { name: string; title: string; image: string }> = {
  market: { name: "Atlas", title: "市场分析师", image: "/images/agent-market.png" },
  content: { name: "Muse", title: "内容创意师", image: "/images/agent-content.png" },
  sales: { name: "Echo", title: "营销客服专家", image: "/images/agent-sales.png" },
  analyst: { name: "Sage", title: "经营决策专家", image: "/images/agent-analyst.png" },
}

type UiTemplate = { id: string; name: string; category: string; language: string; usageCount: number; updatedAt: string; body?: string }
type UiScript = { id: string; scene: string; language: string; summary: string; usageCount: number; updatedAt: string; body?: string }
type UiPrompt = { id: string; agent: string; scene: string; summary: string; version: string; updatedAt: string; body?: string }

function mapTemplate(row: Record<string, unknown>): UiTemplate {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    category: String(row.category ?? "通用"),
    language: String(row.locale ?? "zh-CN"),
    usageCount: 0,
    updatedAt: row.updatedAt ? String(row.updatedAt).slice(0, 10) : "",
    body: String(row.body ?? ""),
  }
}

function mapScript(row: Record<string, unknown>): UiScript {
  const body = String(row.body ?? "")
  return {
    id: String(row.id),
    scene: String(row.scene ?? ""),
    language: String(row.locale ?? "zh-CN"),
    summary: body.slice(0, 80) || "—",
    usageCount: 0,
    updatedAt: row.updatedAt ? String(row.updatedAt).slice(0, 10) : "",
    body,
  }
}

function mapPrompt(row: Record<string, unknown>): UiPrompt {
  const body = String(row.body ?? "")
  const domain = String(row.agentDomain ?? "content")
  const agent = domain.includes("market") ? "market" : domain.includes("sales") ? "sales" : domain.includes("decision") || domain.includes("analyst") ? "analyst" : "content"
  return {
    id: String(row.id),
    agent,
    scene: String(row.name ?? row.promptCode ?? ""),
    summary: body.slice(0, 80) || "—",
    version: String(row.versionLabel ?? "v1"),
    updatedAt: row.updatedAt ? String(row.updatedAt).slice(0, 10) : "",
    body,
  }
}

function TemplatesTab({ items }: { items: UiTemplate[] }) {
  async function handleEdit(t: UiTemplate) {
    if (!t.body && t.id.startsWith("t")) {
      toast.success(`正在编辑「${t.name}」（本地 mock）`)
      return
    }
    const next = typeof window !== "undefined" ? window.prompt(`编辑模板「${t.name}」正文`, t.body || "") : null
    if (next == null) return
    try {
      await updateKnowledgeTemplate(t.id, { body: next, name: t.name })
      toast.success(`「${t.name}」已更新落库`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新模板失败")
    }
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((t) => (
        <Card key={t.id} className="shadow-none">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <Badge variant="outline" className="text-[10px]">
                {t.category}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {t.language}
              </Badge>
            </div>
            <p className="text-xs font-medium leading-5">{t.name}</p>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>使用 {t.usageCount} 次</span>
              <span>{t.updatedAt}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => toast.success(`已应用「${t.name}」`)}>
                使用
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => void handleEdit(t)}>
                编辑
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ScriptsTab({ items }: { items: UiScript[] }) {
  async function handleEdit(s: UiScript) {
    if (!s.body || String(s.id).startsWith("s")) {
      toast.success(`已复制「${s.scene}」话术`)
      return
    }
    const next = typeof window !== "undefined" ? window.prompt(`编辑话术「${s.scene}」`, s.body || "") : null
    if (next == null) return
    try {
      await updateKnowledgeScript(s.id, { body: next, scene: s.scene })
      toast.success(`「${s.scene}」已更新落库`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新话术失败")
    }
  }

  return (
    <Card className="shadow-none">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>场景</TableHead>
              <TableHead>语言</TableHead>
              <TableHead>摘要</TableHead>
              <TableHead>使用次数</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.scene}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">
                    {s.language}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[360px] text-muted-foreground">{s.summary}</TableCell>
                <TableCell>{s.usageCount}</TableCell>
                <TableCell className="text-muted-foreground">{s.updatedAt}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => void handleEdit(s)}>
                    编辑
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function PromptsTab({ items }: { items: UiPrompt[] }) {
  async function handleEdit(p: UiPrompt) {
    if (!p.body || String(p.id).startsWith("p")) {
      toast.success(`已复制「${p.scene}」提示词`)
      return
    }
    const next = typeof window !== "undefined" ? window.prompt(`编辑提示词「${p.scene}」`, p.body || "") : null
    if (next == null) return
    try {
      await updateKnowledgePrompt(p.id, { body: next, name: p.scene })
      toast.success(`「${p.scene}」已更新落库`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新提示词失败")
    }
  }

  return (
    <Card className="shadow-none">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>归属智能体</TableHead>
              <TableHead>场景</TableHead>
              <TableHead>摘要</TableHead>
              <TableHead>版本</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => {
              const meta = agentMeta[p.agent] || agentMeta.content
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="relative size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
                        <Image unoptimized src={meta.image} alt={meta.title} fill className="object-cover object-top" />
                      </div>
                      <span className="text-xs font-medium">{meta.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{p.scene}</TableCell>
                  <TableCell className="max-w-[320px] text-muted-foreground">{p.summary}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {p.version}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => void handleEdit(p)}>
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function KnowledgeCenterPage() {
  const [tab, setTab] = useState("templates")
  const [templates, setTemplates] = useState<UiTemplate[]>(mockTemplates)
  const [scripts, setScripts] = useState<UiScript[]>(mockScripts)
  const [prompts, setPrompts] = useState<UiPrompt[]>(mockPrompts)

  useEffect(() => {
    void Promise.all([
      loadKnowledgeTemplates().then((rows) => (rows.length ? setTemplates(rows.map(mapTemplate)) : null)).catch(() => null),
      loadKnowledgeScripts().then((rows) => (rows.length ? setScripts(rows.map(mapScript)) : null)).catch(() => null),
      loadKnowledgePrompts().then((rows) => (rows.length ? setPrompts(rows.map(mapPrompt)) : null)).catch(() => null),
    ])
  }, [])

  const stats = useMemo(
    () => [
      { label: "模板总数", value: templates.length, icon: FileText },
      { label: "话术总数", value: scripts.length, icon: MessageSquareQuote },
      { label: "提示词总数", value: prompts.length, icon: Sparkles },
      {
        label: "本月复用次数",
        value: templates.reduce((s, t) => s + t.usageCount, 0) + scripts.reduce((s, t) => s + t.usageCount, 0),
        icon: BookOpen,
      },
    ],
    [templates, scripts, prompts],
  )

  return (
    <div className="flex w-full flex-col gap-5">
      <section className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardDescription className="text-[11px]">{s.label}</CardDescription>
                <s.icon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{s.value.toLocaleString()}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="templates">内容模板</TabsTrigger>
          <TabsTrigger value="scripts">销售话术</TabsTrigger>
          <TabsTrigger value="prompts">Agent 提示词</TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="mt-4">
          <TemplatesTab items={templates} />
        </TabsContent>
        <TabsContent value="scripts" className="mt-4">
          <ScriptsTab items={scripts} />
        </TabsContent>
        <TabsContent value="prompts" className="mt-4">
          <PromptsTab items={prompts} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
