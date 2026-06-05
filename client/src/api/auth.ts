import api from '@/lib/axios'
import type {
  AppError,
  AuthResponse,
  GoogleAuthInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  User,
} from '@/types/api'
import { AxiosError } from 'axios'

// ─── Error transformer ────────────────────────────────────────────────────────

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

// ─── Auth functions ───────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Returns accessToken + user on success.
 */
export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', input)
    return data
  } catch (err) {
    throw toAppError(err)
  }
}

/**
 * POST /auth/register
 * Returns accessToken + user on success.
 */
export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/register', input)
    return data
  } catch (err) {
    throw toAppError(err)
  }
}

/**
 * POST /auth/google
 * Exchanges Google idToken for accessToken + user.
 */
export async function googleAuth(input: GoogleAuthInput): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/google', input)
    return data
  } catch (err) {
    throw toAppError(err)
  }
}

/**
 * POST /auth/logout
 * Clears the httpOnly refreshToken cookie on the backend.
 */
export async function logoutUser(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch (err) {
    throw toAppError(err)
  }
}

/**
 * GET /auth/me
 * Returns current user with linkedProviders and hasPassword.
 */
export async function getMe(): Promise<User> {
  try {
    const { data } = await api.get<{ status: 'success'; data: User }>('/auth/me')
    return data.data
  } catch (err) {
    throw toAppError(err)
  }
}

/**
 * PATCH /auth/me
 * Updates name, phone, and/or newsletterOptIn.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  try {
    const { data } = await api.patch<{ status: 'success'; data: User }>(
      '/auth/me',
      input
    )
    return data.data
  } catch (err) {
    throw toAppError(err)
  }
}
