import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOrder } from "@/app/actions";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { ORDER_STATUSES, PRIORITIES } from "@/lib/types";
import { formatDate, formatDateTime, currency, relativeTime, deadlineTone } from "@/lib/utils";
import { ArrowRight, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const id = Number(params.id);
  const { data: o } = await supabase.from("orders").select("*, customer:customers(id, name, company, email)").eq("id", id).single();
  if (!o) return notFound();
  const { data: activity } = await supabase.from("order_activity").select("*").eq("order_id", id).order("created_at", { ascending: false });

  const tone = deadlineTone(o.deadline);

  async function save(formData: FormData) { "use server"; await updateOrder(id, formData); }

  return (
    <>
      <PageHeader title={o.order_number} />
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-muted-foreground">{o.order_number}</span>
              <StatusBadge status={o.status} />
              <PriorityBadge priority={o.priority} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">{o.product_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              for <Link href={`/customers/${o.customer?.id}`} className="text-foreground hover:underline">{o.customer?.name}</Link>
              {o.customer?.company && ` · ${o.customer.company}`}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Quantity</div><div className="text-xl font-semibold tabular mt-1">{o.quantity}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Unit price</div><div className="text-xl font-semibold tabular mt-1">{currency(Number(o.unit_price))}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total value</div><div className="text-xl font-semibold tabular mt-1">{currency(Number(o.quantity) * Number(o.unit_price))}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Deadline</div>
              <div className={`text-xl font-semibold tabular mt-1 ${tone === "overdue" ? "text-destructive" : tone === "soon" ? "text-amber-600" : ""}`}>{formatDate(o.deadline)}</div>
            </CardContent></Card>
          </div>

          {o.specifications && (
            <Card>
              <CardHeader className="pb-2"><CardTitle>Specifications</CardTitle></CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap text-muted-foreground font-mono leading-relaxed">{o.specifications}</CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Activity</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              {(activity ?? []).map((a: any) => (
                <div key={a.id} className="flex gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[13px]">
                      {a.kind === "created" && <>Order created with status <StatusBadge status={a.new_value} /></>}
                      {a.kind === "status_change" && <>Status changed from <span className="text-muted-foreground">{a.old_value}</span> <ArrowRight className="inline h-3 w-3 mx-1" /> <StatusBadge status={a.new_value} /></>}
                      {a.kind === "priority_change" && <>Priority changed: {a.old_value} → <span className="font-medium">{a.new_value}</span></>}
                      {a.kind === "note" && <>{a.content}</>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{relativeTime(a.created_at)} · {formatDateTime(a.created_at)}</div>
                  </div>
                </div>
              ))}
              {(!activity || activity.length === 0) && <div className="text-sm text-muted-foreground">No activity yet.</div>}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-3"><CardTitle>Edit order</CardTitle></CardHeader>
            <CardContent>
              <form action={save} className="space-y-3">
                <div className="space-y-1"><Label>Product</Label><Input name="product_name" defaultValue={o.product_name} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>Qty</Label><Input name="quantity" type="number" defaultValue={o.quantity} /></div>
                  <div className="space-y-1"><Label>Unit $</Label><Input name="unit_price" type="number" step="0.01" defaultValue={o.unit_price} /></div>
                </div>
                <div className="space-y-1"><Label>Status</Label><Select name="status" defaultValue={o.status}>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></div>
                <div className="space-y-1"><Label>Priority</Label><Select name="priority" defaultValue={o.priority}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</Select></div>
                <div className="space-y-1"><Label>Deadline</Label><Input name="deadline" type="date" defaultValue={o.deadline ?? ""} /></div>
                <div className="space-y-1"><Label>Specifications</Label><Textarea name="specifications" defaultValue={o.specifications} /></div>
                <div className="space-y-1"><Label>Notes</Label><Textarea name="notes" defaultValue={o.notes} /></div>
                <Button type="submit" variant="primary" className="w-full">Save changes</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
