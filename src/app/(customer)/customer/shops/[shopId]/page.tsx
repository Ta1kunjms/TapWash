import { FavoriteToggleButton } from "@/components/customer/favorite-toggle-button";
import { ShopShareButton } from "@/components/customer/shop-share-button";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { getCustomerAvatarByKey } from "@/lib/avatar-catalog";
import { getCustomerDictionary } from "@/lib/i18n";
import { formatOptionPriceDelta, formatServiceRateLabel, type PricingOptionGroup, type PricingService } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { roleToPath } from "@/lib/roles";
import { getCurrentUserRole } from "@/services/auth";
import { getCustomerProfile } from "@/services/customer";
import { listFavoriteShopIds } from "@/services/favorites";
import { getShopRecentReviewerAvatars, getVerifiedShopByIdWithServices } from "@/services/shops";
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
  const [shop, favoriteShopIds, profile, recentReviewers] = await Promise.all([
    getVerifiedShopByIdWithServices(shopId),
    listFavoriteShopIds(),
    getCustomerProfile(),
    getShopRecentReviewerAvatars(shopId, 4),
  ]);
  const dictionary = getCustomerDictionary(profile?.preferred_language ?? "en");

  if (!shop) {
    notFound();
  }

  const isFavorite = favoriteShopIds.includes(shop.id);
  const heroImage = shop.cover_image_url?.trim() || "/tapwash-logo.png";
  const reviewerAvatars = recentReviewers.map((review) => getCustomerAvatarByKey(review.avatar_key));
  const shopLoadCapacityKg = typeof shop.load_capacity_kg === "number" ? shop.load_capacity_kg : null;

  const services: ShopService[] = Array.isArray(shop.services)
    ? shop.services
        .filter(
          (service) =>
            typeof service?.id === "string" &&
            typeof service?.name === "string" &&
            typeof service?.unit_price === "number",
        )
        .map((service) => {
          const optionGroups = (service as { service_option_groups?: unknown }).service_option_groups;

          return {
            ...service,
            description: service.description ?? null,
            load_capacity_kg:
              typeof service.load_capacity_kg === "number" ? service.load_capacity_kg : null,
            service_option_groups: Array.isArray(optionGroups) ? optionGroups : [],
          };
        })
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
    <main className="min-h-screen bg-background-app pb-32">
      <div className="relative -mx-4 mt-[-0.75rem]">
        <div className="relative h-80 overflow-hidden">
          <Image
            src={heroImage}
            alt={`${shop.shop_name} cover`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,17,29,0.65)_0%,rgba(4,17,29,0.35)_38%,rgba(4,17,29,0.15)_62%,rgba(4,17,29,0.55)_100%)]" />
        </div>

        <div className="absolute inset-x-4 top-5 flex items-center justify-between">
          <Link
            href="/customer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/85 text-primary-500 shadow-sm backdrop-blur-sm"
            aria-label={dictionary.shop.goBack}
          >
            <FlaticonIcon name="angle-small-left" className="text-xl" />
          </Link>
          <div className="flex items-center gap-2">
            <FavoriteToggleButton shopId={shop.id} initialIsFavorite={isFavorite} variant="icon" />
            <ShopShareButton
              shopName={shop.shop_name}
              label={dictionary.shop.share}
              copiedMessage={dictionary.shop.shareCopied}
              failedMessage={dictionary.shop.shareFailed}
            />
          </div>
        </div>

      </div>

      <div className="relative z-10 -mt-8 rounded-t-[2rem] bg-background-app px-4 pt-5">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-muted" />

        <div className="mb-4">
          <h1 className="text-[2rem] font-black leading-tight text-text-primary">{shop.shop_name}</h1>
          <p className="mt-1 text-sm text-text-muted">{shop.location}</p>
          {shopLoadCapacityKg ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border-muted bg-surface-card px-3 py-1 text-xs font-semibold text-text-secondary">
              <FlaticonIcon name="weight" className="text-sm text-primary-500" />
              {shopLoadCapacityKg.toFixed(0)} {dictionary.shop.capacitySuffix}
            </p>
          ) : null}
        </div>

        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-text-muted">
              {dictionary.shop.startingFrom}
            </p>
            <p className="text-3xl font-black leading-none text-primary-500">
              ₱{shop.starting_price.toFixed(0)}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border-muted bg-surface-card px-3 py-1.5">
            <span className="text-amber-400 text-sm">★</span>
            <span className="text-sm font-bold text-text-primary">{(shop.rating_avg ?? 0).toFixed(1)}</span>
            <span className="text-xs text-text-muted">({shop.total_reviews ?? 0})</span>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-border-muted bg-surface-card px-4 py-4 shadow-soft">
          <h2 className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-primary-500/75">
            {dictionary.shop.about}
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">{shop.description || dictionary.shop.aboutFallback}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary-500/10 px-3 py-1 text-[0.7rem] font-semibold text-primary-500">
              {dictionary.shop.modernMachines}
            </span>
            <span className="rounded-full bg-primary-500/10 px-3 py-1 text-[0.7rem] font-semibold text-primary-500">
              {dictionary.shop.gentleChemicals}
            </span>
            <span className="rounded-full bg-primary-500/10 px-3 py-1 text-[0.7rem] font-semibold text-primary-500">
              {dictionary.shop.pickupDeliveryReady}
            </span>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-primary-500/75">
            {dictionary.shop.services}
          </h2>
          {services.length === 0 ? (
            <p className="text-sm text-text-muted">{dictionary.shop.noServices}</p>
          ) : (
            <ul className="space-y-2.5">
              {services.map((service) => {
                const iconTone = getServiceIconTone(service.name);
                const optionGroupsCount = (service.service_option_groups ?? []).length;
                return (
                  <li id={`service-${service.id}`} key={service.id} className="rounded-2xl border border-border-muted bg-surface-card shadow-soft">
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
                            <p className="text-xs text-text-muted">
                              {optionGroupsCount} {dictionary.shop.optionGroupsLabel}
                            </p>
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
                      {service.description || optionGroupsCount > 0 ? (
                        <div className="border-t border-border-muted px-3 pb-3 pt-2">
                          {service.description ? (
                            <p className="text-xs leading-relaxed text-text-muted">{service.description}</p>
                          ) : null}
                          {optionGroupsCount > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {(service.service_option_groups ?? []).map((group) => (
                                <span
                                  key={group.id}
                                  className="rounded-full bg-primary-500/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-primary-500"
                                >
                                  {group.name}
                                </span>
                              ))}
                            </div>
                          ) : null}
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
              <h2 className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-primary-500/75">
                {dictionary.shop.careOptions}
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
                            <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-text-muted">
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
              <h2 className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-primary-500/75">
                {dictionary.shop.popularAddons}
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

        <div className="my-5 border-t border-border-muted" />
        <section className="mb-5 rounded-2xl border border-border-muted bg-surface-card px-4 py-4 shadow-soft">
          <h2 className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-primary-500/75">
            {dictionary.shop.recentReviews}
          </h2>
          {reviewerAvatars.length > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center">
                {reviewerAvatars.map((avatar, index) => (
                  <div
                    key={`${avatar.key}-${index}`}
                    className={cn(
                      "relative h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm",
                      index > 0 ? "-ml-3" : "",
                    )}
                  >
                    <Image src={avatar.src} alt={avatar.label} fill sizes="40px" className="object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-semibold text-text-secondary">{dictionary.shop.trustedByCustomers}</p>
            </div>
          ) : (
            <p className="text-sm text-text-muted">{dictionary.shop.recentReviewsEmpty}</p>
          )}
        </section>

        <section className="mb-5">
          <h2 className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-primary-500/75">
            {dictionary.shop.faq}
          </h2>
          <div className="space-y-2">
            <FaqItem question={dictionary.shop.faqTurnaroundQ} answer={dictionary.shop.faqTurnaroundA} />
            <FaqItem question={dictionary.shop.faqDelicatesQ} answer={dictionary.shop.faqDelicatesA} />
            <FaqItem question={dictionary.shop.faqPaymentQ} answer={dictionary.shop.faqPaymentA} />
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-background-app via-background-app/95 to-transparent">
          <Link
            href={`/customer/orders/new?shopId=${encodeURIComponent(shop.id)}`}
            className="pointer-events-auto flex h-12 items-center justify-center gap-2 rounded-full bg-[#43a9eb] px-8 text-center text-[1.2rem] font-bold leading-none text-white shadow-[0_12px_26px_rgba(33,126,191,0.35)] transition hover:bg-[#389fdf]"
          >
            <FlaticonIcon name="shopping-cart" className="text-lg" />
            {dictionary.shop.showBucket}
          </Link>
        </div>
      </div>
    </main>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-border-muted bg-surface-card px-4 py-3 shadow-soft">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 marker:hidden">
        <p className="text-sm font-semibold text-text-primary">{question}</p>
        <FlaticonIcon
          name="angle-small-down"
          className="text-base text-text-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{answer}</p>
    </details>
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
