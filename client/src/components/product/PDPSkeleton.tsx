import { Skeleton } from "@/components/ui/skeleton";

export function PDPSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Image gallery skeleton */}
        <div className="flex flex-col-reverse lg:flex-row gap-4">
          <div className="flex lg:flex-col gap-2 shrink-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-16 h-20 lg:w-20 lg:h-24 shrink-0"
              />
            ))}
          </div>
          <Skeleton className="flex-1 aspect-[4/5]" />
        </div>

        {/* Info skeleton */}
        <div className="flex flex-col gap-6">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-28" />
          <div className="h-px bg-[var(--color-border)]" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-8 h-8 rounded-full" />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="w-[120px] h-10" />
            <Skeleton className="flex-1 h-10" />
          </div>
          <div className="h-px bg-[var(--color-border)]" />
          <Skeleton className="h-3 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        </div>
      </div>
    </div>
  );
}
