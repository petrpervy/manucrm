import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createVendor } from "@/app/actions-wb";

export default function NewVendorPage() {
  return (
    <>
      <PageHeader title="New vendor" />
      <div className="px-8 py-6 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-5">New vendor</h1>
        <Card>
          <CardContent className="p-6">
            <form action={createVendor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Contact name</Label><Input name="name" required /></div>
                <div><Label>Company</Label><Input name="company" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input name="email" type="email" required /></div>
                <div><Label>Phone</Label><Input name="phone" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Country</Label>
                  <Select name="country" defaultValue="China">
                    <option>China</option><option>Turkey</option><option>Pakistan</option>
                    <option>India</option><option>Russia</option><option>Belarus</option>
                    <option>Vietnam</option><option>Bangladesh</option><option>Other</option>
                  </Select>
                </div>
                <div><Label>Payment terms</Label><Input name="payment_terms" defaultValue="50/50" /></div>
                <div><Label>Lead time (days)</Label><Input name="lead_time_days" type="number" defaultValue="30" /></div>
              </div>
              <div><Label>Notes</Label><Input name="notes" placeholder="Specialty, quality notes, MOQ, etc." /></div>
              <Button type="submit" variant="primary">Create vendor</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
