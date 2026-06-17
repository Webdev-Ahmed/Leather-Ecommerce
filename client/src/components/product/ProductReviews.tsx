"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { MessageSquare, Pencil, Trash2, User, Loader2, ChevronDown } from "lucide-react";
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  type Review,
} from "@/api/reviews";
import { useAuthStore } from "@/store/auth-store";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AppError } from "@/types/api";

// ─── Initials avatar ──────────────────────────────────────────────────────────

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0 font-[var(--font-inter)] font-semibold select-none"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ─── Review form ──────────────────────────────────────────────────────────────

function ReviewForm({
  slug,
  existingReview,
  onDone,
}: {
  slug: string;
  existingReview?: Review;
  onDone: () => void;
}) {
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<{ body: string }>({
    defaultValues: { body: existingReview?.body ?? "" },
  });

  const body = watch("body", existingReview?.body ?? "");
  const isEdit = !!existingReview;

  const mutation = useMutation<Review, AppError, { body: string }>({
    mutationFn: (data) =>
      isEdit
        ? updateReview(slug, existingReview!.id, data)
        : createReview(slug, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", slug] });
      toast.success(isEdit ? "Review updated." : "Review posted!");
      onDone();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to submit review.");
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <div className="relative">
          <textarea
            {...register("body", {
              required: "Review text is required",
              minLength: { value: 10, message: "At least 10 characters" },
              maxLength: { value: 2000, message: "Max 2000 characters" },
            })}
            rows={4}
            placeholder="Share your experience with this product…"
            className={cn(
              "w-full resize-none border text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] bg-[var(--color-surface)] px-4 py-3 focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all placeholder:text-[var(--color-text-muted)]/60",
              errors.body
                ? "border-[var(--color-danger)]"
                : "border-[var(--color-border)]",
            )}
          />
          <span className="absolute bottom-2.5 right-3 text-[10px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
            {body.length}/2000
          </span>
        </div>
        {errors.body && (
          <p className="mt-1.5 text-[11px] font-[var(--font-inter)] text-[var(--color-danger)]">
            {errors.body.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-10 px-6 bg-[var(--color-primary)] text-white text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {mutation.isPending ? (
            <><Loader2 size={13} className="animate-spin" /> Submitting…</>
          ) : isEdit ? "Update Review" : "Post Review"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-10 px-5 border border-[var(--color-border)] text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Single review card ───────────────────────────────────────────────────────

function ReviewCard({
  review,
  slug,
  currentUserId,
}: {
  review: Review;
  slug: string;
  currentUserId?: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const isOwn = currentUserId === review.user.id;

  const deleteMutation = useMutation({
    mutationFn: () => deleteReview(slug, review.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", slug] });
      toast.success("Review deleted.");
    },
    onError: () => toast.error("Failed to delete review."),
  });

  function handleDelete() {
    if (window.confirm("Delete this review?")) deleteMutation.mutate();
  }

  if (editing) {
    return (
      <div className="py-5 border-b border-[var(--color-border)]">
        <ReviewForm slug={slug} existingReview={review} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="py-5 border-b border-[var(--color-border)] last:border-0">
      <div className="flex items-start gap-3.5">
        <Avatar name={review.user.name} size={34} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-[var(--font-inter)] font-semibold text-[var(--color-text-primary)]">
                {review.user.name}
              </p>
              <p className="text-[10px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-0.5">
                {formatDate(review.createdAt)}
                {review.updatedAt !== review.createdAt && " (edited)"}
              </p>
            </div>
            {isOwn && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditing(true)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                  aria-label="Edit review"
                >
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors disabled:opacity-40"
                  aria-label="Delete review"
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
          <p className="mt-3 text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] leading-relaxed whitespace-pre-wrap">
            {review.body}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

export function ProductReviews({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { isAuthenticated } = useAuth();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", slug, page],
    queryFn: () => getReviews(slug, page, PAGE_SIZE),
    staleTime: 30_000,
  });

  const reviews = data?.data ?? [];
  const total   = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  // Has the logged-in user already left a review on this page?
  const myReview = reviews.find((r) => r.user.id === user?.id);

  return (
    <div className="border-t border-[var(--color-border)] pt-12 mt-12">
      {/* Heading */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare size={16} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
          <h2 className="font-display text-2xl font-light text-[var(--color-primary)]">
            Customer Reviews
          </h2>
          {total > 0 && (
            <span className="text-[11px] tracking-[0.1em] font-[var(--font-inter)] text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2.5 py-0.5">
              {total}
            </span>
          )}
        </div>

        {isAuthenticated && !myReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="h-9 px-5 bg-[var(--color-primary)] text-white text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors flex items-center gap-2"
          >
            <Pencil size={11} strokeWidth={2} /> Write a Review
          </button>
        )}

        {!isAuthenticated && (
          <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
            <a href="/login" className="text-[var(--color-accent)] hover:underline">Sign in</a> to leave a review
          </p>
        )}
      </div>

      {/* Write form */}
      {showForm && (
        <div className="mb-8 bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
          <p className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
            <Pencil size={10} /> Your Review
          </p>
          <ReviewForm
            slug={slug}
            onDone={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3.5 py-5 border-b border-[var(--color-border)] animate-pulse">
              <div className="w-8 h-8 bg-[var(--color-border)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 bg-[var(--color-border)]" />
                <div className="h-3 w-20 bg-[var(--color-border)]" />
                <div className="h-12 bg-[var(--color-border)] mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && reviews.length === 0 && (
        <div className="text-center py-12 border border-[var(--color-border)]">
          <User size={28} strokeWidth={1} className="mx-auto text-[var(--color-border)] mb-4" />
          <p className="font-display text-xl font-light text-[var(--color-text-primary)] mb-1">
            No reviews yet
          </p>
          <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
            Be the first to share your experience.
          </p>
        </div>
      )}

      {/* Review cards */}
      {!isLoading && reviews.length > 0 && (
        <div>
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              slug={slug}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-9 px-5 border border-[var(--color-border)] text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="h-9 px-5 border border-[var(--color-border)] text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
