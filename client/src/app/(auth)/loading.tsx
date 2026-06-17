import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md animate-in fade-in duration-300">
      <div className="bg-[var(--color-surface-card)] border border-[var(--color-border)] p-8 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>

        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
}
