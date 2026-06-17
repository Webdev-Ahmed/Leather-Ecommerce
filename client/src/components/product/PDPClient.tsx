"use client";

import { notFound } from "next/navigation";
import { useProduct } from "@/hooks/useProducts";
import { PDPImageGallery } from "./PDPImageGallery";
import { PDPInfo } from "./PDPInfo";
import { PDPSkeleton } from "./PDPSkeleton";
import { PDPError } from "./PDPError";
import { RelatedProducts } from "./RelatedProducts";
import { ProductReviews } from "./ProductReviews";
import type { AppError } from "@/types/api";

type PDPClientProps = {
  slug: string;
};

export function PDPClient({ slug }: PDPClientProps) {
  const { data: product, isLoading, isError, error, refetch } = useProduct(slug);

  if (isLoading) return <PDPSkeleton />;

  if (isError || !product) {
    const appError = error as AppError | undefined;
    if (appError?.statusCode === 404) notFound();
    return <PDPError onRetry={() => refetch()} />;
  }

  const allImages = [
    ...product.images,
    ...product.variants.flatMap((v) => v.images),
  ].filter(Boolean);

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <PDPImageGallery
            images={allImages.length > 0 ? allImages : product.images}
            productName={product.name}
          />
          <PDPInfo product={product} />
        </div>

        {/* Reviews — same max-width column, below the product grid */}
        <ProductReviews slug={product.slug} />
      </div>

      <RelatedProducts
        categorySlug={product.category.slug}
        currentProductId={product.id}
      />
    </>
  );
}
