import Image from 'next/image'
import { Instagram } from 'lucide-react'

// Static curated images — replace with real Cloudinary URLs or Instagram API
const POSTS = [
  { id: '1', src: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80', alt: 'Leather bag lifestyle shot' },
  { id: '2', src: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',     alt: 'Leather accessories flat lay' },
  { id: '3', src: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',     alt: 'Premium leather wallet' },
  { id: '4', src: 'https://images.unsplash.com/photo-1614179689702-355944cd0918?w=600&q=80',  alt: 'Leather goods detail' },
  { id: '5', src: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=600&q=80',     alt: 'Leather workshop craftsmanship' },
  { id: '6', src: 'https://images.unsplash.com/photo-1597484662317-c93a7c0b8bb1?w=600&q=80',  alt: 'Leather bag close up' },
] as const

export function InstagramGrid() {
  return (
    <section className="bg-[var(--color-surface-card)] py-20">
      {/* Heading */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center mb-10">
        <p className="text-[10px] tracking-[0.35em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)] mb-3">
          Follow Along
        </p>
        <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-light tracking-[0.12em] uppercase text-[var(--color-text-primary)] mb-4">
          As Seen On Instagram
        </h2>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[12px] font-[var(--font-inter)] text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors group"
        >
          <Instagram size={14} strokeWidth={1.5} />
          @leather_co_official
          <span className="w-0 group-hover:w-3 h-px bg-current transition-all duration-200 overflow-hidden" />
        </a>
      </div>

      {/* Grid — 2 cols mobile, 3 cols tablet, 6 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[2px] sm:gap-1">
        {POSTS.map((post) => (
          <a
            key={post.id}
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden aspect-square"
          >
            <Image
              src={post.src}
              alt={post.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-[var(--color-primary)]/0 group-hover:bg-[var(--color-primary)]/40 transition-colors duration-300 flex items-center justify-center">
              <Instagram
                size={22}
                strokeWidth={1.25}
                className="text-white opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300"
              />
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
