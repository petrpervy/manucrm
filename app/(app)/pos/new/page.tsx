import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createPo } from "@/app/actions-wb";
import { getProducts, getVendors, getStock } from "@/lib/wb";
import { PRIORITIES } from "@/lib/wb";

export default async function NewPoPage({ searchParams }: { searchParams: { product_id?: string } }) {
  const [products, vendors, stock] = await Promise.all([getProducts(), getVendors(), getStock()]);
  const preselect = searchParams.product_id ? Number(searchParams.product_id) : undefined;
  const stockMap = Object.fromEntries(stock.map(s => [s.id, s]));

  return (
    <>
      <PageHeader title="New PO" />
      <div className="px-8 py-6 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">New production order</h1>
        <p className="text-sm text-muted-foreground mb-5">Pick a product, assign a vendor, submit. Vendor gets an email + sees the PO in their portal.</p>
        <Card>
          <CardContent className="p-6">
            <form action={createPo} className="space-y-4">
              <div>
                <Label>Product</Label>
                <Select name="product_id" defaultValue={preselect?.toString() ?? ""} required>
                  <option value="">Select a product…</option>
                  {products.map((p) => {
                    const s = stockMap[p.id];
                    const flag = s && s.low ? " · LOW STOCK" : "";
                    return <option key={p.id} value={p.id}>
                      [{p.wb_article}] {p.name} {p.variant ? `— ${p.variant}` : ""} ({s?.qty_on_hand ?? 0} on hand{flag})
                    </option>;
                  })}
                </Select>
              </div>
              <div>
                <Label>Vendor</Label>
                <Select name="vendor_id" required>
                  <option value="">Select a vendor…</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.company} — {v.country} · lead {v.lead_time_days}d · {v.payment_terms}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Quantity</Label><Input name="quantity" type="number" defaultValue="200" required /></div>
                <div><Label>Unit cost (₽)</Label><Input name="unit_cost_rub" type="number" step="0.01" placeholder="Auto from product" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Priority</Label><Select name="priority" defaultValue="Normal">{PRIORITIES.map(p => <option key={p}>{p}</option>)}</Select></div>
                <div><Label>Deadline</Label><Input name="deadline" type="date" /></div>
              </div>
              <div><Label>Note to vendor</Label><Input name="vendor_notes" placeholder="Packaging spec, labeling, QC..." /></div>
              <div><Label>Internal note</Label><Input name="internal_notes" /></div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" variant="primary">Create as Draft</Button>
                <p className="text-xs text-muted-foreground self-center">You&apos;ll send to vendor from the PO detail page.</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
