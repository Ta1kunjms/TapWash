import {
  createHomeOfferAction,
  deleteHomeOfferAction,
  toggleHomeOfferAction,
  updateHomeOfferAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listHomeOffers } from "@/services/admin";

export default async function AdminOffersPage() {
  const offers = await listHomeOffers();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Home Offers</h1>
        <p className="text-sm text-text-secondary">Manage dynamic promo cards shown on the customer home page.</p>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-text-secondary">Create Offer</h2>
        <form action={createHomeOfferAction} className="grid gap-2 md:grid-cols-3">
          <Input required name="badgeLabel" placeholder="Badge label" defaultValue="LIMITED PROMO" />
          <Input required name="title" placeholder="Offer title" />
          <Input name="subtitle" placeholder="Offer subtitle" />
          <Input required name="ctaLabel" placeholder="CTA label" defaultValue="Claim Offer" />
          <Input required name="ctaHref" placeholder="CTA path" defaultValue="/customer/vouchers" />
          <Input required name="priority" type="number" step="1" placeholder="Priority" defaultValue={0} />
          <Input required name="accentFrom" placeholder="Accent from" defaultValue="#1e88e5" />
          <Input required name="accentTo" placeholder="Accent to" defaultValue="#5bb8ff" />
          <select name="audience" className="h-11 rounded-2xl border border-border-muted bg-white px-3 text-sm" defaultValue="all">
            <option value="all">all</option>
            <option value="new">new</option>
            <option value="returning">returning</option>
            <option value="favorites">favorites</option>
          </select>
          <Input name="startsAt" type="datetime-local" />
          <Input name="endsAt" type="datetime-local" />
          <Button type="submit" className="md:col-span-3">
            Create Offer
          </Button>
        </form>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Offer</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">CTA</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Audience</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Priority</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Window</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Active</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td className="px-4 py-3">
                  <Input form={`update-offer-${offer.id}`} name="badgeLabel" defaultValue={offer.badge_label} required />
                  <Input form={`update-offer-${offer.id}`} name="title" defaultValue={offer.title} required className="mt-2" />
                  <Input form={`update-offer-${offer.id}`} name="subtitle" defaultValue={offer.subtitle ?? ""} className="mt-2" />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input form={`update-offer-${offer.id}`} name="accentFrom" defaultValue={offer.accent_from} required />
                    <Input form={`update-offer-${offer.id}`} name="accentTo" defaultValue={offer.accent_to} required />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Input form={`update-offer-${offer.id}`} name="ctaLabel" defaultValue={offer.cta_label} required />
                  <Input form={`update-offer-${offer.id}`} name="ctaHref" defaultValue={offer.cta_href} required className="mt-2" />
                </td>
                <td className="px-4 py-3">
                  <select
                    form={`update-offer-${offer.id}`}
                    name="audience"
                    defaultValue={offer.audience}
                    className="h-11 rounded-2xl border border-border-muted bg-white px-3 text-sm"
                  >
                    <option value="all">all</option>
                    <option value="new">new</option>
                    <option value="returning">returning</option>
                    <option value="favorites">favorites</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Input form={`update-offer-${offer.id}`} name="priority" type="number" step="1" defaultValue={offer.priority} required />
                </td>
                <td className="px-4 py-3">
                  <Input form={`update-offer-${offer.id}`} name="startsAt" type="datetime-local" defaultValue={toDateTimeLocal(offer.starts_at)} />
                  <Input form={`update-offer-${offer.id}`} name="endsAt" type="datetime-local" defaultValue={toDateTimeLocal(offer.ends_at)} className="mt-2" />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      offer.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {offer.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="space-x-2 px-4 py-3 whitespace-nowrap">
                  <form id={`update-offer-${offer.id}`} action={updateHomeOfferAction} className="inline">
                    <input type="hidden" name="offerId" value={offer.id} />
                    <input type="hidden" name="isActive" value={offer.is_active ? "true" : "false"} />
                    <Button type="submit" variant="secondary" size="sm">
                      Save
                    </Button>
                  </form>

                  <form action={toggleHomeOfferAction} className="inline">
                    <input type="hidden" name="offerId" value={offer.id} />
                    <input type="hidden" name="isActive" value={offer.is_active ? "false" : "true"} />
                    <Button type="submit" variant={offer.is_active ? "secondary" : "primary"} size="sm">
                      {offer.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </form>

                  <form action={deleteHomeOfferAction} className="inline">
                    <input type="hidden" name="offerId" value={offer.id} />
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

function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
