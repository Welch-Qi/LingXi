"use client"
// @ts-nocheck — design dump

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Pencil, Plus, Save, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deleteChannel, loadChannels, saveChannel } from "@/lib/bapi"
import { channels as initialChannels, type Channel } from "@/lib/mocks/data-center-channels"

const statusBadgeClass: Record<Channel["cooperationStatus"], string> = {
  合作中: "bg-green-100 text-green-700",
  洽谈中: "bg-amber-100 text-amber-700",
  已暂停: "bg-zinc-100 text-zinc-500",
  已终止: "bg-red-100 text-red-700",
}

function emptyChannel(): Channel {
  return {
    id: `ch-${Date.now()}`,
    code: `CHN-${Math.floor(2000 + Math.random() * 7999)}`,
    name: "",
    type: "线上电商",
    coverageRegion: "",
    cooperationStatus: "洽谈中",
    owner: "",
    monthlyGmv: "$0",
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}

function ChannelsListView({
  channels,
  onSelect,
  onCreate,
}: {
  channels: Channel[]
  onSelect: (id: string) => void
  onCreate: () => void
}) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    return channels.filter((c) => {
      if (statusFilter !== "all" && c.cooperationStatus !== statusFilter) return false
      if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.code.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [channels, statusFilter, query])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-56 pl-8" placeholder="搜索渠道名称或编码" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-32">
              <SelectValue>{() => (statusFilter === "all" ? "全部状态" : statusFilter)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="合作中">合作中</SelectItem>
              <SelectItem value="洽谈中">洽谈中</SelectItem>
              <SelectItem value="已暂停">已暂停</SelectItem>
              <SelectItem value="已终止">已终止</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="size-3.5" />
          新建渠道
        </Button>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>渠道编码</TableHead>
                <TableHead>渠道名称</TableHead>
                <TableHead>渠道类型</TableHead>
                <TableHead>覆盖区域</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>月度 GMV</TableHead>
                <TableHead>合作状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => onSelect(c.id)}>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{c.code}</TableCell>
                  <TableCell className="text-xs font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.type}</TableCell>
                  <TableCell className="text-muted-foreground">{c.coverageRegion}</TableCell>
                  <TableCell className="text-muted-foreground">{c.owner}</TableCell>
                  <TableCell>{c.monthlyGmv}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusBadgeClass[c.cooperationStatus]}`}>{c.cooperationStatus}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSelect(c.id) }}>
                      <Pencil className="size-3" />
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-xs text-muted-foreground">没有匹配的渠道</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ChannelDetailView({
  channel,
  isNew,
  onBack,
  onSave,
  onDelete,
}: {
  channel: Channel
  isNew: boolean
  onBack: () => void
  onSave: (channel: Channel) => void
  onDelete: (id: string) => void
}) {
  const [draft, setDraft] = useState<Channel>(channel)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          返回渠道列表
        </Button>
        <div className="flex gap-2">
          {!isNew && (
            <Button size="sm" variant="outline" onClick={() => onDelete(draft.id)}>
              <Trash2 className="size-3.5" />
              删除渠道
            </Button>
          )}
          <Button size="sm" onClick={() => onSave(draft)}>
            <Save className="size-3.5" />
            保存渠道
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader className="pb-2"><CardTitle className="text-xs">基本信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 pt-0">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">渠道编码</Label>
            <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">渠道名称</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">渠道类型</Label>
            <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as Channel["type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="线上电商">线上电商</SelectItem>
                <SelectItem value="线下经销">线下经销</SelectItem>
                <SelectItem value="直营门店">直营门店</SelectItem>
                <SelectItem value="分销代理">分销代理</SelectItem>
                <SelectItem value="社交媒体">社交媒体</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">覆盖区域</Label>
            <Input value={draft.coverageRegion} onChange={(e) => setDraft({ ...draft, coverageRegion: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">负责人</Label>
            <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">月度 GMV</Label>
            <Input value={draft.monthlyGmv} onChange={(e) => setDraft({ ...draft, monthlyGmv: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">合作状态</Label>
            <Select value={draft.cooperationStatus} onValueChange={(v) => setDraft({ ...draft, cooperationStatus: v as Channel["cooperationStatus"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="合作中">合作中</SelectItem>
                <SelectItem value="洽谈中">洽谈中</SelectItem>
                <SelectItem value="已暂停">已暂停</SelectItem>
                <SelectItem value="已终止">已终止</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ChannelMasterTab() {
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    void loadChannels()
      .then((rows) => { if (rows.length) setChannels(rows) })
      .catch(() => { /* keep mock */ })
  }, [])

  const selected = selectedId ? channels.find((c) => c.id === selectedId) ?? null : null

  function handleCreate() {
    const draft = emptyChannel()
    setChannels((prev) => [draft, ...prev])
    setSelectedId(draft.id)
    setIsNew(true)
  }

  async function handleSave(updated: Channel) {
    try {
      const saved = await saveChannel(updated, isNew)
      setChannels((prev) => {
        const withoutDraft = prev.filter((c) => c.id !== updated.id)
        return [saved, ...withoutDraft.filter((c) => c.id !== saved.id)]
      })
      toast.success(`「${saved.name || "未命名渠道"}」已保存`)
      setSelectedId(null)
      setIsNew(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存渠道失败")
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteChannel(id)
      setChannels((prev) => prev.filter((c) => c.id !== id))
      toast.success("渠道已删除")
      setSelectedId(null)
      setIsNew(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除渠道失败")
    }
  }

  if (selected) {
    return (
      <ChannelDetailView
        channel={selected}
        isNew={isNew}
        onBack={() => { setSelectedId(null); setIsNew(false) }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    )
  }

  return <ChannelsListView channels={channels} onSelect={(id) => { setSelectedId(id); setIsNew(false) }} onCreate={handleCreate} />
}
