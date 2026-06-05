import { Suspense } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandStory } from "@/components/home/BrandStory";
import { InstagramGrid } from "@/components/home/InstagramGrid";
import { TrustBar } from "@/components/home/TrustBar";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <Suspense fallback={<div className="h-96 animate-pulse bg-surface" />}>
        <CategoryGrid />
      </Suspense>
      <Suspense fallback={<div className="h-96 animate-pulse bg-surface" />}>
        <FeaturedProducts />
      </Suspense>
      <BrandStory />
      <InstagramGrid />
      <TrustBar />
    </main>
  );
}
