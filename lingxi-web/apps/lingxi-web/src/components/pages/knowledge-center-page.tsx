"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"
import { BookOpen, FileText, MessageSquareQuote, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { createKnowledgePrompt, createKnowledgeScript, createKnowledgeTemplate } from "@/lib/api-knowledge"
import {
  loadKnowledgePrompts,
  loadKnowledgeScripts,
  loadKnowledgeTemplates,
  UI_AGENT_CODE,
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

const TEMPLATE_CATEGORIES = [
  { value: "DEVELOPMENT_LETTER", label: "营销开发信" },
  { value: "QUOTATION", label: "报价单" },
  { value: "CONTRACT", label: "合同" },
  { value: "FOLLOWUP_EMAIL", label: "跟进邮件" },
] as const

const LOCALE_OPTIONS = ["zh-CN", "en-US", "de-DE", "fr-FR", "nl-NL"] as const

const AGENT_OPTIONS = [
  { key: "market", label: "市场分析师" },
  { key: "content", label: "内容创意师" },
  { key: "sales", label: "营销客服专家" },
  { key: "analyst", label: "经营决策专家" },
] as const

type UiTemplate = { id: string; name: string; category: string; language: string; usageCount: number; updatedAt: string; body?: string }
type UiScript = { id: string; scene: string; language: string; summary: string; usageCount: number; updatedAt: string; body?: string }
type UiPrompt = { id: string; agent: string; scene: string; summary: string; version: string; updatedAt: string; body?: string }

function mapTemplate(row: Record<string, unknown>): UiTemplate {
  const category = String(row.category ?? "通用")
  const categoryLabel = TEMPLATE_CATEGORIES.find((c) => c.value === category)?.label ?? category
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    category: categoryLabel,
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
  const agent = domain.includes("market")
    ? "market"
    : domain.includes("sales")
      ? "sales"
      : domain.includes("decision") || domain.includes("analyst")
        ? "analyst"
        : "content"
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

function isMockId(id: string, prefix: string): boolean {
  return id.startsWith(prefix)
}

type TemplateForm = { name: string; category: string; locale: string; body: string }
type ScriptForm = { scene: string; locale: string; body: string }
type PromptForm = { name: string; promptCode: string; agentKey: string; versionLabel: string; body: string }

const emptyTemplateForm = (): TemplateForm => ({
  name: "",
  category: "DEVELOPMENT_LETTER",
  locale: "zh-CN",
  body: "",
})

const emptyScriptForm = (): ScriptForm => ({
  scene: "",
  locale: "zh-CN",
  body: "",
})

const emptyPromptForm = (): PromptForm => ({
  name: "",
  promptCode: "",
  agentKey: "content",
  versionLabel: "v1",
  body: "",
})

function TemplatesTab({ items, onRefresh }: { items: UiTemplate[]; onRefresh: () => Promise<void> }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<TemplateForm>(emptyTemplateForm)

  async function handleEdit(t: UiTemplate) {
    if (!t.body && isMockId(t.id, "t")) {
      toast.success(`正在编辑「${t.name}」（本地 mock）`)
      return
    }
    const next = typeof window !== "undefined" ? window.prompt(`编辑模板「${t.name}」正文`, t.body || "") : null
    if (next == null) return
    try {
      await updateKnowledgeTemplate(t.id, { body: next, name: t.name })
      toast.success(`「${t.name}」已更新落库`)
      await onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新模板失败")
    }
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.body.trim()) {
      toast.error("请填写名称与正文")
      return
    }
    setSubmitting(true)
    try {
      await createKnowledgeTemplate({
        name: form.name.trim(),
        category: form.category,
        locale: form.locale,
        body: form.body.trim(),
      })
      toast.success(`「${form.name}」已创建`)
      setCreateOpen(false)
      setForm(emptyTemplateForm())
      await onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建模板失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          新建模板
        </Button>
      </div>
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

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-[460px] overflow-auto sm:max-w-[460px]">
          <SheetHeader>
            <SheetTitle>新建内容模板</SheetTitle>
            <SheetDescription>创建后可被营销、销售场景复用</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">模板名称</Label>
              <Input
                className="h-9 text-xs"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例如 标准报价单模板"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">模板类型</Label>
              <Select value={form.category} onValueChange={(v) => v && setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">语言区域</Label>
              <Select value={form.locale} onValueChange={(v) => v && setForm((f) => ({ ...f, locale: v }))}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALE_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">模板正文</Label>
              <Textarea
                className="min-h-[160px] text-xs"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="支持 {{变量}} 占位符"
              />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 p-4 pt-0">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button size="sm" disabled={submitting} onClick={() => void handleCreate()}>
              {submitting ? "创建中…" : "创建"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

function ScriptsTab({ items, onRefresh }: { items: UiScript[]; onRefresh: () => Promise<void> }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<ScriptForm>(emptyScriptForm)

  async function handleEdit(s: UiScript) {
    if (!s.body || isMockId(String(s.id), "s")) {
      toast.success(`已复制「${s.scene}」话术`)
      return
    }
    const next = typeof window !== "undefined" ? window.prompt(`编辑话术「${s.scene}」`, s.body || "") : null
    if (next == null) return
    try {
      await updateKnowledgeScript(s.id, { body: next, scene: s.scene })
      toast.success(`「${s.scene}」已更新落库`)
      await onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新话术失败")
    }
  }

  async function handleCreate() {
    if (!form.scene.trim() || !form.body.trim()) {
      toast.error("请填写场景与正文")
      return
    }
    setSubmitting(true)
    try {
      await createKnowledgeScript({
        scene: form.scene.trim(),
        locale: form.locale,
        body: form.body.trim(),
      })
      toast.success(`「${form.scene}」已创建`)
      setCreateOpen(false)
      setForm(emptyScriptForm())
      await onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建话术失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          新建话术
        </Button>
      </div>
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

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-[460px] overflow-auto sm:max-w-[460px]">
          <SheetHeader>
            <SheetTitle>新建销售话术</SheetTitle>
            <SheetDescription>按场景维护可复用的销售沟通话术</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">使用场景</Label>
              <Input
                className="h-9 text-xs"
                value={form.scene}
                onChange={(e) => setForm((f) => ({ ...f, scene: e.target.value }))}
                placeholder="例如 首次开发信 · 询盘响应"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">语言区域</Label>
              <Select value={form.locale} onValueChange={(v) => v && setForm((f) => ({ ...f, locale: v }))}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALE_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">话术正文</Label>
              <Textarea
                className="min-h-[160px] text-xs"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="输入完整话术内容"
              />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 p-4 pt-0">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button size="sm" disabled={submitting} onClick={() => void handleCreate()}>
              {submitting ? "创建中…" : "创建"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

function PromptsTab({ items, onRefresh }: { items: UiPrompt[]; onRefresh: () => Promise<void> }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<PromptForm>(emptyPromptForm)

  async function handleEdit(p: UiPrompt) {
    if (!p.body || isMockId(String(p.id), "p")) {
      toast.success(`已复制「${p.scene}」提示词`)
      return
    }
    const next = typeof window !== "undefined" ? window.prompt(`编辑提示词「${p.scene}」`, p.body || "") : null
    if (next == null) return
    try {
      await updateKnowledgePrompt(p.id, { body: next, name: p.scene })
      toast.success(`「${p.scene}」已更新落库`)
      await onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新提示词失败")
    }
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.body.trim()) {
      toast.error("请填写名称与正文")
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        agentDomain: UI_AGENT_CODE[form.agentKey] ?? UI_AGENT_CODE.content,
        body: form.body.trim(),
        versionLabel: form.versionLabel.trim() || "v1",
      }
      if (form.promptCode.trim()) {
        payload.promptCode = form.promptCode.trim()
      }
      await createKnowledgePrompt(payload)
      toast.success(`「${form.name}」已创建`)
      setCreateOpen(false)
      setForm(emptyPromptForm())
      await onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建提示词失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          新建提示词
        </Button>
      </div>
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
                const meta = agentMeta[p.agent] ?? agentMeta.content
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
                      <Badge variant="outline" className="font-mono text-[10px]">
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

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-[460px] overflow-auto sm:max-w-[460px]">
          <SheetHeader>
            <SheetTitle>新建 Agent 提示词</SheetTitle>
            <SheetDescription>维护各智能体场景下的系统提示词</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">提示词名称</Label>
              <Input
                className="h-9 text-xs"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例如 细分市场趋势扫描"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">提示词编码（可选）</Label>
              <Input
                className="h-9 text-xs"
                value={form.promptCode}
                onChange={(e) => setForm((f) => ({ ...f, promptCode: e.target.value }))}
                placeholder="留空则自动生成"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">归属智能体</Label>
              <Select value={form.agentKey} onValueChange={(v) => v && setForm((f) => ({ ...f, agentKey: v }))}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_OPTIONS.map((a) => (
                    <SelectItem key={a.key} value={a.key}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">版本标签</Label>
              <Input
                className="h-9 text-xs"
                value={form.versionLabel}
                onChange={(e) => setForm((f) => ({ ...f, versionLabel: e.target.value }))}
                placeholder="v1"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">提示词正文</Label>
              <Textarea
                className="min-h-[160px] text-xs"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="输入系统提示词内容"
              />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 p-4 pt-0">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button size="sm" disabled={submitting} onClick={() => void handleCreate()}>
              {submitting ? "创建中…" : "创建"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function KnowledgeCenterPage() {
  const [tab, setTab] = useState("templates")
  const [templates, setTemplates] = useState<UiTemplate[]>(mockTemplates)
  const [scripts, setScripts] = useState<UiScript[]>(mockScripts)
  const [prompts, setPrompts] = useState<UiPrompt[]>(mockPrompts)

  const refreshTemplates = useCallback(async () => {
    try {
      const rows = await loadKnowledgeTemplates()
      if (rows.length) setTemplates(rows.map(mapTemplate))
    } catch {
      /* keep mock fallback */
    }
  }, [])

  const refreshScripts = useCallback(async () => {
    try {
      const rows = await loadKnowledgeScripts()
      if (rows.length) setScripts(rows.map(mapScript))
    } catch {
      /* keep mock fallback */
    }
  }, [])

  const refreshPrompts = useCallback(async () => {
    try {
      const rows = await loadKnowledgePrompts()
      if (rows.length) setPrompts(rows.map(mapPrompt))
    } catch {
      /* keep mock fallback */
    }
  }, [])

  useEffect(() => {
    void Promise.all([
      refreshTemplates().catch(() => null),
      refreshScripts().catch(() => null),
      refreshPrompts().catch(() => null),
    ])
  }, [refreshTemplates, refreshScripts, refreshPrompts])

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
          <TemplatesTab items={templates} onRefresh={refreshTemplates} />
        </TabsContent>
        <TabsContent value="scripts" className="mt-4">
          <ScriptsTab items={scripts} onRefresh={refreshScripts} />
        </TabsContent>
        <TabsContent value="prompts" className="mt-4">
          <PromptsTab items={prompts} onRefresh={refreshPrompts} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
