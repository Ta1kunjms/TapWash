"use client";

import { createClient } from "@/lib/supabase/client";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { getCustomerAvatarByKey } from "@/lib/avatar-catalog";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  fullName: string;
  email: string;
  avatarKey?: string | null;
  preferredLanguage: string;
  defaultPaymentLabel: string;
  labels: {
    editProfile: string;
    paymentMethod: string;
    language: string;
    helpCenter: string;
    logout: string;
    readyToLeave: string;
    leavingDescription: string;
    staySignedIn: string;
    confirmSignOut: string;
  };
};

export function SettingsMenu({ fullName, email, avatarKey, preferredLanguage, defaultPaymentLabel, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [avatarImageSrc, setAvatarImageSrc] = useState(getCustomerAvatarByKey(avatarKey).src);
  const router = useRouter();

  useEffect(() => {
    setAvatarImageSrc(getCustomerAvatarByKey(avatarKey).src);
  }, [avatarKey]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <section className="space-y-5 pb-2">
        <div className="pt-4 text-center">
          <Image
            src={avatarImageSrc}
            alt={`${fullName} mascot profile photo`}
            width={80}
            height={80}
            sizes="80px"
            className="mx-auto mb-3 h-20 w-20 rounded-full border-2 border-primary-500 bg-white object-cover"
            onError={() => {
              setAvatarImageSrc(getCustomerAvatarByKey(null).src);
            }}
          />
          <h1 className="text-2xl font-bold text-text-secondary">{fullName}</h1>
          <p className="text-sm text-text-muted">@{email.split("@")[0] ?? "customer"}</p>
          <p className="text-sm text-text-muted">{email}</p>
        </div>

        <div className="space-y-3">
          <SettingsLink href="/customer/settings/profile" label={labels.editProfile} icon="person" />
          <SettingsLink href="/customer/settings/payment" label={labels.paymentMethod} subtitle={defaultPaymentLabel} icon="wallet" />
          <SettingsLink href="/customer/settings/language" label={labels.language} subtitle={preferredLanguage.toUpperCase()} icon="language" />
          <SettingsLink href="/customer/settings/help" label={labels.helpCenter} icon="help" />

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-border-muted bg-surface-card px-4 py-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-primary-500">
              <LogoutIcon />
              {labels.logout}
            </span>
            <span className="text-primary-500">›</span>
          </button>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/50 px-6">
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-soft">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
              <LogoutIcon />
            </div>
            <h2 className="text-lg font-bold text-text-secondary">{labels.readyToLeave}</h2>
            <p className="mt-1 text-sm text-text-muted">{labels.leavingDescription}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 flex-1 rounded-xl border border-border-muted bg-surface-card text-xs font-semibold text-text-secondary"
              >
                {labels.staySignedIn}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="h-10 flex-1 rounded-xl bg-primary-500 text-xs font-semibold text-white disabled:opacity-70"
              >
                {isSigningOut ? "Signing out..." : labels.confirmSignOut}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SettingsLink({
  href,
  label,
  subtitle,
  icon,
}: {
  href: string;
  label: string;
  subtitle?: string;
  icon: "person" | "wallet" | "language" | "help";
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-border-muted bg-surface-card px-4 py-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className="flex items-center gap-3 text-sm text-text-secondary">
        <span className="text-primary-500">{iconSymbol(icon)}</span>
        <span>
          <span className="block text-sm font-semibold">{label}</span>
          {subtitle ? <span className="block text-xs text-text-muted">{subtitle}</span> : null}
        </span>
      </span>
      <span className="text-text-secondary">›</span>
    </Link>
  );
}

function iconSymbol(icon: "person" | "wallet" | "language" | "help") {
  if (icon === "person") {
    return <FlaticonIcon name="user" className="text-base" />;
  }
  if (icon === "wallet") {
    return <FlaticonIcon name="wallet" className="text-base" />;
  }
  if (icon === "language") {
    return <FlaticonIcon name="language" className="text-base" />;
  }

  return <FlaticonIcon name="question" className="text-base" />;
}

function LogoutIcon() {
  return <FlaticonIcon name="sign-out-alt" className="text-base" />;
}
