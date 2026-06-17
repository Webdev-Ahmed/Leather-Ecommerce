import type { Metadata } from "next";
import { getCategories } from "@/api/categories";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/TrustBar";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProductsWrapper } from "@/components/home/FeaturedProductsWrapper";
import { BrandStory } from "@/components/home/BrandStory";
import { InstagramGrid } from "@/components/home/InstagramGrid";
import { NewsletterSection } from "@/components/home/NewsletterSection";

export const metadata: Metadata = {
  title: "Premium Leather Goods",
  description:
    "Handcrafted premium leather wallets, bags, and accessories. Discover the finest leather goods.",
};

// Revalidate once per hour — categories change rarely
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch categories server-side for the grid; graceful empty fallback
  const categories = await getCategories().catch(() => []);

  return (
    <>
      {/* 1. Full-bleed hero with animated headline */}
      <HeroSection />

      {/* 2. Three-column trust indicators */}
      <TrustBar />

      {/* 3. Category grid — pre-fetched server-side */}
      <CategoryGrid categories={categories} />

      {/* 4. Featured products carousel — client-side TanStack Query */}
      <FeaturedProductsWrapper />

      {/* 5. Brand story with Story / Inspiration / Quality tabs */}
      <BrandStory />

      {/* 6. Instagram grid social proof */}
      <InstagramGrid />

      {/* 7. Newsletter section */}
      <NewsletterSection />
    </>
  );
}
