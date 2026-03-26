import { updateSupportTicketStatusAction } from "@/app/actions/admin";
import { Card } from "@/components/ui/card";
import { listAdminSupportTickets } from "@/services/support";

export default async function AdminSupportPage() {
  const tickets = await listAdminSupportTickets();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Queue</h1>
        <p className="text-sm text-text-secondary">Review and resolve customer help tickets.</p>
      </div>

      <Card>
        {tickets.length === 0 ? (
          <p className="text-sm text-text-secondary">No support tickets yet.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-2xl border border-border-muted p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-text-primary">{ticket.subject}</h2>
                  <span className="rounded-full bg-primary-500/10 px-2 py-1 text-xs font-semibold text-primary-600">
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-secondary">{ticket.customer_name}</p>
                <p className="mt-1 text-xs text-text-muted">Topic: {ticket.topic}</p>
                <p className="mt-2 text-sm text-text-primary">{ticket.message}</p>

                <form action={updateSupportTicketStatusAction} className="mt-3 grid gap-2 md:grid-cols-[180px,1fr,auto]">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <select
                    name="status"
                    defaultValue={ticket.status}
                    className="h-10 rounded-xl border border-border-muted bg-white px-3 text-sm"
                  >
                    <option value="open">open</option>
                    <option value="in_progress">in progress</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                  <input
                    name="adminNote"
                    defaultValue={ticket.admin_note ?? ""}
                    placeholder="Internal note"
                    className="h-10 rounded-xl border border-border-muted bg-white px-3 text-sm"
                  />
                  <button type="submit" className="h-10 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white">
                    Save
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
