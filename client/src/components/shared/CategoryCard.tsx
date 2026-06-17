import Image from 'next/image'
import Link from 'next/link'
import type { Category } from '@/types/api'

type CategoryCardProps = {
  category: Category
  priority?: boolean
}

export function CategoryCard({ category, priority = false }: CategoryCardProps) {
  const image = category.image ?? '/images/placeholder.jpg'

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative block overflow-hidden bg-[var(--color-primary)]"
    >
      {/* Full-bleed image */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image
          src={image}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AKwAB/9k="
          priority={priority}
        />
        {/* Gradient overlay — darkens toward bottom where text lives */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Text + CTA — bottom-left, matching HUB reference */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="text-white text-sm tracking-[0.25em] uppercase font-[var(--font-inter)] font-medium mb-4">
          {category.name}
        </h3>
        <span className="inline-flex items-center border border-white text-white text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] px-4 py-2.5 group-hover:bg-white group-hover:text-[var(--color-primary)] transition-colors duration-200">
          VIEW PRODUCTS
        </span>
      </div>
    </Link>
  )
}
