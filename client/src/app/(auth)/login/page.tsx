import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your account to access your orders and account details.",
};

// LoginForm uses useSearchParams() for ?redirect= — must be inside Suspense
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
