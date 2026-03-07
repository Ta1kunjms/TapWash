"use client";

import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { notify } from "@/lib/notify";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  shopId: string;
  initialIsFavorite: boolean;
  variant?: "pill" | "icon";
  className?: string;
};

export function FavoriteToggleButton({
  shopId,
  initialIsFavorite,
  variant = "pill",
  className,
}: Props) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    if (isPending) return;

    const nextValue = !isFavorite;
    setIsFavorite(nextValue);

    startTransition(async () => {
      try {
        const response = await fetch("/api/favorites/toggle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ shopId }),
        });

        if (!response.ok) {
          throw new Error("Failed to update favorite");
        }

        const body = (await response.json()) as { isFavorite: boolean };
        setIsFavorite(Boolean(body.isFavorite));
        router.refresh();
      } catch {
        setIsFavorite(!nextValue);
        notify.error("Could not update favorite. Please try again.");
      }
    });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        className={className ?? "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75 text-primary-500 shadow-sm disabled:opacity-70"}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <FlaticonIcon name="heart" className={`text-base ${isFavorite ? "text-red-500" : ""}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      className={
        className ??
        "inline-flex h-9 items-center rounded-xl border border-border-muted px-3 text-xs font-semibold text-text-secondary transition hover:bg-background-app/70 disabled:opacity-70"
      }
    >
      {isPending ? "Updating..." : isFavorite ? "Remove Favorite" : "Add to Favorites"}
    </button>
  );
}
