import api from '@/lib/axios'
import type {
  AppError,
  CreateOrderInput,
  Order,
  PaginatedResponse,
} from '@/types/api'
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
 * POST /orders
 * Places an order from cart items.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  try {
    const { data } = await api.post<{ status: 'success'; data: Order }>(
      '/orders',
      input
    )
    return data.data
  } catch (err) {
    throw toAppError(err)
  }
}

/**
 * GET /orders
 * Customer's own paginated order history.
 */
export async function getOrders(
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Order>> {
  try {
    const { data } = await api.get<PaginatedResponse<Order>>('/orders', {
      params: { page, limit },
    })
    return data
  } catch (err) {
    throw toAppError(err)
  }
}

/**
 * GET /orders/:id
 * Single order detail including items and events timeline.
 */
export async function getOrder(id: string): Promise<Order> {
  try {
    const { data } = await api.get<{ status: 'success'; data: Order }>(
      `/orders/${id}`
    )
    return data.data
  } catch (err) {
    throw toAppError(err)
  }
}

/**
 * PATCH /orders/:id/cancel
 * Customer self-cancellation — only allowed while status is PENDING.
 */
export async function cancelOrder(id: string): Promise<Order> {
  try {
    const { data } = await api.patch<{ status: 'success'; data: Order }>(
      `/orders/${id}/cancel`
    )
    return data.data
  } catch (err) {
    throw toAppError(err)
  }
}
