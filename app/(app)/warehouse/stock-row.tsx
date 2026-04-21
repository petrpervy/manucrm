"use client";
import { useState, useTransition } from "react";
import type { StockRow as StockRowT } from "@/lib/wb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateStock } from "@/app/actions-wb";
import Link from "next/link";

export function StockRow({ s }: { s: StockRowT }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  async function onSave(fd: FormData) {
    start(async () => {
      await updateStock(s.id, fd);
      setEditing(false);
    });
  }

  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="px-5 py-2.5 font-mono text-[12px]">{s.wb_article}</td>
      <td className="px-5 py-2.5">
        <Link href={`/pos/new?product_id=${s.id}`} className="font-medium text-[13px] hover:underline">{s.name}</Link>
        <div className="text-xs text-muted-foreground">{s.variant}</div>
      </td>
      {editing ? (
        <>
          <td className="px-2 py-1.5"><Input name="qty_on_hand" form={`f-${s.id}`} defaultValue={s.qty_on_hand} type="number" className="h-8 text-right" /></td>
          <td className="px-2 py-1.5"><Input name="qty_in_transit" form={`f-${s.id}`} defaultValue={s.qty_in_transit} type="number" className="h-8 text-right" /></td>
          <td className="px-2 py-1.5"><Input name="qty_at_wildberries" form={`f-${s.id}`} defaultValue={s.qty_at_wildberries} type="number" className="h-8 text-right" /></td>
          <td className="px-5 py-2.5 text-right tabular text-[13px] text-muted-foreground">—</td>
        </>
      ) : (
        <>
          <td className={`px-5 py-2.5 text-right tabular text-[13px] ${s.low ? "text-destructive font-medium" : ""}`}>{s.qty_on_hand}</td>
          <td className="px-5 py-2.5 text-right tabular text-[13px]">{s.qty_in_transit}</td>
          <td className="px-5 py-2.5 text-right tabular text-[13px]">{s.qty_at_wildberries}</td>
          <td className="px-5 py-2.5 text-right tabular text-[13px] font-medium">{s.total}</td>
        </>
      )}
      <td className="px-5 py-2.5 text-right tabular text-[13px] text-muted-foreground">{s.reorder_point}</td>
      <td className="px-5 py-2.5 text-right">
        {s.low ? (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">Low</span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">OK</span>
        )}
      </td>
      <td className="px-5 py-2.5 text-right">
        {editing ? (
          <form id={`f-${s.id}`} action={onSave} className="inline-flex gap-1">
            <Button type="submit" variant="primary" disabled={pending} className="h-7 text-[11px]">Save</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)} className="h-7 text-[11px]">Cancel</Button>
          </form>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)} className="h-7 text-[11px]">Edit</Button>
        )}
      </td>
    </tr>
  );
}
