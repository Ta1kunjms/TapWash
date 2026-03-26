import { SubPageHeader } from "@/components/customer/mobile-chrome";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import Link from "next/link";
import { createSupportTicketAction } from "@/app/actions/customer";
import { getCustomerProfile } from "@/services/customer";
import { listCustomerSupportTickets } from "@/services/support";
import { getCustomerDictionary } from "@/lib/i18n";
import { redirect } from "next/navigation";

const topics = [
  { key: "wash-services", title: "Wash Services", icon: "wash" as const },
  { key: "scheduling", title: "Scheduling", icon: "schedule" as const },
  { key: "payments", title: "Payments", icon: "payment" as const },
  { key: "account", title: "Account", icon: "account" as const },
];

export default async function CustomerHelpPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const [profile, tickets] = await Promise.all([getCustomerProfile(), listCustomerSupportTickets()]);
  const dictionary = getCustomerDictionary(profile?.preferred_language ?? "en");

  async function createSupportTicketFormAction(formData: FormData) {
    "use server";

    const result = await createSupportTicketAction(formData);
    if (!result.ok) {
      redirect(`/customer/settings/help?error=${encodeURIComponent(result.message)}`);
    }

    redirect("/customer/settings/help?saved=1");
  }

  return (
    <main className="space-y-4 pb-2">
      <SubPageHeader title={dictionary.settings.helpCenter} />

      <section className="grid grid-cols-2 gap-3">
        {topics.map((topic) => (
          <Link
            key={topic.title}
            href={`/customer/settings/help/${topic.key}`}
            className="rounded-2xl border border-border-muted bg-white p-4 text-center shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="mb-2 flex justify-center text-primary-500">{renderHelpIcon(topic.icon)}</div>
            <p className="text-sm font-bold text-primary-500">{topic.title}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-border-muted bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-primary-500">{dictionary.settings.contactSupport}</h2>
        <p className="text-sm text-text-secondary/70">{dictionary.settings.contactSupportBody}</p>
        <form action={createSupportTicketFormAction} className="space-y-2">
          <select
            name="topic"
            className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-text-secondary"
            defaultValue="account"
          >
            {topics.map((topic) => (
              <option key={topic.key} value={topic.key}>
                {topic.title}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
          <input
            name="subject"
            placeholder={dictionary.settings.shortSubjectPlaceholder}
            className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-text-secondary"
          />
          <textarea
            name="message"
            placeholder={dictionary.settings.describeIssuePlaceholder}
            rows={4}
            className="w-full rounded-xl border border-border-muted bg-white px-3 py-2 text-sm text-text-secondary"
          />
          <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 text-sm font-bold text-white transition hover:bg-primary-500/90">
            <FlaticonIcon name="headset" className="text-sm" />
            {dictionary.settings.submitTicket}
          </button>
        </form>
      </section>

      <section className="space-y-2 rounded-2xl border border-border-muted bg-white p-3 shadow-soft">
        <h2 className="text-sm font-bold text-text-secondary">{dictionary.settings.mySupportTickets}</h2>
        {tickets.length === 0 ? (
          <p className="text-xs text-text-muted">{dictionary.settings.noTickets}</p>
        ) : (
          tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-xl border border-border-muted p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-secondary">{ticket.subject}</p>
                <span className="rounded-full bg-primary-500/10 px-2 py-1 text-[11px] font-semibold text-primary-500">{ticket.status.replace("_", " ")}</span>
              </div>
              <p className="mt-1 text-xs text-text-muted">Topic: {ticket.topic}</p>
              <p className="mt-1 text-xs text-text-secondary/75">{ticket.message}</p>
              {ticket.admin_note ? (
                <p className="mt-2 rounded-lg bg-primary-500/5 px-2 py-1 text-xs text-text-secondary">
                  {dictionary.settings.supportNotePrefix} {ticket.admin_note}
                </p>
              ) : null}
            </article>
          ))
        )}
      </section>

      {saved === "1" ? <p className="text-center text-sm font-semibold text-primary-500">{dictionary.settings.supportTicketSubmitted}</p> : null}
      {error ? <p className="text-center text-sm font-semibold text-rose-600">{error}</p> : null}

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
