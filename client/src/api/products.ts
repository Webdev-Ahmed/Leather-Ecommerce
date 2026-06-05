import api from '@/lib/axios'
import type { AppError, PaginatedResponse, Product, ProductsQuery } from '@/types/api'
import { AxiosError } from 'axios'

function toAppError(err: unknown): AppError {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as { message?: string; errors?: AppError['errors'] }
    return {
      message: data.message ?? 'An unexpected error occurred.',
      errors: data.errors,
      statusCode: err.response.status,
    }
  }
  return { message: 'Could not connect to server. Please try again.' }
}

/**
 * GET /products
 * Paginated product listing with optional filters.
 */
export async function getProducts(
  query: ProductsQuery = {}
): Promise<PaginatedResponse<Product>> {
  try {
    const { data } = await api.get<PaginatedResponse<Product>>('/products', {
      params: query,
    })
    return data
  } catch (err) {
    throw toAppError(err)
  }
}

/**
 * GET /products/:slug
 * Single product detail by slug.
 */
export async function getProduct(slug: string): Promise<Product> {
  try {
    const { data } = await api.get<{ status: 'success'; data: Product }>(
      `/products/${slug}`
    )
    return data.data
  } catch (err) {
    throw toAppError(err)
  }
}
