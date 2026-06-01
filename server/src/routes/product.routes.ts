import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/controllers/product.controller";
import { requireAdmin } from "@/middleware/requireAdmin";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.post("/", requireAdmin, createProduct);
router.put("/:slug", requireAdmin, updateProduct);
router.delete("/:slug", requireAdmin, deleteProduct);

export default router;
