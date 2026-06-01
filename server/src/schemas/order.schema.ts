import { z } from "zod";
import type { Prisma } from "@generated/prisma/client";

export type Order = Prisma.OrderGetPayload<{
  include: {
    items: { include: { product: true } };
    events: true;
  };
}>;

export type OrderItem = Prisma.OrderItemGetPayload<object>;

export type OrderEvent = Prisma.OrderEventGetPayload<object>;

export const ShippingAddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export const OrderItemSchema = z.object({
  productId: z.uuid("Invalid product ID"),
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  image: z.string().default(""),
});

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
  totalAmount: z.number().min(0, "Total amount cannot be negative"),
  paymentMethod: z.enum(["cod", "card", "bank_transfer"]),
  shippingAddress: ShippingAddressSchema,
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  note: z.string().max(500).optional(),
});

export const UpdatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]),
});

export type ShippingAddressInput = z.infer<typeof ShippingAddressSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<
  typeof UpdatePaymentStatusSchema
>;
export type OrderItemInput = z.infer<typeof OrderItemSchema>;
