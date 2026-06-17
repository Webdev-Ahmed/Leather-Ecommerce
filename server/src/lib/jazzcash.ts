import { createHmac } from "crypto";
import { AppError } from "@/middleware/errorHandler";

// ─── Config ───────────────────────────────────────────────────────────────────

const MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID;
const PASSWORD = process.env.JAZZCASH_PASSWORD;
const INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT; // "HashKey" in JazzCash dashboard
const SANDBOX = process.env.NODE_ENV !== "production";

if (!MERCHANT_ID || !PASSWORD || !INTEGRITY_SALT) {
  throw new Error(
    "JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT must be defined in .env",
  );
}

// JazzCash hosted-checkout (page-redirect) URL
export const JAZZCASH_CHECKOUT_URL = SANDBOX
  ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"
  : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JazzCashPaymentData {
  merchantRef: string; // pp_BillReference — your internal order reference
  amount: number; // in PKR (will be converted to paisas: amount * 100, no decimals)
  description: string; // pp_Description shown on JazzCash checkout
  returnUrl: string; // pp_ReturnURL — redirect after payment
}

// Shape of the POST body JazzCash sends back to your returnUrl
export interface JazzCashCallback {
  pp_Amount: string;
  pp_BillReference: string;
  pp_Language: string;
  pp_MerchantID: string;
  pp_ResponseCode: string; // "000" = success
  pp_ResponseMessage: string;
  pp_RetrievalReferenceNo: string;
  pp_SubMerchantID: string;
  pp_TxnCurrency: string;
  pp_TxnDateTime: string;
  pp_TxnRefNo: string;
  pp_SecureHash: string;
  [key: string]: string;
}

// ─── Timestamp helpers ────────────────────────────────────────────────────────

/**
 * Format a Date as yyyyMMddHHmmss — required by JazzCash for pp_TxnDateTime
 * and pp_TxnExpiryDateTime.
 */
function formatDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

// ─── Signature generation ─────────────────────────────────────────────────────

/**
 * Generate a JazzCash HMAC-SHA256 secure hash.
 *
 * Algorithm (per JazzCash v4.2 docs):
 * 1. Collect all pp_* fields (excluding pp_SecureHash itself).
 * 2. Sort values alphabetically by key (ASCII order).
 * 3. Concatenate values with '&' separator.
 * 4. Prepend the IntegritySalt: "<SALT>&<values>".
 * 5. HMAC-SHA256 the result using IntegritySalt as the key.
 * 6. Hex-encode the digest.
 */
export function generateSecureHash(
  params: Record<string, string>,
): string {
  // Only pp_* fields participate in the hash (excluding pp_SecureHash itself)
  const ppFields = Object.entries(params)
    .filter(([key]) => key.startsWith("pp_") && key !== "pp_SecureHash")
    .sort(([a], [b]) => a.localeCompare(b));

  const values = ppFields.map(([, v]) => v).join("&");
  const toSign = `${INTEGRITY_SALT}&${values}`;

  return createHmac("sha256", INTEGRITY_SALT!)
    .update(toSign)
    .digest("hex");
}

/**
 * Verify a JazzCash callback / return-URL POST by recomputing the hash
 * and comparing it to pp_SecureHash. Throws AppError on mismatch.
 */
export function verifySecureHash(body: JazzCashCallback): void {
  const { pp_SecureHash, ...rest } = body;
  const computed = generateSecureHash(rest as Record<string, string>);

  if (computed.toLowerCase() !== pp_SecureHash.toLowerCase()) {
    throw new AppError(400, "JazzCash secure hash mismatch");
  }
}

// ─── Build payment form data ──────────────────────────────────────────────────

/**
 * Build the complete form-field payload to POST to JAZZCASH_CHECKOUT_URL.
 *
 * The frontend receives this as a key-value object and submits it as a hidden
 * HTML form POST — identical flow to PayFast.
 *
 * Key JazzCash quirks:
 * - Amount is in paisas (PKR × 100), no decimal, e.g. 1500 PKR → "150000"
 * - pp_TxnRefNo must be unique per transaction; we prefix with "T" + timestamp
 * - pp_TxnExpiryDateTime = 1 hour after TxnDateTime (configurable)
 */
export function buildJazzCashFormData(
  opts: JazzCashPaymentData,
): Record<string, string> {
  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour

  // Amount in paisas — no decimals, JazzCash treats the last 2 digits as cents
  const amountInPaisas = Math.round(opts.amount * 100).toString();

  const txnRefNo = `T${formatDateTime(now)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const params: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "",
    pp_Language: "EN",
    pp_MerchantID: MERCHANT_ID!,
    pp_SubMerchantID: "",
    pp_Password: PASSWORD!,
    pp_BankID: "",
    pp_ProductID: "",
    pp_TxnRefNo: txnRefNo,
    pp_Amount: amountInPaisas,
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: formatDateTime(now),
    pp_BillReference: opts.merchantRef,
    pp_Description: opts.description.slice(0, 100),
    pp_TxnExpiryDateTime: formatDateTime(expiry),
    pp_ReturnURL: opts.returnUrl,
    pp_SecureHash: "",
  };

  // Compute and inject the secure hash
  params["pp_SecureHash"] = generateSecureHash(params);

  return params;
}
