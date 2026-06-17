import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full">
      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl font-light tracking-[0.2em] uppercase text-white">
          {title}
        </h1>
        <p className="mt-2.5 text-[13px] font-[var(--font-inter)] tracking-[0.05em] text-white/45">
          {subtitle}
        </p>
      </div>

      {/* Card */}
      <div className="w-full bg-white px-8 py-9 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
        {children}
      </div>
    </div>
  );
}
