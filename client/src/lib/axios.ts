import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/store/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

// ─── State ────────────────────────────────────────────────────────────────────

let isRefreshing = false;
// failedQueue prevents concurrent 401s from triggering multiple refresh calls
const failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null): void {
  for (const item of failedQueue) {
    if (error) {
      item.reject(error);
    } else if (token) {
      item.resolve(token);
    }
  }
  failedQueue.length = 0;
}

// ─── Instance ─────────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // Required for the httpOnly refreshToken cookie to be sent automatically
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor: attach access token ─────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: silent 401 refresh ────────────────────────────────

function shouldAttemptRefresh(
  request: (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined,
): boolean {
  if (!request || request._retry || request.headers?.Authorization) {
    // If we already had an access token attached, a refresh retry is reasonable.
    // _retry still short-circuits repeated attempts.
    return !request?._retry;
  }

  const url = request.url ?? "";

  // Public auth endpoints should never trigger refresh logic on 401.
  if (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/google") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  ) {
    return false;
  }

  return true;
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;

  const isAlreadyOnAuthPage =
    window.location.pathname === "/login" ||
    window.location.pathname === "/register";

  if (!isAlreadyOnAuthPage) {
    window.location.href = "/login";
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      !shouldAttemptRefresh(originalRequest)
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err: unknown) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // POST /auth/refresh sends the httpOnly cookie automatically (withCredentials)
      const { data } = await axios.post<{
        status: "ok";
        data: { accessToken: string };
      }>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newToken = data.data.accessToken;
      const store = useAuthStore.getState();
      store.setTokens(newToken);

      if (!store.user) {
        try {
          const { data: meData } = await axios.get<{
            status: "ok";
            data: import("@/types/api").User;
          }>(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${newToken}` },
          });
          useAuthStore.getState().setUser(meData.data);
          useAuthStore.getState().setAuthenticated(true);
        } catch {
          useAuthStore.getState().logout();
          processQueue(new Error("Unable to restore session"), null);
          redirectToLogin();
          return Promise.reject(error);
        }
      }

      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError: unknown) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();

      // Redirect to login on second failure — refresh token is expired/invalid
      redirectToLogin();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
