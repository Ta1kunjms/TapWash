"use client";

import Link from "next/link";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { NotificationBell } from "@/components/customer/notification-bell";
import { LocationSheetTrigger } from "@/components/customer/location-sheet-trigger";
import { useState, useRef, useEffect } from "react";
import type { RecentView } from "@/hooks/use-recent-views";
import { useRecentViews } from "@/hooks/use-recent-views";

type MobileTopBarProps = {
  searchPlaceholder: string;
  searchValue?: string;
  searchAction?: string;
  searchHiddenFields?: Record<string, string | number | boolean | undefined>;
  locationLabel?: string;
  profileInitials?: string;
  notificationCount?: number;
  liveNotificationCount?: boolean;
  recentViews?: RecentView[];
  onRemoveRecentView?: (id: string) => void;
  onClearRecentViews?: () => void;
};

function SearchClearButton() {
  const handleClear = () => {
    const input = document.querySelector('input[name="q"]') as HTMLInputElement | null;
    const form = input?.form;
    if (form && input) {
      input.value = "";
      form.submit();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClear}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-400 transition hover:bg-blue-200 focus:bg-blue-200 focus:outline-none"
      aria-label="Clear search"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path
          fillRule="evenodd"
          d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

export function MobileTopBar({
  searchPlaceholder,
  searchValue,
  searchAction = "/customer",
  searchHiddenFields,
  locationLabel = "Choose Location",
  profileInitials = "TW",
  notificationCount = 0,
  liveNotificationCount = true,
}: MobileTopBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { recentViews, isLoaded, removeRecentView, clearRecentViews } = useRecentViews();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative top-0 z-30 -mx-4 mb-4 overflow-visible bg-transparent px-4 pb-4 pt-3 text-white shadow-soft">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/Bubbles.svg')] bg-bottom bg-no-repeat bg-cover" />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <NotificationBell initialCount={notificationCount} liveCount={liveNotificationCount} />
          <LocationSheetTrigger locationLabel={locationLabel} />
          <Link
            href="/customer/settings/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary-500/35 bg-white/80 text-xs font-bold text-primary-700"
            aria-label="My profile"
          >
            {profileInitials}
          </Link>
        </div>

        <div className="relative">
          <form action={searchAction} className="rounded-full bg-white p-1.5 shadow-md">
            {searchHiddenFields
              ? Object.entries(searchHiddenFields).map(([name, value]) => {
                  if (value === undefined) return null;
                  return <input key={name} type="hidden" name={name} value={String(value)} />;
                })
              : null}
            <div className="flex items-center gap-2 rounded-full px-2">
              <FlaticonIcon name="search" className="text-sm text-primary-500" />
              <input
                ref={searchInputRef}
                name="q"
                defaultValue={searchValue ?? ""}
                placeholder={searchPlaceholder}
                className="h-9 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-primary-500/70"
                onFocus={() => setIsSearchFocused(true)}
              />
              <SearchClearButton />
            </div>
          </form>

          {/* Recently Viewed Dropdown */}
          {isLoaded && isSearchFocused && recentViews.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border-muted bg-white shadow-lg z-50"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Recently Viewed</p>
                <button
                  type="button"
                  onClick={clearRecentViews}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary-500 transition hover:bg-primary-500/10"
                  aria-label="Clear recent views"
                >
                  <FlaticonIcon name="close" className="text-xs" />
                  Clear
                </button>
              </div>
              <div className="border-t border-border-muted px-4 py-2">
                <div className="space-y-1">
                  {recentViews.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-background-app transition group"
                    >
                      <Link
                        href={`/customer/shops/${item.id}`}
                        className="flex-1 text-sm font-medium text-text-secondary truncate"
                        onClick={() => setIsSearchFocused(false)}
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeRecentView(item.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted opacity-0 transition group-hover:opacity-100 hover:bg-background-app hover:text-text-secondary"
                        aria-label={`Remove ${item.name}`}
                      >
                        <FlaticonIcon name="close" className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-2" />
      </div>
    </header>
  );
}

export function SubPageHeader({ title, href = "/customer/settings" }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3 pt-1">
      <Link href={href} className="rounded-full p-2 text-primary-500 transition hover:bg-white/60" aria-label="Go back">
        <FlaticonIcon name="angle-small-left" className="text-lg" />
      </Link>
      <h1 className="text-xl font-bold text-text-secondary">{title}</h1>
    </div>
  );
}
