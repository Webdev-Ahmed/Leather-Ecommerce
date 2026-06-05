import { Router } from "express";
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/controllers/address.controller";
import { requireAuth } from "@/middleware/requireAuth";

const router = Router();

// All address routes require authentication
router.use(requireAuth);

router.get("/", getAddresses);
router.get("/:id", getAddressById);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.patch("/:id/default", setDefaultAddress);

export default router;
