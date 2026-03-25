import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateCustomerAvatarAction } from "@/app/actions/customer";
import { updateCustomerAvatar } from "@/services/customer";
import { revalidatePath } from "next/cache";

vi.mock("@/services/customer", () => ({
  updateCustomerAvatar: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("updateCustomerAvatarAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when avatar save succeeds", async () => {
    vi.mocked(updateCustomerAvatar).mockResolvedValueOnce("techy");

    const result = await updateCustomerAvatarAction({ avatarKey: "techy" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.avatarKey).toBe("techy");
    }
    expect(revalidatePath).toHaveBeenCalledWith("/customer/settings/profile");
  });

  it("returns failure when avatar save fails", async () => {
    vi.mocked(updateCustomerAvatar).mockRejectedValueOnce(new Error("db failure"));

    const result = await updateCustomerAvatarAction({ avatarKey: "techy" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("could not save");
    }
  });

  it("rejects invalid avatar keys", async () => {
    const result = await updateCustomerAvatarAction({ avatarKey: "invalid-key" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("valid mascot avatar");
    }
    expect(updateCustomerAvatar).not.toHaveBeenCalled();
  });
});
