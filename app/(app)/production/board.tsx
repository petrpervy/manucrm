"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { PriorityBadge } from "@/components/ui/badge";
import { formatDate, deadlineTone, currency, cn } from "@/lib/utils";
import { updateOrderStatus } from "@/app/actions";
import type { OrderStatus } from "@/lib/types";

type Card = {
  id: number;
  order_number: string;
  product_name: string;
  status: OrderStatus;
  priority: string;
  deadline: string | null;
  quantity: number;
  unit_price: number;
  customer: { name: string; company: string } | null;
};

const COLUMNS: { key: OrderStatus; title: string; dot: string }[] = [
  { key: "Received", title: "Received", dot: "bg-blue-500" },
  { key: "In Production", title: "In Production", dot: "bg-amber-500" },
  { key: "Completed", title: "Completed", dot: "bg-indigo-500" },
  { key: "Delivered", title: "Delivered", dot: "bg-emerald-500" },
];

export function Board({ initial }: { initial: Card[] }) {
  const [cards, setCards] = useState<Card[]>(initial);
  const [dragId, setDragId] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<OrderStatus | null>(null);
  const [, startTransition] = useTransition();

  function onDragStart(id: number) {
    setDragId(id);
  }
  function onDragEnd() {
    setDragId(null);
    setHoverCol(null);
  }
  function onDrop(status: OrderStatus) {
    if (dragId == null) return;
    const card = cards.find((c) => c.id === dragId);
    setHoverCol(null);
    setDragId(null);
    if (!card || card.status === status) return;
    // Optimistic
    setCards((prev) => prev.map((c) => (c.id === dragId ? { ...c, status } : c)));
    startTransition(async () => {
      try { await updateOrderStatus(dragId, status); }
      catch { setCards((prev) => prev.map((c) => (c.id === dragId ? { ...c, status: card.status } : c))); }
    });
  }

  const byCol: Record<string, Card[]> = {};
  COLUMNS.forEach((c) => (byCol[c.key] = []));
  cards.forEach((c) => (byCol[c.status] ??= []).push(c));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {COLUMNS.map((col) => {
        const items = byCol[col.key] ?? [];
        const over = hoverCol === col.key;
        return (
          <div key={col.key} className="flex flex-col min-h-[60vh]">
            <div className="flex items-center gap-2 px-1 pb-2">
              <span className={cn("h-2 w-2 rounded-full", col.dot)} />
              <span className="text-[13px] font-semibold">{col.title}</span>
              <span className="text-xs text-muted-foreground tabular ml-1">{items.length}</span>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); if (hoverCol !== col.key) setHoverCol(col.key); }}
              onDragLeave={(e) => { if (e.currentTarget === e.target) setHoverCol(null); }}
              onDrop={() => onDrop(col.key)}
              className={cn(
                "flex-1 p-2 space-y-2 rounded-lg border transition-colors",
                over ? "bg-primary/5 border-primary/40 border-dashed" : "bg-muted/30 border-border"
              )}
            >
              {items.map((c) => {
                const tone = deadlineTone(c.deadline);
                const dragging = dragId === c.id;
                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => onDragStart(c.id)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      "group relative bg-card rounded-md border border-border p-3 text-sm shadow-sm cursor-grab active:cursor-grabbing transition-all",
                      "hover:border-primary/40 hover:shadow",
                      dragging && "opacity-40 scale-[0.98]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 -ml-1" />
                        <Link href={`/orders/${c.id}`} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}
                          className="font-mono text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                          draggable={false}>
                          {c.order_number}
                        </Link>
                      </div>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <div className="mt-1.5 font-medium text-[13px] leading-snug">{c.product_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{c.customer?.name}</div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className={tone === "overdue" ? "text-destructive font-medium" : tone === "soon" ? "text-amber-600" : "text-muted-foreground"}>
                        {formatDate(c.deadline)}
                      </span>
                      <span className="tabular text-muted-foreground">{currency(Number(c.quantity) * Number(c.unit_price))}</span>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8 select-none">
                  {over ? "Drop here" : "Nothing here."}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
