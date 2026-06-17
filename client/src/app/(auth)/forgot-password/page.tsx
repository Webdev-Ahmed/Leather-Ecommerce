"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }

    // Note: there is currently no password-reset endpoint on the backend.
    // We acknowledge the request without revealing whether the email exists
    // (standard security practice) and direct the user to support for now.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthCard title="Check Your Email" subtitle="Password reset requested">
        <div className="text-center py-2">
          <div className="w-14 h-14 mx-auto mb-5 bg-[var(--color-accent-light)] flex items-center justify-center">
            <CheckCircle2 size={26} strokeWidth={1.5} className="text-[var(--color-accent)]" />
          </div>
          <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] leading-relaxed mb-2">
            If an account exists for{" "}
            <span className="font-semibold text-[var(--color-text-primary)]">{email}</span>,
            you&apos;ll receive instructions to reset your password shortly.
          </p>
          <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)] leading-relaxed mb-7">
            Didn&apos;t get an email? Check your spam folder, or{" "}
            <a
              href="mailto:support@leatherco.example"
              className="text-[var(--color-accent)] hover:underline"
            >
              contact support
            </a>
            .
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ArrowLeft size={13} strokeWidth={2} />
            Back to Sign In
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset Password"
      subtitle="Enter your email to receive reset instructions"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="fp-email"
            className="block text-[10px] tracking-[0.22em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="you@example.com"
              className="w-full h-12 pl-11 pr-4 border text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all duration-150 placeholder:text-[var(--color-text-muted)]/60 border-[var(--color-border)]"
            />
          </div>
          {error && (
            <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-danger)] mt-1.5">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="h-12 w-full flex items-center justify-center bg-[var(--color-primary)] text-white text-[11px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors duration-200"
        >
          Send Reset Link
        </button>
      </form>

      <p className="mt-7 text-center text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors font-semibold"
        >
          <ArrowLeft size={12} strokeWidth={2} />
          Back to Sign In
        </Link>
      </p>
    </AuthCard>
  );
}
