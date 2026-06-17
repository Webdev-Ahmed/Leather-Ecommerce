import { Router } from "express";
import {
  initiateJazzCashPayment,
  jazzCashCallback,
} from "@/controllers/jazzcash.controller";
import { requireAuth } from "@/middleware/requireAuth";

const router = Router();

// Initiate — authenticated (only the order owner can start payment)
router.post("/initiate", requireAuth, initiateJazzCashPayment);

// Callback — public, called by JazzCash as a browser redirect POST
// Do NOT add requireAuth — JazzCash sends no Bearer token
router.post("/callback", jazzCashCallback);

export default router;
