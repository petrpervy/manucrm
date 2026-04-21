import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Warehouse as WarehouseIcon, AlertTriangle, Wallet, ScrollText, Truck } from "lucide-react";
import { getWbDashboard, rub, PO_STATUSES } from "@/lib/wb";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const d = await getWbDashboard();
  const activePos = d.pos.draft + d.pos.sent + d.pos.in_production + d.pos.shipped;

  const kpis = [
    { label: "Low-stock SKUs", value: d.lowStock.length.toString(), icon: AlertTriangle, hint: `out of ${d.productCount} total`, tone: d.lowStock.length > 0 ? "warn" : "ok" },
    { label: "Open POs", value: activePos.toString(), icon: ScrollText, hint: `${d.pos.in_production} in production` },
    { label: "Value in flight", value: rub(d.pos.open_value), icon: Wallet, hint: "Draft → Shipped" },
    { label: "Vendors", value: d.vendorCount.toString(), icon: Truck, hint: "Active manufacturers" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Stock, POs, and vendors across your Wildberries catalog.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                    <Icon className={`h-3.5 w-3.5 ${k.tone === "warn" ? "text-amber-500" : "text-muted-foreground"}`} />
                  </div>
                  <div className={`mt-2 text-2xl font-semibold tabular tracking-tight ${k.tone === "warn" ? "text-amber-600" : ""}`}>{k.value}</div>
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
                <CardTitle>Reorder alerts</CardTitle>
                <CardDescription>SKUs at or below reorder point</CardDescription>
              </div>
              <Link href="/warehouse" className="text-xs text-primary hover:underline">Warehouse →</Link>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-t border-border">
                    <th className="text-left font-medium px-5 py-2">Артикул</th>
                    <th className="text-left font-medium px-5 py-2">Product</th>
                    <th className="text-right font-medium px-5 py-2">On hand</th>
                    <th className="text-right font-medium px-5 py-2">In transit</th>
                    <th className="text-right font-medium px-5 py-2">At WB</th>
                    <th className="text-right font-medium px-5 py-2">Reorder ≤</th>
                  </tr>
                </thead>
                <tbody>
                  {d.lowStock.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">All SKUs are above reorder point.</td></tr>
                  ) : d.lowStock.map((s) => (
                    <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-5 py-2.5 font-mono text-[12px]">{s.wb_article}</td>
                      <td className="px-5 py-2.5">
                        <div className="font-medium text-[13px]">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.variant}</div>
                      </td>
                      <td className="px-5 py-2.5 text-right tabular text-[13px] text-destructive font-medium">{s.qty_on_hand}</td>
                      <td className="px-5 py-2.5 text-right tabular text-[13px]">{s.qty_in_transit}</td>
                      <td className="px-5 py-2.5 text-right tabular text-[13px]">{s.qty_at_wildberries}</td>
                      <td className="px-5 py-2.5 text-right tabular text-[13px] text-muted-foreground">{s.reorder_point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>POs by status</CardTitle>
              <CardDescription>Production pipeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PO_STATUSES.map((s) => {
                const keyMap: Record<string, keyof typeof d.pos> = {
                  "Draft": "draft",
                  "Sent to Vendor": "sent",
                  "In Production": "in_production",
                  "Shipped": "shipped",
                  "Received": "received",
                  "Cancelled": "total", // not tracked; shown as 0
                };
                const k = keyMap[s];
                const n = s === "Cancelled" ? 0 : (Number((d.pos as any)[k]) || 0);
                const pct = d.pos.total ? Math.round((n / d.pos.total) * 100) : 0;
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium">{s}</span>
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
