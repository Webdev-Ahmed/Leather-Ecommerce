import api from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";

// ─── PayFast ──────────────────────────────────────────────────────────────────

export type PayFastInitiateResponse = {
  payfastUrl: string;
  formData: Record<string, string>;
};

export async function initiatePayFast(
  orderId: string,
): Promise<PayFastInitiateResponse> {
  const res = await api.post<ApiSuccess<PayFastInitiateResponse>>(
    "/payments/initiate",
    { orderId },
  );
  return res.data.data;
}

// ─── JazzCash ─────────────────────────────────────────────────────────────────

export type JazzCashInitiateResponse = {
  jazzcashUrl: string;
  formData: Record<string, string>;
};

export async function initiateJazzCash(
  orderId: string,
): Promise<JazzCashInitiateResponse> {
  const res = await api.post<ApiSuccess<JazzCashInitiateResponse>>(
    "/payments/jazzcash/initiate",
    { orderId },
  );
  return res.data.data;
}

// ─── Easypaisa ────────────────────────────────────────────────────────────────

export type EasypaisaInitiateResponse = {
  easypaisaUrl: string;
  formData: Record<string, string>;
};

export async function initiateEasypaisa(
  orderId: string,
  mobileAccountNo?: string,
): Promise<EasypaisaInitiateResponse> {
  const res = await api.post<ApiSuccess<EasypaisaInitiateResponse>>(
    "/payments/easypaisa/initiate",
    { orderId, mobileAccountNo },
  );
  return res.data.data;
}

// ─── Form submit helper ───────────────────────────────────────────────────────

/**
 * Submits a hidden HTML form to the payment gateway URL.
 * All three gateways require a browser POST with signed form fields.
 *
 * For Easypaisa: the browser redirects to the gateway, the gateway POSTs
 * the result server-to-server, so the browser never redirects back. The
 * caller should navigate to /payment-pending/:id BEFORE calling this so
 * the tab isn't left at the gateway with no return path.
 */
export function submitPaymentForm(
  url: string,
  fields: Record<string, string>,
): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.style.display = "none";

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
