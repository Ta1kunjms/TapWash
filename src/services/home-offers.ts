import { createClient } from "@/lib/supabase/server";

export type HomeOffer = {
  id: string;
  badge_label: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  accent_from: string;
  accent_to: string;
  priority: number;
};

type RawHomeOffer = {
  id: string;
  badge_label: string | null;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  accent_from: string | null;
  accent_to: string | null;
  priority: number | null;
  starts_at: string | null;
  ends_at: string | null;
};

function normalizeHref(value: string | null): string {
  if (!value) return "/customer/vouchers";
  if (!value.startsWith("/")) return "/customer/vouchers";
  return value;
}

export function isHomeOfferActiveAt(offer: Pick<RawHomeOffer, "starts_at" | "ends_at">, nowMs: number): boolean {
  const startsAt = offer.starts_at ? Date.parse(offer.starts_at) : null;
  const endsAt = offer.ends_at ? Date.parse(offer.ends_at) : null;
  if (startsAt !== null && Number.isFinite(startsAt) && startsAt > nowMs) return false;
  if (endsAt !== null && Number.isFinite(endsAt) && endsAt < nowMs) return false;
  return true;
}

export function selectVisibleHomeOffers(rawOffers: RawHomeOffer[], limit: number, nowMs: number): HomeOffer[] {
  return rawOffers
    .filter((offer) => isHomeOfferActiveAt(offer, nowMs))
    .slice(0, Math.min(6, Math.max(1, limit)))
    .map((offer) => ({
      id: offer.id,
      badge_label: offer.badge_label?.trim() || "LIMITED PROMO",
      title: offer.title,
      subtitle: offer.subtitle?.trim() || "Unlock exclusive savings on your next laundry order.",
      cta_label: offer.cta_label?.trim() || "Claim Offer",
      cta_href: normalizeHref(offer.cta_href),
      accent_from: offer.accent_from?.trim() || "#1e88e5",
      accent_to: offer.accent_to?.trim() || "#5bb8ff",
      priority: offer.priority ?? 0,
    }));
}

export async function getActiveHomeOffers(limit = 3): Promise<HomeOffer[]> {
  const supabase = await createClient();
  const now = Date.now();

  const { data, error } = await supabase
    .from("home_offers")
    .select("id, badge_label, title, subtitle, cta_label, cta_href, accent_from, accent_to, priority, starts_at, ends_at")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(Math.min(20, Math.max(4, limit * 4)))
    .returns<RawHomeOffer[]>();

  if (error) {
    return [];
  }

  return selectVisibleHomeOffers(data ?? [], limit, now);
}
