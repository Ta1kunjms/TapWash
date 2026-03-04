import { BottomNav } from "@/components/customer/bottom-nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-20 pt-4 md:max-w-5xl md:pb-6">
      {children}
      <BottomNav />
    </div>
  );
}
