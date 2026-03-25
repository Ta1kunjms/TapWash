import { z } from "zod";
import {
  CUSTOMER_AVATAR_CATALOG,
  DEFAULT_CUSTOMER_AVATAR_KEY,
  type CustomerAvatarKey,
} from "@/lib/avatar-catalog";

const avatarKeys = CUSTOMER_AVATAR_CATALOG.map((avatar) => avatar.key) as [
  CustomerAvatarKey,
  ...CustomerAvatarKey[],
];

export const updateCustomerAvatarSchema = z.object({
  avatarKey: z.enum(avatarKeys).default(DEFAULT_CUSTOMER_AVATAR_KEY),
});

export type UpdateCustomerAvatarInput = z.infer<typeof updateCustomerAvatarSchema>;
