import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────

type QueueItem = {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}

// ─── State ────────────────────────────────────────────────────────────────────

let isRefreshing = false
// failedQueue prevents concurrent 401s from triggering multiple refresh calls
const failedQueue: QueueItem[] = []

function processQueue(error: unknown, token: string | null): void {
  for (const item of failedQueue) {
    if (error) {
      item.reject(error)
    } else if (token) {
      item.resolve(token)
    }
  }
  failedQueue.length = 0
}

// ─── Instance ─────────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // Required for the httpOnly refreshToken cookie to be sent automatically
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request interceptor: attach access token ─────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: silent 401 refresh ────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch((err: unknown) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // POST /auth/refresh sends the httpOnly cookie automatically (withCredentials)
      const { data } = await axios.post<{ accessToken: string }>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )

      const newToken = data.accessToken
      useAuthStore.getState().setTokens(newToken)
      processQueue(null, newToken)

      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch (refreshError: unknown) {
      processQueue(refreshError, null)
      useAuthStore.getState().logout()

      // Redirect to login on second failure — refresh token is expired/invalid
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
