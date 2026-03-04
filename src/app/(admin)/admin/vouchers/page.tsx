import { createVoucherAction, toggleVoucherAction } from "@/app/actions/dispatch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listVouchers } from "@/services/riders";

export default async function AdminVouchersPage() {
  const vouchers = await listVouchers();

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Voucher Management</h1>
      <Card>
        <h2 className="mb-2 text-sm font-semibold text-text-secondary">Create Voucher</h2>
        <form action={createVoucherAction} className="grid gap-2 md:grid-cols-5">
          <Input required name="code" placeholder="CODE" />
          <Input required name="description" placeholder="Description" />
          <select name="discountType" className="h-11 rounded-2xl border border-border-muted bg-white px-3 text-sm" defaultValue="fixed">
            <option value="fixed">fixed</option>
            <option value="percent">percent</option>
          </select>
          <Input required type="number" step="1" min={1} name="discountValue" placeholder="Discount" />
          <Input required type="number" step="1" min={0} name="minOrderAmount" placeholder="Min order" />
          <Button type="submit" className="md:col-span-5">Create Voucher</Button>
        </form>
      </Card>

      {vouchers.map((voucher) => (
        <Card key={voucher.id}>
          <p className="font-semibold">{voucher.code}</p>
          <p className="text-sm text-text-secondary">{voucher.description}</p>
          <p className="text-sm text-text-muted">
            {voucher.discount_type} · {voucher.discount_value} · min ₱{voucher.min_order_amount}
          </p>
          <form action={toggleVoucherAction} className="mt-2">
            <input type="hidden" name="voucherId" value={voucher.id} />
            <input type="hidden" name="isActive" value={voucher.is_active ? "false" : "true"} />
            <Button type="submit" variant={voucher.is_active ? "secondary" : "primary"}>
              {voucher.is_active ? "Deactivate" : "Activate"}
            </Button>
          </form>
        </Card>
      ))}
    </main>
  );
}
