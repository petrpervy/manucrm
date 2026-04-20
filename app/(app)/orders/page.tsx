import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { formatDate, currency, deadlineTone } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const supabase = createClient();
  let query = supabase.from("orders").select("*, customer:customers(name, company)").order("created_at", { ascending: false });
  if (searchParams.status && searchParams.status !== "all") query = query.eq("status", searchParams.status);
  if (searchParams.q) query = query.or(`order_number.ilike.%${searchParams.q}%,product_name.ilike.%${searchParams.q}%`);
  const { data: orders } = await query;

  return (
    <>
      <PageHeader title="Orders" />
      <div className="px-8 py-6 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">{orders?.length ?? 0} orders</p>
          </div>
          <Button asChild variant="primary"><Link href="/orders/new"><Plus className="h-3.5 w-3.5" />New order</Link></Button>
        </div>

        <form className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search order # or product…" className="pl-8" />
          </div>
          <Select name="status" defaultValue={searchParams.status ?? "all"} className="w-40">
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Button type="submit" variant="outline"><Filter className="h-3.5 w-3.5" />Apply</Button>
        </form>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Order</th>
                <th className="text-left font-medium px-5 py-2.5">Customer</th>
                <th className="text-left font-medium px-5 py-2.5">Status</th>
                <th className="text-left font-medium px-5 py-2.5">Priority</th>
                <th className="text-left font-medium px-5 py-2.5">Deadline</th>
                <th className="text-right font-medium px-5 py-2.5">Qty</th>
                <th className="text-right font-medium px-5 py-2.5">Value</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((o: any) => {
                const tone = deadlineTone(o.deadline);
                return (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-2.5">
                      <Link href={`/orders/${o.id}`} className="font-mono text-[12px] hover:underline">{o.order_number}</Link>
                      <div className="text-xs text-muted-foreground">{o.product_name}</div>
                    </td>
                    <td className="px-5 py-2.5">
                      <Link href={`/customers/${o.customer_id}`} className="font-medium text-[13px] hover:underline">{o.customer?.name}</Link>
                      <div className="text-xs text-muted-foreground">{o.customer?.company}</div>
                    </td>
                    <td className="px-5 py-2.5"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-2.5"><PriorityBadge priority={o.priority} /></td>
                    <td className={`px-5 py-2.5 text-[13px] tabular ${tone === "overdue" ? "text-destructive font-medium" : tone === "soon" ? "text-amber-600" : ""}`}>{formatDate(o.deadline)}</td>
                    <td className="px-5 py-2.5 text-right tabular text-[13px]">{o.quantity}</td>
                    <td className="px-5 py-2.5 text-right tabular text-[13px] font-medium">{currency(Number(o.quantity) * Number(o.unit_price))}</td>
                  </tr>
                );
              })}
              {(!orders || orders.length === 0) && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
