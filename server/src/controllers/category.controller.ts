import type { NextFunction, Request, Response } from "express";
import { prisma } from "@/lib/db";
import { AppError } from "@/middleware/errorHandler";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  validate,
} from "@/lib/validators";
import { uploadImage, deleteImage, extractPublicId } from "@/lib/cloudinary";

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
      throw new AppError(404, "Category not found");
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
      select: { id: true },
    });
    if (existing) {
      res.status(409).json({
        status: "error",
        message: `slug "${body.slug}" is already taken`,
        errors: [{ field: "slug", message: "slug must be unique" }],
      });
      return;
    }

    // Upload image if a file was attached
    let imageUrl = body.image ?? "";
    if (req.file) {
      const result = await uploadImage(req.file.buffer, "categories", {
        // Use the slug as a deterministic public_id so re-uploading the same
        // category replaces the image rather than creating a duplicate
        publicId: body.slug,
      });
      imageUrl = result.url;
    }

    const category = await prisma.category.create({
      data: { ...body, image: imageUrl },
    });

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

    // Fetch existing category for slug conflict check and old image cleanup
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, image: true },
    });
    if (!existing) {
      throw new AppError(404, "Category not found");
    }

    if (body.slug && body.slug !== slug) {
      const conflict = await prisma.category.findUnique({
        where: { slug: body.slug },
        select: { id: true },
      });
      if (conflict) {
        res.status(409).json({
          status: "error",
          message: `slug "${body.slug}" is already taken`,
          errors: [{ field: "slug", message: "slug must be unique" }],
        });
        return;
      }
    }

    let imageUrl: string | undefined;

    if (req.file) {
      // Upload the new image — use the new slug if it's changing, else the current one
      const targetSlug = body.slug ?? slug;
      const result = await uploadImage(req.file.buffer, "categories", {
        publicId: targetSlug,
      });
      imageUrl = result.url;

      // Delete the old image if it exists and isn't the same public_id
      // (if slug didn't change the overwrite: true in uploadImage handles it,
      // but if the slug changed we need to explicitly remove the old file)
      if (existing.image && body.slug && body.slug !== slug) {
        const oldPublicId = extractPublicId(existing.image);
        deleteImage(oldPublicId).catch((err: unknown) => {
          console.error(
            "[Cloudinary] Failed to delete old category image:",
            err,
          );
        });
      }
    }

    const category = await prisma.category.update({
      where: { slug },
      data: {
        ...body,
        ...(imageUrl !== undefined && { image: imageUrl }),
      },
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

    const category = await prisma.category.findUnique({
      where: { slug },
      select: { image: true },
    });

    if (!category) {
      throw new AppError(404, "Category not found");
    }

    await prisma.category.delete({ where: { slug } });

    // Clean up the Cloudinary image after the DB row is gone
    if (category.image) {
      const publicId = extractPublicId(category.image);
      deleteImage(publicId).catch((err: unknown) => {
        console.error("[Cloudinary] Failed to delete category image:", err);
      });
    }

    res.status(200).json({ status: "ok", message: "Category deleted" });
  } catch (err) {
    next(err);
  }
}
