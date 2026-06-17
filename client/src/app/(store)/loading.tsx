import { Skeleton } from "@/components/ui/skeleton";

export default function StoreLoading() {
  return (
    <div className="min-h-[70vh] animate-in fade-in duration-300">
      <div className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface-card)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
          <Skeleton className="h-3 w-28 mb-6" />
          <Skeleton className="h-12 w-72 max-w-full mb-4" />
          <Skeleton className="h-4 w-[32rem] max-w-full" />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
