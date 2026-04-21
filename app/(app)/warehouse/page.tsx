import { PageHeader } from "@/components/app-shell/page-header";
import { Card } from "@/components/ui/card";
import { getStock, rub } from "@/lib/wb";
import { StockRow } from "./stock-row";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WarehousePage() {
  const stock = await getStock();
  const lowCount = stock.filter(s => s.low).length;
  const totalValue = stock.reduce((sum, s) => sum + s.qty_on_hand * s.cost_rub, 0);

  return (
    <>
      <PageHeader title="Warehouse" />
      <div className="px-8 py-6 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Warehouse</h1>
            <p className="text-sm text-muted-foreground mt-1">Live stock across on-hand, in-transit, and at Wildberries FBW</p>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Inventory value (on-hand)</div>
              <div className="text-lg font-semibold tabular">{rub(totalValue)}</div>
            </div>
            <div className={lowCount > 0 ? "text-amber-600" : "text-emerald-600"}>
              <div className="text-xs flex items-center gap-1.5">
                {lowCount > 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {lowCount > 0 ? `${lowCount} low-stock` : "All stocked"}
              </div>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Артикул</th>
                <th className="text-left font-medium px-5 py-2.5">Product</th>
                <th className="text-right font-medium px-5 py-2.5">On hand</th>
                <th className="text-right font-medium px-5 py-2.5">In transit</th>
                <th className="text-right font-medium px-5 py-2.5">At WB</th>
                <th className="text-right font-medium px-5 py-2.5">Total</th>
                <th className="text-right font-medium px-5 py-2.5">Reorder ≤</th>
                <th className="text-right font-medium px-5 py-2.5">Status</th>
                <th className="text-right font-medium px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {stock.map((s) => <StockRow key={s.id} s={s} />)}
              {stock.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No products yet. <Link href="/products/new" className="text-primary hover:underline">Add one →</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
