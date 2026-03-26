"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { getCustomerDictionary, normalizeLocale } from "@/lib/i18n";
import { useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: "home" | "heart" | "orders" | "settings";
};

const NAV_TRANSITION_MS = 260;

export function BottomNav() {
  const pathname = usePathname();
  const [locale] = useState(() => {
    if (typeof document === "undefined") {
      return normalizeLocale(undefined);
    }

    const localeCookie = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("tapwash.locale="))
      ?.split("=")[1];

    return normalizeLocale(localeCookie);
  });
  const dictionary = getCustomerDictionary(locale);
  const navItems = useMemo<NavItem[]>(
    () => [
      { href: "/customer", label: dictionary.navigation.home, icon: "home" as const },
      { href: "/customer/favorites", label: dictionary.navigation.favorites, icon: "heart" as const },
      { href: "/customer/requests", label: dictionary.navigation.requests, icon: "orders" as const },
      { href: "/customer/settings", label: dictionary.navigation.settings, icon: "settings" as const },
    ],
    [dictionary.navigation.favorites, dictionary.navigation.home, dictionary.navigation.requests, dictionary.navigation.settings],
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 w-full md:hidden" aria-label="Bottom navigation">
      <div className="mx-auto w-full max-w-md px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))]">
        <div className="relative rounded-full border border-border-muted/75 bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,0.16),0_2px_10px_rgba(15,23,42,0.08)] backdrop-blur">
          <ul className="grid h-[4.4rem] grid-cols-5 items-center">
            <BottomNavLink item={navItems[0]} pathname={pathname} />
            <BottomNavLink item={navItems[1]} pathname={pathname} />

            <li className="flex items-center justify-center">
              <span
                aria-hidden="true"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-muted bg-surface-card shadow-[0_0_0_5px_rgba(255,255,255,0.94),0_7px_16px_rgba(16,24,40,0.2)]"
              >
                <Image
                  src="/tapwash-logo.png"
                  alt="TapWash"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                  priority
                />
              </span>
            </li>

            <BottomNavLink item={navItems[2]} pathname={pathname} />
            <BottomNavLink item={navItems[3]} pathname={pathname} />
          </ul>
        </div>
      </div>
    </nav>
  );
}

function BottomNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isCustomerHome = item.href === "/customer";
  const isRequests = item.href === "/customer/requests";

  const active = isCustomerHome
    ? pathname === "/customer"
    : pathname === item.href ||
      pathname.startsWith(`${item.href}/`) ||
      (isRequests && pathname.startsWith("/customer/orders"));

  return (
    <li>
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className="group inline-flex min-h-11 min-w-11 w-full items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-500/45"
      >
        <span
          className={`text-[1.28rem] leading-none transition-[transform,color,opacity] ease-out motion-reduce:transition-none ${
            active ? "scale-110 text-primary-500 opacity-100" : "scale-100 text-primary-500/60 opacity-95"
          }`}
          style={{ transitionDuration: `${NAV_TRANSITION_MS}ms` }}
        >
          {renderIcon(item.icon)}
        </span>
        <span className="sr-only">{item.label}</span>
      </Link>
    </li>
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
    return <FlaticonIcon name="shopping-basket" />;
  }

  return <FlaticonIcon name="settings" />;
}
