"use client";

import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { PLPToolbar } from "./PLPToolbar";
import { ActiveFilters } from "./ActiveFilters";
import { ProductGrid } from "./ProductGrid";
import { Pagination } from "./Pagination";
import type { ProductsQuery } from "@/types/api";

type PLPClientProps = {
  categorySlug?: string;
  showGenderFilter?: boolean;
};

export function PLPClient({
  categorySlug,
  showGenderFilter = true,
}: PLPClientProps) {
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const sort =
    (searchParams.get("sort") as ProductsQuery["sort"] | null) ?? "newest";
  const search = searchParams.get("search") ?? undefined;
  // URL param is already lowercase (from GenderFilter) — pass straight through
  const gender = searchParams.get("gender") ?? undefined;

  const query: ProductsQuery = {
    page,
    limit: 24,
    sort,
    ...(search && { search }),
    ...(gender && { gender: gender as ProductsQuery["gender"] }),
    ...(categorySlug && { category: categorySlug }),
  };

  const { data, isLoading, isFetching } = useProducts(query);

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <PLPToolbar
        total={pagination?.total ?? 0}
        showGenderFilter={showGenderFilter}
      />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <ActiveFilters />

        <div className="py-10">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
          />
        </div>

        {pagination && pagination.totalPages > 1 && (
          <Pagination
            totalPages={pagination.totalPages}
            currentPage={pagination.page}
          />
        )}
      </div>
    </>
  );
}
