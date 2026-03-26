import { SubPageHeader } from "@/components/customer/mobile-chrome";
import { ProfileAvatarPicker } from "@/components/customer/profile-avatar-picker";
import { changeCustomerPasswordAction, updateCustomerProfileAction } from "@/app/actions/customer";
import { getCustomerProfile } from "@/services/customer";
import { getCustomerDictionary } from "@/lib/i18n";
import { redirect } from "next/navigation";

export default async function CustomerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; passwordSaved?: string; error?: string }>;
}) {
  const { saved, passwordSaved, error } = await searchParams;
  const profile = await getCustomerProfile();
  const dictionary = getCustomerDictionary(profile?.preferred_language ?? "en");

  async function updateProfileFormAction(formData: FormData) {
    "use server";

    const result = await updateCustomerProfileAction(formData);
    if (!result.ok) {
      redirect(`/customer/settings/profile?error=${encodeURIComponent(result.message)}`);
    }

    redirect("/customer/settings/profile?saved=1");
  }

  async function updatePasswordFormAction(formData: FormData) {
    "use server";

    const result = await changeCustomerPasswordAction(formData);
    if (!result.ok) {
      redirect(`/customer/settings/profile?error=${encodeURIComponent(result.message)}`);
    }

    redirect("/customer/settings/profile?passwordSaved=1");
  }

  const fullName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ").trim() || "Customer";

  return (
    <main className="space-y-4 pb-2">
      <SubPageHeader title={dictionary.settings.myProfile} />

      <section className="text-center">
        <ProfileAvatarPicker initialAvatarKey={profile?.avatar_key} name={fullName} />
        <p className="mb-2 text-xs font-medium text-text-muted">Tap your photo to choose a mascot avatar.</p>
        <h1 className="text-2xl font-bold text-text-secondary">{fullName}</h1>
        <p className="text-sm text-text-muted">@{profile?.username ?? "customer"}</p>
        <p className="text-sm text-text-muted">{profile?.email ?? "customer@tapwash.app"}</p>
      </section>

      <form action={updateProfileFormAction} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            name="first_name"
            defaultValue={profile?.first_name ?? ""}
            className="h-11 rounded-xl border border-border-muted bg-white px-3 text-sm text-primary-500"
          />
          <input
            name="surname"
            defaultValue={profile?.surname ?? ""}
            className="h-11 rounded-xl border border-border-muted bg-white px-3 text-sm text-primary-500"
          />
        </div>
        <input
          value={profile?.username ?? ""}
          readOnly
          className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-primary-500"
        />
        <input
          name="phone"
          type="tel"
          defaultValue={profile?.phone ?? ""}
          placeholder="09XXXXXXXXX"
          className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-primary-500"
        />
        <p className="text-xs text-text-muted">Add your phone number here. You can sign up without it, but it is required when placing an order.</p>
        <input
          value={profile?.email ?? "customer@tapwash.app"}
          readOnly
          className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-primary-500"
        />
        <input
          name="address"
          defaultValue={profile?.address ?? "General Santos City"}
          className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-primary-500"
        />

        <button type="submit" className="mt-3 h-12 w-full rounded-full bg-primary-500 text-base font-bold text-white">
          {dictionary.settings.saveProfile}
        </button>
      </form>

      <form action={updatePasswordFormAction} className="space-y-2 rounded-2xl border border-border-muted bg-white p-3">
        <p className="text-xs font-semibold text-primary-500/70">{dictionary.settings.passwordSecurity}</p>
        <input
          name="current_password"
          type="password"
          placeholder="Current password"
          className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-primary-500"
        />
        <input
          name="new_password"
          type="password"
          placeholder="New password"
          className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-primary-500"
        />
        <input
          name="confirm_password"
          type="password"
          placeholder="Confirm new password"
          className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-primary-500"
        />

        <button type="submit" className="h-11 w-full rounded-xl bg-primary-500 text-sm font-bold text-white">
          {dictionary.settings.updatePassword}
        </button>
      </form>

      {saved === "1" && (
        <p className="text-center text-sm font-semibold text-primary-500">{dictionary.settings.profileSaved}</p>
      )}

      {passwordSaved === "1" && (
        <p className="text-center text-sm font-semibold text-primary-500">{dictionary.settings.passwordSaved}</p>
      )}

      {error ? (
        <p className="text-center text-sm font-semibold text-rose-600">{error}</p>
      ) : null}
    </main>
  );
}
