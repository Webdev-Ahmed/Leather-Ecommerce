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

// :cartItemId instead of :productId — one product in two variants = two rows
router.put("/:cartItemId", updateCartItem);
router.delete("/:cartItemId", removeFromCart);

export default router;
