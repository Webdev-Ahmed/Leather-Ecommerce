import { validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

/**
 * Reads the result of express-validator checks that ran before this middleware.
 * If any field failed, responds with 422 and the full error list.
 * Place after your validation chain and before the controller.
 */
export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array().map((e) => ({
        field: e.type === "field" ? e.path : undefined,
        message: e.msg,
      })),
    });
    return;
  }

  next();
}
