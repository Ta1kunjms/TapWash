import { SubPageHeader } from "@/components/customer/mobile-chrome";
import { ProfileAvatarPicker } from "@/components/customer/profile-avatar-picker";
import { createClient } from "@/lib/supabase/server";
import { getCustomerProfile } from "@/services/customer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function CustomerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const profile = await getCustomerProfile();

  async function updateProfileAction(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const first_name = String(formData.get("first_name") ?? "").trim();
    const surname = String(formData.get("surname") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();

    await supabase
      .from("profiles")
      .update({
        first_name: first_name || null,
        surname: surname || null,
        phone: phone || null,
        address: address || null,
      })
      .eq("id", user.id);

    revalidatePath("/customer/settings");
    revalidatePath("/customer/settings/profile");
    redirect("/customer/settings/profile?saved=1");
  }

  const fullName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ").trim() || "Customer";

  return (
    <main className="space-y-4 pb-2">
      <SubPageHeader title="My Profile" />

      <section className="text-center">
        <ProfileAvatarPicker initialAvatarKey={profile?.avatar_key} name={fullName} />
        <p className="mb-2 text-xs font-medium text-text-muted">Tap your photo to choose a mascot avatar.</p>
        <h1 className="text-2xl font-bold text-text-secondary">{fullName}</h1>
        <p className="text-sm text-text-muted">@{profile?.username ?? "customer"}</p>
        <p className="text-sm text-text-muted">{profile?.email ?? "customer@tapwash.app"}</p>
      </section>

      <form action={updateProfileAction} className="space-y-2">
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

        <p className="pt-1 text-xs text-primary-500/60">Leave password blank if you don&apos;t want to change it.</p>
        <input
          type="password"
          placeholder="Password"
          className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-primary-500"
        />

        <button type="submit" className="mt-3 h-12 w-full rounded-full bg-primary-500 text-base font-bold text-white">
          Confirm
        </button>
      </form>

      {saved === "1" && (
        <p className="text-center text-sm font-semibold text-primary-500">Profile updated successfully.</p>
      )}
    </main>
  );
}
