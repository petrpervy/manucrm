import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { getPos, PO_STATUSES, rub } from "@/lib/wb";
import { formatDate, deadlineTone } from "@/lib/utils";
import { PoStatusBadge } from "./status-badge";

export const dynamic = "force-dynamic";

export default async function PosPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const pos = await getPos({ status: searchParams.status && searchParams.status !== "all" ? searchParams.status : undefined, q: searchParams.q });

  return (
    <>
      <PageHeader title="Production Orders" />
      <div className="px-8 py-6 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Production Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">{pos.length} POs</p>
          </div>
          <Button asChild variant="primary"><Link href="/pos/new"><Plus className="h-3.5 w-3.5" />New PO</Link></Button>
        </div>

        <form className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search PO # or product…" className="pl-8" />
          </div>
          <Select name="status" defaultValue={searchParams.status ?? "all"} className="w-48">
            <option value="all">All statuses</option>
            {PO_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Button type="submit" variant="outline"><Filter className="h-3.5 w-3.5" />Apply</Button>
        </form>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">PO</th>
                <th className="text-left font-medium px-5 py-2.5">Product</th>
                <th className="text-left font-medium px-5 py-2.5">Vendor</th>
                <th className="text-left font-medium px-5 py-2.5">Status</th>
                <th className="text-left font-medium px-5 py-2.5">Deadline</th>
                <th className="text-right font-medium px-5 py-2.5">Qty</th>
                <th className="text-right font-medium px-5 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((p) => {
                const tone = deadlineTone(p.deadline);
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-2.5">
                      <Link href={`/pos/${p.id}`} className="font-mono text-[12px] hover:underline">{p.po_number}</Link>
                      <div className="text-xs text-muted-foreground">арт. {p.product_article ?? "—"}</div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="font-medium text-[13px]">{p.product_name}</div>
                      <div className="text-xs text-muted-foreground">{p.product_variant}</div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="text-[13px]">{p.vendor_company}</div>
                      <div className="text-xs text-muted-foreground">{p.vendor_country}</div>
                    </td>
                    <td className="px-5 py-2.5"><PoStatusBadge status={p.status} /></td>
                    <td className={`px-5 py-2.5 text-[13px] tabular ${tone === "overdue" ? "text-destructive font-medium" : tone === "soon" ? "text-amber-600" : ""}`}>{formatDate(p.deadline)}</td>
                    <td className="px-5 py-2.5 text-right tabular text-[13px]">{p.quantity}</td>
                    <td className="px-5 py-2.5 text-right tabular text-[13px] font-medium">{rub(p.total_cost_rub)}</td>
                  </tr>
                );
              })}
              {pos.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No POs yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
