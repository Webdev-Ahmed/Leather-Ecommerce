import type { Metadata } from "next";
import { Suspense } from "react";
import { getProduct } from "@/api/products";
import { PDPClient } from "@/components/product/PDPClient";
import { PDPSkeleton } from "@/components/product/PDPSkeleton";

type PDPPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PDPPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getProduct(slug);
    return {
      title: product.name,
      description: product.description.slice(0, 155),
      openGraph: {
        title: product.name,
        description: product.description.slice(0, 155),
        images: product.images[0] ? [{ url: product.images[0] }] : [],
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function PDPPage({ params }: PDPPageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={<PDPSkeleton />}>
      <PDPClient slug={slug} />
    </Suspense>
  );
}
