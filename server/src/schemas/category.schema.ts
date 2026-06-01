import { z } from "zod";
import type { Prisma } from "@generated/prisma/client";

export type Category = Prisma.CategoryGetPayload<object>;

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  slug: z.string().min(1, "Slug is required").toLowerCase().trim(),
  image: z.string().default(""),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
