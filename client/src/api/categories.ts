import api from "@/lib/axios";
import type { AppError, Category } from "@/types/api";
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
 * GET /categories
 * All categories — used by navbar and category listing page.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const { data } = await api.get<{ status: "ok"; data: Category[] }>(
      "/categories",
    );
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

/**
 * GET /categories/:slug
 * Single category by slug.
 */
export async function getCategory(slug: string): Promise<Category> {
  try {
    const { data } = await api.get<{ status: "ok"; data: Category }>(
      `/categories/${slug}`,
    );
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}
