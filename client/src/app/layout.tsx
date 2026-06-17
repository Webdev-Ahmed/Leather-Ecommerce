import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { AppToaster } from "@/components/layout/AppToaster";
import { Providers } from "./providers";
import "@/styles/globals.css";

// ─── Fonts — self-hosted via next/font, zero layout shift ─────────────────────

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  // block: invisible text during load, then jumps to the correct font once
  // — prevents the system-serif → Cormorant layout-shift flash
  display: "block",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  // optional: uses Inter only if it loads within the first render window
  // (practically always true for self-hosted next/font) — eliminates FOUT
  display: "optional",
  preload: true,
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "Leather E-Commerce",
    template: "%s | Leather E-Commerce",
  },
  description: "Premium leather goods — wallets, bags, and accessories.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",
  ),
};

// ─── Layout ───────────────────────────────────────────────────────────────────

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-(--color-surface) text-(--color-text-body) antialiased">
        <Providers>
          {children}

          {/*
           * CartDrawer is mounted in (store)/layout.tsx — added in Step 4.
           * It lives there rather than here so auth-only routes stay clean.
           */}

          <AppToaster />
        </Providers>
      </body>
    </html>
  );
}
