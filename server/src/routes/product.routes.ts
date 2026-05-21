import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { requireAdmin } from "../middleware/requireAdmin";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

const slugParam = param("slug")
  .trim()
  .notEmpty()
  .withMessage("Slug is required");

const productListQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search query too long"),
  query("category")
    .optional()
    .trim()
    .isMongoId()
    .withMessage("Invalid category ID"),
];

const productBody = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 200 })
    .withMessage("Name must be under 200 characters"),
  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Slug is required")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase letters, numbers, and hyphens only"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("discountPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be a positive number"),
  body("category").isMongoId().withMessage("Invalid category ID"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
];

const productUpdateBody = productBody.map((v) => v.optional());

router.get("/", productListQuery, validateRequest, getProducts);
router.get("/:slug", slugParam, validateRequest, getProductBySlug);

router.post("/", requireAdmin, productBody, validateRequest, createProduct);

router.put(
  "/:slug",
  requireAdmin,
  slugParam,
  productUpdateBody,
  validateRequest,
  updateProduct,
);

router.delete(
  "/:slug",
  requireAdmin,
  slugParam,
  validateRequest,
  deleteProduct,
);

export default router;
