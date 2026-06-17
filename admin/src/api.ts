import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4008/api";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If 401, redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
