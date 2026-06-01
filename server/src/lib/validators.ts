import { z } from "zod";
import type { Response } from "express";

const slug = z
  .string()
  .min(1, "Slug is required")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase letters, numbers, and hyphens only",
  );

// ─── Category ─────────────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters")
    .trim(),
  slug,
  image: z.url("Image must be a valid URL").optional().default(""),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// ─── Product ──────────────────────────────────────────────────────────────────

const productBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).trim(),
  slug,
  description: z.string().min(1, "Description is required").trim(),
  price: z
    .number({ error: "Price must be a number" })
    .min(0, "Price cannot be negative"),
  discountPrice: z
    .number()
    .min(0, "Discount price cannot be negative")
    .optional(),
  categoryId: z.uuid("Invalid category ID"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  isFeatured: z.boolean().optional().default(false),
  gender: z.enum(["men", "women", "unisex"]).optional().default("unisex"),
  images: z
    .array(z.url("Each image must be a valid URL"))
    .optional()
    .default([]),
  tags: z.array(z.string()).optional().default([]),
});

export const CreateProductSchema = productBaseSchema.refine(
  (data) => data.discountPrice === undefined || data.discountPrice < data.price,
  {
    message: "Discount price must be less than the original price",
    path: ["discountPrice"],
  },
);

export const UpdateProductSchema = productBaseSchema
  .partial()
  .refine(
    (data) =>
      data.discountPrice === undefined ||
      data.price === undefined ||
      data.discountPrice < data.price,
    {
      message: "Discount price must be less than the original price",
      path: ["discountPrice"],
    },
  );

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  search: z.string().max(100).optional(),
  category: z.uuid("Invalid category ID").optional(),
  gender: z.enum(["men", "women", "unisex"]).optional(),
});

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const AddToCartSchema = z.object({
  productId: z.uuid("Invalid product ID"),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .optional()
    .default(1),
});

export const UpdateCartSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

// ─── Validate helper ──────────────────────────────────────────────────────────

export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  res: Response,
): T | null {
  const result = schema.safeParse(data);

  if (!result.success) {
    res.status(422).json({
      status: "error",
      message: "Validation failed",
      errors: result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return null;
  }

  return result.data;
}
