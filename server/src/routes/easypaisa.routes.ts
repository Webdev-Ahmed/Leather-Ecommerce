import { Router } from "express";
import {
  initiateEasypaisaPayment,
  easypaisaCallback,
} from "@/controllers/easypaisa.controller";
import { requireAuth } from "@/middleware/requireAuth";

const router = Router();

// Initiate — authenticated (only the order owner can start payment)
router.post("/initiate", requireAuth, initiateEasypaisaPayment);

// Callback — public, called server-to-server by Easypaisa
// Do NOT add requireAuth — Easypaisa sends no Bearer token
router.post("/callback", easypaisaCallback);

export default router;
