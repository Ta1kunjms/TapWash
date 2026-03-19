"use client";

import { useEffect, useState } from "react";

export type RecentView = {
  id: string;
  name: string;
  viewedAt: number;
};

const RECENT_KEY = "tapwash_recently_viewed_shops";

export function useRecentViews() {
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (!raw) {
        setIsLoaded(true);
        return;
      }
      const parsed = JSON.parse(raw) as RecentView[];
      if (Array.isArray(parsed)) {
        setRecentViews(parsed.slice(0, 8));
      }
    } catch {
      setRecentViews([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const addRecentView = (item: Omit<RecentView, "viewedAt">) => {
    if (typeof window === "undefined") return;

    const nextRecent = [
      { ...item, viewedAt: Date.now() },
      ...recentViews.filter((v) => v.id !== item.id),
    ].slice(0, 8);

    setRecentViews(nextRecent);

    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent));
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(12);
      }
    } catch {
      // Ignore local storage failures.
    }
  };

  const clearRecentViews = () => {
    if (typeof window === "undefined") return;

    setRecentViews([]);
    try {
      window.localStorage.removeItem(RECENT_KEY);
    } catch {
      // Ignore local storage failures.
    }
  };

  const removeRecentView = (id: string) => {
    if (typeof window === "undefined") return;

    const nextRecent = recentViews.filter((v) => v.id !== id);
    setRecentViews(nextRecent);

    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent));
    } catch {
      // Ignore local storage failures.
    }
  };

  return {
    recentViews,
    isLoaded,
    addRecentView,
    clearRecentViews,
    removeRecentView,
  };
}
