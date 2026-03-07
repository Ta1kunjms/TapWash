"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";

const navItems = [
  { href: "/customer", label: "Home", icon: "home" as const },
  { href: "/customer/favorites", label: "Favorites", icon: "heart" as const },
  { href: "/customer/requests", label: "Requests", icon: "orders" as const },
  { href: "/customer/settings", label: "Settings", icon: "settings" as const },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 w-full md:hidden">
      <div className="relative w-full aspect-[1080/384] max-h-[136px] overflow-visible">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[71%]">
          <svg className="absolute block h-full w-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1080 273">
            <path
              d="M1079 0C1079.55 0 1080 0.447715 1080 1V272C1080 272.552 1079.55 273 1079 273H1C0.447715 273 2.139e-09 272.552 0 272V1C0 0.447715 0.447715 0 1 0H364.284C385.714 0 402.568 17.6434 408.687 38.1816C425.541 94.7523 477.953 136 540 136C602.047 136 654.459 94.7523 671.313 38.1816C677.432 17.6435 694.286 0 715.716 0H1079Z"
              fill="#F5F5F7"
            />
          </svg>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[71%] border-t border-border-muted/60" />

        <div className="pointer-events-none absolute left-1/2 top-0 flex h-[112px] w-[112px] -translate-x-1/2 -translate-y-[10%] items-center justify-center overflow-hidden rounded-full bg-[#cbe6ff]">
          <Image src="/tapwash-logo.png" alt="TapWash" width={84} height={84} className="h-[90px] w-[90px] rounded-full object-cover" priority />
        </div>

        <ul className="absolute inset-x-0 bottom-[max(0.4rem,env(safe-area-inset-bottom))] grid w-full grid-cols-4 items-end text-center">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/customer/requests" && pathname.startsWith("/customer/orders"));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className="inline-flex h-[56px] w-full flex-col items-center justify-end gap-1 rounded-xl py-1 outline-none transition focus-visible:ring-2 focus-visible:ring-primary-500/40"
                >
                  <span
                    className={`text-[20px] transition duration-200 ${active ? "scale-105 text-primary-500" : "text-primary-500/50"}`}
                  >
                    {renderIcon(item.icon)}
                  </span>
                  <span className={`text-[11px] font-semibold leading-none transition duration-200 ${active ? "text-primary-500" : "text-primary-500/50"}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function renderIcon(icon: "home" | "heart" | "orders" | "settings") {
  if (icon === "home") {
    return <FlaticonIcon name="home" />;
  }

  if (icon === "heart") {
    return <FlaticonIcon name="heart" />;
  }

  if (icon === "orders") {
    return <FlaticonIcon name="list" />;
  }

  return <FlaticonIcon name="settings" />;
}
