import { z } from "zod";
import type { Prisma } from "@generated/prisma/client";

export type User = Prisma.UserGetPayload<{
  include: { addresses: true };
}>;

export type Address = Prisma.AddressGetPayload<object>;

export const AddressSchema = z.object({
  label: z.string().default("Home"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().default(false),
});

export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  phone: z.string().trim().optional(),
  role: z.enum(["customer", "manager", "admin"]).default("customer"),
  addresses: z.array(AddressSchema).default([]),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type AddressInput = z.infer<typeof AddressSchema>;
