export const CUSTOMER_AVATAR_CATALOG = [
  { key: "achiever", label: "Achiever Mascot", src: "/mascot-avatars/Achiever.png", order: 1 },
  { key: "athlete", label: "Athlete Mascot", src: "/mascot-avatars/Athlete.png", order: 2 },
  { key: "designer", label: "Designer Mascot", src: "/mascot-avatars/Designer.png", order: 3 },
  { key: "grumpy", label: "Grumpy Mascot", src: "/mascot-avatars/Grumpy.png", order: 4 },
  { key: "hustler", label: "Hustler Mascot", src: "/mascot-avatars/Hustler.png", order: 5 },
  { key: "overthinker", label: "Overthinker Mascot", src: "/mascot-avatars/Overthinker.png", order: 6 },
  { key: "sleeper", label: "Sleeper Mascot", src: "/mascot-avatars/Sleeper.png", order: 7 },
  { key: "socializer", label: "Socializer Mascot", src: "/mascot-avatars/Socializer.png", order: 8 },
  { key: "techy", label: "Techy Mascot", src: "/mascot-avatars/Techy.png", order: 9 },
] as const;

export type CustomerAvatarKey = (typeof CUSTOMER_AVATAR_CATALOG)[number]["key"];

export const DEFAULT_CUSTOMER_AVATAR_KEY: CustomerAvatarKey = "achiever";

const avatarMap: Readonly<Record<CustomerAvatarKey, (typeof CUSTOMER_AVATAR_CATALOG)[number]>> =
  CUSTOMER_AVATAR_CATALOG.reduce((accumulator, avatar) => {
    accumulator[avatar.key] = avatar;
    return accumulator;
  }, {} as Record<CustomerAvatarKey, (typeof CUSTOMER_AVATAR_CATALOG)[number]>);

export function isCustomerAvatarKey(value: string): value is CustomerAvatarKey {
  return value in avatarMap;
}

export function normalizeCustomerAvatarKey(value: string | null | undefined): CustomerAvatarKey {
  if (!value) return DEFAULT_CUSTOMER_AVATAR_KEY;
  return isCustomerAvatarKey(value) ? value : DEFAULT_CUSTOMER_AVATAR_KEY;
}

export function getCustomerAvatarByKey(key: string | null | undefined) {
  const normalizedKey = normalizeCustomerAvatarKey(key);
  return avatarMap[normalizedKey];
}
