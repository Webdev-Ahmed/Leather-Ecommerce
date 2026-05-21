import type { Request, Response, NextFunction } from "express";

/**
 * Placeholder admin middleware.
 * TODO: Replace with real JWT verification + role check when auth is implemented.
 */
export function requireAdmin(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // Auth will be wired in here — for now pass through
  next();
}
