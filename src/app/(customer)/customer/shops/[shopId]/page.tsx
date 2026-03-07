import { FavoriteToggleButton } from "@/components/customer/favorite-toggle-button";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { formatOptionPriceDelta, formatServiceRateLabel, type PricingOptionGroup, type PricingService } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { listFavoriteShopIds } from "@/services/favorites";
import { getVerifiedShopByIdWithServices } from "@/services/shops";
import Link from "next/link";
import { notFound } from "next/navigation";

type ShopService = Omit<PricingService, "description"> & {
  description: string | null;
  load_capacity_kg: number | null;
  service_option_groups?: PricingOptionGroup[];
};

export default async function CustomerShopDetailPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const [shop, favoriteShopIds] = await Promise.all([getVerifiedShopByIdWithServices(shopId), listFavoriteShopIds()]);

  if (!shop) {
    notFound();
  }

  const isFavorite = favoriteShopIds.includes(shop.id);
  const heroImage = shop.cover_image_url?.trim() || "/tapwash-logo.png";

  const services: ShopService[] = Array.isArray(shop.services)
    ? shop.services
        .filter(
          (service) =>
            typeof service?.id === "string" &&
            typeof service?.name === "string" &&
            typeof service?.unit_price === "number",
        )
        .map((service) => ({
          ...service,
          description: service.description ?? null,
          load_capacity_kg: typeof service.load_capacity_kg === "number" ? service.load_capacity_kg : null,
          service_option_groups: Array.isArray(service.service_option_groups) ? service.service_option_groups : [],
        }))
        .sort((a, b) => a.unit_price - b.unit_price)
    : [];
  const suggestedAddOns = Array.from(
    new Set(
      services.flatMap((service) =>
        (service.service_option_groups ?? [])
          .filter((group) => group.option_type === "addon")
          .flatMap((group) => (group.service_options ?? []).map((option) => option.name)),
      ),
    ),
  ).slice(0, 4);

  return (
    <main className="space-y-4 pb-2">

      <section>
        <div className="relative h-56 overflow-hidden -mx-4 mt-[-1.5rem] rounded-b-[0.5rem] shadow-[0_6px_5px_rgba(33,126,191,0.13)]">
          <img
            src={heroImage}
            alt={`${shop.shop_name} cover`}
            className="h-full w-full object-cover rounded-b-[0.5rem]"
            loading="eager"
            style={{ display: 'block', width: '100vw', maxWidth: '100%', minWidth: '100%', margin: 0 }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,67,109,0.28)_0%,rgba(14,67,109,0.16)_34%,rgba(8,43,72,0.65)_100%)] rounded-b-[0.5rem]" />

          <div className="absolute inset-x-3 top-7 flex items-center justify-between">
            <Link
              href="/customer/shops"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/85 text-primary-500 shadow-sm backdrop-blur"
              aria-label="Go back"
            >
              <FlaticonIcon name="angle-small-left" className="text-xl" />
            </Link>
            <div className="flex items-center gap-2">
              <FavoriteToggleButton shopId={shop.id} initialIsFavorite={isFavorite} variant="icon" />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/85 text-primary-500 shadow-sm backdrop-blur"
                aria-label="Share laundromat"
              >
                <FlaticonIcon name="share" className="text-base" />
              </button>
            </div>
          </div>

          {/* Removed shop name and location overlay from hero image as requested */}
        </div>

        <div className="space-y-3 px-0 pb-4 pt-0">
          {/* Removed operating hours and turnaround cards as requested */}

          <section className="px-0 pt-0 pb-5">
            <div className="flex items-center justify-end gap-2 pt-4 pb-2">
              <span className="text-xl text-yellow-400">★</span>
              <span className="text-base font-semibold" style={{ color: '#185671' }}>{(shop.rating_avg ?? 0).toFixed(1)}</span>
              <div className="flex -space-x-2">
                {/* Example avatars, replace src with real rater profile images if available */}
                <img src="/window.svg" alt="Rater 1" className="inline-block h-6 w-6 rounded-full border-2 border-white bg-white object-cover" />
                <img src="/tapwash-logo.png" alt="Rater 2" className="inline-block h-6 w-6 rounded-full border-2 border-white bg-white object-cover" />
                <img src="/globe.svg" alt="Rater 3" className="inline-block h-6 w-6 rounded-full border-2 border-white bg-white object-cover" />
                <img src="/vercel.svg" alt="Rater 4" className="inline-block h-6 w-6 rounded-full border-2 border-white bg-white object-cover" />
              </div>
              <span className="ml-2 text-sm font-semibold" style={{ color: '#185671' }}>{shop.total_reviews ?? 0} Reviews</span>
            </div>
            <h1 className="text-2xl font-black" style={{ color: '#2196f3' }}>{shop.shop_name}</h1>
            <div className="text-[1rem] font-medium leading-tight mb-1" style={{ color: '#185671' }}>{shop.location}</div>
            <div className="text-sm mb-1" style={{ color: '#185671' }}>Standard machine load: {shop.load_capacity_kg.toFixed(0)} kg</div>
            <div className="text-sm mb-1" style={{ color: '#185671' }}>Starting price: ₱{shop.starting_price.toFixed(2)}</div>
            <div className="text-sm mb-1" style={{ color: '#185671' }}>+639123456789</div>
            <div className="text-sm mb-1" style={{ color: '#185671' }}>7:00 AM – 9:00 PM (Daily)</div>
            <h2 className="mt-4 text-lg font-bold" style={{ color: '#185671' }}>Description</h2>
            <p className="mt-1 text-base font-medium" style={{ color: '#185671' }}>
              {shop.description ||
                "A top-rated laundromat in Fatima, General Santos City, offering reliable wash–dry–fold, dry cleaning, ironing, and stain treatment services. Known for modern machines and excellent customer service, backed by outstanding customer reviews."}
            </p>
              <hr className="my-6 border-t border-gray-200" />
          </section>

          <section className="rounded-2xl bg-white/80 px-3 py-3 mt-2">
            <h2 className="text-sm font-black text-primary-500">Services offered</h2>
            {services.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">No service menu available yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-[#d5e7f6] rounded-2xl bg-white px-2">
                {services.map((service) => {
                  const iconTone = getServiceIconTone(service.name);

                  return (
                    <li key={service.id} className="flex items-center justify-between gap-3 px-1 py-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-black", iconTone.className)}>
                          {iconTone.badge}
                        </span>
                        <div>
                          <span className="text-[1.02rem] font-black text-primary-500">{service.name}</span>
                          {service.description ? <p className="mt-1 text-xs font-medium text-primary-500/70">{service.description}</p> : null}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary-500/55">{formatServiceRateLabel(service, shop.load_capacity_kg)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {services.some((service) => (service.service_option_groups ?? []).length > 0) ? (
            <section className="rounded-2xl bg-white/80 px-3 py-3 mt-2">
              <h2 className="text-sm font-black text-primary-500">Care customizations</h2>
              <div className="mt-2 space-y-3">
                {services
                  .filter((service) => (service.service_option_groups ?? []).length > 0)
                  .map((service) => (
                    <div key={service.id} className="rounded-2xl border border-[#d5e7f6] bg-white px-3 py-3">
                      <p className="text-sm font-black text-primary-500">{service.name}</p>
                      <div className="mt-2 space-y-2">
                        {(service.service_option_groups ?? []).map((group) => (
                          <div key={group.id}>
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-primary-500/65">{group.name}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {(group.service_options ?? []).map((option) => (
                                <span key={option.id} className="rounded-full bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-500">
                                  {option.name} · {formatOptionPriceDelta(option)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl bg-white/75 px-3 py-2.5">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-primary-500/70">Suggested Add-ons</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(suggestedAddOns.length > 0 ? suggestedAddOns : ["Express handling", "Ironing", "Stain treatment"]).map((name) => (
                <span key={name} className="rounded-full bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-500">{name}</span>
              ))}
            </div>
          </section>
        </div>
      </section>

      <div className="fixed left-0 right-0 bottom-[max(0.85rem,env(safe-area-inset-bottom))] z-30 px-4 pointer-events-none">
        <Link
          href={`/customer/orders/new?shopId=${encodeURIComponent(shop.id)}`}
          className="block pointer-events-auto rounded-full bg-[#43a9eb] px-4 py-4 text-center text-[1.2rem] font-medium leading-none text-white shadow-[0_12px_26px_rgba(33,126,191,0.35)] transition hover:bg-[#389fdf]"
        >
          Show Bucket
        </Link>
      </div>
    </main>
  );
}

function getServiceIconTone(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("wash")) {
    return { badge: "WA", className: "bg-[#e1f2ff] text-[#0f8fd9]" };
  }

  if (normalized.includes("dry")) {
    return { badge: "DR", className: "bg-[#ddf5f0] text-[#17a489]" };
  }

  if (normalized.includes("fold")) {
    return { badge: "FO", className: "bg-[#ece9ff] text-[#6c5bd5]" };
  }

  if (normalized.includes("iron")) {
    return { badge: "IR", className: "bg-[#fff1df] text-[#d8892e]" };
  }

  return { badge: "SV", className: "bg-[#edf3f8] text-[#4f8db8]" };
}
