import { CategoryPageHeader } from "@/components/category/CategoryPageHeader";
import type { Category } from "@/types/api";

type PLPHeaderProps = {
  category?: Category | null;
  total?: number;
};

export function PLPHeader({ category, total }: PLPHeaderProps) {
  if (category) {
    return (
      <CategoryPageHeader
        title={category.name}
        description={undefined}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
        productCount={total}
        image={category.image}
      />
    );
  }

  return (
    <CategoryPageHeader
      title="All Products"
      description="Browse our complete range of premium leather goods, crafted with enduring quality."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Products" }]}
      productCount={total}
    />
  );
}
