import { z } from "zod";
import type { Prisma } from "@generated/prisma/client";

export type Product = Prisma.ProductGetPayload<object>;

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

const BaseProductSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  slug: z.string().min(1, "Slug is required").toLowerCase().trim(),
  description: z.string().min(1, "Description is required").trim(),
  price: z.number().min(0, "Price cannot be negative"),
  discountPrice: z
    .number()
    .min(0, "Discount price cannot be negative")
    .optional(),
  images: z.array(z.string()).default([]),
  categoryId: z.uuid("Invalid category ID"),
  stock: z.number().int().min(0, "Stock cannot be negative").default(0),
  isFeatured: z.boolean().default(false),
  gender: z.enum(["men", "women", "unisex"]).default("unisex"),
  tags: z.array(z.string()).default([]),
});

export const CreateProductSchema = BaseProductSchema.refine(
  (data) => data.discountPrice === undefined || data.discountPrice < data.price,
  {
    message: "Discount price must be less than the original price",
    path: ["discountPrice"],
  },
);

export const UpdateProductSchema = BaseProductSchema.partial().refine(
  (data) => {
    if (data.price !== undefined && data.discountPrice !== undefined) {
      return data.discountPrice < data.price;
    }

    return true;
  },
  {
    message: "Discount price must be less than the original price",
    path: ["discountPrice"],
  },
);

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
