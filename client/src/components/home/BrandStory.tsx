"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = [
  {
    id: "story",
    label: "Story",
    heading: "For the Love of Leather",
    body: "Our enduring passion for natural leather prompted us to officially launch in 2001 as a retailer of premium quality leather goods, after consistently exporting to esteemed buyers across the globe. The commitment to stay on the cutting edge is a combination of an innovating approach and our long heritage of leather & textile manufacturing, tracing the foundation back to a trading house of leather hides set up in the early 1900s.",
  },
  {
    id: "inspiration",
    label: "Inspiration",
    heading: "Crafted With Intention",
    body: "Every piece begins as an idea — a desire to create something both beautiful and enduring. We draw inspiration from the raw honesty of natural materials, the quiet elegance of minimal design, and the timeless craft traditions passed down through generations of Pakistani artisans.",
  },
  {
    id: "quality",
    label: "Quality",
    heading: "Uncompromising Standards",
    body: "We source only full-grain and top-grain leathers, chosen for their natural character and durability. Each product is hand-stitched, hand-finished, and inspected before it leaves our workshop. Our commitment to quality means every piece you carry is built to last a lifetime — and then some.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function BrandStory() {
  const [activeTab, setActiveTab] = useState<TabId>("story");

  const activeContent = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <section className="py-24 bg-[var(--color-surface)]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — image */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[4/5] w-full overflow-hidden"
          >
            <Image
              src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=900&q=80"
              alt="Leather craftsmanship"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AKwAB/9k="
            />
          </motion.div>

          {/* Right — text */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Tab bar */}
            <div className="flex gap-8 border-b border-[var(--color-border)] mb-10">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "pb-3 text-[11px] tracking-[0.25em] uppercase font-[var(--font-inter)] transition-colors duration-200 relative",
                    activeTab === tab.id
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="story-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-text-primary)]"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-light tracking-[0.12em] uppercase text-[var(--color-text-primary)] mb-6 leading-tight">
                  {activeContent.heading}
                </h2>
                <p className="text-[var(--color-text-body)] text-base leading-relaxed font-[var(--font-inter)] font-light">
                  {activeContent.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Accent rule */}
            <div className="w-12 h-px bg-[var(--color-accent)] mt-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
