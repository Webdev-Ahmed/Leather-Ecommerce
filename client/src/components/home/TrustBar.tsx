import { Users, Truck, Gift, ArrowRight } from 'lucide-react'

const TRUST_ITEMS = [
  {
    icon: Users,
    stat: '30,000+',
    label: 'Loyal Customers',
    sub: 'Trusted across Pakistan since 2001',
  },
  {
    icon: Truck,
    stat: '3–7 Days',
    label: 'Fast Delivery',
    sub: 'Nationwide shipping, tracked end-to-end',
  },
  {
    icon: Gift,
    stat: 'Always Free',
    label: 'Gift Packing',
    sub: 'Every order, beautifully wrapped',
  },
] as const

export function TrustBar() {
  return (
    <section
      id="trust-bar"
      className="bg-[var(--color-primary)] relative overflow-hidden"
    >
      {/* Subtle gold accent line at top */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-accent)]/40 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {TRUST_ITEMS.map(({ icon: Icon, stat, label, sub }) => (
            <div
              key={label}
              className="group flex items-center gap-4 py-8 sm:py-10 px-2 sm:px-8"
            >
              {/* Icon in a square frame */}
              <div className="shrink-0 w-12 h-12 border border-white/15 flex items-center justify-center group-hover:border-[var(--color-accent)] transition-colors duration-300">
                <Icon
                  size={20}
                  strokeWidth={1.25}
                  className="text-[var(--color-accent)]"
                />
              </div>

              <div className="min-w-0">
                <p className="font-display text-xl sm:text-2xl font-light text-white leading-tight">
                  {stat}
                </p>
                <p className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-white/70 mt-1">
                  {label}
                </p>
                <p className="text-[11px] font-[var(--font-inter)] text-white/35 mt-1 leading-snug hidden md:block">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
