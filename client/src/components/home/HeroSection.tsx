"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useAnnouncementStore } from "@/store/announcement-store";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const barVisible = useAnnouncementStore((s) => s.isVisible);

  function scrollToContent() {
    const el = document.getElementById("trust-bar");
    el?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      className={cn(
        "relative h-screen min-h-[600px] max-h-[900px] w-full overflow-hidden bg-[var(--color-primary)]",
        // mobile 60px | tablet 64px | desktop 72px  (+40px bar when visible)
        barVisible
          ? "-mt-[100px] md:-mt-[104px] lg:-mt-[112px]"
          : "-mt-[60px] md:-mt-[64px] lg:-mt-[72px]",
      )}
    >
      <Image
        src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1800&q=80"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AKwAB/9k="
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-white/60 text-[11px] tracking-[0.35em] uppercase font-[var(--font-inter)] mb-6"
        >
          Premium Leather Goods
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
          className="font-display text-[clamp(2.5rem,8vw,7rem)] font-light tracking-[0.12em] uppercase text-white leading-none"
        >
          Leather Is{" "}
          <span className="font-semibold">Timeless</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
          className="w-16 h-px bg-[var(--color-accent)] mt-8 mb-8 origin-left"
        />

        <motion.a
          href="/products"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85, ease: "easeOut" }}
          className="inline-flex items-center border border-white text-white text-[11px] tracking-[0.25em] uppercase font-[var(--font-inter)] px-8 py-3.5 hover:bg-white hover:text-[var(--color-primary)] transition-colors duration-200"
        >
          Shop Now
        </motion.a>
      </div>

      <button
        onClick={scrollToContent}
        aria-label="Scroll to content"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors hero-chevron-bounce opacity-0 [animation-delay:1.4s] [animation-fill-mode:forwards]"
      >
        <ChevronDown size={18} />
      </button>
    </section>
  );
}
