import { describe, expect, it } from "vitest";
import { signUpSchema } from "@/lib/validators/auth";

describe("signUpSchema", () => {
  it("accepts signup payload without phone number", () => {
    const parsed = signUpSchema.safeParse({
      email: "student@msu.edu.ph",
      password: "password123",
      fullName: "Jane Customer",
      role: "customer",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid signup payloads", () => {
    const parsed = signUpSchema.safeParse({
      email: "not-an-email",
      password: "short",
      fullName: "J",
      role: "customer",
    });

    expect(parsed.success).toBe(false);
  });
});
