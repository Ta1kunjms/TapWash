import { verifyShopAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminShopsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("laundry_shops")
    .select("id, shop_name, is_verified")
    .order("created_at", { ascending: false });

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Verify Shops</h1>
      {(data ?? []).map((shop) => (
        <Card key={shop.id}>
          <p className="font-semibold">{shop.shop_name}</p>
          <p className="text-sm text-text-secondary">Verified: {shop.is_verified ? "Yes" : "No"}</p>
          <form action={verifyShopAction} className="mt-3">
            <input type="hidden" name="shopId" value={shop.id} />
            <input type="hidden" name="isVerified" value={shop.is_verified ? "false" : "true"} />
            <Button type="submit" variant={shop.is_verified ? "secondary" : "primary"}>
              {shop.is_verified ? "Unverify shop" : "Verify shop"}
            </Button>
          </form>
        </Card>
      ))}
    </main>
  );
}
