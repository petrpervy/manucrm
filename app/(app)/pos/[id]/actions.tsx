"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendPoToVendor, updatePoStatus } from "@/app/actions-wb";
import type { PoStatus } from "@/lib/wb";
import { Mail, Factory, Truck, PackageCheck, X } from "lucide-react";

export function PoActions({ id, status }: { id: number; status: PoStatus }) {
  const [pending, start] = useTransition();
  const next = (s: PoStatus) => start(() => updatePoStatus(id, s));
  const send = () => start(() => sendPoToVendor(id));

  return (
    <div className="space-y-2">
      {status === "Draft" && (
        <Button onClick={send} disabled={pending} variant="primary" className="w-full justify-start gap-2">
          <Mail className="h-3.5 w-3.5" /> Send to vendor
        </Button>
      )}
      {status === "Sent to Vendor" && (
        <Button onClick={() => next("In Production")} disabled={pending} variant="primary" className="w-full justify-start gap-2">
          <Factory className="h-3.5 w-3.5" /> Mark in production
        </Button>
      )}
      {status === "In Production" && (
        <Button onClick={() => next("Shipped")} disabled={pending} variant="primary" className="w-full justify-start gap-2">
          <Truck className="h-3.5 w-3.5" /> Mark shipped
        </Button>
      )}
      {status === "Shipped" && (
        <Button onClick={() => next("Received")} disabled={pending} variant="primary" className="w-full justify-start gap-2">
          <PackageCheck className="h-3.5 w-3.5" /> Mark received (+ warehouse)
        </Button>
      )}
      {status !== "Cancelled" && status !== "Received" && (
        <Button onClick={() => next("Cancelled")} disabled={pending} variant="outline" className="w-full justify-start gap-2 text-destructive">
          <X className="h-3.5 w-3.5" /> Cancel PO
        </Button>
      )}
      {(status === "Received" || status === "Cancelled") && (
        <p className="text-xs text-muted-foreground">This PO is closed.</p>
      )}
    </div>
  );
}
