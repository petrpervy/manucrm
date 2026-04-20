"use client";
import { useState, useTransition } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, Check } from "lucide-react";
import { createCustomerInline } from "@/app/actions";

type Customer = { id: number; name: string; company: string | null };

export function CustomerPicker({ initial, defaultId }: { initial: Customer[]; defaultId?: string }) {
  const [options, setOptions] = useState<Customer[]>(initial);
  const [selected, setSelected] = useState<string>(defaultId ?? "");
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onCreate(formData: FormData) {
    setErr(null);
    start(async () => {
      try {
        const c = await createCustomerInline(formData);
        setOptions((prev) => [{ id: c.id, name: c.name, company: c.company }, ...prev]);
        setSelected(String(c.id));
        setOpen(false);
      } catch (e: any) {
        setErr(e.message || "Could not create customer");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Customer *</Label>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {open ? <><X className="h-3 w-3" />Cancel</> : <><Plus className="h-3 w-3" />New customer</>}
        </button>
      </div>
      <Select name="customer_id" value={selected} onChange={(e) => setSelected(e.target.value)} required>
        <option value="" disabled>Select a customer</option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}{c.company ? ` — ${c.company}` : ""}
          </option>
        ))}
      </Select>

      {open && (
        <div className="mt-3 rounded-md border border-border bg-muted/30 p-4 space-y-3">
          <div className="text-xs font-medium text-muted-foreground">Quick add customer</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Contact name *</Label>
              <Input name="name" form="inline-customer" required placeholder="e.g. Jane Smith" />
            </div>
            <div className="space-y-1"><Label>Company</Label><Input name="company" form="inline-customer" /></div>
            <div className="space-y-1"><Label>Industry</Label><Input name="industry" form="inline-customer" /></div>
            <div className="space-y-1"><Label>Email</Label><Input name="email" type="email" form="inline-customer" /></div>
            <div className="space-y-1"><Label>Phone</Label><Input name="phone" form="inline-customer" /></div>
          </div>
          {err && <div className="text-xs text-destructive">{err}</div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={pending}
              onClick={(e) => {
                const wrapper = e.currentTarget.closest("div")?.parentElement;
                if (!wrapper) return;
                const fd = new FormData();
                wrapper.querySelectorAll<HTMLInputElement>("input[name]").forEach((i) => fd.append(i.name, i.value));
                onCreate(fd);
              }}
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save and select
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
