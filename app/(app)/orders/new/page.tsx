import { createOrder } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ORDER_STATUSES, PRIORITIES } from "@/lib/types";
import { CustomerPicker } from "./customer-picker";

export const dynamic = "force-dynamic";

export default async function NewOrder({ searchParams }: { searchParams: { customer?: string } }) {
  const supabase = createClient();
  const { data: customers } = await supabase.from("customers").select("id, name, company").order("name");
  return (
    <>
      <PageHeader title="New order" />
      <form action={createOrder} className="px-8 py-6 max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New order</h1>
          <p className="text-sm text-muted-foreground mt-1">Starts as a Quote. Promote to Received once confirmed.</p>
        </div>
        <Card><CardContent className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <CustomerPicker initial={(customers ?? []) as any} defaultId={searchParams.customer} />
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Product *</Label><Input name="product_name" required /></div>
          <div className="space-y-1.5"><Label>Quantity *</Label><Input name="quantity" type="number" min={1} defaultValue={1} required /></div>
          <div className="space-y-1.5"><Label>Unit price (USD)</Label><Input name="unit_price" type="number" step="0.01" min={0} defaultValue={0} /></div>
          <div className="space-y-1.5"><Label>Status</Label><Select name="status" defaultValue="Quote">{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></div>
          <div className="space-y-1.5"><Label>Priority</Label><Select name="priority" defaultValue="Normal">{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</Select></div>
          <div className="space-y-1.5"><Label>Deadline</Label><Input name="deadline" type="date" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Specifications</Label><Textarea name="specifications" placeholder="Material, tolerances, finish…" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea name="notes" /></div>
        </CardContent></Card>
        <div className="flex gap-2 justify-end">
          <Button asChild variant="outline"><Link href="/orders">Cancel</Link></Button>
          <Button type="submit" variant="primary">Create order</Button>
        </div>
      </form>
    </>
  );
}
