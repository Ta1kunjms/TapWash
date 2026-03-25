import { SettingsMenu } from "@/components/customer/settings-menu";
import { getCustomerProfile } from "@/services/customer";

export default async function CustomerSettingsPage() {
  const profile = await getCustomerProfile();
  const fullName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ") || "Tycoon James Flores";

  return (
    <main>
      <SettingsMenu
        fullName={fullName}
        email={profile?.email || "tycoonjames.flores@msugensan.edu.ph"}
        avatarKey={profile?.avatar_key}
      />
    </main>
  );
}
