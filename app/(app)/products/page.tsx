import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getProducts, rub } from "@/lib/wb";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <>
      <PageHeader title="Products" />
      <div className="px-8 py-6 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">{products.length} SKUs in catalog</p>
          </div>
          <Button asChild variant="primary"><Link href="/products/new"><Plus className="h-3.5 w-3.5" />New product</Link></Button>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Артикул</th>
                <th className="text-left font-medium px-5 py-2.5">Name</th>
                <th className="text-left font-medium px-5 py-2.5">Variant</th>
                <th className="text-left font-medium px-5 py-2.5">Category</th>
                <th className="text-right font-medium px-5 py-2.5">Cost</th>
                <th className="text-right font-medium px-5 py-2.5">WB price</th>
                <th className="text-right font-medium px-5 py-2.5">Target</th>
                <th className="text-right font-medium px-5 py-2.5">Reorder ≤</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-2.5 font-mono text-[12px]">{p.wb_article}</td>
                  <td className="px-5 py-2.5 font-medium text-[13px]">{p.name}</td>
                  <td className="px-5 py-2.5 text-[13px] text-muted-foreground">{p.variant}</td>
                  <td className="px-5 py-2.5 text-[13px] text-muted-foreground">{p.category}</td>
                  <td className="px-5 py-2.5 text-right tabular text-[13px]">{rub(p.cost_rub)}</td>
                  <td className="px-5 py-2.5 text-right tabular text-[13px] font-medium">{rub(p.wb_price_rub)}</td>
                  <td className="px-5 py-2.5 text-right tabular text-[13px]">{p.target_stock}</td>
                  <td className="px-5 py-2.5 text-right tabular text-[13px] text-muted-foreground">{p.reorder_point}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">No products yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
