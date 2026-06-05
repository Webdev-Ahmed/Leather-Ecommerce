import { Router } from "express";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/controllers/category.controller";
import { requireAuth } from "@/middleware/requireAuth";
import { requireAdmin } from "@/middleware/requireAdmin";
import { withUpload, uploadSingle } from "@/middleware/upload";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

router.get("/", getCategories);
router.get("/:slug", getCategoryBySlug);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.post(
  "/",
  requireAuth,
  requireAdmin,
  withUpload(uploadSingle),
  createCategory,
);

router.put(
  "/:slug",
  requireAuth,
  requireAdmin,
  withUpload(uploadSingle),
  updateCategory,
);

router.delete("/:slug", requireAuth, requireAdmin, deleteCategory);

export default router;
