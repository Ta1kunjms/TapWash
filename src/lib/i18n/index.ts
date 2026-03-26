import type { SupportedLanguage } from "@/types/domain";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "ar", "hi", "ur", "bn", "tl", "fa", "ne", "si"];

export function normalizeLocale(value: string | null | undefined): SupportedLanguage {
  if (!value) return "en";
  const normalized = value.toLowerCase().trim();
  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage;
  }
  return "en";
}

export type AuthDictionary = {
  headingSignIn: string;
  headingSignUp: string;
  headingForgotPassword: string;
  signInSubheading: string;
  signUpSubheading: string;
  forgotSubheading: string;
  signInCta: string;
  signUpCta: string;
  forgotCta: string;
};

export type CustomerDictionary = {
  navigation: {
    home: string;
    favorites: string;
    requests: string;
    settings: string;
  };
  home: {
    specialOffersTitle: string;
    seeAllVouchers: string;
    featuredLaundromatsTitle: string;
    serviceMapTitle: string;
    noVerifiedShopsYet: string;
    noFavoriteShopsYet: string;
    setLocationLabel: string;
    phoneRequiredTitle: string;
    phoneRequiredBody: string;
    updateProfileCta: string;
  };
  settings: {
    editProfile: string;
    paymentMethod: string;
    language: string;
    helpCenter: string;
    logout: string;
    readyToLeave: string;
    leavingDescription: string;
    staySignedIn: string;
    confirmSignOut: string;
    notSet: string;
    myProfile: string;
    saveProfile: string;
    passwordSecurity: string;
    updatePassword: string;
    profileSaved: string;
    passwordSaved: string;
    addPaymentPreference: string;
    cashOnDelivery: string;
    card: string;
    displayLabelPlaceholder: string;
    maskedReferencePlaceholder: string;
    setDefaultCheckout: string;
    savePreference: string;
    noSavedPreferences: string;
    noLabel: string;
    noReference: string;
    defaultBadge: string;
    setDefault: string;
    remove: string;
    paymentPreferenceSaved: string;
    paymentFootnote: string;
    languageSaved: string;
    supportTicketSubmitted: string;
    contactSupport: string;
    contactSupportBody: string;
    shortSubjectPlaceholder: string;
    describeIssuePlaceholder: string;
    submitTicket: string;
    mySupportTickets: string;
    noTickets: string;
    supportNotePrefix: string;
  };
  requests: {
    searchPlaceholder: string;
    active: string;
    completed: string;
    cancelled: string;
    bookingConfirmed: string;
    emptyStateBody: string;
    bookLaundry: string;
    laundryShopFallback: string;
    refPrefix: string;
    justBooked: string;
    pickupPrefix: string;
    totalPrefix: string;
    paymentPrefix: string;
    trackLaundry: string;
  };
  shop: {
    goBack: string;
    share: string;
    verified: string;
    startingFrom: string;
    capacitySuffix: string;
    turnaround24h: string;
    about: string;
    aboutFallback: string;
    services: string;
    noServices: string;
    careOptions: string;
    popularAddons: string;
    showBucket: string;
  };
};

