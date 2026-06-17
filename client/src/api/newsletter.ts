import api from '@/lib/axios'
import type { AppError } from '@/types/api'
import { AxiosError } from 'axios'

function toAppError(err: unknown): AppError {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as {
      message?: string
      errors?: AppError['errors']
    }

    return {
      message: data.message ?? 'An unexpected error occurred.',
      errors: data.errors,
      statusCode: err.response.status,
    }
  }

  return { message: 'Could not connect to server. Please try again.' }
}

export async function subscribeToNewsletter(email: string, name?: string): Promise<string> {
  try {
    const { data } = await api.post<{ status: 'ok'; message: string }>(
      '/newsletter/subscribe',
      { email, ...(name ? { name } : {}) }
    )

    return data.message
  } catch (err) {
    throw toAppError(err)
  }
}
