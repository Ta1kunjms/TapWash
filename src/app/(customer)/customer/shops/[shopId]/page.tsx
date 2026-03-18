import { FavoriteToggleButton } from "@/components/customer/favorite-toggle-button";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { formatOptionPriceDelta, formatServiceRateLabel, type PricingOptionGroup, type PricingService } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { roleToPath } from "@/lib/roles";
import { getCurrentUserRole } from "@/services/auth";
import { listFavoriteShopIds } from "@/services/favorites";
import { getVerifiedShopByIdWithServices } from "@/services/shops";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
  const role = await getCurrentUserRole();
  if (!role) redirect("/login");
  if (role !== "customer") redirect(roleToPath(role));

  const { shopId } = await params;
  const [shop, favoriteShopIds] = await Promise.all([
    getVerifiedShopByIdWithServices(shopId),
    listFavoriteShopIds(),
  ]);

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
          load_capacity_kg:
            typeof service.load_capacity_kg === "number" ? service.load_capacity_kg : null,
          service_option_groups: Array.isArray(service.service_option_groups)
            ? service.service_option_groups
            : [],
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

  const hasCustomizations = services.some(
    (service) => (service.service_option_groups ?? []).length > 0,
  );

  return (
    <main className="min-h-screen pb-32">
      {/* ── Hero image ── */}
      <div className="relative -mx-4 mt-[-0.75rem]">
        <div className="relative h-72 overflow-hidden">
          <Image
            src={heroImage}
            alt={`${shop.shop_name} cover`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* gradient: dark top for controls, subtle tint at bottom */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.38)_0%,rgba(0,0,0,0)_45%,rgba(0,0,0,0.12)_100%)]" />
        </div>

        {/* Overlay controls */}
        <div className="absolute inset-x-4 top-5 flex items-center justify-between">
          <Link
            href="/customer/shops"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/85 text-primary-500 shadow-sm backdrop-blur-sm"
            aria-label="Go back"
          >
            <FlaticonIcon name="angle-small-left" className="text-xl" />
          </Link>
          <div className="flex items-center gap-2">
            <FavoriteToggleButton shopId={shop.id} initialIsFavorite={isFavorite} variant="icon" />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/85 text-primary-500 shadow-sm backdrop-blur-sm"
              aria-label="Share"
            >
              <FlaticonIcon name="share" className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content card — slides up over image ── */}
      <div className="-mt-6 rounded-t-3xl bg-background-app px-4 pt-4 relative z-10">
        {/* drag pill */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-muted" />

        {/* Name + starting price */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-text-primary leading-tight">
                {shop.shop_name}
              </h1>
              {shop.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary-500">
                  <FlaticonIcon name="badge-check" className="text-[0.7rem]" />
                  Verified
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-text-muted line-clamp-1">{shop.location}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted">
              Starting from
            </p>
            <p className="text-2xl font-black text-primary-500 leading-tight">
              ₱{shop.starting_price.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Rating + info badges row */}
        <div className="flex items-center gap-2.5 mb-5 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-amber-400 text-sm">★</span>
            <span className="text-sm font-bold text-text-primary">
              {(shop.rating_avg ?? 0).toFixed(1)}
            </span>
            <span className="text-xs text-text-muted">({shop.total_reviews ?? 0})</span>
          </div>
          <div className="h-3.5 w-px bg-border-muted" />
          <div className="flex items-center gap-1 text-text-muted">
            <FlaticonIcon name="weight" className="text-sm text-primary-500/60" />
            <span className="text-xs font-medium">
              {shop.load_capacity_kg.toFixed(0)} kg capacity
            </span>
          </div>
          <div className="h-3.5 w-px bg-border-muted" />
          <div className="flex items-center gap-1 text-text-muted">
            <FlaticonIcon name="clock" className="text-sm text-primary-500/60" />
            <span className="text-xs font-medium">24 hr turnaround</span>
          </div>
        </div>

        {/* About */}
        <div className="mb-5">
          <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-primary-500/70">
            About
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            {shop.description ||
              "A trusted laundromat offering reliable wash–dry–fold, express laundry, dry cleaning, and stain treatment. Known for modern equipment, fast turnaround, and excellent service."}
          </p>
        </div>

        <div className="my-5 border-t border-border-muted" />

        {/* Services */}
        <div className="mb-5">
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-primary-500/70">
            Services
          </h2>
          {services.length === 0 ? (
            <p className="text-sm text-text-muted">No services available yet.</p>
          ) : (
            <ul className="space-y-2">
              {services.map((service) => {
                const iconTone = getServiceIconTone(service.name);
                return (
                  <li key={service.id} className="rounded-2xl bg-surface-card shadow-soft">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 marker:hidden">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black",
                              iconTone.className,
                            )}
                          >
                            {iconTone.badge}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-primary">{service.name}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-bold text-primary-500">
                            {formatServiceRateLabel(service)}
                          </span>
                          {service.description ? (
                            <FlaticonIcon
                              name="angle-small-down"
                              className="text-base text-text-muted transition-transform group-open:rotate-180"
                            />
                          ) : null}
                        </div>
                      </summary>
                      {service.description ? (
                        <div className="border-t border-border-muted px-3 pb-3 pt-2">
                          <p className="text-xs leading-relaxed text-text-muted">{service.description}</p>
                        </div>
                      ) : null}
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Care customizations */}
        {hasCustomizations ? (
          <>
            <div className="my-5 border-t border-border-muted" />
            <div className="mb-5">
              <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-primary-500/70">
                Care Options
              </h2>
              <div className="space-y-2">
                {services
                  .filter((service) => (service.service_option_groups ?? []).length > 0)
                  .map((service) => (
                    <div
                      key={service.id}
                      className="rounded-2xl bg-surface-card px-3 py-3 shadow-soft"
                    >
                      <p className="text-sm font-bold text-text-primary mb-2">{service.name}</p>
                      <div className="space-y-2">
                        {(service.service_option_groups ?? []).map((group) => (
                          <div key={group.id}>
                            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-text-muted mb-1.5">
                              {group.name}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(group.service_options ?? []).map((option) => (
                                <span
                                  key={option.id}
                                  className="rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-semibold text-primary-500"
                                >
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
            </div>
          </>
        ) : null}

        {/* Add-ons */}
        {suggestedAddOns.length > 0 ? (
          <>
            <div className="my-5 border-t border-border-muted" />
            <div className="mb-5">
              <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-primary-500/70">
                Popular Add-ons
              </h2>
              <div className="flex flex-wrap gap-2">
                {suggestedAddOns.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-500"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : null}

      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-background-app via-background-app/95 to-transparent">
          <Link
            href={`/customer/orders/new?shopId=${encodeURIComponent(shop.id)}`}
            className="pointer-events-auto flex h-12 items-center justify-center gap-2 rounded-full bg-[#43a9eb] px-8 text-center text-[1.2rem] font-bold leading-none text-white shadow-[0_12px_26px_rgba(33,126,191,0.35)] transition hover:bg-[#389fdf]"
          >
            <FlaticonIcon name="shopping-cart" className="text-lg" />
            Show Bucket
          </Link>
        </div>
      </div>
    </main>
  );
}

function getServiceIconTone(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("wash")) return { badge: "WA", className: "bg-[#e1f2ff] text-[#0f8fd9]" };
  if (normalized.includes("dry")) return { badge: "DR", className: "bg-[#ddf5f0] text-[#17a489]" };
  if (normalized.includes("fold")) return { badge: "FO", className: "bg-[#ece9ff] text-[#6c5bd5]" };
  if (normalized.includes("iron")) return { badge: "IR", className: "bg-[#fff1df] text-[#d8892e]" };
  return { badge: "SV", className: "bg-[#edf3f8] text-[#4f8db8]" };
}
