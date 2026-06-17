import type { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "@/middleware/errorHandler";
import { hasRole, type Role } from "@/lib/roles";

export function requireRole(...allowedRoles: Role[]): RequestHandler {
  if (allowedRoles.length === 0) {
    throw new Error("requireRole requires at least one role");
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userId) {
        throw new AppError(401, "Authentication required");
      }

      if (!hasRole(req.userRole, allowedRoles)) {
        throw new AppError(
          403,
          "You do not have permission to perform this action",
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
