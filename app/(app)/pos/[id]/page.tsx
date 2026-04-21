import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getPo, getPoActivity, rub, PO_STATUSES } from "@/lib/wb";
import { formatDate } from "@/lib/utils";
import { PoStatusBadge } from "../status-badge";
import { PoActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function PoDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const po = await getPo(id);
  if (!po) return notFound();
  const activity = await getPoActivity(id);

  return (
    <>
      <PageHeader title={po.po_number} />
      <div className="px-8 py-6 space-y-5 max-w-5xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-mono">{po.po_number}</div>
            <h1 className="text-2xl font-semibold tracking-tight mt-0.5">{po.product_name}</h1>
            <div className="text-sm text-muted-foreground">{po.product_variant} · арт. {po.product_article}</div>
          </div>
          <div className="flex items-center gap-3">
            <PoStatusBadge status={po.status} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Quantity</div>
            <div className="text-2xl font-semibold tabular mt-1">{po.quantity}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{rub(po.unit_cost_rub)} per unit</div>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Total cost</div>
            <div className="text-2xl font-semibold tabular mt-1">{rub(po.total_cost_rub)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{po.priority} priority</div>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <div className="text-xs text-muted-foreground">Deadline</div>
            <div className="text-2xl font-semibold tabular mt-1">{formatDate(po.deadline) ?? "—"}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Created {formatDate(po.created_at)}</div>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3"><CardTitle>Vendor</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Company</span><Link href={`/vendors`} className="font-medium hover:underline">{po.vendor_company}</Link></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Contact</span><span>{po.vendor_name}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono text-[12px]">{po.vendor_email}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Country</span><span>{po.vendor_country}</span></div>
              {po.vendor_notes && (
                <div className="pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-1">Note to vendor</div>
                  <div className="text-[13px]">{po.vendor_notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle>Actions</CardTitle><CardDescription>Move the PO along</CardDescription></CardHeader>
            <CardContent>
              <PoActions id={po.id} status={po.status} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle>Activity</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {activity.map((a: any) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-5 py-2.5 text-xs text-muted-foreground tabular w-40">{formatDate(a.created_at)}</td>
                    <td className="px-5 py-2.5 text-[13px]">
                      <div className="font-medium">{a.kind.replace(/_/g, " ")}</div>
                      <div className="text-xs text-muted-foreground whitespace-pre-wrap">{a.message}</div>
                    </td>
                    <td className="px-5 py-2.5 text-right text-xs text-muted-foreground tabular">{a.actor_email ?? "system"}</td>
                  </tr>
                ))}
                {activity.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">No activity yet.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
