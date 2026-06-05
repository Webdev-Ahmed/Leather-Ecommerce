import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import "@/styles/globals.css";

// ─── Fonts — self-hosted via next/font, zero layout shift ─────────────────────

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
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

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
                fontFamily: "var(--font-inter)",
                fontSize: "14px",
                borderRadius: "4px",
                padding: "12px 16px",
              },
              success: {
                iconTheme: {
                  primary: "var(--color-accent)",
                  secondary: "var(--color-primary)",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "var(--color-primary)",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
