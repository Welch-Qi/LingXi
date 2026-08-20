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
import { deleteEmployee, loadEmployees, saveEmployee } from "@/lib/bapi"
import { employees as initialEmployees, type Employee } from "@/lib/mocks/data-center-employees"

const statusBadgeClass: Record<Employee["employmentStatus"], string> = {
  在职: "bg-green-100 text-green-700",
  试用期: "bg-amber-100 text-amber-700",
  离职: "bg-zinc-100 text-zinc-500",
}

function emptyEmployee(): Employee {
  return {
    id: `em-${Date.now()}`,
    code: `EMP-${Math.floor(30000 + Math.random() * 9999)}`,
    name: "",
    department: "",
    role: "普通员工",
    position: "",
    employmentStatus: "试用期",
    email: "",
    joinDate: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}

function EmployeesListView({
  employees,
  onSelect,
  onCreate,
}: {
  employees: Employee[]
  onSelect: (id: string) => void
  onCreate: () => void
}) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (statusFilter !== "all" && e.employmentStatus !== statusFilter) return false
      if (query && !e.name.toLowerCase().includes(query.toLowerCase()) && !e.code.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [employees, statusFilter, query])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-56 pl-8" placeholder="搜索员工姓名或编码" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-32">
              <SelectValue>{() => (statusFilter === "all" ? "全部状态" : statusFilter)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="在职">在职</SelectItem>
              <SelectItem value="试用期">试用期</SelectItem>
              <SelectItem value="离职">离职</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="size-3.5" />
          新建员工
        </Button>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>员工编码</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>组织架构</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>岗位</TableHead>
                <TableHead>入职日期</TableHead>
                <TableHead>在职状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id} className="cursor-pointer" onClick={() => onSelect(e.id)}>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{e.code}</TableCell>
                  <TableCell className="text-xs font-medium">{e.name}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-muted-foreground">{e.department}</TableCell>
                  <TableCell className="text-muted-foreground">{e.role}</TableCell>
                  <TableCell className="text-muted-foreground">{e.position}</TableCell>
                  <TableCell className="text-muted-foreground">{e.joinDate}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusBadgeClass[e.employmentStatus]}`}>{e.employmentStatus}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); onSelect(e.id) }}>
                      <Pencil className="size-3" />
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-xs text-muted-foreground">没有匹配的员工</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function EmployeeDetailView({
  employee,
  isNew,
  onBack,
  onSave,
  onDelete,
}: {
  employee: Employee
  isNew: boolean
  onBack: () => void
  onSave: (employee: Employee) => void
  onDelete: (id: string) => void
}) {
  const [draft, setDraft] = useState<Employee>(employee)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          返回员工列表
        </Button>
        <div className="flex gap-2">
          {!isNew && (
            <Button size="sm" variant="outline" onClick={() => onDelete(draft.id)}>
              <Trash2 className="size-3.5" />
              删除员工
            </Button>
          )}
          <Button size="sm" onClick={() => onSave(draft)}>
            <Save className="size-3.5" />
            保存员工
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader className="pb-2"><CardTitle className="text-xs">基本信息</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 pt-0">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">员工编码</Label>
            <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">姓名</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">联系邮箱</Label>
            <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">组织架构</Label>
            <Input value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">角色</Label>
            <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v as Employee["role"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="管理员">管理员</SelectItem>
                <SelectItem value="业务负责人">业务负责人</SelectItem>
                <SelectItem value="普通员工">普通员工</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">岗位</Label>
            <Input value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">入职日期</Label>
            <Input type="date" value={draft.joinDate} onChange={(e) => setDraft({ ...draft, joinDate: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground">在职状态</Label>
            <Select value={draft.employmentStatus} onValueChange={(v) => setDraft({ ...draft, employmentStatus: v as Employee["employmentStatus"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="在职">在职</SelectItem>
                <SelectItem value="试用期">试用期</SelectItem>
                <SelectItem value="离职">离职</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function EmployeeMasterTab() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    void loadEmployees()
      .then((rows) => { if (rows.length) setEmployees(rows) })
      .catch(() => { /* keep mock */ })
  }, [])

  const selected = selectedId ? employees.find((e) => e.id === selectedId) ?? null : null

  function handleCreate() {
    const draft = emptyEmployee()
    setEmployees((prev) => [draft, ...prev])
    setSelectedId(draft.id)
    setIsNew(true)
  }

  async function handleSave(updated: Employee) {
    try {
      const saved = await saveEmployee(updated, isNew)
      setEmployees((prev) => {
        const withoutDraft = prev.filter((e) => e.id !== updated.id)
        return [saved, ...withoutDraft.filter((e) => e.id !== saved.id)]
      })
      toast.success(`「${saved.name || "未命名员工"}」已保存`)
      setSelectedId(null)
      setIsNew(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存员工失败")
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEmployee(id)
      setEmployees((prev) => prev.filter((e) => e.id !== id))
      toast.success("员工已删除")
      setSelectedId(null)
      setIsNew(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除员工失败")
    }
  }

  if (selected) {
    return (
      <EmployeeDetailView
        employee={selected}
        isNew={isNew}
        onBack={() => { setSelectedId(null); setIsNew(false) }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    )
  }

  return <EmployeesListView employees={employees} onSelect={(id) => { setSelectedId(id); setIsNew(false) }} onCreate={handleCreate} />
}
