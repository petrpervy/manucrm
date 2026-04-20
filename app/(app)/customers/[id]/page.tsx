import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer } from "@/app/actions";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Package } from "lucide-react";
import { formatDate, currency, deadlineTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const id = Number(params.id);
  const { data: c } = await supabase.from("customers").select("*").eq("id", id).single();
  if (!c) return notFound();
  const { data: orders } = await supabase.from("orders").select("*").eq("customer_id", id).order("created_at", { ascending: false });

  const pipeline = (orders ?? []).filter((o: any) => !["Delivered","Cancelled"].includes(o.status))
    .reduce((s: number, o: any) => s + Number(o.quantity) * Number(o.unit_price), 0);
  const delivered = (orders ?? []).filter((o: any) => o.status === "Delivered").length;

  async function save(formData: FormData) { "use server"; await updateCustomer(id, formData); }

  return (
    <>
      <PageHeader title={c.name} />
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-start gap-4">
            <Avatar name={c.name} size={52} />
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
              <p className="text-sm text-muted-foreground">{c.company}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                {c.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                {c.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.address}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Pipeline</div><div className="text-xl font-semibold tabular mt-1">{currency(pipeline)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Orders</div><div className="text-xl font-semibold tabular mt-1">{orders?.length ?? 0}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Delivered</div><div className="text-xl font-semibold tabular mt-1">{delivered}</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Orders</CardTitle>
              <Button asChild size="sm" variant="outline"><Link href={`/orders/new?customer=${id}`}>New order</Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  {(orders ?? []).map((o: any) => {
                    const tone = deadlineTone(o.deadline);
                    return (
                      <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-5 py-2.5">
                          <Link href={`/orders/${o.id}`} className="font-mono text-[12px] hover:underline">{o.order_number}</Link>
                          <div className="text-xs text-muted-foreground">{o.product_name}</div>
                        </td>
                        <td className="px-5 py-2.5"><StatusBadge status={o.status} /></td>
                        <td className={`px-5 py-2.5 text-[13px] tabular ${tone === "overdue" ? "text-destructive" : tone === "soon" ? "text-amber-600" : "text-muted-foreground"}`}>{formatDate(o.deadline)}</td>
                        <td className="px-5 py-2.5 text-right tabular text-[13px]">{currency(Number(o.quantity) * Number(o.unit_price))}</td>
                      </tr>
                    );
                  })}
                  {(!orders || orders.length === 0) && (
                    <tr><td className="px-5 py-8 text-center text-sm text-muted-foreground">No orders yet.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-3"><CardTitle>Account details</CardTitle></CardHeader>
            <CardContent>
              <form action={save} className="space-y-3">
                <div className="space-y-1"><Label>Name</Label><Input name="name" defaultValue={c.name} /></div>
                <div className="space-y-1"><Label>Company</Label><Input name="company" defaultValue={c.company} /></div>
                <div className="space-y-1"><Label>Industry</Label><Input name="industry" defaultValue={c.industry} /></div>
                <div className="space-y-1"><Label>Email</Label><Input name="email" defaultValue={c.email} /></div>
                <div className="space-y-1"><Label>Phone</Label><Input name="phone" defaultValue={c.phone} /></div>
                <div className="space-y-1"><Label>Address</Label><Input name="address" defaultValue={c.address} /></div>
                <div className="space-y-1"><Label>Notes</Label><Textarea name="notes" defaultValue={c.notes} /></div>
                <Button type="submit" variant="primary" className="w-full">Save</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
