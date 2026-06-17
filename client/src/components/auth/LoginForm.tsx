"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { loginUser } from "@/api/auth";
import { AuthCard } from "./AuthCard";
import { AuthDivider } from "./AuthDivider";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { cn } from "@/lib/utils";
import type { AppError } from "@/types/api";

type FieldErrors = Partial<Record<"email" | "password", string>>;

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[10px] tracking-[0.22em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] mb-2"
    >
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-danger)] mt-1.5 flex items-center gap-1">
      <span className="inline-block w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px] shrink-0">!</span>
      {message}
    </p>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const redirect = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await loginUser({ email: email.trim(), password });
      login(result.accessToken, result.user);
      router.push(redirect);
    } catch (err: unknown) {
      const appErr = err as AppError;
      if (appErr.errors) {
        const mapped: FieldErrors = {};
        for (const e of appErr.errors) {
          if (e.field === "email" || e.field === "password")
            mapped[e.field] = e.message;
        }
        setFieldErrors(mapped);
      } else {
        setGlobalError(appErr.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const baseInput =
    "w-full h-12 px-4 border text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all duration-150 placeholder:text-[var(--color-text-muted)]/60";

  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to continue shopping"
    >
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <>
          <GoogleSignInButton
            redirect={redirect}
            onStart={() => setSubmitting(true)}
            onEnd={() => setSubmitting(false)}
          />
          <AuthDivider />
        </>
      )}

      {globalError && (
        <div
          role="alert"
          className="mb-5 px-4 py-3 bg-red-50 border-l-2 border-[var(--color-danger)] text-[var(--color-danger)] text-[13px] font-[var(--font-inter)]"
        >
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Email */}
        <div>
          <FieldLabel htmlFor="login-email">Email Address</FieldLabel>
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email)
                  setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              disabled={submitting}
              placeholder="you@example.com"
              className={cn(
                baseInput,
                "pl-11",
                fieldErrors.email
                  ? "border-[var(--color-danger)] bg-red-50/50"
                  : "border-[var(--color-border)]",
              )}
            />
          </div>
          <FieldError message={fieldErrors.email} />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-[10px] font-[var(--font-inter)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors -mt-0.5"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              disabled={submitting}
              placeholder="••••••••"
              className={cn(
                baseInput,
                "pl-11 pr-12",
                fieldErrors.password
                  ? "border-[var(--color-danger)] bg-red-50/50"
                  : "border-[var(--color-border)]",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <FieldError message={fieldErrors.password} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 h-12 w-full flex items-center justify-center bg-[var(--color-primary)] text-white text-[11px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors font-semibold"
        >
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
