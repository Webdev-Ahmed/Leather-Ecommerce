import { Router } from "express";
import {
  getOrders,
  getOrderById,
  getOrderTracking,
  createOrder,
  updateOrderStatus,
  cancelOrder,
} from "@/controllers/order.controller";
import { requireAuth } from "@/middleware/requireAuth";
import { requireAdmin } from "@/middleware/requireAdmin";

const router = Router();

// All order routes require authentication
router.use(requireAuth);

// ─── Customer ─────────────────────────────────────────────────────────────────

router.get("/", getOrders);
router.get("/:id", getOrderById);
router.get("/:id/tracking", getOrderTracking);
router.post("/", createOrder);
router.patch("/:id/cancel", cancelOrder);

// ─── Admin / Manager ──────────────────────────────────────────────────────────

router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
