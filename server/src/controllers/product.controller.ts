import type { NextFunction, Request, Response } from "express";
import { prisma } from "@/lib/db";
import {
  CreateProductSchema,
  UpdateProductSchema,
} from "@/schemas/product.schema";
import { ProductQuerySchema, validate } from "@/lib/validators";

// ─── GET /api/products ────────────────────────────────────────────────────────

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = validate(ProductQuerySchema, req.query, res);
    if (!query) return;

    const { page, limit, search, category, gender } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(category && { categoryId: category }),
      ...(gender && { gender }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { tags: { has: search } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.status(200).json({
      status: "ok",
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/products/:slug ──────────────────────────────────────────────────

export async function getProductBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug } = req.params as { slug: string };

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: { select: { name: true, slug: true } } },
    });

    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found" });
      return;
    }

    res.status(200).json({ status: "ok", data: product });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/products ───────────────────────────────────────────────────────

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validate(CreateProductSchema, req.body, res);
    if (!body) return;

    // Check for duplicate slug
    const existingSlug = await prisma.product.findUnique({
      where: { slug: body.slug },
    });
    if (existingSlug) {
      res.status(409).json({
        status: "error",
        message: `slug "${body.slug}" is already taken`,
        errors: [{ field: "slug", message: "slug must be unique" }],
      });
      return;
    }

    // Verify the referenced category actually exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: body.categoryId },
    });
    if (!categoryExists) {
      res.status(422).json({
        status: "error",
        message: "Validation failed",
        errors: [{ field: "categoryId", message: "Category not found" }],
      });
      return;
    }

    const product = await prisma.product.create({
      data: body,
      include: { category: { select: { name: true, slug: true } } },
    });

    res.status(201).json({ status: "ok", data: product });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/products/:slug ──────────────────────────────────────────────────

export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug } = req.params as { slug: string };

    const body = validate(UpdateProductSchema, req.body, res);
    if (!body) return;

    // If slug is being changed, make sure the new one isn't taken by a
    // *different* product.
    if (body.slug && body.slug !== slug) {
      const slugConflict = await prisma.product.findUnique({
        where: { slug: body.slug },
      });
      if (slugConflict) {
        res.status(409).json({
          status: "error",
          message: `slug "${body.slug}" is already taken`,
          errors: [{ field: "slug", message: "slug must be unique" }],
        });
        return;
      }
    }

    // If categoryId is being updated, verify it exists
    if (body.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: body.categoryId },
      });
      if (!categoryExists) {
        res.status(422).json({
          status: "error",
          message: "Validation failed",
          errors: [{ field: "categoryId", message: "Category not found" }],
        });
        return;
      }
    }

    const product = await prisma.product.update({
      where: { slug },
      data: body,
      include: { category: { select: { name: true, slug: true } } },
    });

    res.status(200).json({ status: "ok", data: product });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/products/:slug ───────────────────────────────────────────────

export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug } = req.params as { slug: string };

    await prisma.product.delete({ where: { slug } });
    res.status(200).json({ status: "ok", message: "Product deleted" });
  } catch (err) {
    next(err);
  }
}
