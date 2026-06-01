import type { NextFunction, Request, Response } from "express";

// ─── Custom AppError ──────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ─── Prisma error types ───────────────────────────────────────────────────────

interface PrismaKnownError extends Error {
  code: string;
  meta?: Record<string, unknown>;
}

interface PrismaInitError extends Error {
  errorCode?: string;
}

function isPrismaKnownError(err: unknown): err is PrismaKnownError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as Error).name === "PrismaClientKnownRequestError"
  );
}

function isPrismaInitError(err: unknown): err is PrismaInitError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as Error).name === "PrismaClientInitializationError"
  );
}

function isPrismaValidationError(err: unknown): err is Error {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as Error).name === "PrismaClientValidationError"
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV !== "production";

function log(req: Request, err: unknown, statusCode: number): void {
  if (!isDev) return;
  const label = statusCode >= 500 ? "error" : "warn";
  console[label](
    `[ErrorHandler] ${req.method} ${req.path} → ${statusCode}`,
    err,
  );
}

// ─── 404 handler ─────────────────────────────────────────────────────────────

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
  });
}

// ─── Global error handler ─────────────────────────────────────────────────────

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── AppError ──────────────────────────────────────────────────────────────
  if (err instanceof AppError) {
    log(req, err, err.statusCode);
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  // ── Prisma initialization / connection errors ─────────────────────────────
  if (isPrismaInitError(err)) {
    log(req, err, 503);
    res.status(503).json({
      status: "error",
      message: isDev
        ? `Database unavailable: ${err.message}`
        : "Service temporarily unavailable",
    });
    return;
  }

  // ── Prisma validation errors (bad query shape — should never reach prod) ──
  if (isPrismaValidationError(err)) {
    log(req, err, 400);
    res.status(400).json({
      status: "error",
      message: isDev ? err.message : "Invalid request",
    });
    return;
  }

  // ── Prisma known request errors ───────────────────────────────────────────
  if (isPrismaKnownError(err)) {
    const { code, meta } = err;

    // P2000 — value too long for column
    if (code === "P2000") {
      const column = meta?.column_name as string | undefined;
      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: [
          {
            field: column ?? "unknown",
            message: "Value is too long for this field",
          },
        ],
      });
      return;
    }

    // P2001 — record searched in where does not exist
    if (code === "P2001") {
      res.status(404).json({ status: "error", message: "Record not found" });
      return;
    }

    // P2002 — unique constraint violation
    if (code === "P2002") {
      // meta.target is string[] of field names e.g. ["email"] or ["slug"]
      const targets = meta?.target as string[] | string | undefined;
      const fields = Array.isArray(targets)
        ? targets
        : typeof targets === "string"
          ? [targets]
          : ["field"];

      res.status(409).json({
        status: "error",
        message: `${fields.join(", ")} already exists`,
        errors: fields.map((f) => ({
          field: f,
          message: `${f} must be unique`,
        })),
      });
      return;
    }

    // P2003 — foreign key constraint failed
    if (code === "P2003") {
      const field = meta?.field_name as string | undefined;
      res.status(422).json({
        status: "error",
        message: "Validation failed",
        errors: [
          {
            field: field ?? "unknown",
            message: "Referenced record does not exist",
          },
        ],
      });
      return;
    }

    // P2004 — constraint failed on the database
    if (code === "P2004") {
      res.status(422).json({
        status: "error",
        message: "A database constraint was violated",
      });
      return;
    }

    // P2025 — record not found (update/delete on non-existent record)
    if (code === "P2025") {
      const cause = meta?.cause as string | undefined;
      res.status(404).json({
        status: "error",
        message: cause ?? "Record not found",
      });
      return;
    }

    // P2034 — transaction conflict, safe to retry
    if (code === "P2034") {
      res.status(409).json({
        status: "error",
        message: "Transaction conflict, please retry",
      });
      return;
    }

    // Catch-all for unhandled Prisma codes
    log(req, err, 500);
    res.status(500).json({
      status: "error",
      message: isDev
        ? `Prisma error ${code}: ${err.message}`
        : "Database error",
    });
    return;
  }

  // ── Generic fallback ──────────────────────────────────────────────────────
  log(req, err, 500);
  res.status(500).json({
    status: "error",
    message: isDev
      ? ((err as Error)?.message ?? "Unknown error")
      : "An unexpected error occurred",
  });
}
