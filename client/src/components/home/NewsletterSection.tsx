"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { subscribeToNewsletter } from "@/api/newsletter";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const message = await subscribeToNewsletter(trimmed);
      toast.success(message);
      setEmail("");
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : "Subscription failed. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-[var(--color-primary)] py-20">
      {/* px on the section caused the inner form to miscalculate width —
          move padding inside the constrained container instead */}
      <div className="max-w-xl mx-auto px-5 sm:px-6 text-center">
        <p className="text-white/50 text-[10px] tracking-[0.35em] uppercase font-[var(--font-inter)] mb-4">
          Newsletter
        </p>
        <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-light tracking-[0.12em] uppercase text-white mb-3">
          Stay in the Loop
        </h2>
        <p className="text-white/60 text-sm font-[var(--font-inter)] font-light mb-10 leading-relaxed">
          Subscribe to receive exclusive offers, new arrivals, and more.
        </p>

        {/* Stack vertically on mobile, side-by-side from sm up */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-0 w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            disabled={submitting}
            className="w-full sm:flex-1 min-w-0 h-12 bg-transparent border border-white/30 text-white text-sm font-[var(--font-inter)] placeholder:text-white/30 px-4 focus:outline-none focus:border-white/70 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto h-12 px-7 bg-[var(--color-accent)] text-white text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Subscribe
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
