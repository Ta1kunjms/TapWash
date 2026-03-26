import { describe, expect, it } from "vitest";
import { paginateFeedItems, parsePositiveInt } from "@/app/api/customer/shops-feed/route";

describe("customer shops-feed helpers", () => {
  it("parsePositiveInt falls back for invalid values", () => {
    expect(parsePositiveInt(null, 8)).toBe(8);
    expect(parsePositiveInt("", 8)).toBe(8);
    expect(parsePositiveInt("abc", 8)).toBe(8);
    expect(parsePositiveInt("0", 8)).toBe(8);
    expect(parsePositiveInt("-4", 8)).toBe(8);
  });

  it("parsePositiveInt normalizes numeric values", () => {
    expect(parsePositiveInt("7", 8)).toBe(7);
    expect(parsePositiveInt("7.9", 8)).toBe(7);
  });

  it("paginateFeedItems returns accurate slices and hasMore", () => {
    const source = Array.from({ length: 19 }).map((_, index) => ({ id: index + 1 }));

    const firstPage = paginateFeedItems(source, 1, 8);
    expect(firstPage.items).toHaveLength(8);
    expect(firstPage.total).toBe(19);
    expect(firstPage.hasMore).toBe(true);

    const secondPage = paginateFeedItems(source, 2, 8);
    expect(secondPage.items).toHaveLength(8);
    expect(secondPage.hasMore).toBe(true);

    const thirdPage = paginateFeedItems(source, 3, 8);
    expect(thirdPage.items).toHaveLength(3);
    expect(thirdPage.hasMore).toBe(false);
  });
});
