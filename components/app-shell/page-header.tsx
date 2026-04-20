import { Topbar } from "./topbar";
import { getProfile } from "@/lib/queries";

export async function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <>
      <Topbar profile={profile} title={title} />
      {children && (
        <div className="px-8 pt-6 pb-2 flex items-center gap-3">{children}</div>
      )}
    </>
  );
}
