import multer, { type FileFilterCallback } from "multer";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "@/middleware/errorHandler";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// ─── Storage ──────────────────────────────────────────────────────────────────

// Memory storage — files land in req.file.buffer / req.files[].buffer.
// We stream the buffer directly to Cloudinary, never writing to disk.
const storage = multer.memoryStorage();

// ─── File filter ──────────────────────────────────────────────────────────────

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        415,
        `Unsupported file type "${file.mimetype}". Allowed: JPEG, PNG, WebP, GIF`,
      ),
    );
  }
}

// ─── Multer instances ─────────────────────────────────────────────────────────

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

/**
 * Single image upload — reads from the field named "image".
 * Use for category image and user avatar.
 * Exposes the file on req.file after the middleware runs.
 */
export const uploadSingle = upload.single("image");

/**
 * Multiple image upload — reads from the field named "images", max 10.
 * Use for product create/update.
 * Exposes files on req.files after the middleware runs.
 */
export const uploadMultiple = upload.fields([{ name: "images", maxCount: 10 }]);

// ─── Error wrapper ────────────────────────────────────────────────────────────

type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

/**
 * Wraps a multer middleware so that MulterError instances are translated into
 * AppErrors before reaching the global errorHandler. Without this, multer's
 * own error class would fall through to the generic 500 branch.
 *
 * Usage in routes:
 *   router.post("/", withUpload(uploadMultiple), requireAdmin, createProduct);
 */
export function withUpload(
  multerMiddleware: ExpressMiddleware,
): ExpressMiddleware {
  return (req: Request, res: Response, next: NextFunction): void => {
    multerMiddleware(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }

      // multer's own error type
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          next(
            new AppError(
              413,
              `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`,
            ),
          );
          return;
        }

        if (err.code === "LIMIT_FILE_COUNT") {
          next(new AppError(422, "Too many files. Maximum is 10 images"));
          return;
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          next(
            new AppError(
              422,
              `Unexpected field "${err.field}". Use "image" for single or "images" for multiple uploads`,
            ),
          );
          return;
        }

        // Any other multer error
        next(new AppError(400, err.message));
        return;
      }

      // AppError thrown from fileFilter passes through as-is
      next(err);
    });
  };
}
