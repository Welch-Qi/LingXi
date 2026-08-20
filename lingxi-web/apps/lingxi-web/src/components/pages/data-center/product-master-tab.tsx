"use client"
// @ts-nocheck — design dump

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Package, Pencil, Plus, Save, Search, Tag, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { deleteProduct, loadProducts, saveProduct } from "@/lib/bapi"
import { productCategories, products as initialProducts, type Product, type ProductCategory } from "@/lib/mocks/data-center-products"

// ─── 商品类别 sub-tab ────────────────────────────────────────────────────────────
function CategoriesSubTab({ productCount }: { productCount: (categoryId: string) => number }) {
  const [categories, setCategories] = useState<ProductCategory[]>(productCategories)

  function toggleStatus(id: string) {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const next = c.status === "启用" ? "停用" : "启用"
        toast.success(`「${c.name}」已${next}`)
        return { ...c, status: next }
      }),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">共 {categories.length} 个商品类别，用于组织「商品主数据」中的商品归属。</p>
        <Button size="sm" onClick={() => toast.success("即将开放新建类别功能")}>
          <Plus className="size-3.5" />
          新建类别
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {categories
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((c) => (
            <Card key={c.id} className="shadow-none">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-lg">{c.icon}</span>
                    <div>
                      <p className="text-xs font-semibold">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">排序 {c.sortOrder}</p>
                    </div>
                  </div>
                  <Badge className={c.status === "启用" ? "bg-green-100 text-[10px] text-green-700" : "bg-zinc-100 text-[10px] text-zinc-500"}>
                    {c.status}
                  </Badge>
                </div>
                <p className="text-[11px] leading-5 text-muted-foreground">{c.description}</p>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    包含商品 <strong className="text-foreground">{productCount(c.id)}</strong> 个
                  </span>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => toast.success(`正在编辑「${c.name}」`)}>
                      <Pencil className="size-3" />
                      编辑
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(c.id)}>
                      {c.status === "启用" ? "停用" : "启用"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}

// ─── 商品配置 sub-tab — list + detail edit ──────────────────────────────────────
const statusBadgeClass: Record<Product["status"], string> = {
  在售: "bg-green-100 text-green-700",
  下架: "bg-zinc-100 text-zinc-500",
  草稿: "bg-amber-100 text-amber-700",
}

function ProductsListView({
  products,
  categoryName,
  onSelect,
  onCreate,
}: {
  products: Product[]
  categoryName: (id: string) => string
  onSelect: (id: string) => void
  onCreate: () => void
}) {
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (query && !p.name.toLowerCase().includes(query.toLowerCase()) && !p.sku.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [products, categoryFilter, statusFilter, query])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-56 pl-8"
              placeholder="搜索商品名称或 SKU"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
            <SelectTrigger className="w-40">
              <SelectValue>
                {() => (categoryFilter === "all" ? "全部分类" : productCategories.find((c) => c.id === categoryFilter)?.name ?? "全部分类")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {productCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-32">
              <SelectValue>
                {() => (statusFilter === "all" ? "全部状态" : statusFilter)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="在售">在售</SelectItem>
              <SelectItem value="下架">下架</SelectItem>
              <SelectItem value="草稿">草稿</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="size-3.5" />
          新建商品
        </Button>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品</TableHead>
                <TableHead>SKU / 品牌</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>HS 编码</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>库存</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => onSelect(p.id)}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-md border bg-muted">
                        <Image unoptimized src={p.image} alt={p.name} fill className="object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="max-w-[220px] truncate text-xs font-medium">{p.name}</span>
                        <span className="max-w-[220px] truncate text-[10px] text-muted-foreground">{p.nameEn}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-muted-foreground">{p.sku}</span>
                      <span className="text-[10px] text-muted-foreground">{p.brand}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{categoryName(p.categoryId)}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{p.hsCode}</TableCell>
                  <TableCell>{p.currency} {p.price.toLocaleString()}</TableCell>
                  <TableCell className={p.stock === 0 ? "text-red-500" : ""}>{p.stock}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${statusBadgeClass[p.status]}`}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(p.id)
                      }}
                    >
                      <Pencil className="size-3" />
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                    没有匹配的商品
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ProductDetailView({
  product,
  isNew,
  onBack,
  onSave,
  onDelete,
}: {
  product: Product
  isNew: boolean
  onBack: () => void
  onSave: (product: Product) => void
  onDelete: (id: string) => void
}) {
  const [draft, setDraft] = useState<Product>(product)

  function updateSpec(index: number, field: "label" | "value", value: string) {
    setDraft((prev) => {
      const specs = [...prev.specs]
      specs[index] = { ...specs[index], [field]: value }
      return { ...prev, specs }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          返回商品列表
        </Button>
        <div className="flex gap-2">
          {!isNew && (
            <Button size="sm" variant="outline" onClick={() => onDelete(draft.id)}>
              <Trash2 className="size-3.5" />
              删除商品
            </Button>
          )}
          <Button size="sm" onClick={() => onSave(draft)}>
            <Save className="size-3.5" />
            保存商品
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-5">
        <Card className="shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-xs">商品图片</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
              <Image unoptimized src={draft.image} alt={draft.name} fill className="object-cover" />
            </div>
            <Button size="sm" variant="outline" onClick={() => toast.success("即将开放图片上传功能")}>更换图片</Button>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-xs">基本信息</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground">商品名称（中文）</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground">商品名称（英文）</Label>
                <Input value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground">SKU 编码</Label>
                <Input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground">品牌</Label>
                <Input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground">商品分类</Label>
                <Select value={draft.categoryId} onValueChange={(v) => setDraft({ ...draft, categoryId: v ?? draft.categoryId })}>
                  <SelectTrigger>
                    <SelectValue>
                      {() => productCategories.find((c) => c.id === draft.categoryId)?.name ?? "选择分类"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground">HS 编码</Label>
                <Input value={draft.hsCode} onChange={(e) => setDraft({ ...draft, hsCode: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground">上架状态</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Product["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="在售">在售</SelectItem>
                    <SelectItem value="下架">下架</SelectItem>
                    <SelectItem value="草稿">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground">价格</Label>
                <div className="flex gap-2">
                  <Input className="w-16" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} />
                  <Input
                    type="number"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground">库存</Label>
                <Input
                  type="number"
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">商品简介</Label>
              <Textarea
                rows={3}
                value={draft.shortDescription}
                onChange={(e) => setDraft({ ...draft, shortDescription: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader className="pb-2"><CardTitle className="text-xs">规格参数</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-0">
          {draft.specs.map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border p-2.5">
              <Input
                className="w-28 border-none bg-transparent px-1 text-[11px] text-muted-foreground shadow-none"
                value={s.label}
                onChange={(e) => updateSpec(i, "label", e.target.value)}
              />
              <Input
                className="border-none bg-transparent px-1 text-xs font-medium shadow-none"
                value={s.value}
                onChange={(e) => updateSpec(i, "value", e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function emptyProduct(): Product {
  return {
    id: `p-${Date.now()}`,
    name: "",
    nameEn: "",
    sku: "",
    brand: "",
    hsCode: "",
    categoryId: productCategories[0].id,
    price: 0,
    currency: "USD",
    stock: 0,
    status: "草稿",
    image: "/images/agent-analyst.png",
    shortDescription: "",
    specs: [
      { label: "规格 1", value: "" },
      { label: "规格 2", value: "" },
    ],
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}

function ProductsSubTab() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    void loadProducts()
      .then((rows) => { if (rows.length) setProducts(rows) })
      .catch(() => { /* keep mock */ })
  }, [])

  const categoryName = (id: string) => productCategories.find((c) => c.id === id)?.name ?? "未分类"
  const selected = selectedId ? products.find((p) => p.id === selectedId) ?? null : null

  function handleCreate() {
    const draft = emptyProduct()
    setProducts((prev) => [draft, ...prev])
    setSelectedId(draft.id)
    setIsNew(true)
  }

  async function handleSave(updated: Product) {
    try {
      const saved = await saveProduct(updated, isNew)
      setProducts((prev) => {
        const withoutDraft = prev.filter((p) => p.id !== updated.id)
        return [saved, ...withoutDraft.filter((p) => p.id !== saved.id)]
      })
      toast.success(`「${saved.name || "未命名商品"}」已保存`)
      setSelectedId(null)
      setIsNew(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存商品失败")
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success("商品已删除")
      setSelectedId(null)
      setIsNew(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除商品失败")
    }
  }

  if (selected) {
    return (
      <ProductDetailView
        product={selected}
        isNew={isNew}
        onBack={() => { setSelectedId(null); setIsNew(false) }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <ProductsListView
      products={products}
      categoryName={categoryName}
      onSelect={(id) => { setSelectedId(id); setIsNew(false) }}
      onCreate={handleCreate}
    />
  )
}

// ─── entry ────────────────────────────────────────────────────────────────────
export function ProductMasterTab() {
  const [subTab, setSubTab] = useState("products")
  const productCountByCategory = (categoryId: string) => initialProducts.filter((p) => p.categoryId === categoryId).length

  return (
    <Tabs value={subTab} onValueChange={(v) => { if (v) setSubTab(v) }}>
      <TabsList>
        <TabsTrigger value="products"><Package className="size-3.5" />商品配置</TabsTrigger>
        <TabsTrigger value="categories"><Tag className="size-3.5" />商品类别</TabsTrigger>
      </TabsList>
      <TabsContent value="products" className="mt-4"><ProductsSubTab /></TabsContent>
      <TabsContent value="categories" className="mt-4"><CategoriesSubTab productCount={productCountByCategory} /></TabsContent>
    </Tabs>
  )
}
