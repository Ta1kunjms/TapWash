import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingShopPage() {
  return (
    <main className="min-h-screen pb-28">
      <div className="relative -mx-4 mt-[-0.75rem]">
        <Skeleton className="h-72 w-full rounded-none" />
      </div>

      <div className="relative z-10 -mt-8 rounded-t-[2rem] bg-background-app px-4 pt-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="w-full max-w-[14rem] space-y-2">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="w-20 space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>

        <div className="my-5 space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-20" />
        </div>

        <div className="space-y-3 pb-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <Skeleton className="mx-auto h-12 max-w-md rounded-full" />
      </div>
    </main>
  );
}
