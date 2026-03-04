import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "h-11 rounded-2xl px-4 text-sm font-semibold transition active:scale-[0.99]",
        variant === "primary" && "bg-primary-500 text-white hover:opacity-95",
        variant === "secondary" && "bg-surface-card text-text-primary border border-border-muted",
        variant === "ghost" && "text-text-secondary hover:bg-white/70",
        className,
      )}
      {...props}
    />
  );
}
