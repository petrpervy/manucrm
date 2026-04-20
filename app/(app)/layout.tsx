import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/app-shell/sidebar";
import { CommandPalette } from "@/components/app-shell/command-palette";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-[232px]">{children}</div>
      <CommandPalette />
    </div>
  );
}
