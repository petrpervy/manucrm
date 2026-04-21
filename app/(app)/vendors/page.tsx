import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getVendors } from "@/lib/wb";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await getVendors();
  return (
    <>
      <PageHeader title="Vendors" />
      <div className="px-8 py-6 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
            <p className="text-sm text-muted-foreground mt-1">{vendors.length} manufacturers across {new Set(vendors.map(v => v.country)).size} countries</p>
          </div>
          <Button asChild variant="primary"><Link href="/vendors/new"><Plus className="h-3.5 w-3.5" />New vendor</Link></Button>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Contact</th>
                <th className="text-left font-medium px-5 py-2.5">Company</th>
                <th className="text-left font-medium px-5 py-2.5">Country</th>
                <th className="text-left font-medium px-5 py-2.5">Email</th>
                <th className="text-left font-medium px-5 py-2.5">Terms</th>
                <th className="text-right font-medium px-5 py-2.5">Lead time</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-2.5 font-medium text-[13px]">{v.name}</td>
                  <td className="px-5 py-2.5 text-[13px]">{v.company}</td>
                  <td className="px-5 py-2.5 text-[13px] text-muted-foreground">{v.country}</td>
                  <td className="px-5 py-2.5 text-[13px] font-mono text-[12px]">{v.email}</td>
                  <td className="px-5 py-2.5 text-[13px] text-muted-foreground">{v.payment_terms}</td>
                  <td className="px-5 py-2.5 text-right tabular text-[13px]">{v.lead_time_days} days</td>
                </tr>
              ))}
              {vendors.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">No vendors yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
