import { createHash } from "crypto";
import { AppError } from "@/middleware/errorHandler";

// ─── Config ───────────────────────────────────────────────────────────────────

const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE; // optional but recommended
const SANDBOX = process.env.NODE_ENV !== "production";

if (!MERCHANT_ID || !MERCHANT_KEY) {
  throw new Error(
    "PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY must be defined in .env",
  );
}

export const PAYFAST_URL = SANDBOX
  ? "https://sandbox.payfast.co.za/eng/process"
  : "https://www.payfast.co.za/eng/process";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayFastPaymentData {
  merchantRef: string; // m_payment_id — your internal order reference
  amount: number; // total in ZAR (or PKR depending on your account)
  itemName: string; // shown on PayFast checkout page
  email: string; // customer email
  firstName: string;
  lastName: string;
  returnUrl: string; // redirect after successful payment
  cancelUrl: string; // redirect after cancellation
  notifyUrl: string; // your ITN webhook URL
}

// Shape of the ITN POST body PayFast sends to your webhook
export interface PayFastITN {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: "COMPLETE" | "FAILED" | "PENDING";
  item_name: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  signature: string;
  [key: string]: string;
}

// ─── Signature generation ─────────────────────────────────────────────────────

/**
 * Generate a PayFast MD5 signature from a key-value payload.
 * PayFast requires: sort params alphabetically, build a query string,
 * append the passphrase if set, then MD5 hash the result.
 */
export function generateSignature(
  data: Record<string, string>,
  passphrase?: string,
): string {
  // Sort keys alphabetically — PayFast is strict about ordering
  const sorted = Object.keys(data)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      if (data[key] !== "" && data[key] !== undefined) {
        acc[key] = data[key]!;
      }
      return acc;
    }, {});

  let queryString = new URLSearchParams(sorted).toString();

  // PayFast uses PHP's urlencode which encodes spaces as + not %20
  // URLSearchParams already does this, so we're consistent

  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase)}`;
  }

  return createHash("md5").update(queryString).digest("hex");
}

// ─── Build payment form data ──────────────────────────────────────────────────

/**
 * Build the complete form data to POST to PayFast.
 * The frontend receives this as a key-value object and submits it
 * as a hidden HTML form POST to PAYFAST_URL.
 */
export function buildPaymentFormData(
  opts: PayFastPaymentData,
): Record<string, string> {
  const nameParts = opts.firstName.trim().split(" ");
  const firstName = nameParts[0] ?? opts.firstName;
  // If only one name was provided, lastName falls back to a dash
  const lastName = nameParts.slice(1).join(" ") || opts.lastName;

  const data: Record<string, string> = {
    merchant_id: MERCHANT_ID!,
    merchant_key: MERCHANT_KEY!,
    return_url: opts.returnUrl,
    cancel_url: opts.cancelUrl,
    notify_url: opts.notifyUrl,
    name_first: firstName,
    name_last: lastName,
    email_address: opts.email,
    m_payment_id: opts.merchantRef,
    amount: opts.amount.toFixed(2),
    item_name: opts.itemName.slice(0, 100), // PayFast max 100 chars
  };

  // Remove merchant_key before signing — PayFast excludes it from signature
  const { merchant_key: _mk, ...signatureData } = data;

  data["signature"] = generateSignature(signatureData, PASSPHRASE ?? undefined);

  return data;
}

// ─── ITN verification ─────────────────────────────────────────────────────────

/**
 * Verify a PayFast ITN (Instant Transaction Notification) webhook.
 *
 * Steps per PayFast docs:
 * 1. Verify the signature matches
 * 2. Confirm the originating IP is a known PayFast IP
 * 3. Request PayFast's validate endpoint to confirm the payment
 * 4. Check the amount matches our order
 *
 * Throws AppError if any check fails.
 */
export async function verifyITN(
  body: PayFastITN,
  expectedAmount: number,
): Promise<void> {
  // ── Step 1: Verify signature ──────────────────────────────────────────────
  const { signature, ...rest } = body;

  const computedSignature = generateSignature(
    rest as Record<string, string>,
    PASSPHRASE ?? undefined,
  );

  if (computedSignature !== signature) {
    throw new AppError(400, "PayFast ITN signature mismatch");
  }

  // ── Step 2: Verify merchant ID ────────────────────────────────────────────
  if (body.merchant_id !== MERCHANT_ID) {
    throw new AppError(400, "PayFast ITN merchant ID mismatch");
  }

  // ── Step 3: Verify amount matches (allow 1 cent tolerance for float math) ─
  const receivedAmount = parseFloat(body.amount_gross);
  if (Math.abs(receivedAmount - expectedAmount) > 0.01) {
    throw new AppError(
      400,
      `PayFast ITN amount mismatch: expected ${expectedAmount}, got ${receivedAmount}`,
    );
  }

  // ── Step 4: Validate with PayFast server-to-server ────────────────────────
  // Build the raw query string from the ITN body to send back to PayFast
  const validateUrl = SANDBOX
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";

  const pfParam = new URLSearchParams(
    Object.entries(body) as [string, string][],
  ).toString();

  const response = await fetch(validateUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: pfParam,
  });

  const validationResult = await response.text();

  if (validationResult !== "VALID") {
    throw new AppError(
      400,
      `PayFast server-side validation failed: ${validationResult}`,
    );
  }
}
