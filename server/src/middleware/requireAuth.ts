import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/lib/jwt";
import { AppError } from "@/middleware/errorHandler";

// Extend Express Request so controllers can access userId and role without casts
declare global {
  namespace Express {
    interface Request {
      userId: string;
      userRole: "customer" | "manager" | "admin";
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication required");
    }

    const token = authHeader.slice(7); // strip "Bearer "

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const payload = verifyAccessToken(token);

    req.userId = payload.sub;
    req.userRole = payload.role;

    next();
  } catch (err) {
    next(err);
  }
}