const AUTH_DICTIONARY: Record<SupportedLanguage, AuthDictionary> = {
  en: {
    headingSignIn: "Welcome back!",
    headingSignUp: "Create account",
    headingForgotPassword: "Reset password",
    signInSubheading: "Sign in to continue to TapWash.",
    signUpSubheading: "Join TapWash and get started today.",
    forgotSubheading: "Enter your email and we will send a reset link.",
    signInCta: "Sign In",
    signUpCta: "Create Account",
    forgotCta: "Send Reset Link",
  },
  ar: {
    headingSignIn: "Welcome back!",
    headingSignUp: "Create account",
    headingForgotPassword: "Reset password",
    signInSubheading: "Sign in to continue to TapWash.",
    signUpSubheading: "Join TapWash and get started today.",
    forgotSubheading: "Enter your email and we will send a reset link.",
    signInCta: "Sign In",
    signUpCta: "Create Account",
    forgotCta: "Send Reset Link",
  },
  hi: {
    headingSignIn: "Welcome back!",
    headingSignUp: "Create account",
    headingForgotPassword: "Reset password",
    signInSubheading: "Sign in to continue to TapWash.",
    signUpSubheading: "Join TapWash and get started today.",
    forgotSubheading: "Enter your email and we will send a reset link.",
    signInCta: "Sign In",
    signUpCta: "Create Account",
    forgotCta: "Send Reset Link",
  },
  ur: {
    headingSignIn: "Welcome back!",
    headingSignUp: "Create account",
    headingForgotPassword: "Reset password",
    signInSubheading: "Sign in to continue to TapWash.",
    signUpSubheading: "Join TapWash and get started today.",
    forgotSubheading: "Enter your email and we will send a reset link.",
    signInCta: "Sign In",
    signUpCta: "Create Account",
    forgotCta: "Send Reset Link",
  },
  bn: {
    headingSignIn: "Welcome back!",
    headingSignUp: "Create account",
    headingForgotPassword: "Reset password",
    signInSubheading: "Sign in to continue to TapWash.",
    signUpSubheading: "Join TapWash and get started today.",
    forgotSubheading: "Enter your email and we will send a reset link.",
    signInCta: "Sign In",
    signUpCta: "Create Account",
    forgotCta: "Send Reset Link",
  },
  tl: {
    headingSignIn: "Welcome back!",
    headingSignUp: "Create account",
    headingForgotPassword: "Reset password",
    signInSubheading: "Sign in to continue to TapWash.",
    signUpSubheading: "Join TapWash and get started today.",
    forgotSubheading: "Enter your email and we will send a reset link.",
    signInCta: "Sign In",
    signUpCta: "Create Account",
    forgotCta: "Send Reset Link",
  },
  fa: {
    headingSignIn: "Welcome back!",
    headingSignUp: "Create account",
    headingForgotPassword: "Reset password",
    signInSubheading: "Sign in to continue to TapWash.",
    signUpSubheading: "Join TapWash and get started today.",
    forgotSubheading: "Enter your email and we will send a reset link.",
    signInCta: "Sign In",
    signUpCta: "Create Account",
    forgotCta: "Send Reset Link",
  },
  ne: {
    headingSignIn: "Welcome back!",
    headingSignUp: "Create account",
    headingForgotPassword: "Reset password",
    signInSubheading: "Sign in to continue to TapWash.",
    signUpSubheading: "Join TapWash and get started today.",
    forgotSubheading: "Enter your email and we will send a reset link.",
    signInCta: "Sign In",
    signUpCta: "Create Account",
    forgotCta: "Send Reset Link",
  },
  si: {
    headingSignIn: "Welcome back!",
    headingSignUp: "Create account",
    headingForgotPassword: "Reset password",
    signInSubheading: "Sign in to continue to TapWash.",
    signUpSubheading: "Join TapWash and get started today.",
    forgotSubheading: "Enter your email and we will send a reset link.",
    signInCta: "Sign In",
    signUpCta: "Create Account",
    forgotCta: "Send Reset Link",
  },
};

