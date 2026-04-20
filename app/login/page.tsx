"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { loginAction } from "@/app/actions-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Boxes, Loader2 } from "lucide-react";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      Sign in
    </Button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState(loginAction, null as any);
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-indigo-50 via-background to-background border-r border-border p-10">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-md bg-foreground flex items-center justify-center"><Boxes className="h-4 w-4 text-background" strokeWidth={2.4} /></div>
            <span className="text-[15px] font-semibold tracking-tight">ManuCRM</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight leading-[1.1] mb-3">
            Orders, floor, and customers<br />on one connected surface.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Quotes to delivery — every status change, note, and handoff logged automatically. Built for manufacturing teams who left spreadsheets behind.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { n: "148ms", l: "median query" },
              { n: "100%", l: "audit trail" },
              { n: "3", l: "departments unified" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-xl font-semibold tabular">{s.n}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
          <p className="text-sm text-muted-foreground mt-1">Welcome back. Enter your credentials.</p>
          <form action={action} className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="you@company.com" required /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" placeholder="••••••••" required /></div>
            {state?.error && <div className="text-xs text-destructive">{state.error}</div>}
            <SubmitBtn />
          </form>
          <div className="mt-6 text-xs text-muted-foreground space-y-1">
            <div>No account? <Link className="text-primary hover:underline" href="/signup">Create one</Link></div>
            <div className="text-[10px] pt-2 text-muted-foreground/70">Demo: <code className="font-mono">demo@manucrm.io</code> / <code className="font-mono">password123</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
