import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  customerPaymentPreferenceSchema,
  supportedLanguageSchema,
  supportTicketCreateSchema,
  updateCustomerProfileSchema,
} from "@/lib/validators/settings";

describe("updateCustomerProfileSchema", () => {
  it("accepts optional customer profile fields", () => {
    const parsed = updateCustomerProfileSchema.safeParse({
      firstName: "Tycoon",
      surname: "Flores",
      phone: "09123456789",
      address: "General Santos City",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid phone number", () => {
    const parsed = updateCustomerProfileSchema.safeParse({
      phone: "12345",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts valid password change payload", () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "oldpassword123",
      newPassword: "newpassword123",
      confirmPassword: "newpassword123",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects non-matching confirmation", () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "oldpassword123",
      newPassword: "newpassword123",
      confirmPassword: "nomatch123",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("customerPaymentPreferenceSchema", () => {
  it("accepts valid payment preference", () => {
    const parsed = customerPaymentPreferenceSchema.safeParse({
      method: "gcash",
      displayLabel: "Personal GCash",
      maskedReference: "+63-9***-****",
      isDefault: true,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects unsupported payment method", () => {
    const parsed = customerPaymentPreferenceSchema.safeParse({
      method: "paypal",
      isDefault: false,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("supportedLanguageSchema", () => {
  it("accepts supported language", () => {
    expect(supportedLanguageSchema.safeParse("tl").success).toBe(true);
  });

  it("rejects unsupported language", () => {
    expect(supportedLanguageSchema.safeParse("jp").success).toBe(false);
  });
});

describe("supportTicketCreateSchema", () => {
  it("accepts valid ticket payload", () => {
    const parsed = supportTicketCreateSchema.safeParse({
      topic: "account",
      subject: "Cannot update profile",
      message: "My profile does not save when I tap submit.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects too-short ticket fields", () => {
    const parsed = supportTicketCreateSchema.safeParse({
      topic: "account",
      subject: "Bad",
      message: "short",
    });

    expect(parsed.success).toBe(false);
  });
});
