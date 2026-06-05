import { z } from "zod";

// ─── Variant ──────────────────────────────────────────────────────────────────

const variantSchema = z.object({
  color: z.string().trim().max(50).optional(),
  colorHex: z
    .string()
    .trim()
    .regex(
      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
      "colorHex must be a valid hex colour e.g. #1A1A1A",
    )
    .optional(),
  size: z.string().trim().max(50).optional(),
  sku: z.string().trim().max(100).optional(),
  stock: z.number().int().min(0, "Stock cannot be negative").default(0),
  priceOverride: z
    .number()
    .min(0, "Price override cannot be negative")
    .optional(),
  images: z
    .array(z.url("Each image must be a valid URL"))
    .optional()
    .default([]),
});

// At least one of color or size must be provided — a variant with neither is meaningless
export const CreateVariantSchema = variantSchema.refine(
  (d) => d.color !== undefined || d.size !== undefined,
  { message: "A variant must have at least a color or a size" },
);

export const UpdateVariantSchema = variantSchema.partial();

// ─── Product ──────────────────────────────────────────────────────────────────

const slug = z
  .string()
  .min(1, "Slug is required")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase letters, numbers, and hyphens only",
  );

const productBase = z.object({
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
  stock: z.number().int().min(0, "Stock cannot be negative").default(0),
  isFeatured: z.boolean().optional().default(false),
  gender: z.enum(["men", "women", "unisex"]).optional().default("unisex"),
  images: z
    .array(z.url("Each image must be a valid URL"))
    .optional()
    .default([]),
  tags: z.array(z.string()).optional().default([]),
  variants: z.array(CreateVariantSchema).optional().default([]),
});

export const CreateProductSchema = productBase.refine(
  (d) => d.discountPrice === undefined || d.discountPrice < d.price,
  {
    message: "Discount price must be less than the original price",
    path: ["discountPrice"],
  },
);

export const UpdateProductSchema = productBase
  .omit({ variants: true })
  .partial()
  .extend({
    // On update, variants carry an optional id so existing rows are updated
    // rather than deleted and recreated (preserves cart items referencing them)
    variants: z
      .array(
        variantSchema
          .extend({ id: z.uuid().optional() })
          .refine((d) => d.color !== undefined || d.size !== undefined, {
            message: "A variant must have at least a color or a size",
          }),
      )
      .optional(),
  })
  .refine(
    (d) =>
      d.discountPrice === undefined ||
      d.price === undefined ||
      d.discountPrice < d.price,
    {
      message: "Discount price must be less than the original price",
      path: ["discountPrice"],
    },
  );

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;
