import { v2 as cloudinary } from "cloudinary";

// ─── Config ───────────────────────────────────────────────────────────────────

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  throw new Error(
    "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be defined in .env",
  );
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string; // HTTPS delivery URL
  publicId: string; // Cloudinary public_id — store this to delete later
}

// ─── Folders ──────────────────────────────────────────────────────────────────
// Keeping uploads organised by resource type in Cloudinary's media library.

const FOLDERS = {
  products: "pern-ecommerce/products",
  categories: "pern-ecommerce/categories",
  avatars: "pern-ecommerce/avatars",
} as const;

export type UploadFolder = keyof typeof FOLDERS;

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a single file buffer to Cloudinary.
 * Uses upload_stream internally so we never write a temp file to disk —
 * multer's memory storage passes the buffer directly.
 */
export async function uploadImage(
  buffer: Buffer,
  folder: UploadFolder,
  options?: {
    /** Override the generated public_id — useful for deterministic filenames */
    publicId?: string;
    /** Transformation applied at upload time — e.g. resize, quality */
    transformation?: object;
  },
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDERS[folder],
        public_id: options?.publicId,
        overwrite: true,
        // Always deliver as WebP for best compression/quality ratio
        format: "webp",
        // Sensible default transformation — prevent giant images from being stored
        transformation: options?.transformation ?? [
          { width: 1200, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
        // Use the secure (HTTPS) URL in the response
        secure: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(buffer);
  });
}

/**
 * Upload multiple buffers concurrently.
 * Returns results in the same order as the input array.
 */
export async function uploadImages(
  buffers: Buffer[],
  folder: UploadFolder,
): Promise<UploadResult[]> {
  return Promise.all(buffers.map((buf) => uploadImage(buf, folder)));
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a single image by its Cloudinary public_id.
 * Silently ignores "not found" — safe to call even if the image was already deleted.
 */
export async function deleteImage(publicId: string): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId);
  // result.result is "ok" on success, "not found" if already gone — both are fine
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(
      `Cloudinary delete failed for ${publicId}: ${result.result}`,
    );
  }
}

/**
 * Delete multiple images concurrently by their public_ids.
 * Uses the batch destroy API when possible (max 100 per call).
 */
export async function deleteImages(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;

  // Cloudinary's delete_resources accepts up to 100 public_ids at once
  const BATCH_SIZE = 100;
  const batches: string[][] = [];

  for (let i = 0; i < publicIds.length; i += BATCH_SIZE) {
    batches.push(publicIds.slice(i, i + BATCH_SIZE));
  }

  await Promise.all(
    batches.map((batch) => cloudinary.api.delete_resources(batch)),
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Extract the Cloudinary public_id from a full secure URL.
 * e.g. "https://res.cloudinary.com/demo/image/upload/v1/pern-ecommerce/products/abc123.webp"
 *   → "pern-ecommerce/products/abc123"
 *
 * Use this when you have stored URLs rather than public_ids in the DB.
 * Note: in this codebase we store public_ids directly on the model, so this
 * is a utility for edge cases (e.g. migrating legacy data).
 */
export function extractPublicId(cloudinaryUrl: string): string {
  // Strip the version segment (/v1234567890/) and the file extension
  const match = cloudinaryUrl.match(/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
  if (!match?.[1]) {
    throw new Error(`Cannot extract public_id from URL: ${cloudinaryUrl}`);
  }
  return match[1];
}
