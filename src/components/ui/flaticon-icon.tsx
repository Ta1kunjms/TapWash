import { cn } from "@/lib/utils";

type FlaticonIconProps = {
  name: string;
  className?: string;
  ariaHidden?: boolean;
};

export function FlaticonIcon({ name, className, ariaHidden = true }: FlaticonIconProps) {
  return <i className={cn("fi", `fi-rr-${name}`, "inline-flex leading-none", className)} aria-hidden={ariaHidden} />;
}
