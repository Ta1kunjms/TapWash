import Link from "next/link";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { NotificationBell } from "@/components/customer/notification-bell";
import { LocationSheetTrigger } from "@/components/customer/location-sheet-trigger";

type MobileTopBarProps = {
  searchPlaceholder: string;
  searchValue?: string;
  searchAction?: string;
  searchHiddenFields?: Record<string, string | number | boolean | undefined>;
  locationLabel?: string;
  profileInitials?: string;
  notificationCount?: number;
  liveNotificationCount?: boolean;
};

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
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 overflow-hidden bg-transparent px-4 pb-4 pt-3 text-white shadow-soft">
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
              name="q"
              defaultValue={searchValue ?? ""}
              placeholder={searchPlaceholder}
              className="h-9 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-primary-500/70"
            />
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-500"
              aria-label="Apply search"
            >
              <FlaticonIcon name="filter" className="text-sm" />
            </button>
          </div>
        </form>

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
