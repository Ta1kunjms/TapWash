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
  locationLabel = "Brgy. Tambler, GSC",
  profileInitials = "TW",
  notificationCount = 0,
  liveNotificationCount = true,
}: MobileTopBarProps) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 overflow-hidden rounded-b-[2rem] bg-primary-500 px-4 pb-4 pt-3 text-white shadow-soft">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <svg className="block h-full w-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1361.44 595">
          <defs>
            <linearGradient id="topbar-water-gradient" x1="680.72" x2="680.72" y1="594.988" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3FA9F0" />
              <stop offset="0.17" stopColor="#4AAEF1" />
              <stop offset="0.48" stopColor="#68BBF4" />
              <stop offset="0.89" stopColor="#97D0F9" />
              <stop offset="1" stopColor="#A6D6FB" />
            </linearGradient>
          </defs>
          <rect width="1361.44" height="595" fill="url(#topbar-water-gradient)" />
          <path
            d="M0 485C37 525 77 503 119 530C157 556 193 512 232 531C272 551 303 500 343 526C383 553 421 501 460 531C500 562 536 510 576 526C616 542 649 500 689 531C730 562 764 503 805 531C846 559 881 504 921 525C961 546 996 498 1038 529C1079 560 1117 508 1156 530C1195 552 1232 510 1272 525C1306 538 1334 527 1361.44 511V595H0V485Z"
            fill="#F4FAFF"
          />
          <circle cx="317" cy="536" r="7" fill="#9ED1FA" />
          <circle cx="352" cy="544" r="5" fill="#9ED1FA" />
          <circle cx="562" cy="537" r="6" fill="#9ED1FA" />
          <circle cx="960" cy="544" r="5" fill="#9ED1FA" />
          <circle cx="1122" cy="539" r="7" fill="#9ED1FA" />
        </svg>
      </div>

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <NotificationBell initialCount={notificationCount} liveCount={liveNotificationCount} />
          <LocationSheetTrigger locationLabel={locationLabel} />
          <Link
            href="/customer/settings/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 bg-white/30 text-xs font-bold"
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
