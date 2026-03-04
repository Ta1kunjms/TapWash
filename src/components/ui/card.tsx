import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl bg-surface-card p-4 shadow-soft border border-border-muted", className)}
      {...props}
    />
  );
}
