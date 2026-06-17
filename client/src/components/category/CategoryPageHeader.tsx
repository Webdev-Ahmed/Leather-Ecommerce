import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type BreadcrumbItem = {
  label: string
  href?: string
}

type CategoryPageHeaderProps = {
  title: string
  description?: string | null
  breadcrumbs: BreadcrumbItem[]
  productCount?: number
  image?: string | null
}

export function CategoryPageHeader({
  title,
  description,
  breadcrumbs,
  productCount,
  image,
}: CategoryPageHeaderProps) {
  const breadcrumbNav = (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
      {breadcrumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <ChevronRight
              size={11}
              className={image ? "text-white/40" : "text-[var(--color-text-muted)]"}
            />
          )}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className={[
                "text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] transition-colors",
                image
                  ? "text-white/60 hover:text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-accent)]",
              ].join(" ")}
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              className={[
                "text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)]",
                image ? "text-white" : "text-[var(--color-text-primary)]",
              ].join(" ")}
            >
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )

  // ── Image variant — full-bleed hero with overlay text ──
  if (image) {
    return (
      <div className="relative h-[280px] sm:h-[320px] lg:h-[380px] w-full overflow-hidden bg-[var(--color-primary)]">
        <Image
          src={image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

        <div className="relative z-10 h-full max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col justify-end pb-10">
          <div className="mb-4">{breadcrumbNav}</div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-light tracking-[0.15em] uppercase text-white leading-none">
                {title}
              </h1>
              {description && (
                <p className="mt-3 text-sm font-[var(--font-inter)] text-white/70 max-w-xl leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {productCount !== undefined && (
              <p className="text-[11px] tracking-[0.15em] font-[var(--font-inter)] text-white/60 shrink-0">
                {productCount} {productCount === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
          {/* Gold accent rule */}
          <div className="w-12 h-px bg-[var(--color-accent)] mt-6" />
        </div>
      </div>
    )
  }

  // ── Plain variant — no image available ──
  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-card)]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-10 pb-8">
        <div className="mb-6">{breadcrumbNav}</div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-light tracking-[0.15em] uppercase text-[var(--color-text-primary)] leading-none">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-sm font-[var(--font-inter)] text-[var(--color-text-muted)] max-w-xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {productCount !== undefined && (
            <p className="text-[11px] tracking-[0.15em] font-[var(--font-inter)] text-[var(--color-text-muted)] shrink-0">
              {productCount} {productCount === 1 ? 'category' : 'categories'}
            </p>
          )}
        </div>
        {/* Gold accent rule */}
        <div className="w-12 h-px bg-[var(--color-accent)] mt-6" />
      </div>
    </div>
  )
}
