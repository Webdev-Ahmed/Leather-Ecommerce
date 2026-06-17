import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCategory } from "@/api/categories";
import { PLPHeader } from "@/components/product/PLPHeader";
import { PLPClient } from "@/components/product/PLPClient";
import { Skeleton } from "@/components/ui/skeleton";

type CategoryPLPPageProps = {
  params: Promise<{ slug: string }>;
};

// Generate metadata from the server-fetched category
export async function generateMetadata({
  params,
}: CategoryPLPPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const category = await getCategory(slug);
    return {
      title: category.name,
      description: `Shop our ${category.name} collection — premium leather goods crafted with enduring quality.`,
    };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPLPPage({
  params,
}: CategoryPLPPageProps) {
  const { slug } = await params;

  let category;

  try {
    category = await getCategory(slug);
  } catch {
    notFound();
  }

  return (
    <>
      {/* RSC header — has category name, description, breadcrumbs */}
      <PLPHeader category={category} />

      {/* PLPClient locks category via slug prop; gender filter hidden on category pages */}
      <Suspense
        fallback={
          <>
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-card)] h-[65px]" />
            <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[3/4] w-full" />
                    <Skeleton className="h-3 w-3/4 mt-3" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </>
        }
      >
        <PLPClient categorySlug={slug} showGenderFilter={false} />
      </Suspense>
    </>
  );
}
