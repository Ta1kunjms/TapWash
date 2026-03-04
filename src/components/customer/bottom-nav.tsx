"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/customer", label: "Home", icon: "home" as const },
  { href: "/customer/favorites", label: "Favorites", icon: "heart" as const },
  { href: "/customer/requests", label: "Requests", icon: "orders" as const },
  { href: "/customer/settings", label: "Settings", icon: "settings" as const },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-3 md:hidden">
      <div className="relative overflow-visible rounded-t-3xl border border-border-muted bg-white/95 px-2 pb-2 pt-3 shadow-soft backdrop-blur">
        <div className="pointer-events-none absolute left-1/2 top-0 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-gradient-to-b from-primary-500 to-primary-500/80 shadow-md" />
        <div className="pointer-events-none absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-xl">
          🫧
        </div>

        <ul className="grid grid-cols-4 items-end text-center">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/customer/requests" && pathname.startsWith("/customer/orders"));

            return (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex w-full flex-col items-center gap-1 py-1">
                  <span className={active ? "text-primary-500" : "text-text-muted"}>{renderIcon(item.icon)}</span>
                  <span className={`text-[11px] font-medium ${active ? "text-primary-500" : "text-text-muted"}`}>{item.label}</span>
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
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11.5L12 4l9 7.5" />
        <path d="M5.5 10.5V20h13V10.5" />
      </svg>
    );
  }

  if (icon === "heart") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 21s-7-4.4-9.5-8.4C.7 9.8 2.2 6 6 6c2.2 0 3.2 1.2 4 2.3C10.8 7.2 11.8 6 14 6c3.8 0 5.3 3.8 3.5 6.6C19 16.6 12 21 12 21z" />
      </svg>
    );
  }

  if (icon === "orders") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16" />
        <path d="M7 12h10" />
        <path d="M9 17h6" />
        <rect x="3" y="4" width="18" height="16" rx="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2 2.4 3.2-.4.8 3.2 3 1.4-1.4 3 1.4 3-3 1.4-.8 3.2-3.2-.4L12 22l-2-2.4-3.2.4-.8-3.2-3-1.4 1.4-3-1.4-3 3-1.4.8-3.2 3.2.4L12 2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
