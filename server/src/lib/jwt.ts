import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import { AppError } from "@/middleware/errorHandler";
import type { Role } from "@/lib/roles";

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error(
    "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be defined in .env",
  );
}

const ACCESS_SECRET: string = ACCESS_TOKEN_SECRET;
const REFRESH_SECRET: string = REFRESH_TOKEN_SECRET;

// Access tokens are short-lived — they are not stored in the DB.
// If you need longer sessions, increase this but keep it under 1 hour.
const ACCESS_TOKEN_TTL = "15m";

// Refresh tokens are long-lived and ARE stored (as a hash) in the DB.
// Changing this requires a matching Duration type for prisma expiresAt calculation.
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string; // userId
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string; // userId
  jti: string; // unique token ID — matches the raw token used to derive the hash
}

// What callers get back when issuing a full token pair
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string; // SHA-256 hash — store this in the DB, not the raw token
  refreshTokenExpiresAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Deterministically hash a refresh token for safe DB storage.
 * On rotation, hash the incoming token and look it up — never store raw tokens.
 */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

// ─── Access token ─────────────────────────────────────────────────────────────

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
    issuer: "pern-ecommerce",
    audience: "pern-ecommerce-client",
  });
}

/**
 * Verify an access token.
 * Throws AppError 401 for expired/invalid tokens so controllers can stay clean.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET, {
      issuer: "pern-ecommerce",
      audience: "pern-ecommerce-client",
    });

    // jwt.verify returns string | JwtPayload — narrow it down
    if (typeof decoded === "string" || !decoded.sub || !decoded.role) {
      throw new AppError(401, "Invalid token payload");
    }

    return {
      sub: decoded.sub,
      role: decoded.role as AccessTokenPayload["role"],
    };
  } catch (err) {
    if (err instanceof AppError) throw err;

    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Access token has expired");
    }

    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, "Invalid access token");
    }

    throw new AppError(401, "Token verification failed");
  }
}

// ─── Refresh token ────────────────────────────────────────────────────────────

/**
 * Issue a full token pair.
 * The refresh token is a signed JWT with a random jti for uniqueness.
 * Store refreshTokenHash in the DB — never the raw refreshToken.
 */
export function issueTokenPair(
  userId: string,
  role: AccessTokenPayload["role"],
): TokenPair {
  const accessToken = signAccessToken({ sub: userId, role });

  // jti makes each refresh token globally unique even for the same user,
  // so token rotation can't be confused across concurrent sessions.
  const jti = randomBytes(32).toString("hex");

  const refreshToken = jwt.sign(
    { sub: userId, jti } satisfies RefreshTokenPayload,
    REFRESH_SECRET,
    {
      expiresIn: "30d",
      issuer: "pern-ecommerce",
      audience: "pern-ecommerce-refresh",
    },
  );

  return {
    accessToken,
    refreshToken,
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  };
}

/**
 * Verify a refresh token.
 * Throws AppError 401 on failure — call this before the DB hash lookup.
 * After this succeeds, look up the hash in the DB to confirm it hasn't been revoked.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET, {
      issuer: "pern-ecommerce",
      audience: "pern-ecommerce-refresh",
    });

    if (typeof decoded === "string" || !decoded.sub || !decoded.jti) {
      throw new AppError(401, "Invalid refresh token payload");
    }

    return {
      sub: decoded.sub,
      jti: decoded.jti as string,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;

    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Refresh token has expired, please log in again");
    }

    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, "Invalid refresh token");
    }

    throw new AppError(401, "Refresh token verification failed");
  }
}
