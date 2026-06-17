import { z } from "zod";

// ─── Create review ────────────────────────────────────────────────────────────

export const CreateReviewSchema = z.object({
  body: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(2000, "Review must be under 2000 characters")
    .trim(),
});

// ─── Update review ────────────────────────────────────────────────────────────

export const UpdateReviewSchema = CreateReviewSchema;

// ─── Review list query ────────────────────────────────────────────────────────

export const ReviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type ReviewQueryInput = z.infer<typeof ReviewQuerySchema>;
