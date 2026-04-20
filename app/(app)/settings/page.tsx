import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const supabase = createClient();
  const profile = await getProfile();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <PageHeader title="Settings" />
      <div className="px-8 py-6 space-y-5 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Your profile and workspace.</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Profile</CardTitle><CardDescription>Your account info.</CardDescription></CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar name={profile?.full_name} size={56} />
            <div>
              <div className="text-base font-semibold">{profile?.full_name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
              <div className="mt-2"><Badge tone="primary">{profile?.role ?? "Sales"}</Badge></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Workspace</CardTitle><CardDescription>Environment and connection.</CardDescription></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row label="Database" value="Supabase Postgres" />
            <Row label="Auth" value="Email / password" />
            <Row label="Region" value="us-west-2" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-[12px]">{value}</span>
    </div>
  );
}
