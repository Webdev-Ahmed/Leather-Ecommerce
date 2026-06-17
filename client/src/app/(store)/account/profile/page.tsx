"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Mail, Phone, Shield, Chrome, User } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { getMe, updateProfile } from "@/api/auth";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { cn } from "@/lib/utils";
import type { UpdateProfileInput } from "@/types/api";

type FormValues = {
  name: string;
  phone: string;
  newsletterOptIn: boolean;
};

const inputClass =
  "w-full h-11 px-4 border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all placeholder:text-[var(--color-text-muted)]/60";

const labelClass =
  "block text-[10px] tracking-[0.22em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] mb-2";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 1000 * 60 * 5,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: { name: "", phone: "", newsletterOptIn: false },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        phone: user.phone ?? "",
        newsletterOptIn: user.newsletterOptIn,
      });
    }
  }, [user, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setUser(updated);
      toast.success("Profile updated");
      reset({
        name: updated.name,
        phone: updated.phone ?? "",
        newsletterOptIn: updated.newsletterOptIn,
      });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message ?? "Could not update profile.");
    },
  });

  function onSubmit(values: FormValues) {
    save({
      name: values.name,
      phone: values.phone.trim() || undefined,
      newsletterOptIn: values.newsletterOptIn,
    });
  }

  if (isLoading || !user) {
    return (
      <div className="max-w-2xl animate-pulse space-y-5">
        <div className="h-6 w-40 bg-[var(--color-border)]" />
        <div className="bg-white border border-[var(--color-border)] p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[var(--color-border)] shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-36 bg-[var(--color-border)]" />
            <div className="h-3 w-52 bg-[var(--color-border)]" />
          </div>
        </div>
        <div className="bg-white border border-[var(--color-border)] p-6 space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 bg-[var(--color-border)]" />
              <div className="h-11 bg-[var(--color-border)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasGoogle = user.linkedProviders?.includes("google") ?? false;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="font-display text-3xl font-light text-[var(--color-primary)]">
          My Profile
        </h1>
        <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-1">
          Manage your personal information
        </p>
      </div>

      {/* ── Profile card ── */}
      <div className="bg-white border border-[var(--color-border)] overflow-hidden">
        {/* Dark header strip */}
        <div className="h-12 bg-[var(--color-primary)]" />
        <div className="px-6 pb-6">
          {/* Avatar — pulled up to overlap the strip */}
          <div className="-mt-8 mb-4 flex items-end gap-4">
            <div className="ring-4 ring-white">
              {user.avatarUrl ? (
                <div className="relative w-16 h-16 overflow-hidden">
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <InitialsAvatar name={user.name} size={64} />
              )}
            </div>
            <div className="mb-1 flex flex-wrap gap-1.5">
              {user.hasPassword && (
                <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.12em] uppercase font-[var(--font-inter)] font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] px-2 py-0.5">
                  <Shield size={8} strokeWidth={2} />
                  Password
                </span>
              )}
              {hasGoogle && (
                <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.12em] uppercase font-[var(--font-inter)] font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] px-2 py-0.5">
                  <Chrome size={8} strokeWidth={2} />
                  Google
                </span>
              )}
            </div>
          </div>

          <h2 className="font-display text-2xl font-light text-[var(--color-primary)] leading-tight">
            {user.name}
          </h2>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            <span className="flex items-center gap-1.5 text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
              <Mail size={11} strokeWidth={1.5} />
              {user.email}
            </span>
            {user.phone && (
              <span className="flex items-center gap-1.5 text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
                <Phone size={11} strokeWidth={1.5} />
                {user.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit form ── */}
      <div className="bg-white border border-[var(--color-border)] p-6">
        <div className="flex items-center gap-2 mb-6 pb-5 border-b border-[var(--color-border)]">
          <User size={14} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
          <h2 className="text-[11px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)]">
            Edit Profile
          </h2>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          <div>
            <label htmlFor="pf-name" className={labelClass}>
              Full Name
            </label>
            <input
              id="pf-name"
              type="text"
              autoComplete="name"
              {...register("name", { required: "Name is required" })}
              className={cn(
                inputClass,
                errors.name && "border-[var(--color-danger)] bg-red-50/50",
              )}
            />
            {errors.name && (
              <p className="text-[11px] text-[var(--color-danger)] mt-1.5">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pf-phone" className={labelClass}>
              Phone{" "}
              <span className="normal-case tracking-normal text-[9px] opacity-50 font-normal">
                optional
              </span>
            </label>
            <input
              id="pf-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+92 300 0000000"
              {...register("phone")}
              className={inputClass}
            />
          </div>

          {/* Newsletter toggle */}
          <label className="flex items-start gap-3 cursor-pointer py-4 border-t border-[var(--color-border)] group">
            <input
              type="checkbox"
              {...register("newsletterOptIn")}
              className="mt-0.5 accent-[var(--color-primary)] w-4 h-4 shrink-0 cursor-pointer"
            />
            <div>
              <p className={cn(labelClass, "mb-0.5 group-hover:text-[var(--color-primary)] transition-colors")}>
                Newsletter
              </p>
              <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
                Receive updates on new collections and exclusive offers.
              </p>
            </div>
          </label>

          <div className="flex items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={isPending || !isDirty}
              className={cn(
                "h-11 px-8 text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold transition-all duration-150",
                isPending || !isDirty
                  ? "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
                  : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-accent)]",
              )}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Saving…
                </span>
              ) : "Save Changes"}
            </button>
            {isDirty && !isPending && (
              <button
                type="button"
                onClick={() => reset()}
                className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors underline underline-offset-2"
              >
                Discard
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
