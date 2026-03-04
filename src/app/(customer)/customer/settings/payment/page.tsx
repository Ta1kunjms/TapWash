import { SubPageHeader } from "@/components/customer/mobile-chrome";

export default function CustomerPaymentPage() {
  return (
    <main className="space-y-4 pb-2">
      <SubPageHeader title="Payment Method" />

      <section className="rounded-2xl border border-border-muted bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3 border-b border-border-muted pb-3">
          <div className="rounded-lg bg-primary-500 px-2 py-1 text-xs font-bold text-white">GCash</div>
          <div>
            <p className="text-sm font-bold text-text-secondary">GCash (Alipay+ Partner)</p>
            <p className="text-xs text-text-muted">+63-9****40851</p>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md bg-text-secondary/10 px-2 py-1 text-xs font-black text-primary-500">VISA</div>
            <p className="text-sm text-text-secondary">
              Switch to your VISA credit or debit card now. VISA, the best way to pay.
            </p>
          </div>
          <button className="rounded-lg border border-border-muted px-3 py-1.5 text-xs font-semibold text-text-secondary">Add card</button>
        </div>
      </section>
    </main>
  );
}
