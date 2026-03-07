import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "rounded-2xl text-sm font-semibold transition active:scale-[0.99]",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-11 px-4",
        size === "lg" && "h-14 px-6 text-base",
        variant === "primary" && "bg-primary-500 text-white hover:opacity-95",
        variant === "secondary" && "bg-surface-card text-text-primary border border-border-muted",
        variant === "ghost" && "text-text-secondary hover:bg-white/70",
        className,
      )}
      {...props}
    />
  );
}
