"use client";
import Link from "next/link";
import { useTransition } from "react";
import { PriorityBadge } from "@/components/ui/badge";
import { formatDate, deadlineTone, currency } from "@/lib/utils";
import { updateOrderStatus } from "@/app/actions";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { ChevronRight, Loader2 } from "lucide-react";

export function KanbanCard({ order: o }: { order: any }) {
  const [pending, start] = useTransition();
  const tone = deadlineTone(o.deadline);
  const nextIdx = ORDER_STATUSES.indexOf(o.status) + 1;
  const next = nextIdx < ORDER_STATUSES.length ? ORDER_STATUSES[nextIdx] : null;

  function advance() {
    if (!next) return;
    start(async () => { await updateOrderStatus(o.id, next as OrderStatus); });
  }

  return (
    <div className="group relative bg-card rounded-md border border-border p-3 text-sm hover:border-primary/40 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/orders/${o.id}`} className="font-mono text-[11px] text-muted-foreground hover:text-foreground hover:underline">{o.order_number}</Link>
        <PriorityBadge priority={o.priority} />
      </div>
      <div className="mt-1.5 font-medium text-[13px] leading-snug">{o.product_name}</div>
      <div className="mt-1 text-xs text-muted-foreground">{o.customer?.name}</div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={tone === "overdue" ? "text-destructive font-medium" : tone === "soon" ? "text-amber-600" : "text-muted-foreground"}>
          {formatDate(o.deadline)}
        </span>
        <span className="tabular text-muted-foreground">{currency(Number(o.quantity) * Number(o.unit_price))}</span>
      </div>
      {next && (
        <button
          onClick={advance}
          disabled={pending}
          className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[11px] rounded px-2 py-1 flex items-center justify-center gap-1 font-medium"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <>Move to {next} <ChevronRight className="h-3 w-3" /></>}
        </button>
      )}
    </div>
  );
}
