"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type PDPImageGalleryProps = {
  images: string[];
  productName: string;
};

export function PDPImageGallery({ images, productName }: PDPImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [zoomed, setZoomed] = useState(false);

  const all = images.length > 0 ? images : ["/images/placeholder.jpg"];

  function go(idx: number) {
    setDirection(idx > active ? 1 : -1);
    setActive(idx);
  }

  function prev() {
    go(active === 0 ? all.length - 1 : active - 1);
  }

  function next() {
    go(active === all.length - 1 ? 0 : active + 1);
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-3 lg:gap-4">
      {/* Thumbnails — vertical on desktop, horizontal on mobile */}
      {all.length > 1 && (
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[620px] scrollbar-thin shrink-0">
          {all.map((src, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative shrink-0 w-[60px] h-[72px] lg:w-[72px] lg:h-[88px] overflow-hidden border-2 transition-all duration-200",
                i === active
                  ? "border-[var(--color-primary)] opacity-100"
                  : "border-transparent opacity-60 hover:opacity-90 hover:border-[var(--color-border)]",
              )}
            >
              <Image
                src={src}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
                sizes="72px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div
        className={cn(
          "relative flex-1 bg-[var(--color-accent-light)] overflow-hidden",
          "aspect-[4/5]",
          zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
        )}
        onClick={() => setZoomed((z) => !z)}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={active}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d * 32, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -32, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={all[active]}
              alt={`${productName} — image ${active + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className={cn(
                "object-cover transition-transform duration-500",
                zoomed ? "scale-125" : "scale-100 hover:scale-105",
              )}
              priority={active === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Zoom hint */}
        {!zoomed && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-white/70 backdrop-blur-sm flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={14} strokeWidth={1.5} className="text-[var(--color-primary)]" />
          </div>
        )}

        {/* Nav arrows */}
        {all.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 hover:bg-white flex items-center justify-center transition-all duration-150 shadow-sm hover:shadow"
            >
              <ChevronLeft size={17} strokeWidth={1.5} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 hover:bg-white flex items-center justify-center transition-all duration-150 shadow-sm hover:shadow"
            >
              <ChevronRight size={17} strokeWidth={1.5} />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {all.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); go(i); }}
                  aria-label={`Go to image ${i + 1}`}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    i === active
                      ? "w-4 h-1.5 bg-white"
                      : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80",
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Image count badge */}
        {all.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-[var(--font-inter)] font-semibold px-2 py-0.5 pointer-events-none">
            {active + 1} / {all.length}
          </div>
        )}
      </div>
    </div>
  );
}
