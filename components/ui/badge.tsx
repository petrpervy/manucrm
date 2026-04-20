import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "primary" | "success" | "warning" | "destructive" | "info" | "muted";

export function Badge({
  className,
  tone = "neutral",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    neutral: "bg-muted text-foreground border-border",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    destructive: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
    info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
    muted: "bg-muted text-muted-foreground border-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    Quote: "muted",
    Received: "info",
    "In Production": "warning",
    Completed: "primary",
    Delivered: "success",
    Cancelled: "destructive",
  };
  const dotColor: Record<string, string> = {
    Quote: "bg-zinc-400",
    Received: "bg-blue-500",
    "In Production": "bg-amber-500",
    Completed: "bg-indigo-500",
    Delivered: "bg-emerald-500",
    Cancelled: "bg-red-500",
  };
  return (
    <Badge tone={map[status] ?? "neutral"}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[status] ?? "bg-zinc-400")} />
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, Tone> = { Low: "muted", Normal: "neutral", High: "warning", Urgent: "destructive" };
  return <Badge tone={map[priority] ?? "neutral"}>{priority}</Badge>;
}
