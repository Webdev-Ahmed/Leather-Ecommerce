import { Router } from "express";
import {
  subscribe,
  unsubscribe,
  blast,
} from "@/controllers/newsletter.controller";
import { requireAuth } from "@/middleware/requireAuth";
import { requireAdmin } from "@/middleware/requireAdmin";

const router = Router();

router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);
router.post("/blast", requireAuth, requireAdmin, blast);

export default router;
