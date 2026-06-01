import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/middleware/errorHandler";

// requireAdmin must always be chained after requireAuth — it reads
// req.userRole which requireAuth sets. Using it standalone is a bug.
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.userId) {
      throw new AppError(401, "Authentication required");
    }

    if (req.userRole !== "admin" && req.userRole !== "manager") {
      throw new AppError(
        403,
        "You do not have permission to perform this action",
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
