import { PageHeader } from "@/components/app-shell/page-header";
import { getDashboardStats } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { currency, formatDate, deadlineTone } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/types";
import { ArrowUpRight, Clock, AlertTriangle, DollarSign, Package, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const stats = await getDashboardStats();
  const supabase = createClient();
  const { data: recent } = await supabase
    .from("orders")
    .select("id, order_number, product_name, status, priority, deadline, quantity, unit_price, customer:customers(name, company)")
    .order("created_at", { ascending: false })
    .limit(8);

  const activeCount = ORDER_STATUSES.filter(s => s !== "Delivered" && s !== "Cancelled").reduce((n, s) => n + (stats.byStatus[s] ?? 0), 0);

  const kpis = [
    { label: "Pipeline value", value: currency(stats.pipelineValue), icon: DollarSign, hint: "Open order backlog" },
    { label: "Active orders", value: activeCount.toString(), icon: Package, hint: `${stats.total} total` },
    { label: "Customers", value: stats.customerCount.toString(), icon: Users, hint: "All accounts" },
    { label: "Overdue", value: stats.overdue.toString(), icon: AlertTriangle, hint: `${stats.urgent} urgent` },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations overview</h1>
          <p className="text-sm text-muted-foreground mt-1">A live read on pipeline, floor, and account health.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="mt-2 text-2xl font-semibold tabular tracking-tight">{k.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{k.hint}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent orders</CardTitle>
                <CardDescription>Latest activity across all customers</CardDescription>
              </div>
              <Link href="/orders" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-t border-border">
                    <th className="text-left font-medium px-5 py-2">Order</th>
                    <th className="text-left font-medium px-5 py-2">Customer</th>
                    <th className="text-left font-medium px-5 py-2">Status</th>
                    <th className="text-left font-medium px-5 py-2">Deadline</th>
                    <th className="text-right font-medium px-5 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(recent ?? []).map((o: any) => {
                    const tone = deadlineTone(o.deadline);
                    return (
                      <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-2.5">
                          <Link href={`/orders/${o.id}`} className="font-mono text-[12px] text-foreground hover:underline">{o.order_number}</Link>
                          <div className="text-xs text-muted-foreground">{o.product_name}</div>
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="font-medium text-[13px]">{o.customer?.name}</div>
                          <div className="text-xs text-muted-foreground">{o.customer?.company}</div>
                        </td>
                        <td className="px-5 py-2.5"><StatusBadge status={o.status} /></td>
                        <td className={`px-5 py-2.5 text-[13px] tabular ${tone === "overdue" ? "text-destructive font-medium" : tone === "soon" ? "text-amber-600" : ""}`}>
                          {formatDate(o.deadline)}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular text-[13px]">{currency(Number(o.quantity) * Number(o.unit_price))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Pipeline by status</CardTitle>
              <CardDescription>Order distribution right now</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ORDER_STATUSES.map((s) => {
                const n = stats.byStatus[s] ?? 0;
                const pct = stats.total ? Math.round((n / stats.total) * 100) : 0;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2"><StatusBadge status={s} /></div>
                      <span className="tabular text-muted-foreground">{n} · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
