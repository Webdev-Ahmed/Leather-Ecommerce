import { Router } from "express";
import { body, param } from "express-validator";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { requireAdmin } from "../middleware/requireAdmin";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

const slugParam = param("slug")
  .trim()
  .notEmpty()
  .withMessage("Slug is required");

const categoryBody = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must be under 100 characters"),
  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Slug is required")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase letters, numbers, and hyphens only"),
];

const categoryUpdateBody = categoryBody.map((v) => v.optional());

router.get("/", getCategories);
router.get("/:slug", slugParam, validateRequest, getCategoryBySlug);

router.post("/", requireAdmin, categoryBody, validateRequest, createCategory);

router.put(
  "/:slug",
  requireAdmin,
  slugParam,
  categoryUpdateBody,
  validateRequest,
  updateCategory,
);

router.delete(
  "/:slug",
  requireAdmin,
  slugParam,
  validateRequest,
  deleteCategory,
);

export default router;
