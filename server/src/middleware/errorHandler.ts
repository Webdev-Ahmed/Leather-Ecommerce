import type { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import { MongoServerError } from "mongodb";

interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    res.status(422).json({
      status: "error",
      message: "Validation failed",
      errors,
    });
    return;
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
    const value = err.keyValue?.[field];

    res.status(409).json({
      status: "error",
      message: `${field} "${value}" is already taken`,
      errors: [{ field, message: `${field} must be unique` }],
    });
    return;
  }

  if (err instanceof MongooseError.CastError) {
    res.status(400).json({
      status: "error",
      message: `Invalid value for field "${err.path}"`,
    });
    return;
  }

  if (err.statusCode) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
}
