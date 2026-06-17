import api from "@/lib/axios";
import type { CartProduct, ProductVariant, AppError } from "@/types/api";
import { AxiosError } from "axios";

// ─── Server response types ────────────────────────────────────────────────────
// These mirror the server's `cartItemSelect` shape exactly.

export type ServerCartItem = {
  id: string; // cartItemId on the server (CartItem.id in Prisma)
  quantity: number;
  product: CartProduct;
  variant: ProductVariant | null;
};

export type ServerCart = {
  id?: string;
  items: ServerCartItem[];
};

// ─── Error helper ─────────────────────────────────────────────────────────────

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

// ─── GET /cart ────────────────────────────────────────────────────────────────

export async function fetchServerCart(): Promise<ServerCartItem[]> {
  try {
    const { data } = await api.get<{ status: "ok"; data: ServerCart }>("/cart");
    return data.data.items ?? [];
  } catch (err) {
    throw toAppError(err);
  }
}

// ─── POST /cart ───────────────────────────────────────────────────────────────

export async function addToServerCart(
  productId: string,
  variantId: string | undefined,
  quantity: number,
): Promise<ServerCart> {
  try {
    const { data } = await api.post<{ status: "ok"; data: ServerCart }>("/cart", {
      productId,
      variantId: variantId ?? undefined,
      quantity,
    });
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

// ─── PUT /cart/:cartItemId ────────────────────────────────────────────────────

export async function updateServerCartItem(
  cartItemId: string,
  quantity: number,
): Promise<ServerCart> {
  try {
    const { data } = await api.put<{ status: "ok"; data: ServerCart }>(
      `/cart/${cartItemId}`,
      { quantity },
    );
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

// ─── DELETE /cart/:cartItemId ─────────────────────────────────────────────────

export async function removeFromServerCart(
  cartItemId: string,
): Promise<ServerCart> {
  try {
    const { data } = await api.delete<{ status: "ok"; data: ServerCart }>(
      `/cart/${cartItemId}`,
    );
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

// ─── DELETE /cart ─────────────────────────────────────────────────────────────

export async function clearServerCart(): Promise<void> {
  try {
    await api.delete("/cart");
  } catch (err) {
    throw toAppError(err);
  }
}
