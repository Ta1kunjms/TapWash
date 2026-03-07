"use client";

import { BottomNav } from "@/components/customer/bottom-nav";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isShopDetailRoute = /^\/customer\/shops\/[^/]+$/.test(pathname);
  const hideBottomNav = isShopDetailRoute || pathname === "/customer/orders/new";

  return (
    <div
      className={cn(
        "mx-auto min-h-screen max-w-md bg-[radial-gradient(120%_100%_at_0%_0%,_#e7f3ff_0%,_#cae5ff_100%)] px-4 pt-3",
        hideBottomNav ? "pb-5" : "pb-24",
      )}
    >
      {children}
      {hideBottomNav ? null : <BottomNav />}
    </div>
  );
}
