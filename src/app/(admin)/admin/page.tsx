import { Card } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const [
    { count: users },
    { count: shops },
    { count: verifiedShops },
    { count: orders },
    { count: pendingOrders },
    { count: completedOrders },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("laundry_shops").select("id", { count: "exact", head: true }),
    supabase.from("laundry_shops").select("id", { count: "exact", head: true }).eq("is_verified", true),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "completed"),
  ]);

  const statCards = [
    { label: "Total Users", value: users ?? 0 },
    { label: "Total Shops", value: shops ?? 0 },
    { label: "Verified Shops", value: verifiedShops ?? 0 },
    { label: "Total Orders", value: orders ?? 0 },
    { label: "Pending Orders", value: pendingOrders ?? 0 },
    { label: "Completed Orders", value: completedOrders ?? 0 },
  ];

  const sections = [
    { href: "/admin/shops", title: "Shop Registry", subtitle: "Add, edit, verify, and remove laundry shops." },
    { href: "/admin/users", title: "User Governance", subtitle: "Manage account roles and suspension status." },
    { href: "/admin/vouchers", title: "Promo Vault", subtitle: "Control discount campaigns and voucher lifecycle." },
    { href: "/admin/offers", title: "Home Offers", subtitle: "Manage home-page promo cards and publishing windows." },
    { href: "/admin/orders", title: "Order Audit", subtitle: "Track status and payment state of all orders." },
    { href: "/admin/support", title: "Support Queue", subtitle: "Review and resolve customer support tickets." },
  ];

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-sm text-text-secondary">Command center for marketplace operations.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-sm text-gray-600">{item.label}</p>
            <p className="text-2xl font-bold">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full p-5 transition hover:border-primary-500/30 hover:shadow-md">
              <h2 className="text-lg font-semibold text-text-primary">{section.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{section.subtitle}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
