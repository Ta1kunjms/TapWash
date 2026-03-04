import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-border-muted bg-white px-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:ring-2 focus:ring-primary-500/30",
        className,
      )}
      {...props}
    />
  );
}
