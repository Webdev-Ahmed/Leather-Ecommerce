import { Router } from "express";
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} from "@/controllers/review.controller";
import { requireAuth } from "@/middleware/requireAuth";

// Mounted under /api/products/:slug/reviews via the product router
const router = Router({ mergeParams: true });

// ─── Public ───────────────────────────────────────────────────────────────────

router.get("/", getReviews);

// ─── Authenticated ────────────────────────────────────────────────────────────

router.post("/", requireAuth, createReview);
router.patch("/:reviewId", requireAuth, updateReview);
router.delete("/:reviewId", requireAuth, deleteReview);

export default router;
