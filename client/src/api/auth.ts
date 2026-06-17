import api from "@/lib/axios";
import type {
  AppError,
  GoogleAuthInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  User,
} from "@/types/api";
import { AxiosError } from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

// Actual backend response shape — { status: 'ok', data: { user, accessToken } }
type AuthData = {
  user: User;
  accessToken: string;
};

type AuthApiResponse = {
  status: "ok";
  data: AuthData;
};

// What callers receive after unwrapping
export type AuthResult = AuthData;

// ─── Error transformer ────────────────────────────────────────────────────────

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

// ─── Auth functions ───────────────────────────────────────────────────────────

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  try {
    const { data } = await api.post<AuthApiResponse>("/auth/login", input);
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  try {
    const { data } = await api.post<AuthApiResponse>("/auth/register", input);
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function googleAuth(input: GoogleAuthInput): Promise<AuthResult> {
  try {
    const { data } = await api.post<AuthApiResponse>("/auth/google", input);
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    throw toAppError(err);
  }
}

export async function getMe(): Promise<User> {
  try {
    const { data } = await api.get<{ status: "ok"; data: User }>("/auth/me");
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function refreshSession(): Promise<string> {
  try {
    const { data } = await api.post<{
      status: "ok";
      data: { accessToken: string };
    }>("/auth/refresh");
    return data.data.accessToken;
  } catch (err) {
    throw toAppError(err);
  }
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  try {
    const { data } = await api.patch<{ status: "ok"; data: User }>(
      "/auth/me",
      input,
    );
    return data.data;
  } catch (err) {
    throw toAppError(err);
  }
}
