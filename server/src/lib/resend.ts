console.log(
  "[Resend] API Key loaded:",
  process.env.RESEND_API_KEY ? "YES" : "UNDEFINED",
);

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@yourdomain.com";
const FROM_NAME = process.env.FROM_NAME ?? "Leather E-Commerce";

if (!RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY must be defined in .env");
}

const resend = new Resend(RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send a single transactional email via Resend.
 * Returns true on success, false on failure — callers decide whether to throw.
 * Transactional emails (welcome, order confirm) are fire-and-forget and should
 * never block or fail the primary request if Resend is down.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
  });

  if (error) {
    console.error("[Resend] Failed to send email:", error);
    return false;
  }

  console.log(`[Resend] Email sent → ${data?.id}`);
  return true;
}

/**
 * Send a batch of emails (e.g. newsletter blast).
 * Resend batch API sends up to 100 emails per call.
 * Returns the number of successfully queued emails.
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[],
): Promise<number> {
  if (emails.length === 0) return 0;

  const BATCH_SIZE = 100;
  let successCount = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);

    const { data, error } = await resend.batch.send(
      batch.map((e) => ({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: e.to,
        subject: e.subject,
        html: e.html,
        reply_to: e.replyTo,
      })),
    );

    if (error) {
      console.error(`[Resend] Batch ${i / BATCH_SIZE + 1} failed:`, error);
    } else {
      successCount += data?.data?.length ?? 0;
    }
  }

  return successCount;
}
