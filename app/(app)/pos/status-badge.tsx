import { cn } from "@/lib/utils";
import type { PoStatus } from "@/lib/wb";

const styles: Record<PoStatus, string> = {
  "Draft": "bg-muted text-muted-foreground",
  "Sent to Vendor": "bg-blue-500/10 text-blue-700",
  "In Production": "bg-amber-500/10 text-amber-700",
  "Shipped": "bg-violet-500/10 text-violet-700",
  "Received": "bg-emerald-500/10 text-emerald-700",
  "Cancelled": "bg-red-500/10 text-red-700",
};

export function PoStatusBadge({ status }: { status: PoStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", styles[status] ?? "bg-muted")}>
      {status}
    </span>
  );
}
