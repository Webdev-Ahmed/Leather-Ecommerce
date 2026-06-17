'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Clock, TrendingUp, ArrowRight, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type SearchOverlayProps = {
  isOpen: boolean
  onClose: () => void
}

const TRENDING = [
  "Leather Wallet",
  "Crossbody Bag",
  "Card Holder",
  "Leather Belt",
  "Tote Bag",
  "Bifold Wallet",
] as const

const QUICK_LINKS = [
  { label: "New Arrivals",   href: "/products?sort=newest"    },
  { label: "Best Sellers",   href: "/products?sort=popular"   },
  { label: "All Categories", href: "/categories"              },
] as const

const RECENT_KEY = "lc_recent_searches"
const MAX_RECENT = 5

function getRecent(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") } catch { return [] }
}

function saveRecent(query: string) {
  const prev = getRecent().filter((q) => q.toLowerCase() !== query.toLowerCase())
  localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENT)))
}

function clearRecent() {
  localStorage.removeItem(RECENT_KEY)
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router   = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query,   setQuery]   = useState("")
  const [recent,  setRecent]  = useState<string[]>([])
  const [focused, setFocused] = useState(-1) // keyboard nav index

  // Collect recent searches when overlay opens
  useEffect(() => {
    if (isOpen) {
      setRecent(getRecent())
      setQuery("")
      setFocused(-1)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const submit = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    saveRecent(trimmed)
    router.push(`/products?search=${encodeURIComponent(trimmed)}`)
    onClose()
  }, [router, onClose])

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit(query)
  }

  function handleSuggestionClick(q: string) {
    setQuery(q)
    submit(q)
  }

  function handleClearRecent() {
    clearRecent()
    setRecent([])
  }

  // Keyboard navigation through suggestions
  const suggestions = query.trim()
    ? TRENDING.filter((t) => t.toLowerCase().includes(query.toLowerCase()))
    : []

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setFocused((f) => Math.min(f + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFocused((f) => Math.max(f - 1, -1))
    } else if (e.key === "Enter" && focused >= 0 && suggestions[focused]) {
      e.preventDefault()
      handleSuggestionClick(suggestions[focused])
    }
  }

  const showSuggestions = query.trim().length > 0 && suggestions.length > 0
  const showRecent      = !query.trim() && recent.length > 0
  const showTrending    = !query.trim()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel — drops from top */}
          <motion.div
            key="search-panel"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-[310] bg-white shadow-[0_16px_48px_-8px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold accent line */}
            <div className="h-[2px] bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent)]/50 to-transparent" />

            <div className="max-w-[800px] mx-auto px-6 lg:px-8">
              {/* Search input row */}
              <form onSubmit={handleFormSubmit} className="flex items-center gap-4 py-5 border-b border-[var(--color-border)]">
                <Search
                  size={18}
                  strokeWidth={1.5}
                  className="text-[var(--color-text-muted)] shrink-0"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setFocused(-1) }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products, categories…"
                  autoComplete="off"
                  className="flex-1 min-w-0 bg-transparent text-[var(--color-text-primary)] text-[1.05rem] font-[var(--font-inter)] font-light placeholder:text-[var(--color-text-muted)]/50 outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setFocused(-1); inputRef.current?.focus() }}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
                    aria-label="Clear"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors shrink-0 ml-1"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </form>

              {/* Body */}
              <div className="py-6">
                <AnimatePresence mode="wait">
                  {/* ── Live suggestions while typing ── */}
                  {showSuggestions && (
                    <motion.div
                      key="suggestions"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      <p className="text-[9px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-text-muted)] mb-3">
                        Suggestions
                      </p>
                      <div className="space-y-0.5">
                        {suggestions.map((s, i) => (
                          <button
                            key={s}
                            onClick={() => handleSuggestionClick(s)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors group",
                              focused === i
                                ? "bg-[var(--color-accent-light)]"
                                : "hover:bg-[var(--color-surface)]",
                            )}
                          >
                            <Search size={12} strokeWidth={1.5} className="text-[var(--color-text-muted)] shrink-0" />
                            <span className="flex-1 text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)]">
                              {/* Bold the matching part */}
                              {s.split(new RegExp(`(${query})`, "gi")).map((part, j) =>
                                part.toLowerCase() === query.toLowerCase()
                                  ? <strong key={j} className="text-[var(--color-primary)] font-semibold">{part}</strong>
                                  : part
                              )}
                            </span>
                            <ArrowUpRight size={12} className="text-[var(--color-border)] group-hover:text-[var(--color-accent)] transition-colors shrink-0" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Default state: recent + trending + quick links ── */}
                  {!showSuggestions && (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8"
                    >
                      <div className="space-y-6">
                        {/* Recent searches */}
                        {showRecent && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[9px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-text-muted)]">
                                Recent
                              </p>
                              <button
                                onClick={handleClearRecent}
                                className="text-[9px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                              >
                                Clear
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {recent.map((r) => (
                                <button
                                  key={r}
                                  onClick={() => handleSuggestionClick(r)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-border)] text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors group"
                                >
                                  <Clock size={10} className="shrink-0" />
                                  {r}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trending */}
                        {showTrending && (
                          <div>
                            <p className="text-[9px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-text-muted)] mb-3">
                              Trending
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {TRENDING.map((t, i) => (
                                <button
                                  key={t}
                                  onClick={() => handleSuggestionClick(t)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-[var(--font-inter)] text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors group"
                                >
                                  <TrendingUp
                                    size={9}
                                    className="text-[var(--color-accent)] shrink-0"
                                  />
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick links — vertical divider on md+ */}
                      <div className="md:border-l md:border-[var(--color-border)] md:pl-8 md:min-w-[180px]">
                        <p className="text-[9px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-text-muted)] mb-3">
                          Quick Links
                        </p>
                        <div className="space-y-1">
                          {QUICK_LINKS.map(({ label, href }) => (
                            <Link
                              key={href}
                              href={href}
                              onClick={onClose}
                              className="group flex items-center justify-between py-2 text-[12px] font-[var(--font-inter)] text-[var(--color-text-body)] hover:text-[var(--color-accent)] transition-colors"
                            >
                              {label}
                              <ArrowRight
                                size={12}
                                strokeWidth={2}
                                className="text-[var(--color-border)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all"
                              />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
