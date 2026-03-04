import Link from "next/link";

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-border-muted bg-white px-4 py-3 md:hidden">
      <ul className="grid grid-cols-3 gap-2 text-center text-sm text-text-secondary">
        <li><Link href="/customer">Home</Link></li>
        <li><Link href="/customer/shops">Shops</Link></li>
        <li><Link href="/customer/orders">Orders</Link></li>
      </ul>
    </nav>
  );
}
