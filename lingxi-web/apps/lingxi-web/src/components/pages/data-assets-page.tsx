"use client"
// @ts-nocheck — design dump
import { useState } from "react"
import { Package, ShieldCheck, Store, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { channels } from "@/lib/mocks/data-center-channels"
import { customers } from "@/lib/mocks/data-center-customers"
import { employees } from "@/lib/mocks/data-center-employees"
import { products } from "@/lib/mocks/data-center-products"
import { ChannelMasterTab } from "@/components/pages/data-center/channel-master-tab"
import { CustomerMasterTab } from "@/components/pages/data-center/customer-master-tab"
import { EmployeeMasterTab } from "@/components/pages/data-center/employee-master-tab"
import { ProductMasterTab } from "@/components/pages/data-center/product-master-tab"

// ─── main page ────────────────────────────────────────────────────────────────
// 一期范围：数据中心 = 四大主数据域（客户 DC-01 / 商品 DC-02 / 渠道 DC-03 / 员工 DC-04）
export function DataAssetsPage() {
  const [tab, setTab] = useState("customers")

  const stats = [
    { l: "客户主数据", v: customers.length, s: `${customers.filter((c) => c.status === "合作中").length} 合作中`, i: Users },
    { l: "商品主数据", v: products.length, s: `${products.filter((p) => p.status === "在售").length} 在售`, i: Package },
    { l: "渠道主数据", v: channels.length, s: `${channels.filter((c) => c.cooperationStatus === "合作中").length} 合作中`, i: Store },
    { l: "员工主数据", v: employees.length, s: `${employees.filter((e) => e.employmentStatus === "在职").length} 在职`, i: ShieldCheck },
  ]

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((x) => (
          <Card key={x.l}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardDescription>{x.l}</CardDescription>
                  <CardTitle className="mt-2 text-3xl">{x.v}</CardTitle>
                </div>
                <x.i className="size-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{x.s}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => { if (v) setTab(v) }}>
        <TabsList>
          <TabsTrigger value="customers"><Users className="size-3.5" />客户主数据</TabsTrigger>
          <TabsTrigger value="products"><Package className="size-3.5" />商品主数据</TabsTrigger>
          <TabsTrigger value="channels"><Store className="size-3.5" />渠道主数据</TabsTrigger>
          <TabsTrigger value="employees"><ShieldCheck className="size-3.5" />员工主数据</TabsTrigger>
        </TabsList>
        <TabsContent value="customers" className="mt-4"><CustomerMasterTab /></TabsContent>
        <TabsContent value="products" className="mt-4"><ProductMasterTab /></TabsContent>
        <TabsContent value="channels" className="mt-4"><ChannelMasterTab /></TabsContent>
        <TabsContent value="employees" className="mt-4"><EmployeeMasterTab /></TabsContent>
      </Tabs>
    </div>
  )
}
