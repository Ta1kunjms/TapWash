"use client";

import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  initialCount: number;
  liveCount?: boolean;
};

export function NotificationBell({ initialCount, liveCount = true }: Props) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (!liveCount) return;

    let mounted = true;

    const refresh = async () => {
      try {
        const response = await fetch("/api/notifications/unread-count", { cache: "no-store" });
        if (!response.ok) return;

        const body = (await response.json()) as { count: number };
        if (!mounted) return;
        setCount(body.count ?? 0);
      } catch {
        return;
      }
    };

    const interval = window.setInterval(refresh, 15000);
    const onFocus = () => {
      void refresh();
    };

    window.addEventListener("focus", onFocus);
    void refresh();

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [liveCount]);

  return (
    <Link href="/customer/notifications" className="relative rounded-full p-2 transition hover:bg-white/15" aria-label="Notifications">
      <FlaticonIcon name="bell" className="text-lg" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
