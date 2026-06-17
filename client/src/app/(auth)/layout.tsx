import type { ReactNode } from "react";
import Link from "next/link";
import { GuestOnly } from "@/components/auth/GuestOnly";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestOnly>
      <div className="min-h-screen bg-[var(--color-primary)] flex flex-col relative overflow-hidden">

        {/* ── Layer 1: Radial glow — warm amber centre ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(184,150,12,0.13) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(184,150,12,0.07) 0%, transparent 60%)",
          }}
        />

        {/* ── Layer 2: Leather-grain crosshatch SVG tile ── */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.055]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="auth-grain"
              x="0"
              y="0"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              {/* Fine crosshatch — mimics woven leather texture */}
              <path
                d="M0 12 L48 12 M0 24 L48 24 M0 36 L48 36 M12 0 L12 48 M24 0 L24 48 M36 0 L36 48"
                stroke="#B8960C"
                strokeWidth="0.4"
                fill="none"
              />
              {/* Diagonal accent lines */}
              <path
                d="M0 0 L48 48 M24 0 L48 24 M0 24 L24 48"
                stroke="#B8960C"
                strokeWidth="0.25"
                fill="none"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grain)" />
        </svg>

        {/* ── Layer 3: Large faint monogram watermark ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        >
          <span
            className="font-display font-light text-[clamp(18rem,40vw,32rem)] leading-none tracking-[0.15em]"
            style={{ color: "rgba(184,150,12,0.04)" }}
          >
            LC
          </span>
        </div>

        {/* ── Layer 4: Corner ornament — top-left ── */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 w-40 h-40 opacity-20"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 1 L80 1 M1 0 L1 80"
            stroke="#B8960C"
            strokeWidth="0.75"
          />
          <path
            d="M0 16 L32 16 M16 0 L16 32"
            stroke="#B8960C"
            strokeWidth="0.5"
          />
          <circle cx="1" cy="1" r="2.5" fill="#B8960C" opacity="0.6" />
        </svg>

        {/* ── Layer 5: Corner ornament — bottom-right ── */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 w-40 h-40 opacity-20"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M160 159 L80 159 M159 160 L159 80"
            stroke="#B8960C"
            strokeWidth="0.75"
          />
          <path
            d="M160 144 L128 144 M144 160 L144 128"
            stroke="#B8960C"
            strokeWidth="0.5"
          />
          <circle cx="159" cy="159" r="2.5" fill="#B8960C" opacity="0.6" />
        </svg>

        {/* ── Top gold accent line ── */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-50 shrink-0" />

        {/* ── Logo ── */}
        <header className="relative flex flex-col items-center justify-center pt-10 pb-10 shrink-0 px-4">
          <Link
            href="/"
            className="font-display text-[1.4rem] font-light tracking-[0.5em] uppercase text-white/90 hover:text-white transition-colors"
          >
            Leather&nbsp;Co.
          </Link>
          {/* Small gold rule under the logo */}
          <div className="mt-3 w-8 h-px bg-[var(--color-accent)] opacity-60" />
        </header>

        {/* ── Form content ── */}
        <main className="relative flex-1 flex items-start justify-center px-4 pb-16">
          <div className="w-full max-w-[420px] mx-auto">{children}</div>
        </main>

        {/* ── Bottom gold accent line ── */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-25 mb-8 shrink-0" />
      </div>
    </GuestOnly>
  );
}
