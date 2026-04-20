import { cn, initials } from "@/lib/utils";

export function Avatar({ name, className, size = 28 }: { name?: string | null; className?: string; size?: number }) {
  // Deterministic hue from name
  let h = 0;
  const s = name || "?";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return (
    <div
      className={cn("inline-flex items-center justify-center rounded-full font-medium text-[11px] text-white shrink-0", className)}
      style={{ width: size, height: size, background: `hsl(${h} 50% 50%)` }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
