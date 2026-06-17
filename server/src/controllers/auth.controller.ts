import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { AppError } from "@/middleware/errorHandler";
import { issueTokenPair, verifyRefreshToken, hashToken } from "@/lib/jwt";
import { verifyGoogleIdToken } from "@/lib/oauth";
import { validate } from "@/lib/validators";
import {
  RegisterSchema,
  LoginSchema,
  UpdateMeSchema,
} from "@/schemas/auth.schema";
import { sendEmail } from "@/lib/resend";
import { welcomeEmail } from "@/lib/email-templates";
import type { Role } from "@/lib/roles";

// ─── Constants ────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;

// httpOnly cookie settings — the refresh token never touches JS on the client
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth", // scoped so the cookie is only sent to auth routes
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip sensitive fields before sending a user object to the client. */
function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  newsletterOptIn: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    newsletterOptIn: user.newsletterOptIn,
    createdAt: user.createdAt,
  };
}

/** Write the refresh token as an httpOnly cookie and return the access token. */
function sendTokens(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  res.locals["accessToken"] = accessToken;
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validate(RegisterSchema, req.body, res);
    if (!body) return;

    const { name, email, password, phone, newsletterOptIn } = body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({
        status: "error",
        message: "An account with this email already exists",
        errors: [{ field: "email", message: "Email is already in use" }],
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        phone: phone ?? null,
        newsletterOptIn: newsletterOptIn ?? false,
      },
    });

    const {
      accessToken,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt,
    } = issueTokenPair(user.id, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
        userAgent: req.headers["user-agent"] ?? null,
        ip: req.ip ?? null,
      },
    });

    sendTokens(res, accessToken, refreshToken);
    const { subject, html } = welcomeEmail({ name, email });
    sendEmail({ to: email, subject, html }).catch((err: unknown) => {
      console.error("[Resend] Welcome email failed:", err);
    });

    res.status(201).json({
      status: "ok",
      data: { user: sanitizeUser(user), accessToken },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validate(LoginSchema, req.body, res);
    if (!body) return;

    const { email, password } = body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Use a constant-time compare even on the "user not found" path to prevent
    // timing attacks that could enumerate valid email addresses.
    const dummyHash =
      "$2b$12$invalidhashpaddingtomatchbcrypttimingxxxxxxxxxxxxxxxxxxxxxxx";
    const passwordMatch = await bcrypt.compare(
      password,
      user?.password ?? dummyHash,
    );

    if (!user || !passwordMatch) {
      res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
      return;
    }

    // User exists but signed up via OAuth — they have no password set
    if (!user.password) {
      res.status(401).json({
        status: "error",
        message:
          "This account uses Google sign-in. Please continue with Google.",
      });
      return;
    }

    const {
      accessToken,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt,
    } = issueTokenPair(user.id, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
        userAgent: req.headers["user-agent"] ?? null,
        ip: req.ip ?? null,
      },
    });

    sendTokens(res, accessToken, refreshToken);

    res.status(200).json({
      status: "ok",
      data: { user: sanitizeUser(user), accessToken },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/google ────────────────────────────────────────────────────
//
// Flow:
//   1. Frontend completes Google Sign-In and receives a credential (ID token)
//   2. Frontend POSTs { idToken } to this endpoint
//   3. We verify the token server-side, then upsert the user + Account row
//   4. We issue our own JWT pair — Google tokens are never used beyond this point

export async function googleAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { idToken } = req.body as { idToken?: unknown };

    if (typeof idToken !== "string" || !idToken.trim()) {
      throw new AppError(400, "idToken is required");
    }

    const googleUser = await verifyGoogleIdToken(idToken);
    const { providerAccountId, email, name, avatarUrl } = googleUser;

    // Look up an existing Account row for this Google identity
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId,
        },
      },
      include: { user: true },
    });

    let user: Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>;

    if (existingAccount) {
      // Returning Google user — update their avatar in case it changed
      user = await prisma.user.update({
        where: { id: existingAccount.userId },
        data: { avatarUrl },
      });
    } else {
      // First time this Google account has been seen.
      // Check if a user with this email already exists (they registered with
      // email/password first). If so, link the Google account to them.
      // If not, create a brand new user.
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        // Link Google to the existing email/password account
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: { avatarUrl: existingUser.avatarUrl ?? avatarUrl },
        });

        await prisma.account.create({
          data: {
            userId: existingUser.id,
            provider: "google",
            providerAccountId,
          },
        });
      } else {
        // New user — create user + account in a transaction so we never get a
        // user row without a corresponding account row or vice versa.
        user = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: { name, email, avatarUrl },
          });

          await tx.account.create({
            data: {
              userId: newUser.id,
              provider: "google",
              providerAccountId,
            },
          });

          return newUser;
        });
      }
    }

    const {
      accessToken,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt,
    } = issueTokenPair(user.id, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
        userAgent: req.headers["user-agent"] ?? null,
        ip: req.ip ?? null,
      },
    });

    sendTokens(res, accessToken, refreshToken);

    res.status(200).json({
      status: "ok",
      data: { user: sanitizeUser(user), accessToken },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
//
// Rotation strategy: each refresh issues a new pair and deletes the old token.
// If an already-used token is presented (hash not found in DB), that means
// either the token was already rotated (normal) or it was stolen and used by
// an attacker first. Either way, we reject it. No silent re-use.

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawToken: unknown = req.cookies[REFRESH_COOKIE_NAME];

    if (typeof rawToken !== "string" || !rawToken.trim()) {
      throw new AppError(401, "No refresh token provided");
    }

    // Step 1 — verify the JWT signature and expiry
    const payload = verifyRefreshToken(rawToken);

    // Step 2 — confirm this exact token exists in the DB (not revoked/rotated)
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.userId !== payload.sub) {
      // Token was already rotated or forcibly revoked — could be a replay attack.
      // Revoke ALL tokens for this user as a precaution.
      await prisma.refreshToken.deleteMany({ where: { userId: payload.sub } });
      throw new AppError(
        401,
        "Refresh token has been revoked. Please log in again.",
      );
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { tokenHash } });
      throw new AppError(
        401,
        "Refresh token has expired. Please log in again.",
      );
    }

    const { user } = stored;

    // Step 3 — issue new pair and rotate (delete old, insert new) in a transaction
    const {
      accessToken,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt,
    } = issueTokenPair(user.id, user.role);

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { tokenHash } }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: refreshTokenHash,
          expiresAt: refreshTokenExpiresAt,
          userAgent: req.headers["user-agent"] ?? null,
          ip: req.ip ?? null,
        },
      }),
    ]);

    sendTokens(res, accessToken, refreshToken);

    res.status(200).json({
      status: "ok",
      data: { accessToken },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawToken: unknown = req.cookies[REFRESH_COOKIE_NAME];

    // Best-effort deletion — if the cookie is missing or already invalid,
    // we still clear it and return 200 (the user is effectively logged out).
    if (typeof rawToken === "string" && rawToken.trim()) {
      const tokenHash = hashToken(rawToken);
      await prisma.refreshToken
        .delete({ where: { tokenHash } })
        .catch(() => undefined); // suppress "not found" — already gone
    }

    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 0,
    });

    res.status(200).json({ status: "ok", message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/logout-all ────────────────────────────────────────────────
// Revokes every active session for the authenticated user ("log out everywhere")

export async function logoutAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as Request & { userId?: string }).userId;

    if (!userId) {
      throw new AppError(401, "Authentication required");
    }

    await prisma.refreshToken.deleteMany({ where: { userId } });

    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 0,
    });

    res.status(200).json({
      status: "ok",
      message: "Logged out from all devices",
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/auth/me ──────────────────────────────────────────────────────

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as Request & { userId?: string }).userId;

    if (!userId) {
      throw new AppError(401, "Authentication required");
    }

    const body = validate(UpdateMeSchema, req.body, res);
    if (!body) return;

    const user = await prisma.user.update({
      where: { id: userId },
      data: body,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        newsletterOptIn: true,
        createdAt: true,
        updatedAt: true,
        password: true,
        accounts: { select: { provider: true } },
      },
    });

    res.status(200).json({
      status: "ok",
      data: {
        ...sanitizeUser(user),
        hasPassword: user.password !== null,
        linkedProviders: user.accounts.map((a) => a.provider),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as Request & { userId?: string }).userId;

    if (!userId) {
      throw new AppError(401, "Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        newsletterOptIn: true,
        createdAt: true,
        // Include whether they have a password set and which OAuth providers
        // are linked — useful for the frontend account settings page
        password: true,
        accounts: { select: { provider: true } },
      },
    });

    if (!user) {
      throw new AppError(401, "User not found");
    }

    res.status(200).json({
      status: "ok",
      data: {
        ...sanitizeUser(user),
        hasPassword: user.password !== null,
        linkedProviders: user.accounts.map((a) => a.provider),
      },
    });
  } catch (err) {
    next(err);
  }
}
