import { SettingsMenu } from "@/components/customer/settings-menu";
import { getCustomerProfile } from "@/services/customer";

export default async function CustomerSettingsPage() {
  const profile = await getCustomerProfile();

  return (
    <main>
      <SettingsMenu
        fullName={profile?.fullName ?? "Tycoon James Flores"}
        email={profile?.email || "tycoonjames.flores@msugensan.edu.ph"}
      />
    </main>
  );
}
