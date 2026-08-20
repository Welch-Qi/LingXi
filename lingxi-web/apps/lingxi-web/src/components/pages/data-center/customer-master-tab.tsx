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
import { deleteCustomer, loadCustomers, saveCustomer } from "@/lib/bapi"
import { customers as initialCustomers, type Customer } from "@/lib/mocks/data-center-customers"

const statusBadgeClass: Record<Customer["status"], string> = {
  合作中: "bg-green-100 text-green-700",
  潜在客户: "bg-amber-100 text-amber-700",
  暂停合作: "bg-zinc-100 text-zinc-500",
  已终止: "bg-red-100 text-red-700",
}

function emptyCustomer(): Customer {
  return {
    id: `cu-${Date.now()}`,
    code: `CUS-${Math.floor(10000 + Math.random() * 89999)}`,
    name: "",
    nameEn: "",
    type: "终端客户",
    country: "",
    region: "",
    industry: "",
    scale: "小型",
    creditRating: "BBB",
    status: "潜在客户",
    contactPerson: "",
    email: "",
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}

function CustomersListView({
  customers,
  onSelect,
  onCreate,
}: {
  customers: Customer[]
  onSelect: (id: string) => void
  onCreate: () => void
}) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.code.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [customers, statusFilter, query])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-56 pl-8" placeholder="搜索客户名称或编码" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-32">
              <SelectValue>{() => (statusFilter === "all" ? "全部状态" : statusFilter)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="合作中">合作中</SelectItem>
              <SelectItem value="潜在客户">潜在客户</SelectItem>
              <SelectItem value="暂停合作">暂停合作</SelectItem>
              <SelectItem value="已终止">已终止</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="size-3.5" />
          新建客户
        </Button>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户编码</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>国家/区域</TableHead>
                <TableHead>行业</TableHead>
                <TableHead>规模</TableHead>
                <TableHead>信用等级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => onSelect(c.id)}>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{c.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground">{c.nameEn}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.type}</TableCell>
                  <TableCell className="text-muted-foreground">{c.country} · {c.region}</TableCell>
                  <TableCell className="text-muted-foreground">{c.industry}</TableCell>
                  <TableCell className="text-muted-foreground">{c.scale}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{c.creditRating}</Badge></TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusBadgeClass[c.status]}`}>{c.status}</Badge></TableCell>
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
                  <TableCell colSpan={9} className="py-10 text-center text-xs text-muted-foreground">没有匹配的客户</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function CustomerDetailView({
  customer,
  isNew,
  onBack,
  onSave,
  onDelete,
}: {
  customer: Customer
  isNew: boolean
  onBack: () => void
  onSave: (customer: Customer) => void
  onDelete: (id: string) => void
}) {
  const [draft, setDraft] = useState<Customer>(customer)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          返回客户列表
        </Button>
        <div className="flex gap-2">
          {!isNew && (
            <Button size="sm" variant="outline" onClick={() => onDelete(draft.id)}>
              <Trash2 className="size-3.5" />
              删除客户
            </Button>
          )}
          <Button size="sm" onClick={() => onSave(draft)}>
            <Save className="size-3.5" />
            保存客户
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader className="pb-2"><CardTitle className="text-xs">基本信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 pt-0">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">客户编码</Label>
            <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">客户名称（中文）</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">客户名称（英文）</Label>
            <Input value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">客户类型</Label>
            <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as Customer["type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="终端客户">终端客户</SelectItem>
                <SelectItem value="代理商">代理商</SelectItem>
                <SelectItem value="经销商">经销商</SelectItem>
                <SelectItem value="战略伙伴">战略伙伴</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">国家</Label>
            <Input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">区域</Label>
            <Input value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">所属行业</Label>
            <Input value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">客户规模</Label>
            <Select value={draft.scale} onValueChange={(v) => setDraft({ ...draft, scale: v as Customer["scale"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="大型">大型</SelectItem>
                <SelectItem value="中型">中型</SelectItem>
                <SelectItem value="小型">小型</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">信用等级</Label>
            <Select value={draft.creditRating} onValueChange={(v) => setDraft({ ...draft, creditRating: v as Customer["creditRating"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["AAA", "AA", "A", "BBB", "BB"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">合作状态</Label>
            <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Customer["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="合作中">合作中</SelectItem>
                <SelectItem value="潜在客户">潜在客户</SelectItem>
                <SelectItem value="暂停合作">暂停合作</SelectItem>
                <SelectItem value="已终止">已终止</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">联系人</Label>
            <Input value={draft.contactPerson} onChange={(e) => setDraft({ ...draft, contactPerson: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">联系邮箱</Label>
            <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CustomerMasterTab() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    void loadCustomers()
      .then((rows) => { if (rows.length) setCustomers(rows) })
      .catch(() => { /* keep mock */ })
  }, [])

  const selected = selectedId ? customers.find((c) => c.id === selectedId) ?? null : null

  function handleCreate() {
    const draft = emptyCustomer()
    setCustomers((prev) => [draft, ...prev])
    setSelectedId(draft.id)
    setIsNew(true)
  }

  async function handleSave(updated: Customer) {
    try {
      const saved = await saveCustomer(updated, isNew)
      setCustomers((prev) => {
        const withoutDraft = prev.filter((c) => c.id !== updated.id)
        return [saved, ...withoutDraft.filter((c) => c.id !== saved.id)]
      })
      toast.success(`「${saved.name || "未命名客户"}」已保存`)
      setSelectedId(null)
      setIsNew(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存客户失败，已保留本地草稿")
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? { ...updated, updatedAt: new Date().toISOString().slice(0, 10) } : c)))
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCustomer(id)
      setCustomers((prev) => prev.filter((c) => c.id !== id))
      toast.success("客户已删除")
      setSelectedId(null)
      setIsNew(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除客户失败")
    }
  }

  if (selected) {
    return (
      <CustomerDetailView
        customer={selected}
        isNew={isNew}
        onBack={() => { setSelectedId(null); setIsNew(false) }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    )
  }

  return <CustomersListView customers={customers} onSelect={(id) => { setSelectedId(id); setIsNew(false) }} onCreate={handleCreate} />
}
