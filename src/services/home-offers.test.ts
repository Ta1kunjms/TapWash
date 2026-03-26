import { describe, expect, it } from "vitest";
import { isHomeOfferActiveAt, selectVisibleHomeOffers } from "@/services/home-offers";

describe("home offers selection", () => {
  it("isHomeOfferActiveAt honors start and end windows", () => {
    const now = Date.parse("2026-03-26T10:00:00.000Z");

    expect(
      isHomeOfferActiveAt(
        { starts_at: "2026-03-26T09:00:00.000Z", ends_at: "2026-03-26T12:00:00.000Z" },
        now,
      ),
    ).toBe(true);

    expect(
      isHomeOfferActiveAt(
        { starts_at: "2026-03-26T11:00:00.000Z", ends_at: "2026-03-26T12:00:00.000Z" },
        now,
      ),
    ).toBe(false);

    expect(
      isHomeOfferActiveAt(
        { starts_at: "2026-03-26T08:00:00.000Z", ends_at: "2026-03-26T09:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("selectVisibleHomeOffers filters inactive and applies defaults", () => {
    const now = Date.parse("2026-03-26T10:00:00.000Z");

    const offers = selectVisibleHomeOffers(
      [
        {
          id: "1",
          badge_label: null,
          title: "Active Offer",
          subtitle: null,
          cta_label: null,
          cta_href: null,
          accent_from: null,
          accent_to: null,
          priority: 10,
          starts_at: "2026-03-26T09:00:00.000Z",
          ends_at: "2026-03-26T11:00:00.000Z",
        },
        {
          id: "2",
          badge_label: "Soon",
          title: "Future Offer",
          subtitle: "Not yet",
          cta_label: "Open",
          cta_href: "/customer/vouchers",
          accent_from: "#000000",
          accent_to: "#ffffff",
          priority: 5,
          starts_at: "2026-03-26T12:00:00.000Z",
          ends_at: null,
        },
      ],
      3,
      now,
    );

    expect(offers).toHaveLength(1);
    expect(offers[0]?.id).toBe("1");
    expect(offers[0]?.badge_label).toBe("LIMITED PROMO");
    expect(offers[0]?.cta_href).toBe("/customer/vouchers");
    expect(offers[0]?.accent_from).toBe("#1e88e5");
  });
});
