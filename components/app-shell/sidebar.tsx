"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, Factory, Settings, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/production", label: "Production", icon: Factory },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-[232px] border-r border-border bg-card/50 backdrop-blur flex flex-col">
      <div className="h-14 flex items-center gap-2 px-5 border-b border-border">
        <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center">
          <Boxes className="h-4 w-4 text-background" strokeWidth={2.4} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight">ManuCRM</span>
          <span className="text-[10px] text-muted-foreground">Rochester Ops</span>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        <div className="px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Workspace</div>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-border">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
            pathname.startsWith("/settings") ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" strokeWidth={1.75} /> Settings
        </Link>
      </div>
    </aside>
  );
}
