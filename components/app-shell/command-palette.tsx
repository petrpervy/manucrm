"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, LayoutDashboard, Users, Package, Factory, Plus, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Hit = { type: "customer" | "order"; id: number; label: string; sub?: string; href: string };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    const openEv = () => setOpen(true);
    document.addEventListener("keydown", down);
    document.addEventListener("manucrm:openCommand", openEv);
    return () => { document.removeEventListener("keydown", down); document.removeEventListener("manucrm:openCommand", openEv); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      const supabase = createClient();
      const term = q.trim();
      if (!term) { setHits([]); return; }
      const [cust, ord] = await Promise.all([
        supabase.from("customers").select("id,name,company").ilike("name", `%${term}%`).limit(5),
        supabase.from("orders").select("id,order_number,product_name").or(`order_number.ilike.%${term}%,product_name.ilike.%${term}%`).limit(5),
      ]);
      const out: Hit[] = [
        ...(cust.data ?? []).map((c: any) => ({ type: "customer" as const, id: c.id, label: c.name, sub: c.company, href: `/customers/${c.id}` })),
        ...(ord.data ?? []).map((o: any) => ({ type: "order" as const, id: o.id, label: o.order_number, sub: o.product_name, href: `/orders/${o.id}` })),
      ];
      setHits(out);
    }, 120);
    return () => clearTimeout(t);
  }, [q, open]);

  function go(href: string) { setOpen(false); setQ(""); router.push(href); }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Command shouldFilter={false} className="flex flex-col">
          <div className="flex items-center gap-2 px-4 h-12 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input value={q} onValueChange={setQ} placeholder="Search or jump to…" className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" autoFocus />
            <span className="kbd">ESC</span>
          </div>
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            {hits.length === 0 && !q && (
              <>
                <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground">
                  <Item icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" onSelect={() => go("/dashboard")} />
                  <Item icon={<Users className="h-4 w-4" />} label="Customers" onSelect={() => go("/customers")} />
                  <Item icon={<Package className="h-4 w-4" />} label="Orders" onSelect={() => go("/orders")} />
                  <Item icon={<Factory className="h-4 w-4" />} label="Production queue" onSelect={() => go("/production")} />
                  <Item icon={<Settings className="h-4 w-4" />} label="Settings" onSelect={() => go("/settings")} />
                </Command.Group>
                <Command.Group heading="Actions">
                  <Item icon={<Plus className="h-4 w-4" />} label="New order" onSelect={() => go("/orders/new")} />
                  <Item icon={<Plus className="h-4 w-4" />} label="New customer" onSelect={() => go("/customers/new")} />
                </Command.Group>
              </>
            )}
            {hits.length === 0 && q && (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">No results for "{q}"</div>
            )}
            {hits.map((h) => (
              <Command.Item key={`${h.type}-${h.id}`} value={`${h.type}-${h.id}`} onSelect={() => go(h.href)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer aria-selected:bg-accent">
                {h.type === "customer" ? <Users className="h-4 w-4 text-muted-foreground" /> : <Package className="h-4 w-4 text-muted-foreground" />}
                <span>{h.label}</span>
                {h.sub && <span className="text-xs text-muted-foreground">· {h.sub}</span>}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({ icon, label, onSelect }: { icon: React.ReactNode; label: string; onSelect: () => void }) {
  return (
    <Command.Item onSelect={onSelect} value={label} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer aria-selected:bg-accent">
      <span className="text-muted-foreground">{icon}</span>{label}
    </Command.Item>
  );
}
