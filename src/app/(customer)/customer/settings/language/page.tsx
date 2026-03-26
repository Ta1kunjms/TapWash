import { SubPageHeader } from "@/components/customer/mobile-chrome";
import { updateCustomerLanguageAction } from "@/app/actions/customer";
import { getCustomerProfile } from "@/services/customer";
import { getCustomerDictionary } from "@/lib/i18n";
import { redirect } from "next/navigation";

const languages = [
  ["en", "🇬🇧", "English", "English"],
  ["ar", "🇪🇬", "Arabic", "العربية"],
  ["hi", "🇮🇳", "Hindi", "हिंदी"],
  ["ur", "🇵🇰", "Urdu", "اردو"],
  ["bn", "🇧🇩", "Bangla", "বাংলা"],
  ["tl", "🇵🇭", "Tagalog", "Tagalog"],
  ["fa", "🇮🇷", "Persian", "فارسی"],
  ["ne", "🇳🇵", "Nepali", "नेपाली"],
  ["si", "🇱🇰", "Sinhala", "සිංහල"],
] as const;

export default async function CustomerLanguagePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const profile = await getCustomerProfile();
  const selectedLanguage = profile?.preferred_language ?? "en";
  const dictionary = getCustomerDictionary(selectedLanguage);

  async function updateLanguageFormAction(formData: FormData) {
    "use server";

    const result = await updateCustomerLanguageAction(formData);
    if (!result.ok) {
      redirect(`/customer/settings/language?error=${encodeURIComponent(result.message)}`);
    }

    redirect("/customer/settings/language?saved=1");
  }

  return (
    <main className="space-y-4 pb-2">
      <SubPageHeader title={dictionary.settings.language} />

      <section className="space-y-2 rounded-2xl border border-border-muted bg-white p-2 shadow-soft">
        {languages.map(([code, flag, country, native]) => {
          const selected = selectedLanguage === code;
          return (
            <form key={code} action={updateLanguageFormAction}>
              <input type="hidden" name="language" value={code} />
              <button
                type="submit"
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${
                  selected ? "border-primary-500/60 bg-primary-500/5" : "border-border-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-text-secondary">{country}</p>
                  </div>
                </div>
                <span className="text-xs text-text-muted">({native})</span>
              </button>
            </form>
          );
        })}
      </section>

      {saved === "1" ? (
        <p className="text-center text-sm font-semibold text-primary-500">{dictionary.settings.languageSaved}</p>
      ) : null}

      {error ? (
        <p className="text-center text-sm font-semibold text-rose-600">{error}</p>
      ) : null}
    </main>
  );
}
