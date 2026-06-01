import { OAuth2Client } from "google-auth-library";
import { AppError } from "@/middleware/errorHandler";

// ─── Config ───────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID must be defined in .env");
}

// OAuth2Client is cheap to construct and internally caches Google's public
// certs — one instance per process is the right pattern.
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoogleUserInfo {
  providerAccountId: string; // Google's stable "sub" claim
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

// ─── Verification ─────────────────────────────────────────────────────────────

/**
 * Verify a Google ID token sent from the frontend after the user completes
 * the Google Sign-In flow (e.g. via Google Identity Services / One Tap).
 *
 * The frontend sends the raw credential (idToken) to POST /api/auth/google.
 * This function validates the signature, expiry, and audience — all server-side.
 * Never trust client-supplied user info directly; always verify the token here.
 *
 * Throws AppError 401 if the token is invalid or the email is unverified.
 */
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleUserInfo> {
  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
  } catch {
    // google-auth-library throws generic Error objects with descriptive messages
    // (expired, wrong audience, bad signature, etc.) — wrap them uniformly.
    throw new AppError(401, "Invalid or expired Google token");
  }

  const payload = ticket.getPayload();

  if (!payload) {
    throw new AppError(401, "Google token payload is empty");
  }

  // "sub" is Google's stable, immutable identifier for the user.
  // Never use "email" as a primary key — users can change their email.
  const { sub, email, name, picture, email_verified } = payload;

  if (!sub) {
    throw new AppError(401, "Google token is missing subject claim");
  }

  if (!email) {
    // Rare — only happens if the token was issued without the email scope,
    // which shouldn't occur with standard Sign-In flows but worth guarding.
    throw new AppError(
      401,
      "Google account did not provide an email address. Please use a different sign-in method.",
    );
  }

  // Google marks all consumer accounts as verified; this can be false for
  // G Suite accounts with custom domains that haven't completed verification.
  if (!email_verified) {
    throw new AppError(
      403,
      "Your Google account email is not verified. Please verify it with Google and try again.",
    );
  }

  return {
    providerAccountId: sub,
    email,
    name: name ?? email, // fall back to email if display name is absent
    avatarUrl: picture ?? null,
    emailVerified: email_verified,
  };
}
