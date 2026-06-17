import { Router } from "express";
import { getUsers, updateUserRole } from "@/controllers/user.controller";
import { requireAuth } from "@/middleware/requireAuth";
import { requireRole } from "@/middleware/requireRole";

const router = Router();

router.use(requireAuth, requireRole("owner"));

router.get("/", getUsers);
router.patch("/:id/role", updateUserRole);

export default router;
