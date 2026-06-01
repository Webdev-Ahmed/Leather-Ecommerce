import type { NextFunction, Request, Response } from "express";
import { prisma } from "@/lib/db";
import { CreateCategorySchema, UpdateCategorySchema } from "@/lib/validators";
import { validate } from "@/lib/validators";

// ─── GET /api/categories ──────────────────────────────────────────────────────

export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.status(200).json({ status: "ok", data: categories });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/categories/:slug ────────────────────────────────────────────────

export async function getCategoryBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug } = req.params as { slug: string };

    const category = await prisma.category.findUnique({ where: { slug } });

    if (!category) {
      res.status(404).json({ status: "error", message: "Category not found" });
      return;
    }

    res.status(200).json({ status: "ok", data: category });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/categories ─────────────────────────────────────────────────────

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validate(CreateCategorySchema, req.body, res);
    if (!body) return;

    const existing = await prisma.category.findUnique({
      where: { slug: body.slug },
    });
    if (existing) {
      res.status(409).json({
        status: "error",
        message: `slug "${body.slug}" is already taken`,
        errors: [{ field: "slug", message: "slug must be unique" }],
      });
      return;
    }

    const category = await prisma.category.create({ data: body });
    res.status(201).json({ status: "ok", data: category });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/categories/:slug ────────────────────────────────────────────────

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug } = req.params as { slug: string };

    const body = validate(UpdateCategorySchema, req.body, res);
    if (!body) return;

    if (body.slug && body.slug !== slug) {
      const existing = await prisma.category.findUnique({
        where: { slug: body.slug },
      });
      if (existing) {
        res.status(409).json({
          status: "error",
          message: `slug "${body.slug}" is already taken`,
          errors: [{ field: "slug", message: "slug must be unique" }],
        });
        return;
      }
    }

    const category = await prisma.category.update({
      where: { slug },
      data: body,
    });

    res.status(200).json({ status: "ok", data: category });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/categories/:slug ─────────────────────────────────────────────

export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug } = req.params as { slug: string };

    await prisma.category.delete({ where: { slug } });
    res.status(200).json({ status: "ok", message: "Category deleted" });
  } catch (err) {
    next(err);
  }
}
