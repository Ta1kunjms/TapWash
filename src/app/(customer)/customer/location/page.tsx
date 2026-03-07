import { MobileTopBar } from "@/components/customer/mobile-chrome";
import { LocationPicker } from "@/components/customer/location-picker";
import { createClient } from "@/lib/supabase/server";
import { getCustomerProfile, getInitials } from "@/services/customer";
import { getUnreadNotificationCount } from "@/services/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function CustomerLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const profile = await getCustomerProfile();
  const notificationCount = await getUnreadNotificationCount();
  const profileInitials = getInitials(profile?.first_name ?? null, profile?.surname ?? null) || "TW";
  const locationLabel = profile?.address?.trim() || "Set location";

  async function saveLocationAction(formData: FormData) {
    "use server";

    const address = String(formData.get("address") ?? "").trim();
    const latValue = Number(formData.get("lat") ?? "");
    const lngValue = Number(formData.get("lng") ?? "");
    const preferred_lat = Number.isFinite(latValue) ? latValue : null;
    const preferred_lng = Number.isFinite(lngValue) ? lngValue : null;

    if (!address) {
      redirect("/customer/location");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    await supabase
      .from("profiles")
      .update({
        address,
        preferred_lat,
        preferred_lng,
      })
      .eq("id", user.id);

    revalidatePath("/customer");
    revalidatePath("/customer/shops");
    revalidatePath("/customer/requests");
    revalidatePath("/customer/favorites");
    revalidatePath("/customer/location");
    revalidatePath("/customer/settings/profile");
    redirect("/customer/location?saved=1");
  }

  return (
    <main className="space-y-4">
      <MobileTopBar
        searchPlaceholder="Find location..."
        searchAction="/customer/location"
        locationLabel={locationLabel}
        profileInitials={profileInitials}
        notificationCount={notificationCount}
      />

      <section className="space-y-1">
        <h1 className="text-3xl font-black text-primary-500">Set Pickup Location</h1>
        <p className="text-sm text-text-secondary/70">Choose by typing an address or selecting directly from the map.</p>
      </section>

      <form action={saveLocationAction}>
        <LocationPicker initialAddress={profile?.address ?? "General Santos City"} />
      </form>

      {saved === "1" && (
        <p className="text-center text-sm font-semibold text-primary-500">Location updated successfully.</p>
      )}
    </main>
  );
}
