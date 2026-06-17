import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

// Snapshot of the shipping address stored on the order at checkout time.
// This is intentionally separate from the Address model — the user's saved
// address can change later but the order must preserve what it was at purchase.
const ShippingAddressSchema = z.object({
  label: z.string().min(1).max(50).trim().optional(),
  street: z.string().min(1, "Street is required").max(200).trim(),
  city: z.string().min(1, "City is required").max(100).trim(),
  state: z.string().min(1, "State is required").max(100).trim(),
  postalCode: z.string().min(1, "Postal code is required").max(20).trim(),
  country: z.string().min(1, "Country is required").max(100).trim(),
});

// ─── Create order ─────────────────────────────────────────────────────────────

export const CreateOrderSchema = z
  .object({
    paymentMethod: z.enum(["cod", "payfast", "jazzcash", "easypaisa"], {
      error: 'Payment method must be "cod", "payfast", "jazzcash", or "easypaisa"',
    }),
    // Optionally pass a saved address ID to pre-fill the snapshot.
    // If both are provided, addressId is used to fetch the address and
    // shippingAddress is ignored. If neither, the controller returns 422.
    addressId: z.uuid("Invalid address ID").optional(),
    shippingAddress: ShippingAddressSchema.optional(),
  })
  .refine(
    (data) =>
      data.addressId !== undefined || data.shippingAddress !== undefined,
    { message: "Either addressId or shippingAddress is required" },
  );

// ─── Admin: update order status ───────────────────────────────────────────────

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(
    ["pending", "processing", "shipped", "delivered", "cancelled"],
    {
      error: "Invalid order status",
    },
  ),
  trackingNumber: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500).optional(),
});

// ─── Order list query ─────────────────────────────────────────────────────────

export const OrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: z
    .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  userId: z.uuid("Invalid user ID").optional(), // admin-only filter
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof OrderQuerySchema>;
export type ShippingAddressInput = z.infer<typeof ShippingAddressSchema>;
