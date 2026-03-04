import { SubPageHeader } from "@/components/customer/mobile-chrome";

const languages = [
  ["🇬🇧", "English (UK)", "English"],
  ["🇪🇬", "Egypt (Syria)", "العربية"],
  ["🇮🇳", "India", "हिंदी"],
  ["🇵🇰", "Pakistan", "اردو"],
  ["🇧🇩", "Bangladesh", "বাংলা"],
  ["🇵🇭", "Philippines", "Tagalog"],
  ["🇮🇷", "Iran", "فارسی"],
  ["🇳🇵", "Nepal", "नेपाली"],
  ["🇱🇰", "Srilanka", "සිංහල"],
] as const;

export default function CustomerLanguagePage() {
  return (
    <main className="space-y-4 pb-2">
      <SubPageHeader title="Language" />

      <section className="space-y-2 rounded-2xl border border-border-muted bg-white p-2 shadow-soft">
        {languages.map(([flag, country, native], index) => {
          const selected = index === 0;
          return (
            <button
              key={country}
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
          );
        })}
      </section>
    </main>
  );
}
