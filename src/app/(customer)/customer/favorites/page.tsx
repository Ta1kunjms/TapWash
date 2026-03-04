import { MobileTopBar } from "@/components/customer/mobile-chrome";

export default function CustomerFavoritesPage() {
  return (
    <main className="space-y-4">
      <MobileTopBar searchPlaceholder="Find favorites..." searchAction="/customer/favorites" />

      <section className="rounded-2xl border border-border-muted bg-background-app/40 px-4 py-12 text-center">
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-500/20 text-5xl text-primary-500">
          ♡
        </div>
        <h1 className="text-3xl font-black text-primary-500/80">No favorites yet</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-primary-500/70">
          Save laundromats you love to access them quickly next time.
        </p>
      </section>
    </main>
  );
}
