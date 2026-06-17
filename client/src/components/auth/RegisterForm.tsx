"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, User, Mail, Lock, Phone } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { registerUser } from "@/api/auth";
import { AuthCard } from "./AuthCard";
import { AuthDivider } from "./AuthDivider";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { cn } from "@/lib/utils";
import type { AppError } from "@/types/api";

type FieldErrors = Partial<
  Record<"name" | "email" | "password" | "phone", string>
>;

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
    <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-danger)] mt-1.5">
      {message}
    </p>
  );
}

function PasswordStrength({ strength }: { strength: number }) {
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "",
    "bg-red-400",
    "bg-yellow-400",
    "bg-blue-400",
    "bg-green-500",
  ];
  if (strength === 0) return null;
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex gap-1 flex-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-0.5 rounded-full transition-colors duration-300",
              i < strength ? colors[strength] : "bg-[var(--color-border)]",
            )}
          />
        ))}
      </div>
      <span className="text-[10px] font-[var(--font-inter)] text-[var(--color-text-muted)] w-10 text-right">
        {labels[strength]}
      </span>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  function getStrength(p: string): number {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }

  const strength = getStrength(password);

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "At least 8 characters";
    if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone))
      errs.phone = "Enter a valid phone number";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        ...(phone.trim() && { phone: phone.trim() }),
        newsletterOptIn: newsletter,
      });
      login(result.accessToken, result.user);
      router.push(redirect);
    } catch (err: unknown) {
      const appErr = err as AppError;
      if (appErr.errors) {
        const mapped: FieldErrors = {};
        for (const e of appErr.errors) {
          if (
            e.field === "name" ||
            e.field === "email" ||
            e.field === "password" ||
            e.field === "phone"
          )
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
      title="Create Account"
      subtitle="Join and start shopping premium leather"
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
        {/* Name */}
        <div>
          <FieldLabel htmlFor="reg-name">Full Name</FieldLabel>
          <div className="relative">
            <User
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name)
                  setFieldErrors((p) => ({ ...p, name: undefined }));
              }}
              disabled={submitting}
              placeholder="Ahmed Raza"
              className={cn(
                baseInput,
                "pl-11",
                fieldErrors.name
                  ? "border-[var(--color-danger)] bg-red-50/50"
                  : "border-[var(--color-border)]",
              )}
            />
          </div>
          <FieldError message={fieldErrors.name} />
        </div>

        {/* Email */}
        <div>
          <FieldLabel htmlFor="reg-email">Email Address</FieldLabel>
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              id="reg-email"
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
          <FieldLabel htmlFor="reg-password">Password</FieldLabel>
          <div className="relative">
            <Lock
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              disabled={submitting}
              placeholder="Min. 8 characters"
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
          {password.length > 0 && <PasswordStrength strength={strength} />}
        </div>

        {/* Phone — two-col with label inline */}
        <div>
          <FieldLabel htmlFor="reg-phone">
            Phone{" "}
            <span className="normal-case tracking-normal opacity-50 text-[9px] font-normal">
              optional
            </span>
          </FieldLabel>
          <div className="relative">
            <Phone
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone)
                  setFieldErrors((p) => ({ ...p, phone: undefined }));
              }}
              disabled={submitting}
              placeholder="+92 300 0000000"
              className={cn(
                baseInput,
                "pl-11",
                fieldErrors.phone
                  ? "border-[var(--color-danger)] bg-red-50/50"
                  : "border-[var(--color-border)]",
              )}
            />
          </div>
          <FieldError message={fieldErrors.phone} />
        </div>

        {/* Newsletter */}
        <label className="flex items-center gap-3 cursor-pointer py-3 border-t border-[var(--color-border)] -mx-1 px-1">
          <div className="relative shrink-0">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              className="sr-only peer"
              disabled={submitting}
            />
            <div className="w-4 h-4 border border-[var(--color-border)] peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)] transition-colors" />
            {newsletter && (
              <svg
                className="absolute inset-0 w-4 h-4 text-white pointer-events-none"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M3 8l3.5 3.5L13 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
            Send me exclusive offers &amp; new arrivals
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="h-12 w-full flex items-center justify-center bg-[var(--color-primary)] text-white text-[11px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Create Account"
          )}
        </button>

        <p className="text-[10px] font-[var(--font-inter)] text-[var(--color-text-muted)] text-center -mt-1">
          By registering you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-2 hover:text-[var(--color-accent)]"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="underline underline-offset-2 hover:text-[var(--color-accent)]"
          >
            Privacy Policy
          </Link>
        </p>
      </form>

      <p className="mt-7 text-center text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors font-semibold"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