const CUSTOMER_EN: CustomerDictionary = {
  navigation: {
    home: "Home",
    favorites: "Favorites",
    requests: "Requests",
    settings: "Settings",
  },
  home: {
    specialOffersTitle: "Special Offers",
    seeAllVouchers: "See all vouchers",
    featuredLaundromatsTitle: "Featured Laundromats",
    serviceMapTitle: "Service Map",
    noVerifiedShopsYet: "No verified shops yet.",
    noFavoriteShopsYet: "No favorite laundromats yet.",
    setLocationLabel: "Set location",
    phoneRequiredTitle: "Add your contact number before checkout",
    phoneRequiredBody: "You can browse shops now, but placing an order requires a valid phone number.",
    updateProfileCta: "Update Profile",
  },
  settings: {
    editProfile: "Edit Profile",
    paymentMethod: "Payment Method",
    language: "Language",
    helpCenter: "Help Center",
    logout: "Logout",
    readyToLeave: "Ready to leave?",
    leavingDescription: "You're about to sign out of TapWash.",
    staySignedIn: "Stay Signed In",
    confirmSignOut: "Yes, Sign Out",
    notSet: "Not set",
    myProfile: "My Profile",
    saveProfile: "Save Profile",
    passwordSecurity: "Password & Security",
    updatePassword: "Update Password",
    profileSaved: "Profile updated successfully.",
    passwordSaved: "Password updated successfully.",
    addPaymentPreference: "Add Payment Preference",
    cashOnDelivery: "Cash on Delivery",
    card: "Card",
    displayLabelPlaceholder: "Display label (e.g., Personal GCash)",
    maskedReferencePlaceholder: "Masked reference (e.g., +63-9***-**** or **** 1234)",
    setDefaultCheckout: "Set as default for checkout",
    savePreference: "Save Preference",
    noSavedPreferences: "No saved payment preferences yet. Add one above to prefill checkout.",
    noLabel: "No label",
    noReference: "No reference",
    defaultBadge: "Default",
    setDefault: "Set Default",
    remove: "Remove",
    paymentPreferenceSaved: "Payment preference updated.",
    paymentFootnote: "We save payment preference metadata only for faster checkout selection. TapWash does not store full card numbers or CVV.",
    languageSaved: "Language preference saved.",
    supportTicketSubmitted: "Support ticket submitted.",
    contactSupport: "Contact Support",
    contactSupportBody: "Submit your concern and our team will follow up from your support queue.",
    shortSubjectPlaceholder: "Short subject",
    describeIssuePlaceholder: "Describe your issue",
    submitTicket: "Submit Ticket",
    mySupportTickets: "My Support Tickets",
    noTickets: "No tickets yet. Your submitted tickets will appear here.",
    supportNotePrefix: "Support note:",
  },
  requests: {
    searchPlaceholder: "Find requests...",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
    bookingConfirmed: "Booking confirmed. You can now track live updates here.",
    emptyStateBody: "Your past and pending requests will appear here once booked.",
    bookLaundry: "Book Laundry",
    laundryShopFallback: "Laundry Shop",
    refPrefix: "Ref:",
    justBooked: "Just booked",
    pickupPrefix: "Pickup:",
    totalPrefix: "Total:",
    paymentPrefix: "Payment:",
    trackLaundry: "Track Laundry",
  },
  shop: {
    goBack: "Go back",
    share: "Share",
    verified: "Verified",
    startingFrom: "Starting from",
    capacitySuffix: "kg capacity",
    turnaround24h: "24 hr turnaround",
    about: "About",
    aboutFallback:
      "A trusted laundromat offering reliable wash-dry-fold, express laundry, dry cleaning, and stain treatment. Known for modern equipment, fast turnaround, and excellent service.",
    services: "Services",
    noServices: "No services available yet.",
    careOptions: "Care Options",
    popularAddons: "Popular Add-ons",
    showBucket: "Show Bucket",
  },
};

