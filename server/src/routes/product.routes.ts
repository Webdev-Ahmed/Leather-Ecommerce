import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteVariant,
} from "@/controllers/product.controller";
import { requireAuth } from "@/middleware/requireAuth";
import { requireAdmin } from "@/middleware/requireAdmin";
import { withUpload, uploadMultiple } from "@/middleware/upload";
import reviewRoutes from "./review.routes";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.post(
  "/",
  requireAuth,
  requireAdmin,
  withUpload(uploadMultiple),
  createProduct,
);
router.put(
  "/:slug",
  requireAuth,
  requireAdmin,
  withUpload(uploadMultiple),
  updateProduct,
);
router.delete("/:slug", requireAuth, requireAdmin, deleteProduct);

// Variant delete — slug is context for the admin UI, variantId drives the operation
router.delete(
  "/:slug/variants/:variantId",
  requireAuth,
  requireAdmin,
  deleteVariant,
);

// ─── Reviews (nested) ─────────────────────────────────────────────────────────

router.use("/:slug/reviews", reviewRoutes);

export default router;
