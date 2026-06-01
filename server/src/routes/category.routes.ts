import { Router } from "express";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/controllers/category.controller";
import { requireAdmin } from "@/middleware/requireAdmin";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

router.get("/", getCategories);
router.get("/:slug", getCategoryBySlug);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.post("/", requireAdmin, createCategory);
router.put("/:slug", requireAdmin, updateCategory);
router.delete("/:slug", requireAdmin, deleteCategory);

export default router;
