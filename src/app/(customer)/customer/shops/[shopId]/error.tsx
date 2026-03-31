"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ShopPageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-500/70">Menu unavailable</p>
      <h1 className="text-2xl font-black text-text-primary">We could not load this laundromat right now.</h1>
      <p className="max-w-md text-sm text-text-muted">
        Please try again in a moment. If the issue continues, return to home and choose another shop.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/customer"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border-muted px-4 text-sm font-semibold text-text-secondary"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
