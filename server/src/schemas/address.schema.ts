import { z } from "zod";

const addressBase = z.object({
  label: z.string().trim().max(50).optional().default("Home"),
  street: z.string().min(1, "Street is required").max(200).trim(),
  city: z.string().min(1, "City is required").max(100).trim(),
  state: z.string().min(1, "State is required").max(100).trim(),
  postalCode: z.string().min(1, "Postal code is required").max(20).trim(),
  country: z.string().min(1, "Country is required").max(100).trim(),
  isDefault: z.boolean().optional().default(false),
});

export const CreateAddressSchema = addressBase;

export const UpdateAddressSchema = addressBase.partial();

export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;
