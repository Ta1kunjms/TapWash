import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPaymentPreferenceAction,
  createSupportTicketAction,
  updateCustomerLanguageAction,
} from "@/app/actions/customer";
import {
  createCustomerPaymentPreference,
  updateCustomerLanguage,
} from "@/services/customer";
import { createSupportTicket } from "@/services/support";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const setCookie = vi.fn();

vi.mock("@/services/customer", () => ({
  updateCustomerAvatar: vi.fn(),
  updateCustomerLanguage: vi.fn(),
  createCustomerPaymentPreference: vi.fn(),
  deleteCustomerPaymentPreference: vi.fn(),
  setDefaultCustomerPaymentPreference: vi.fn(),
  updateCustomerPaymentPreference: vi.fn(),
  updateCustomerProfile: vi.fn(),
  changeCustomerPassword: vi.fn(),
}));

vi.mock("@/services/support", () => ({
  createSupportTicket: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: setCookie })),
}));

describe("customer settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates customer language and writes locale cookie", async () => {
    vi.mocked(updateCustomerLanguage).mockResolvedValueOnce();

    const formData = new FormData();
    formData.set("language", "tl");

    const result = await updateCustomerLanguageAction(formData);

    expect(result.ok).toBe(true);
    expect(updateCustomerLanguage).toHaveBeenCalledWith("tl");
    expect(cookies).toHaveBeenCalled();
    expect(setCookie).toHaveBeenCalledWith(
      "tapwash.locale",
      "tl",
      expect.objectContaining({ path: "/", sameSite: "lax" }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/customer/settings/language");
  });

  it("rejects unsupported language values", async () => {
    const formData = new FormData();
    formData.set("language", "jp");

    const result = await updateCustomerLanguageAction(formData);

    expect(result.ok).toBe(false);
    expect(updateCustomerLanguage).not.toHaveBeenCalled();
  });

  it("creates payment preference when payload is valid", async () => {
    vi.mocked(createCustomerPaymentPreference).mockResolvedValueOnce();

    const formData = new FormData();
    formData.set("method", "gcash");
    formData.set("display_label", "Personal GCash");
    formData.set("masked_reference", "+63-9***-****");
    formData.set("is_default", "true");

    const result = await createPaymentPreferenceAction(formData);

    expect(result.ok).toBe(true);
    expect(createCustomerPaymentPreference).toHaveBeenCalledWith(
      expect.objectContaining({ method: "gcash", isDefault: true }),
    );
  });

  it("submits support ticket on valid payload", async () => {
    vi.mocked(createSupportTicket).mockResolvedValueOnce();

    const formData = new FormData();
    formData.set("topic", "account");
    formData.set("subject", "Cannot update profile");
    formData.set("message", "Profile save button does not work for me.");

    const result = await createSupportTicketAction(formData);

    expect(result.ok).toBe(true);
    expect(createSupportTicket).toHaveBeenCalledWith(
      expect.objectContaining({ topic: "account" }),
    );
  });
});
