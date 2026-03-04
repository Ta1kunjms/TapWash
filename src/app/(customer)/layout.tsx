import { BottomNav } from "@/components/customer/bottom-nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-[radial-gradient(120%_100%_at_0%_0%,_#e7f3ff_0%,_#cae5ff_100%)] px-4 pb-24 pt-3">
      {children}
      <BottomNav />
    </div>
  );
}
