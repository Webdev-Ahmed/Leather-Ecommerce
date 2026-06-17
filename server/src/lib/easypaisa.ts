import { createHmac } from "crypto";
import { AppError } from "@/middleware/errorHandler";

// ─── Config ───────────────────────────────────────────────────────────────────

const STORE_ID = process.env.EASYPAISA_STORE_ID;
const HASH_KEY = process.env.EASYPAISA_HASH_KEY;
const SANDBOX = process.env.NODE_ENV !== "production";

if (!STORE_ID || !HASH_KEY) {
  throw new Error(
    "EASYPAISA_STORE_ID and EASYPAISA_HASH_KEY must be defined in .env",
  );
}

// Easypaisa hosted-checkout (page-redirect) URL
export const EASYPAISA_CHECKOUT_URL = SANDBOX
  ? "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf"
  : "https://easypay.easypaisa.com.pk/easypay/Index.jsf";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EasypaisaPaymentData {
  merchantRef: string; // orderRefNum — your internal order reference (max 20 alphanumeric)
  amount: number; // in PKR; last 2 digits treated as decimal (1500.00 PKR → "150000")
  postBackUrl: string; // postBackURL — Easypaisa POSTs the result here
  mobileAccountNo?: string; // optional: pre-fill customer's mobile number
}

// Shape of the POST body Easypaisa sends to your postBackURL
export interface EasypaisaCallback {
  orderId: string;
  storeId: string;
  transactionId: string;
  transactionDateTime: string;
  responseCode: string; // "0000" = success
  responseDesc: string;
  encryptedHashRequest?: string;
  [key: string]: string | undefined;
}

// ─── Timestamp helper ─────────────────────────────────────────────────────────

/**
 * Easypaisa requires timeStamp in yyyyMMddHHmmss format.
 */
function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

// ─── Signature generation ─────────────────────────────────────────────────────

/**
 * Generate Easypaisa HMAC-SHA256 hash for hosted checkout.
 *
 * Algorithm (per Easypaisa integration guide v4.1):
 * 1. Build a string of all request fields concatenated in the exact order:
 *    amount + orderRefNum + paymentMethod + postBackURL + storeId + timeStamp
 * 2. HMAC-SHA256 the string using the HashKey as the key.
 * 3. Hex-encode the digest — this is the encryptedHashRequest.
 *
 * Field order is fixed and must not change.
 */
export function generateEasypaisaHash(fields: {
  amount: string;
  orderRefNum: string;
  paymentMethod: string;
  postBackURL: string;
  storeId: string;
  timeStamp: string;
}): string {
  const payload =
    fields.amount +
    fields.orderRefNum +
    fields.paymentMethod +
    fields.postBackURL +
    fields.storeId +
    fields.timeStamp;

  return createHmac("sha256", HASH_KEY!).update(payload).digest("hex");
}

/**
 * Verify an Easypaisa postback callback by recomputing the hash.
 * Easypaisa sends encryptedHashRequest in the callback using the same scheme.
 * Throws AppError if verification fails.
 *
 * Note: Easypaisa's callback hash field ordering mirrors the original request,
 * so we use the same generateEasypaisaHash function.
 */
export function verifyEasypaisaCallback(
  body: EasypaisaCallback,
  originalFields: {
    amount: string;
    orderRefNum: string;
    paymentMethod: string;
    postBackURL: string;
    storeId: string;
    timeStamp: string;
  },
): void {
  if (!body.encryptedHashRequest) {
    // Easypaisa does not always send the hash in sandbox; skip in non-production
    if (SANDBOX) return;
    throw new AppError(400, "Easypaisa callback missing encryptedHashRequest");
  }

  const computed = generateEasypaisaHash(originalFields);

  if (computed.toLowerCase() !== body.encryptedHashRequest.toLowerCase()) {
    throw new AppError(400, "Easypaisa hash verification failed");
  }
}

// ─── Build payment form data ──────────────────────────────────────────────────

/**
 * Build the complete key-value payload to POST to EASYPAISA_CHECKOUT_URL.
 *
 * The frontend submits this as a hidden HTML form POST to the checkout URL.
 *
 * Key Easypaisa quirks:
 * - amount: last 2 digits are the decimal portion (1500.00 PKR → "150000")
 * - orderRefNum: max 20 alphanumeric chars — we truncate merchantRef accordingly
 * - paymentMethod: always "InitialRequest" for hosted checkout
 * - encryptedHashRequest: HMAC-SHA256 of (amount + orderRefNum + paymentMethod +
 *   postBackURL + storeId + timeStamp), in that exact order, keyed with HASH_KEY
 */
export function buildEasypaisaFormData(
  opts: EasypaisaPaymentData,
): Record<string, string> {
  // Amount: multiply by 100 and strip decimals
  const amount = Math.round(opts.amount * 100).toString();

  // orderRefNum must be max 20 alphanumeric chars
  const orderRefNum = opts.merchantRef.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);

  const paymentMethod = "InitialRequest";
  const timeStamp = getTimestamp();

  const hashFields = {
    amount,
    orderRefNum,
    paymentMethod,
    postBackURL: opts.postBackUrl,
    storeId: STORE_ID!,
    timeStamp,
  };

  const encryptedHashRequest = generateEasypaisaHash(hashFields);

  const formData: Record<string, string> = {
    storeId: STORE_ID!,
    amount,
    postBackURL: opts.postBackUrl,
    orderRefNum,
    timeStamp,
    paymentMethod,
    encryptedHashRequest,
    mobileAccountNo: opts.mobileAccountNo ?? "",
  };

  return formData;
}
