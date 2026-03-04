import Link from "next/link";

type MobileTopBarProps = {
  searchPlaceholder: string;
  searchValue?: string;
  searchAction?: string;
};

export function MobileTopBar({ searchPlaceholder, searchValue, searchAction = "/customer" }: MobileTopBarProps) {
  return (
    <header className="-mx-4 mb-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-b from-primary-500 to-primary-500/80 px-4 pb-4 pt-3 text-white shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <button className="rounded-full p-2 transition hover:bg-white/15" aria-label="Notifications">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M12 2a6 6 0 00-6 6v3.7c0 .9-.3 1.8-.9 2.5L3.3 16a1 1 0 00.7 1.7h16a1 1 0 00.7-1.7l-1.8-1.8a3.6 3.6 0 01-.9-2.5V8a6 6 0 00-6-6zm0 20a3 3 0 002.8-2H9.2A3 3 0 0012 22z" />
          </svg>
        </button>
        <div className="text-center leading-tight">
          <p className="text-xs font-semibold tracking-wide text-white/80">Location</p>
          <p className="text-sm font-semibold">Brgy. Tambler, GSC</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 bg-white/30 text-xs font-bold">
          TJ
        </div>
      </div>

      <form action={searchAction} className="rounded-full bg-white p-1.5 shadow-md">
        <div className="flex items-center gap-2 rounded-full px-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
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
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16" />
              <path d="M7 12h10" />
              <path d="M10 18h4" />
            </svg>
          </button>
        </div>
      </form>

      <div className="relative mt-3 h-3">
        <div className="absolute inset-x-0 top-0 h-2 rounded-full bg-primary-500/90" />
        <div className="absolute left-0 top-[-6px] h-4 w-8 rounded-full bg-primary-500/90" />
        <div className="absolute left-10 top-[-6px] h-4 w-10 rounded-full bg-primary-500/90" />
        <div className="absolute left-24 top-[-6px] h-4 w-7 rounded-full bg-primary-500/90" />
        <div className="absolute right-8 top-[-6px] h-4 w-10 rounded-full bg-primary-500/90" />
      </div>
    </header>
  );
}

export function SubPageHeader({ title, href = "/customer/settings" }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3 pt-1">
      <Link href={href} className="rounded-full p-2 text-primary-500 transition hover:bg-white/60" aria-label="Go back">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="text-xl font-bold text-text-secondary">{title}</h1>
    </div>
  );
}
