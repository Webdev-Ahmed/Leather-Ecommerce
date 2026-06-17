"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { subscribeToNewsletter } from "@/api/newsletter";

export function FooterEmailForm() {
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
    <form onSubmit={handleSubmit} className="flex gap-0 w-full">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        required
        disabled={submitting}
        className="flex-1 min-w-0 h-10 border border-[var(--color-border)] bg-transparent text-[12px] font-[var(--font-inter)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] px-3 focus:outline-none focus:border-[var(--color-accent)] transition-colors disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={submitting}
        className="h-10 px-4 bg-[var(--color-accent)] text-white text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-medium hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50"
      >
        {submitting ? (
          <span className="inline-block w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          "Subscribe"
        )}
      </button>
    </form>
  );
}
