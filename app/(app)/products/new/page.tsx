import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createProduct } from "@/app/actions-wb";

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="New product" />
      <div className="px-8 py-6 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-5">New product</h1>
        <Card>
          <CardContent className="p-6">
            <form action={createProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Артикул WB</Label><Input name="wb_article" placeholder="142857301" required /></div>
                <div><Label>Category</Label><Input name="category" placeholder="Аксессуары" /></div>
              </div>
              <div><Label>Name</Label><Input name="name" required placeholder="Силиконовый чехол iPhone 15" /></div>
              <div><Label>Variant</Label><Input name="variant" placeholder="Черный матовый / M" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cost (₽)</Label><Input name="cost_rub" type="number" step="0.01" defaultValue="0" /></div>
                <div><Label>WB price (₽)</Label><Input name="wb_price_rub" type="number" step="0.01" defaultValue="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Target stock</Label><Input name="target_stock" type="number" defaultValue="200" /></div>
                <div><Label>Reorder point</Label><Input name="reorder_point" type="number" defaultValue="50" /></div>
              </div>
              <Button type="submit" variant="primary">Create product</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
