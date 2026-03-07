"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/shops", label: "Shops" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/vouchers", label: "Vouchers" },
    { href: "/admin/orders", label: "Orders" },
  ];

  const isActive = (href: string) => {
    if (href === "/admin" && pathname === "/admin") return true;
    if (href !== "/admin" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-4 p-4 md:grid-cols-[240px_1fr]">
      <aside className="hidden rounded-2xl border border-border-muted bg-white p-4 md:block">
        <div className="mb-6">
          <h2 className="text-lg font-bold">TapWash Admin Portal</h2>
          <p className="text-xs text-text-secondary">Operations and governance</p>
        </div>
        <nav className="space-y-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              className={`block rounded-lg px-3 py-2 transition-colors ${
                isActive(link.href)
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="space-y-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-border-muted bg-white p-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              className={`rounded-xl px-3 py-2 text-sm whitespace-nowrap ${
                isActive(link.href)
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700"
              }`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
