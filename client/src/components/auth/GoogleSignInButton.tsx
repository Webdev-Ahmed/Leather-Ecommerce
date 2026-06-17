"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { googleAuth } from "@/api/auth";
import toast from "react-hot-toast";

// Extend window to include the Google Identity Services script globals
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

type GoogleSignInButtonProps = {
  redirect?: string;
  onStart?: () => void;
  onEnd?: () => void;
};

export function GoogleSignInButton({
  redirect,
  onStart,
  onEnd,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      onStart?.();
      try {
        const result = await googleAuth({ idToken: response.credential });
        login(result.accessToken, result.user);
        toast.success(`Welcome, ${result.user.name}`);
        router.push(redirect ?? "/");
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Google sign-in failed. Please try again.";
        toast.error(message);
      } finally {
        onEnd?.();
      }
    },
    [login, router, redirect, onStart, onEnd],
  );

  // Load the Google Identity Services script once
  useEffect(() => {
    if (window.google) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
  }, []);

  // Initialise + render the button once the script is ready
  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.google) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    });

    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: containerRef.current.offsetWidth,
      text: "continue_with",
    });
  }, [scriptReady, handleCredential]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="w-full">
      {/* Google renders its own button into this div */}
      <div
        ref={containerRef}
        className="w-full flex justify-center"
        aria-label="Sign in with Google"
      />
    </div>
  );
}
