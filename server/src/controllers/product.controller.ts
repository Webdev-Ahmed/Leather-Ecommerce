import type { NextFunction, Request, Response } from "express";
import { prisma } from "@/lib/db";
import { AppError } from "@/middleware/errorHandler";
import { validate } from "@/lib/validators";
import {
  CreateProductSchema,
  UpdateProductSchema,
} from "@/schemas/product.schema";
import { ProductQuerySchema } from "@/lib/validators";
import { uploadImages, deleteImages, extractPublicId } from "@/lib/cloudinary";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const variantSelect = {
  id: true,
  color: true,
  colorHex: true,
  size: true,
  sku: true,
  stock: true,
  priceOverride: true,
  images: true,
} as const;

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  discountPrice: true,
  images: true,
  stock: true,
  isFeatured: true,
  gender: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { name: true, slug: true } },
  variants: { select: variantSelect, orderBy: { color: "asc" as const } },
} as const;

function getUploadedBuffers(req: Request): Buffer[] {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  return files?.["images"]?.map((f) => f.buffer) ?? [];
}

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
        select: productSelect,
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
      select: productSelect,
    });

    if (!product) {
      throw new AppError(404, "Product not found");
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

    const existingSlug = await prisma.product.findUnique({
      where: { slug: body.slug },
      select: { id: true },
    });
    if (existingSlug) {
      res.status(409).json({
        status: "error",
        message: `slug "${body.slug}" is already taken`,
        errors: [{ field: "slug", message: "slug must be unique" }],
      });
      return;
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: body.categoryId },
      select: { id: true },
    });
    if (!categoryExists) {
      res.status(422).json({
        status: "error",
        message: "Validation failed",
        errors: [{ field: "categoryId", message: "Category not found" }],
      });
      return;
    }

    const buffers = getUploadedBuffers(req);
    const uploaded =
      buffers.length > 0 ? await uploadImages(buffers, "products") : [];
    const imageUrls = [...uploaded.map((r) => r.url), ...(body.images ?? [])];

    const { variants, ...productData } = body;

    const product = await prisma.product.create({
      data: {
        ...productData,
        images: imageUrls,
        variants:
          variants && variants.length > 0 ? { create: variants } : undefined,
      },
      select: productSelect,
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

    const existing = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        images: true,
        variants: { select: { id: true, images: true } },
      },
    });
    if (!existing) {
      throw new AppError(404, "Product not found");
    }

    if (body.slug && body.slug !== slug) {
      const slugConflict = await prisma.product.findUnique({
        where: { slug: body.slug },
        select: { id: true },
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

    if (body.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: body.categoryId },
        select: { id: true },
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

    const buffers = getUploadedBuffers(req);
    const uploaded =
      buffers.length > 0 ? await uploadImages(buffers, "products") : [];

    let finalImages = existing.images;
    if (buffers.length > 0 || body.images !== undefined) {
      const keptUrls = body.images ?? existing.images;
      finalImages = [...keptUrls, ...uploaded.map((r) => r.url)];

      const removedUrls = existing.images.filter(
        (url) => !keptUrls.includes(url),
      );
      if (removedUrls.length > 0) {
        deleteImages(removedUrls.map(extractPublicId)).catch((err: unknown) => {
          console.error(
            "[Cloudinary] Failed to delete removed product images:",
            err,
          );
        });
      }
    }

    const { variants, ...productData } = body;

    const product = await prisma.$transaction(async (tx) => {
      // Upsert variants by id: update existing rows, create new ones.
      // Never blindly delete — cart items and order items may reference them.
      if (variants !== undefined) {
        for (const variant of variants) {
          const { id: variantId, ...variantData } = variant;
          if (variantId) {
            await tx.productVariant.update({
              where: { id: variantId },
              data: variantData,
            });
          } else {
            await tx.productVariant.create({
              data: { ...variantData, productId: existing.id },
            });
          }
        }
      }

      return tx.product.update({
        where: { slug },
        data: { ...productData, images: finalImages },
        select: productSelect,
      });
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

    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        images: true,
        variants: { select: { images: true } },
      },
    });

    if (!product) {
      throw new AppError(404, "Product not found");
    }

    await prisma.product.delete({ where: { slug } });

    const allImages = [
      ...product.images,
      ...product.variants.flatMap((v) => v.images),
    ];
    if (allImages.length > 0) {
      deleteImages(allImages.map(extractPublicId)).catch((err: unknown) => {
        console.error("[Cloudinary] Failed to delete product images:", err);
      });
    }

    res.status(200).json({ status: "ok", message: "Product deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/products/:slug/variants/:variantId ───────────────────────────
// Only allowed when no active cart items or non-terminal orders reference the variant.

export async function deleteVariant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { variantId } = req.params as { variantId: string };

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        images: true,
        cartItems: { select: { id: true }, take: 1 },
        orderItems: {
          select: { id: true },
          where: { order: { status: { notIn: ["delivered", "cancelled"] } } },
          take: 1,
        },
      },
    });

    if (!variant) {
      throw new AppError(404, "Variant not found");
    }

    if (variant.cartItems.length > 0) {
      throw new AppError(
        409,
        "This variant is in one or more customer carts and cannot be deleted",
      );
    }

    if (variant.orderItems.length > 0) {
      throw new AppError(
        409,
        "This variant has active orders and cannot be deleted until they are completed or cancelled",
      );
    }

    await prisma.productVariant.delete({ where: { id: variantId } });

    if (variant.images.length > 0) {
      deleteImages(variant.images.map(extractPublicId)).catch(
        (err: unknown) => {
          console.error("[Cloudinary] Failed to delete variant images:", err);
        },
      );
    }

    res.status(200).json({ status: "ok", message: "Variant deleted" });
  } catch (err) {
    next(err);
  }
}
