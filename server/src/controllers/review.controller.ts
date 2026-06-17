import type { NextFunction, Request, Response } from "express";
import { prisma } from "@/lib/db";
import { AppError } from "@/middleware/errorHandler";
import { validate } from "@/lib/validators";
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  ReviewQuerySchema,
} from "@/schemas/review.schema";
import { ADMIN_ROLES, hasRole } from "@/lib/roles";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const reviewSelect = {
  id: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, name: true, avatarUrl: true },
  },
  productId: true,
} as const;

// ─── GET /api/products/:slug/reviews ─────────────────────────────────────────

export async function getReviews(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug } = req.params as { slug: string };

    const query = validate(ReviewQuerySchema, req.query, res);
    if (!query) return;

    const { page, limit } = query;

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      throw new AppError(404, "Product not found");
    }

    const [total, reviews] = await prisma.$transaction([
      prisma.review.count({ where: { productId: product.id } }),
      prisma.review.findMany({
        where: { productId: product.id },
        select: reviewSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.status(200).json({
      status: "ok",
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/products/:slug/reviews ────────────────────────────────────────
//
// A user may only submit one review per product. They must have purchased
// and received the product before they can review it.

export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug } = req.params as { slug: string };

    const body = validate(CreateReviewSchema, req.body, res);
    if (!body) return;

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      throw new AppError(404, "Product not found");
    }

    // Only customers who have a delivered order containing this product may review it
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: req.userId,
        status: "delivered",
        items: { some: { productId: product.id } },
      },
      select: { id: true },
    });

    if (!deliveredOrder) {
      throw new AppError(
        403,
        "You can only review products from a delivered order",
      );
    }

    // Enforce one review per user per product at the DB level (@@unique) and here
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId: req.userId, productId: product.id } },
      select: { id: true },
    });

    if (existing) {
      throw new AppError(409, "You have already reviewed this product");
    }

    const review = await prisma.review.create({
      data: {
        body: body.body,
        userId: req.userId,
        productId: product.id,
      },
      select: reviewSelect,
    });

    res.status(201).json({ status: "ok", data: review });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/products/:slug/reviews/:reviewId ─────────────────────────────

export async function updateReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug, reviewId } = req.params as { slug: string; reviewId: string };

    const body = validate(UpdateReviewSchema, req.body, res);
    if (!body) return;

    // Verify the product exists and the review belongs to it
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true, product: { select: { slug: true } } },
    });

    if (!existing || existing.product.slug !== slug) {
      throw new AppError(404, "Review not found");
    }

    const isAdmin = hasRole(req.userRole, ADMIN_ROLES);

    if (!isAdmin && existing.userId !== req.userId) {
      throw new AppError(403, "You can only edit your own reviews");
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { body: body.body },
      select: reviewSelect,
    });

    res.status(200).json({ status: "ok", data: review });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/products/:slug/reviews/:reviewId ────────────────────────────

export async function deleteReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { slug, reviewId } = req.params as { slug: string; reviewId: string };

    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true, product: { select: { slug: true } } },
    });

    if (!existing || existing.product.slug !== slug) {
      throw new AppError(404, "Review not found");
    }

    const isAdmin = hasRole(req.userRole, ADMIN_ROLES);

    if (!isAdmin && existing.userId !== req.userId) {
      throw new AppError(403, "You can only delete your own reviews");
    }

    await prisma.review.delete({ where: { id: reviewId } });

    res.status(200).json({ status: "ok", message: "Review deleted" });
  } catch (err) {
    next(err);
  }
}
