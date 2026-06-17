import Link from 'next/link'
import { Facebook, Instagram } from 'lucide-react'
import { FooterEmailForm } from './FooterEmailForm'

const INFORMATION_LINKS = [
  { label: 'Stores', href: '/stores' },
  { label: 'Track Your Order', href: '/account/orders' },
  { label: 'Refund & Exchange Policy', href: '/refund-policy' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms and Services', href: '/terms' },
] as const

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
] as const

const linkClass =
  'block text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors py-1.5'

const headingClass =
  'text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-primary)] mb-5'

export function Footer() {
  return (
    <footer className="bg-[var(--color-surface-card)] border-t border-[var(--color-border)]">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 py-14">
        {/*
          Mobile:  1 col (stacked)
          sm:      2 col (about + newsletter on top, links below)
          lg:      4 col
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* About */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className={headingClass}>About the Shop</p>
            <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)] leading-relaxed mb-6">
              A discerning clientele can choose from a wide variety of handcrafted
              premium leather products — daily essentials, high-fashion accessories,
              or thoughtful gifts, made in leather worthy of lasting love.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
              >
                <Facebook size={16} strokeWidth={1.5} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
              >
                <Instagram size={16} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Information */}
          <div>
            <p className={headingClass}>Information</p>
            <nav>
              {INFORMATION_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Company */}
          <div>
            <p className={headingClass}>Our Company</p>
            <nav>
              {COMPANY_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <p className={headingClass}>Newsletter</p>
            <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)] leading-relaxed mb-5">
              Subscribe for exclusive offers and new arrivals.
            </p>
            <FooterEmailForm />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--color-border)]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Leather Co. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
