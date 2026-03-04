import Link from "next/link";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-screen max-w-6xl gap-4 p-4 md:grid-cols-[220px_1fr]">
      <aside className="hidden rounded-2xl border border-border-muted bg-white p-4 md:block">
        <nav className="space-y-2 text-sm">
          <Link className="block" href="/shop">Dashboard</Link>
          <Link className="block" href="/shop/orders">Orders</Link>
          <Link className="block" href="/shop/services">Services</Link>
          <Link className="block" href="/shop/dispatch">Dispatch</Link>
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}
