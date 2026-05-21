import { Router } from "express";
import { body, param } from "express-validator";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

const productIdParam = param("productId")
  .isMongoId()
  .withMessage("Invalid product ID");

const addToCartBody = [
  body("productId").isMongoId().withMessage("Invalid product ID"),
  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
];

const updateCartBody = [
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

router.get("/", getCart);
router.post("/", addToCartBody, validateRequest, addToCart);
router.put(
  "/:productId",
  productIdParam,
  updateCartBody,
  validateRequest,
  updateCartItem,
);
router.delete("/:productId", productIdParam, validateRequest, removeFromCart);
router.delete("/", clearCart);

export default router;
