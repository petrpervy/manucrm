import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { Board } from "./board";

export const dynamic = "force-dynamic";

const STATUSES = ["Received", "In Production", "Completed", "Delivered"];

export default async function ProductionPage() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, product_name, status, priority, deadline, quantity, unit_price, customer:customers(name, company)")
    .in("status", STATUSES)
    .order("deadline", { ascending: true, nullsFirst: false });

  return (
    <>
      <PageHeader title="Production" />
      <div className="px-8 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Production queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag cards across the pipeline as work moves. Drop in any column — including backward.</p>
        </div>
        <Board initial={(orders ?? []) as any} />
      </div>
    </>
  );
}
