import { createCustomer } from "@/app/actions";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function NewCustomer() {
  return (
    <>
      <PageHeader title="New customer" />
      <form action={createCustomer} className="px-8 py-6 max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New customer</h1>
          <p className="text-sm text-muted-foreground mt-1">Create an account to start tracking orders.</p>
        </div>
        <Card><CardContent className="p-5 grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2"><Label>Contact name *</Label><Input name="name" required /></div>
          <div className="space-y-1.5"><Label>Company</Label><Input name="company" /></div>
          <div className="space-y-1.5"><Label>Industry</Label><Input name="industry" placeholder="e.g. Automotive" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input name="phone" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Address</Label><Input name="address" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea name="notes" /></div>
        </CardContent></Card>
        <div className="flex gap-2 justify-end">
          <Button asChild variant="outline"><Link href="/customers">Cancel</Link></Button>
          <Button type="submit" variant="primary">Create customer</Button>
        </div>
      </form>
    </>
  );
}
