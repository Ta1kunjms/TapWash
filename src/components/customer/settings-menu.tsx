"use client";

import { createClient } from "@/lib/supabase/client";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  fullName: string;
  email: string;
};

export function SettingsMenu({ fullName, email }: Props) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const initials = useMemo(
    () =>
      fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
    [fullName],
  );

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
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-xl font-bold text-primary-500">
            {initials || "TW"}
          </div>
          <h1 className="text-2xl font-bold text-text-secondary">{fullName}</h1>
          <p className="text-sm text-text-muted">@{email.split("@")[0] ?? "customer"}</p>
          <p className="text-sm text-text-muted">{email}</p>
        </div>

        <div className="space-y-3">
          <SettingsLink href="/customer/settings/profile" label="Edit Profile" icon="person" />
          <SettingsLink href="/customer/settings/payment" label="Payment Method" icon="wallet" />
          <SettingsLink href="/customer/settings/language" label="Language" icon="language" />
          <SettingsLink href="/customer/settings/help" label="Help Center" icon="help" />

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-border-muted bg-surface-card px-4 py-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-primary-500">
              <LogoutIcon />
              Logout
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
            <h2 className="text-lg font-bold text-text-secondary">Ready to leave?</h2>
            <p className="mt-1 text-sm text-text-muted">You&apos;re about to sign out of TapWash.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 flex-1 rounded-xl border border-border-muted bg-surface-card text-xs font-semibold text-text-secondary"
              >
                Stay Signed In
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="h-10 flex-1 rounded-xl bg-primary-500 text-xs font-semibold text-white disabled:opacity-70"
              >
                {isSigningOut ? "Signing out..." : "Yes, Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SettingsLink({ href, label, icon }: { href: string; label: string; icon: "person" | "wallet" | "language" | "help" }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-border-muted bg-surface-card px-4 py-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className="flex items-center gap-3 text-sm font-semibold text-text-secondary">
        <span className="text-primary-500">{iconSymbol(icon)}</span>
        {label}
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
