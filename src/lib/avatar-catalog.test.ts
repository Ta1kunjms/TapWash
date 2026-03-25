import { describe, expect, it } from "vitest";
import {
  CUSTOMER_AVATAR_CATALOG,
  DEFAULT_CUSTOMER_AVATAR_KEY,
  getCustomerAvatarByKey,
  normalizeCustomerAvatarKey,
} from "@/lib/avatar-catalog";

describe("avatar catalog", () => {
  it("contains exactly 9 mascot avatars", () => {
    expect(CUSTOMER_AVATAR_CATALOG).toHaveLength(9);
  });

  it("uses stable default fallback when key is missing or invalid", () => {
    expect(normalizeCustomerAvatarKey(null)).toBe(DEFAULT_CUSTOMER_AVATAR_KEY);
    expect(normalizeCustomerAvatarKey("legacy-avatar-key")).toBe(DEFAULT_CUSTOMER_AVATAR_KEY);
  });

  it("returns default mascot record for invalid keys", () => {
    const avatar = getCustomerAvatarByKey("not-allowed-key");
    expect(avatar.key).toBe(DEFAULT_CUSTOMER_AVATAR_KEY);
    expect(avatar.src).toContain("/mascot-avatars/");
  });
});
