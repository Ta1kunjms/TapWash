import {
  createVoucherAction,
  deleteVoucherAction,
  toggleVoucherAction,
  updateVoucherAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listVouchers } from "@/services/admin";

export default async function AdminVouchersPage() {
  const vouchers = await listVouchers();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Voucher Management</h1>
        <p className="text-sm text-text-secondary">Create, update, activate, or delete promo vouchers.</p>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-text-secondary">Create Voucher</h2>
        <form action={createVoucherAction} className="grid gap-2 md:grid-cols-6">
          <Input required name="code" placeholder="CODE" />
          <Input required name="description" placeholder="Description" />
          <select
            name="discountType"
            className="h-11 rounded-2xl border border-border-muted bg-white px-3 text-sm"
            defaultValue="fixed"
          >
            <option value="fixed">fixed</option>
            <option value="percent">percent</option>
          </select>
          <Input
            required
            type="number"
            step="1"
            min={1}
            name="discountValue"
            placeholder="Discount"
          />
          <Input
            required
            type="number"
            step="1"
            min={0}
            name="minOrderAmount"
            placeholder="Min order"
          />
          <Input
            type="number"
            step="1"
            min={0}
            name="maxDiscountAmount"
            placeholder="Max discount"
          />
          <Button type="submit" className="md:col-span-6">
            Create Voucher
          </Button>
        </form>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount Type
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount Value
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Min Order Amount
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Discount
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vouchers.map((voucher) => (
              <tr key={voucher.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <Input form={`update-voucher-${voucher.id}`} name="code" defaultValue={voucher.code} required />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <Input
                    form={`update-voucher-${voucher.id}`}
                    name="description"
                    defaultValue={voucher.description ?? ""}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <select
                    form={`update-voucher-${voucher.id}`}
                    name="discountType"
                    defaultValue={voucher.discount_type}
                    className="h-11 rounded-2xl border border-border-muted bg-white px-3 text-sm"
                  >
                    <option value="fixed">fixed</option>
                    <option value="percent">percent</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Input
                    form={`update-voucher-${voucher.id}`}
                    name="discountValue"
                    type="number"
                    step="1"
                    min={1}
                    defaultValue={voucher.discount_value}
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Input
                    form={`update-voucher-${voucher.id}`}
                    name="minOrderAmount"
                    type="number"
                    step="1"
                    min={0}
                    defaultValue={voucher.min_order_amount}
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Input
                    form={`update-voucher-${voucher.id}`}
                    name="maxDiscountAmount"
                    type="number"
                    step="1"
                    min={0}
                    defaultValue={voucher.max_discount_amount ?? ""}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      voucher.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {voucher.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <form id={`update-voucher-${voucher.id}`} action={updateVoucherAction} className="inline">
                    <input type="hidden" name="voucherId" value={voucher.id} />
                    <input type="hidden" name="isActive" value={voucher.is_active ? "true" : "false"} />
                    <Button type="submit" variant="secondary" size="sm">
                      Save
                    </Button>
                  </form>

                  <form action={toggleVoucherAction} className="inline">
                    <input type="hidden" name="voucherId" value={voucher.id} />
                    <input
                      type="hidden"
                      name="isActive"
                      value={voucher.is_active ? "false" : "true"}
                    />
                    <Button
                      type="submit"
                      variant={voucher.is_active ? "secondary" : "primary"}
                      size="sm"
                    >
                      {voucher.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </form>

                  <form action={deleteVoucherAction} className="inline">
                    <input type="hidden" name="voucherId" value={voucher.id} />
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
