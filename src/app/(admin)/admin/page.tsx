import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const [{ count: users }, { count: shops }, { count: orders }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("laundry_shops").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Overview</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <Card>Users: {users ?? 0}</Card>
        <Card>Shops: {shops ?? 0}</Card>
        <Card>Orders: {orders ?? 0}</Card>
      </div>
    </main>
  );
}
