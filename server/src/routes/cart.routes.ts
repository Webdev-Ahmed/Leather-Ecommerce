import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "@/controllers/cart.controller";
import { requireAuth } from "@/middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/", getCart);
router.post("/", addToCart);

router.delete("/", clearCart);
router.put("/:productId", updateCartItem);
router.delete("/:productId", removeFromCart);

export default router;
