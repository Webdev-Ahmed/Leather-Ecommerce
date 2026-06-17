import { Router } from "express";
import { initiatePayment, itn } from "@/controllers/payfast.controller";
import { requireAuth } from "@/middleware/requireAuth";

const router = Router();

// Initiate payment — authenticated (only the order owner can start payment)
router.post("/initiate", requireAuth, initiatePayment);

// ITN webhook — public, called server-to-server by PayFast
// Do NOT add requireAuth here — PayFast has no Bearer token
router.post("/itn", itn);

export default router;
