import { Router } from "express";
import {
  register,
  login,
  googleAuth,
  refresh,
  logout,
  logoutAll,
  me,
} from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/requireAuth";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/refresh", refresh);
router.post("/logout", logout);

// ─── Authenticated ────────────────────────────────────────────────────────────

router.post("/logout-all", requireAuth, logoutAll);
router.get("/me", requireAuth, me);

export default router;
