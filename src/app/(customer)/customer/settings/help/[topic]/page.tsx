import { SubPageHeader } from "@/components/customer/mobile-chrome";
import { getCustomerProfile } from "@/services/customer";
import { listHelpArticlesByTopic } from "@/services/support";
import { notFound } from "next/navigation";

const topicLabels = {
  "wash-services": "Wash Services",
  scheduling: "Scheduling",
  payments: "Payments",
  account: "Account",
} as const;

type HelpTopic = keyof typeof topicLabels;

export default async function HelpTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  if (!isHelpTopic(topic)) {
    notFound();
  }

  const profile = await getCustomerProfile();
  const locale = profile?.preferred_language ?? "en";
  const articles = await listHelpArticlesByTopic(topic, locale);

  return (
    <main className="space-y-4 pb-2">
      <SubPageHeader title={topicLabels[topic]} href="/customer/settings/help" />

      <section className="space-y-2">
        {articles.length === 0 ? (
          <div className="rounded-2xl border border-border-muted bg-white p-4 text-sm text-text-muted shadow-soft">
            No help articles available for this topic yet.
          </div>
        ) : (
          articles.map((article) => (
            <article key={article.id} className="rounded-2xl border border-border-muted bg-white p-4 shadow-soft">
              <h2 className="text-base font-bold text-text-secondary">{article.title}</h2>
              {article.summary ? <p className="mt-1 text-xs text-text-muted">{article.summary}</p> : null}
              <p className="mt-3 text-sm leading-relaxed text-text-secondary/85">{article.content}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function isHelpTopic(value: string): value is HelpTopic {
  return value === "wash-services" || value === "scheduling" || value === "payments" || value === "account";
}
