import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export async function getProfile(): Promise<Profile | null> {
  const s = await getSession();
  if (!s) return null;
  return { id: String(s.id), full_name: s.full_name, role: s.role, avatar_url: null };
}

export async function getDashboardStats() {
  const supabase = createClient();
  const { data: orders } = await supabase.from("orders").select("status, priority, quantity, unit_price, deadline, created_at");
  const { count: customerCount } = await supabase.from("customers").select("*", { count: "exact", head: true });
  const all = orders ?? [];
  const pipelineValue = all
    .filter((o: any) => !["Delivered", "Cancelled"].includes(o.status))
    .reduce((sum: number, o: any) => sum + Number(o.quantity ?? 0) * Number(o.unit_price ?? 0), 0);
  const byStatus: Record<string, number> = {};
  all.forEach((o: any) => { byStatus[o.status] = (byStatus[o.status] ?? 0) + 1; });
  const overdue = all.filter((o: any) => o.deadline && new Date(o.deadline) < new Date() && !["Delivered","Cancelled"].includes(o.status)).length;
  const urgent = all.filter((o: any) => o.priority === "Urgent" && !["Delivered","Cancelled"].includes(o.status)).length;
  return { total: all.length, pipelineValue, byStatus, overdue, urgent, customerCount: customerCount ?? 0 };
}
