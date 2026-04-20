"use client";
import { Search, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/app/actions-auth";
import type { Profile } from "@/lib/types";

export function Topbar({ profile, title }: { profile: Profile | null; title: string }) {
  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border bg-background/80 backdrop-blur flex items-center px-6 gap-4">
      <h1 className="text-[14px] font-semibold tracking-tight">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("manucrm:openCommand"))}
          className="group flex items-center gap-2 h-8 pl-2.5 pr-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground min-w-[260px] transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search customers, orders…</span>
          <span className="ml-auto kbd">⌘K</span>
        </button>
        {profile && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-border">
            <Avatar name={profile.full_name} />
            <div className="flex flex-col leading-tight">
              <span className="text-[12px] font-medium">{profile.full_name}</span>
              <Badge tone="muted" className="w-fit text-[9px] py-0 px-1">{profile.role}</Badge>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="icon" title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
