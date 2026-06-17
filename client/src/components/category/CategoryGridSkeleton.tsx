import { Skeleton } from '@/components/ui/skeleton'

type CategoryGridSkeletonProps = {
  count?: number
}

export function CategoryGridSkeleton({ count = 6 }: CategoryGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative">
          <Skeleton className="aspect-[4/5] w-full" />
          {/* Simulate the text overlay position */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
            <Skeleton className="h-3 w-32 mb-4" />
            <Skeleton className="h-8 w-36" />
          </div>
        </div>
      ))}
    </div>
  )
}
