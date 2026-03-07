import {
  createShopAction,
  deleteShopAction,
  updateShopAction,
  verifyShopAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listShopOwners, listShops } from "@/services/admin";

export default async function AdminShopsPage() {
  const [shops, owners] = await Promise.all([listShops(), listShopOwners()]);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Shops</h1>
        <p className="text-sm text-text-secondary">Create, update, verify, and remove shop records.</p>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">Create Shop</h2>
        <form action={createShopAction} className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            Owner
            <select
              required
              name="ownerId"
              className="h-11 w-full rounded-2xl border border-border-muted bg-white px-3 text-sm text-text-primary"
            >
              <option value="">Select owner</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            Shop Name
            <Input required name="shopName" placeholder="FreshSpin Laundry" />
          </label>
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            Location
            <Input required name="location" placeholder="Quezon City" />
          </label>
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            Description
            <Input name="description" placeholder="Pickup and same-day delivery" />
          </label>
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            Cover image URL
            <Input name="coverImageUrl" placeholder="https://images.example.com/laundry-cover.jpg" />
          </label>
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            Starting price
            <Input required type="number" step="0.01" min={0} name="startingPrice" placeholder="65" />
          </label>
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            Kg per load
            <Input required type="number" step="0.1" min={1} name="loadCapacityKg" placeholder="8" />
          </label>
          <label className="space-y-1 text-xs font-medium text-text-secondary">
            Commission %
            <Input required type="number" step="0.01" min={0} max={100} name="commissionPercentage" placeholder="10" />
          </label>
          <Button type="submit" className="md:col-span-2">
            Add Shop
          </Button>
        </form>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shop Name
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cover Image URL
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Starting price
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kg per load
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verified
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shops.map((shop) => (
              <tr key={shop.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <Input form={`update-shop-${shop.id}`} name="shopName" defaultValue={shop.shop_name} required />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <select
                    form={`update-shop-${shop.id}`}
                    name="ownerId"
                    defaultValue={shop.owner_id}
                    className="h-11 w-full min-w-[160px] rounded-2xl border border-border-muted bg-white px-3 text-sm"
                  >
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.displayName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Input form={`update-shop-${shop.id}`} name="location" defaultValue={shop.location} required />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Input
                    form={`update-shop-${shop.id}`}
                    name="description"
                    defaultValue={shop.description ?? ""}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Input
                    form={`update-shop-${shop.id}`}
                    name="coverImageUrl"
                    defaultValue={shop.cover_image_url ?? ""}
                    placeholder="https://images.example.com/laundry-cover.jpg"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Input
                    form={`update-shop-${shop.id}`}
                    name="startingPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={shop.starting_price}
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Input
                    form={`update-shop-${shop.id}`}
                    name="loadCapacityKg"
                    type="number"
                    min={1}
                    step="0.1"
                    defaultValue={shop.load_capacity_kg}
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Input
                    form={`update-shop-${shop.id}`}
                    name="commissionPercentage"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    defaultValue={shop.commission_percentage}
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      shop.is_verified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {shop.is_verified ? "Verified" : "Pending"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(shop.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <form id={`update-shop-${shop.id}`} action={updateShopAction} className="inline">
                    <input type="hidden" name="shopId" value={shop.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      Save
                    </Button>
                  </form>

                  <form action={verifyShopAction} className="inline">
                    <input type="hidden" name="shopId" value={shop.id} />
                    <input
                      type="hidden"
                      name="isVerified"
                      value={shop.is_verified ? "false" : "true"}
                    />
                    <Button
                      type="submit"
                      variant={shop.is_verified ? "secondary" : "primary"}
                      size="sm"
                    >
                      {shop.is_verified ? "Unverify" : "Verify"}
                    </Button>
                  </form>

                  <form action={deleteShopAction} className="inline">
                    <input type="hidden" name="shopId" value={shop.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                      Delete
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
