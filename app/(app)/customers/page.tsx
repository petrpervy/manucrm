import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? "";
  let query = supabase.from("customers").select("id, name, company, email, phone, industry, created_at, orders(count)").order("created_at", { ascending: false });
  if (q) query = query.or(`name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`);
  const { data: customers } = await query;

  return (
    <>
      <PageHeader title="Customers" />
      <div className="px-8 py-6 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground mt-1">{customers?.length ?? 0} accounts</p>
          </div>
          <Button asChild variant="primary"><Link href="/customers/new"><Plus className="h-3.5 w-3.5" />New customer</Link></Button>
        </div>

        <form className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search by name, company, email…" className="pl-8" />
          </div>
        </form>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Account</th>
                <th className="text-left font-medium px-5 py-2.5">Industry</th>
                <th className="text-left font-medium px-5 py-2.5">Contact</th>
                <th className="text-left font-medium px-5 py-2.5">Orders</th>
                <th className="text-left font-medium px-5 py-2.5">Added</th>
              </tr>
            </thead>
            <tbody>
              {(customers ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/customers/${c.id}`} className="flex items-center gap-3 group">
                      <Avatar name={c.name} />
                      <div>
                        <div className="font-medium text-[13px] group-hover:underline">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.company || "—"}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    {c.industry ? <Badge tone="muted">{c.industry}</Badge> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-3 text-[13px]">
                    <div>{c.email || "—"}</div>
                    <div className="text-xs text-muted-foreground">{c.phone || ""}</div>
                  </td>
                  <td className="px-5 py-3 tabular text-[13px]">{c.orders?.[0]?.count ?? 0}</td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{formatDate(c.created_at)}</td>
                </tr>
              ))}
              {(!customers || customers.length === 0) && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No customers yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
