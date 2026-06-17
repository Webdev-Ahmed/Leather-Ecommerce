import api from "@/lib/axios";
import type {
  Address,
  AppError,
  CreateAddressInput,
  UpdateAddressInput,
} from "@/types/api";
import { AxiosError } from "axios";

function toAppError(err: unknown): AppError {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as {
      message?: string;
      errors?: AppError["errors"];
    };
    return {
      message: data.message ?? "An unexpected error occurred.",
      errors: data.errors,
      statusCode: err.response.status,
    };
  }
  return { message: "Could not connect to server. Please try again." };
}

/**
 * GET /addresses
 * List all saved addresses for the current user.
 */
export async function getAddresses(): Promise<Address[]> {
  try {
    const { data } = await api.get<{ status: "ok"; data: Address[] }>(
      "/addresses",
    );
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

/**
 * POST /addresses
 * Add a new address.
 */
export async function createAddress(
  input: CreateAddressInput,
): Promise<Address> {
  try {
    const { data } = await api.post<{ status: "ok"; data: Address }>(
      "/addresses",
      input,
    );
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

/**
 * PUT /addresses/:id
 * Update an existing address.
 */
export async function updateAddress(
  id: string,
  input: UpdateAddressInput,
): Promise<Address> {
  try {
    const { data } = await api.put<{ status: "ok"; data: Address }>(
      `/addresses/${id}`,
      input,
    );
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

/**
 * DELETE /addresses/:id
 * Delete an address.
 */
export async function deleteAddress(id: string): Promise<void> {
  try {
    await api.delete(`/addresses/${id}`);
  } catch (err) {
    throw toAppError(err);
  }
}

/**
 * PATCH /addresses/:id/default
 * Set an address as the default.
 */
export async function setDefaultAddress(id: string): Promise<Address> {
  try {
    const { data } = await api.patch<{ status: "ok"; data: Address }>(
      `/addresses/${id}/default`,
    );
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}
