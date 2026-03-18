"use client";

import { BottomNav } from "@/components/customer/bottom-nav";
import { LocationPickerSheet } from "@/components/customer/location-picker-sheet";
import { CustomerLocationPermissionGate } from "@/components/customer/location-permission-gate";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isShopDetailRoute = /^\/customer\/shops\/[^/]+$/.test(pathname);
  const isOnboardingRoute = pathname.startsWith("/customer/onboarding");
  const hideBottomNav =
    isShopDetailRoute ||
    isOnboardingRoute ||
    pathname === "/customer/location" ||
    pathname === "/customer/orders/new" ||
    pathname === "/customer/orders/checkout";

  return (
    <div
      className={cn(
        "mx-auto min-h-screen max-w-md bg-[radial-gradient(120%_100%_at_0%_0%,_#e7f3ff_0%,_#cae5ff_100%)]",
        isOnboardingRoute ? "px-0 pt-0" : "px-4 pt-3",
        hideBottomNav ? "pb-5" : "pb-24",
      )}
    >
      <CustomerLocationPermissionGate />
      {children}
      <LocationPickerSheet />
      {hideBottomNav ? null : <BottomNav />}
    </div>
  );
}
