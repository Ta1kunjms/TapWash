import { SettingsMenu } from "@/components/customer/settings-menu";
import { getCustomerProfile, listCustomerPaymentPreferences } from "@/services/customer";
import { formatPaymentMethodLabel, getCustomerDictionary } from "@/lib/i18n";

export default async function CustomerSettingsPage() {
  const [profile, paymentPreferences] = await Promise.all([getCustomerProfile(), listCustomerPaymentPreferences()]);
  const locale = profile?.preferred_language ?? "en";
  const dictionary = getCustomerDictionary(locale);
  const fullName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ") || "Customer";
  const defaultPayment = paymentPreferences.find((entry) => entry.is_default) ?? paymentPreferences[0] ?? null;

  return (
    <main>
      <SettingsMenu
        fullName={fullName}
        email={profile?.email || "customer@tapwash.app"}
        avatarKey={profile?.avatar_key}
        preferredLanguage={locale}
        defaultPaymentLabel={defaultPayment ? `${formatPaymentMethodLabel(defaultPayment.method, locale)}${defaultPayment.masked_reference ? ` • ${defaultPayment.masked_reference}` : ""}` : dictionary.settings.notSet}
        labels={dictionary.settings}
      />
    </main>
  );
}
