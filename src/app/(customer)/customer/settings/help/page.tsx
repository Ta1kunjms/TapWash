import { SubPageHeader } from "@/components/customer/mobile-chrome";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";

const topics = [
  { title: "Wash Services", icon: "wash" as const },
  { title: "Scheduling", icon: "schedule" as const },
  { title: "Payments", icon: "payment" as const },
  { title: "Account", icon: "account" as const },
];

export default function CustomerHelpPage() {
  return (
    <main className="space-y-4 pb-2">
      <SubPageHeader title="Help Center" />

      <section className="grid grid-cols-2 gap-3">
        {topics.map((topic) => (
          <article
            key={topic.title}
            className="rounded-2xl border border-border-muted bg-white p-4 text-center shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="mb-2 flex justify-center text-primary-500">{renderHelpIcon(topic.icon)}</div>
            <p className="text-sm font-bold text-primary-500">{topic.title}</p>
          </article>
        ))}
      </section>

      <section className="pt-3 text-center">
        <h2 className="text-3xl font-black text-primary-500">Still need Help?</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-text-secondary/70">
          Our support team is available 24/7 to assist you with any questions or issues.
        </p>
        <button className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 text-sm font-bold text-white transition hover:bg-primary-500/90">
          <FlaticonIcon name="headset" className="text-sm" />
          Contact Support
        </button>
      </section>
    </main>
  );
}

function renderHelpIcon(icon: "wash" | "schedule" | "payment" | "account") {
  if (icon === "wash") {
    return <FlaticonIcon name="washer" className="text-[40px]" />;
  }

  if (icon === "schedule") {
    return <FlaticonIcon name="calendar-clock" className="text-[40px]" />;
  }

  if (icon === "payment") {
    return <FlaticonIcon name="credit-card" className="text-[40px]" />;
  }

  return <FlaticonIcon name="user" className="text-[40px]" />;
}
