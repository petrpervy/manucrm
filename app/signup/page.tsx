"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signupAction } from "@/app/actions-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Boxes, Loader2 } from "lucide-react";
import { ROLES } from "@/lib/types";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      Create account
    </Button>
  );
}

export default function SignupPage() {
  const [state, action] = useFormState(signupAction, null as any);
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-md bg-foreground flex items-center justify-center"><Boxes className="h-4 w-4 text-background" strokeWidth={2.4} /></div>
          <span className="text-[15px] font-semibold tracking-tight">ManuCRM</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Create your account</h2>
        <p className="text-sm text-muted-foreground mt-1">Get your team on the same page.</p>
        <form action={action} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Name</Label><Input name="full_name" required /></div>
            <div className="space-y-1.5"><Label>Role</Label><Select name="role">{ROLES.map((r) => <option key={r}>{r}</option>)}</Select></div>
          </div>
          <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" required /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input name="password" type="password" required minLength={6} /></div>
          {state?.error && <div className="text-xs text-destructive">{state.error}</div>}
          <SubmitBtn />
        </form>
        <div className="mt-6 text-xs text-muted-foreground">
          Already have an account? <Link className="text-primary hover:underline" href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
