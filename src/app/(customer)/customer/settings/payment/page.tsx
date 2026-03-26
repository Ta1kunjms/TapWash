import { SubPageHeader } from "@/components/customer/mobile-chrome";
import {
  createPaymentPreferenceAction,
  deletePaymentPreferenceAction,
  setDefaultPaymentPreferenceAction,
} from "@/app/actions/customer";
import { getCustomerProfile, listCustomerPaymentPreferences } from "@/services/customer";
import { formatPaymentMethodLabel, getCustomerDictionary } from "@/lib/i18n";
import { redirect } from "next/navigation";

export default async function CustomerPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const [profile, preferences] = await Promise.all([getCustomerProfile(), listCustomerPaymentPreferences()]);
  const locale = profile?.preferred_language ?? "en";
  const dictionary = getCustomerDictionary(locale);

  async function createPreferenceFormAction(formData: FormData) {
    "use server";

    const result = await createPaymentPreferenceAction(formData);
    if (!result.ok) {
      redirect(`/customer/settings/payment?error=${encodeURIComponent(result.message)}`);
    }

    redirect("/customer/settings/payment?saved=1");
  }

  async function deletePreferenceFormAction(formData: FormData) {
    "use server";

    const result = await deletePaymentPreferenceAction(formData);
    if (!result.ok) {
      redirect(`/customer/settings/payment?error=${encodeURIComponent(result.message)}`);
    }

    redirect("/customer/settings/payment?saved=1");
  }

  async function setDefaultFormAction(formData: FormData) {
    "use server";

    const result = await setDefaultPaymentPreferenceAction(formData);
    if (!result.ok) {
      redirect(`/customer/settings/payment?error=${encodeURIComponent(result.message)}`);
    }

    redirect("/customer/settings/payment?saved=1");
  }

  return (
    <main className="space-y-4 pb-2">
      <SubPageHeader title={dictionary.settings.paymentMethod} />

      <section className="space-y-3 rounded-2xl border border-border-muted bg-white p-4 shadow-soft">
        <h2 className="text-sm font-bold text-text-secondary">{dictionary.settings.addPaymentPreference}</h2>
        <form action={createPreferenceFormAction} className="space-y-2">
          <select
            name="method"
            className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-text-secondary"
            defaultValue="cod"
          >
            <option value="cod">{dictionary.settings.cashOnDelivery}</option>
            <option value="gcash">GCash</option>
            <option value="card">{dictionary.settings.card}</option>
          </select>
          <input
            name="display_label"
            placeholder={dictionary.settings.displayLabelPlaceholder}
            className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-text-secondary"
          />
          <input
            name="masked_reference"
            placeholder={dictionary.settings.maskedReferencePlaceholder}
            className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-text-secondary"
          />
          <label className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <input type="checkbox" name="is_default" value="true" />
            {dictionary.settings.setDefaultCheckout}
          </label>

          <button type="submit" className="h-10 w-full rounded-xl bg-primary-500 text-sm font-bold text-white">
            {dictionary.settings.savePreference}
          </button>
        </form>
      </section>

      <section className="space-y-2">
        {preferences.length === 0 ? (
          <div className="rounded-2xl border border-border-muted bg-white p-4 text-sm text-text-muted shadow-soft">
            {dictionary.settings.noSavedPreferences}
          </div>
        ) : null}

        {preferences.map((preference) => (
          <article key={preference.id} className="rounded-2xl border border-border-muted bg-white p-3 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary">{formatPaymentMethodLabel(preference.method, locale)}</p>
                <p className="text-xs text-text-muted">{preference.display_label || dictionary.settings.noLabel}</p>
                <p className="text-xs text-text-muted">{preference.masked_reference || dictionary.settings.noReference}</p>
              </div>
              {preference.is_default ? (
                <span className="rounded-full bg-primary-500/10 px-2 py-1 text-[11px] font-semibold text-primary-500">{dictionary.settings.defaultBadge}</span>
              ) : null}
            </div>

            <div className="mt-3 flex gap-2">
              {!preference.is_default ? (
                <form action={setDefaultFormAction}>
                  <input type="hidden" name="preference_id" value={preference.id} />
                  <button type="submit" className="h-9 rounded-lg border border-border-muted px-3 text-xs font-semibold text-text-secondary">
                    {dictionary.settings.setDefault}
                  </button>
                </form>
              ) : null}

              <form action={deletePreferenceFormAction}>
                <input type="hidden" name="preference_id" value={preference.id} />
                <button type="submit" className="h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-600">
                  {dictionary.settings.remove}
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>

      {saved === "1" ? (
        <p className="text-center text-sm font-semibold text-primary-500">{dictionary.settings.paymentPreferenceSaved}</p>
      ) : null}

      {error ? (
        <p className="text-center text-sm font-semibold text-rose-600">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-border-muted bg-white p-3 text-xs text-text-muted shadow-soft">
        {dictionary.settings.paymentFootnote}
      </section>
    </main>
  );
}