const CUSTOMER_TL: CustomerDictionary = {
  ...CUSTOMER_EN,
  navigation: {
    home: "Home",
    favorites: "Mga Paborito",
    requests: "Requests",
    settings: "Settings",
  },
  home: {
    ...CUSTOMER_EN.home,
    specialOffersTitle: "Mga Special Offer",
    seeAllVouchers: "Tingnan lahat ng voucher",
    featuredLaundromatsTitle: "Mga Tampok na Laundromat",
    serviceMapTitle: "Mapa ng Serbisyo",
    noVerifiedShopsYet: "Wala pang verified na shop.",
    noFavoriteShopsYet: "Wala ka pang paboritong laundromat.",
    phoneRequiredTitle: "Ilagay ang contact number bago mag-checkout",
    phoneRequiredBody: "Pwede kang mag-browse ngayon, pero kailangan ng valid na phone number bago umorder.",
    updateProfileCta: "I-update ang Profile",
  },
  settings: {
    ...CUSTOMER_EN.settings,
    editProfile: "I-edit ang Profile",
    paymentMethod: "Paraan ng Bayad",
    language: "Wika",
    helpCenter: "Help Center",
    logout: "Mag-logout",
    readyToLeave: "Aalis ka na ba?",
    leavingDescription: "Magso-sign out ka na sa TapWash.",
    staySignedIn: "Manatiling Naka-sign In",
    confirmSignOut: "Oo, Mag-sign Out",
    myProfile: "Aking Profile",
    saveProfile: "I-save ang Profile",
    updatePassword: "I-update ang Password",
    profileSaved: "Matagumpay na na-update ang profile.",
    passwordSaved: "Matagumpay na na-update ang password.",
    addPaymentPreference: "Magdagdag ng Payment Preference",
    savePreference: "I-save ang Preference",
    setDefaultCheckout: "Gawing default sa checkout",
    paymentPreferenceSaved: "Na-update ang payment preference.",
    languageSaved: "Na-save ang language preference.",
    supportTicketSubmitted: "Naipasa ang support ticket.",
    contactSupport: "Makipag-ugnayan sa Support",
    submitTicket: "I-submit ang Ticket",
    mySupportTickets: "Aking Support Tickets",
  },
  requests: {
    ...CUSTOMER_EN.requests,
    searchPlaceholder: "Hanapin ang mga request...",
    active: "Aktibo",
    completed: "Kumpleto",
    cancelled: "Kinansela",
    bookingConfirmed: "Nakumpirma ang booking. Dito mo na masusubaybayan ang live updates.",
    emptyStateBody: "Lalabas dito ang iyong mga nakaraan at kasalukuyang request kapag nakapag-book ka na.",
    bookLaundry: "Mag-book ng Laundry",
    justBooked: "Kaka-book lang",
    pickupPrefix: "Pickup:",
    totalPrefix: "Kabuuan:",
    paymentPrefix: "Bayad:",
    trackLaundry: "I-track ang Laundry",
  },
  shop: {
    ...CUSTOMER_EN.shop,
    goBack: "Bumalik",
    share: "I-share",
    verified: "Verified",
    startingFrom: "Mula sa",
    capacitySuffix: "kg kapasidad",
    turnaround24h: "24 oras na turnaround",
    about: "Tungkol",
    services: "Mga Serbisyo",
    noServices: "Wala pang available na serbisyo.",
    careOptions: "Mga Care Option",
    popularAddons: "Mga Sikat na Add-on",
    showBucket: "Ipakita ang Bucket",
  },
};

const CUSTOMER_DICTIONARY: Record<SupportedLanguage, CustomerDictionary> = {
  en: CUSTOMER_EN,
  tl: CUSTOMER_TL,
  ar: CUSTOMER_EN,
  hi: CUSTOMER_EN,
  ur: CUSTOMER_EN,
  bn: CUSTOMER_EN,
  fa: CUSTOMER_EN,
  ne: CUSTOMER_EN,
  si: CUSTOMER_EN,
};

export function getAuthDictionary(locale: SupportedLanguage): AuthDictionary {
  return AUTH_DICTIONARY[locale] ?? AUTH_DICTIONARY.en;
}

export function getCustomerDictionary(locale: SupportedLanguage): CustomerDictionary {
  return CUSTOMER_DICTIONARY[locale] ?? CUSTOMER_DICTIONARY.en;
}

export function formatPaymentMethodLabel(method: "cod" | "gcash" | "card", locale: SupportedLanguage): string {
  const dictionary = getCustomerDictionary(locale);
  if (method === "cod") {
    return dictionary.settings.cashOnDelivery;
  }
  if (method === "gcash") {
    return "GCash";
  }
  return dictionary.settings.card;
}
