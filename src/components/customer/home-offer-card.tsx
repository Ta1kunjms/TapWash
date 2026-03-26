import Link from "next/link";
import type { HomeOffer } from "@/services/home-offers";

type Props = {
  offer: HomeOffer;
};

export function HomeOfferCard({ offer }: Props) {
  return (
    <article
      className="min-w-[88%] snap-start overflow-hidden rounded-2xl p-4 text-white shadow-soft"
      style={{
        backgroundImage: `linear-gradient(90deg, ${offer.accent_from}, ${offer.accent_to})`,
      }}
    >
      <p className="text-xs font-semibold tracking-widest text-white/85">{offer.badge_label}</p>
      <p className="mt-1 text-2xl font-black leading-tight">{offer.title}</p>
      <p className="mt-1 text-sm text-white/90">{offer.subtitle}</p>
      <Link
        href={offer.cta_href}
        className="mt-3 inline-flex items-center rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-primary-600 transition hover:bg-white"
      >
        {offer.cta_label}
      </Link>
    </article>
  );
}
