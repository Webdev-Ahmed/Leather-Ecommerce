import { z } from "zod";
import type { Prisma } from "@generated/prisma/client";

export type Cart = Prisma.CartGetPayload<{
  include: { items: { include: { product: true } } };
}>;

export type CartItem = Prisma.CartItemGetPayload<{
  include: { product: true };
}>;

export const CartItemSchema = z.object({
  productId: z.uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export type CartItemInput = z.infer<typeof CartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
