import { SubPageHeader } from "@/components/customer/mobile-chrome";

const topics = [
  { title: "Wash Services", icon: "🧺" },
  { title: "Scheduling", icon: "🗓️" },
  { title: "Payments", icon: "💳" },
  { title: "Account", icon: "👤" },
];

export default function CustomerHelpPage() {
  return (
    <main className="space-y-4 pb-2">
      <SubPageHeader title="Help Center" />

      <section className="grid grid-cols-2 gap-3">
        {topics.map((topic) => (
          <article key={topic.title} className="rounded-2xl border border-border-muted bg-white p-4 text-center shadow-soft">
            <div className="mb-2 text-4xl text-primary-500">{topic.icon}</div>
            <p className="text-sm font-bold text-primary-500">{topic.title}</p>
          </article>
        ))}
      </section>

      <section className="pt-3 text-center">
        <h2 className="text-3xl font-black text-primary-500">Still need Help?</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-text-secondary/70">
          Our support team is available 24/7 to assist you with any questions or issues.
        </p>
        <button className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary-500 px-6 text-sm font-bold text-white">
          🎧 Contact Support
        </button>
      </section>
    </main>
  );
}
