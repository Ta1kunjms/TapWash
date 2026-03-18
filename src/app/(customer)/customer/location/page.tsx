import { LocationPicker } from "@/components/customer/location-picker";
import { LocationSuggestions } from "@/components/customer/location-suggestions";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { geocodeAddress } from "@/lib/geocoding";
import { upsertSelectedCustomerAddress } from "@/services/addresses";
import { getCustomerProfile } from "@/services/customer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import Link from "next/link";

export default async function CustomerLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const profile = await getCustomerProfile();
  // No navbars, just a back button

  async function saveLocationAction(formData: FormData) {
    "use server";
    const address = String(formData.get("address") ?? "").trim();
    const latValue = Number(formData.get("lat") ?? "");
    const lngValue = Number(formData.get("lng") ?? "");
    let preferred_lat = Number.isFinite(latValue) ? latValue : null;
    let preferred_lng = Number.isFinite(lngValue) ? lngValue : null;
    if (!address) {
      redirect("/customer/location");
    }

    if (preferred_lat === null || preferred_lng === null) {
      const resolved = await geocodeAddress(address, ["ph"]);
      preferred_lat = resolved?.lat ?? null;
      preferred_lng = resolved?.lng ?? null;
    }

    if (preferred_lat === null || preferred_lng === null) {
      redirect("/customer/location");
    }

    try {
      await upsertSelectedCustomerAddress({
        label: "other",
        address_line: address,
        lat: preferred_lat,
        lng: preferred_lng,
        is_default: true,
      });
    } catch {
      redirect("/login");
    }

    revalidatePath("/customer");
    revalidatePath("/customer/shops");
    revalidatePath("/customer/requests");
    revalidatePath("/customer/favorites");
    revalidatePath("/customer/location");
    revalidatePath("/customer/settings/profile");
    redirect("/customer/location?saved=1");
  }

  return (
    <main className="min-h-screen px-4 pt-0">
      <section className="-mx-4 rounded-b-[2rem] bg-[linear-gradient(180deg,#ddecfb_0%,#cce4fa_100%)] px-4 pb-5 pt-3 shadow-[0_12px_28px_rgba(90,140,184,0.18)]">
        <div className="relative flex items-center justify-center">
          <Link
            href="/customer"
            className="absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0081c9] transition hover:bg-white/40"
            aria-label="Go back to home"
          >
            <FlaticonIcon name="angle-small-left" className="text-2xl" />
          </Link>

          <div className="min-w-0 px-12 text-center">
            <h1 className="text-[1.25rem] font-black leading-[0.92] text-[#233f6e]">Set Pickup Location</h1>
            <p className="mt-1 truncate text-[0.92rem] font-semibold text-[#1f93d8]">Choose by typing, map pin, or current location</p>
          </div>
        </div>
      </section>

      <section className="pb-2 pt-4">
        <p className="text-sm text-text-secondary/70">Choose by typing an address, using your current location, or selecting from suggestions below.</p>
      </section>

      <form action={saveLocationAction}>
        <LocationPicker initialAddress={profile?.address ?? "General Santos City"} />
      </form>


      {/* Suggestions: realtime location and recent addresses */}
      <LocationSuggestions />

      {saved === "1" && (
        <p className="text-center text-sm font-semibold text-primary-500">Location updated successfully.</p>
      )}
    </main>
  );
}
