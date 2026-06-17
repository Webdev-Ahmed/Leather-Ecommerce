"use client";

import { Toaster, ToastBar, toast } from "react-hot-toast";
import { X } from "lucide-react";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--color-primary)",
          color: "var(--color-primary-foreground)",
          fontFamily: "var(--font-inter)",
          fontSize: "13px",
          fontWeight: "500",
          letterSpacing: "0.02em",
          borderRadius: "0px",
          border: "1px solid rgba(184, 150, 12, 0.25)",
          padding: "14px 14px 14px 18px",
          boxShadow: "0 12px 32px -8px rgba(0,0,0,0.35)",
        },
        success: {
          iconTheme: {
            primary: "var(--color-accent)",
            secondary: "var(--color-primary)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--color-danger)",
            secondary: "var(--color-primary)",
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div className="flex items-center gap-3 w-full">
              {icon}
              <div className="flex-1 text-left">{message}</div>
              {/* Close button — only for persistent toasts, not loading spinners */}
              {t.type !== "loading" && (
                <button
                  onClick={() => toast.dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 text-white/40 hover:text-white transition-colors -mr-1"
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
