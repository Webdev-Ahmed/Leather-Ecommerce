import type { Request, Response } from "express";
import { Category } from "../models";

export async function getCategories(
  _req: Request,
  res: Response,
): Promise<void> {
  const categories = await Category.find().sort({ name: 1 }).lean();

  res.status(200).json({ status: "ok", data: categories });
}

export async function getCategoryBySlug(
  req: Request,
  res: Response,
): Promise<void> {
  const category = await Category.findOne({ slug: req.params.slug }).lean();

  if (!category) {
    res.status(404).json({ status: "error", message: "Category not found" });
    return;
  }

  res.status(200).json({ status: "ok", data: category });
}

export async function createCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const category = await Category.create(req.body);

  res.status(201).json({ status: "ok", data: category });
}

export async function updateCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const category = await Category.findOneAndUpdate(
    { slug: req.params.slug },
    req.body,
    { new: true, runValidators: true },
  ).lean();

  if (!category) {
    res.status(404).json({ status: "error", message: "Category not found" });
    return;
  }

  res.status(200).json({ status: "ok", data: category });
}

export async function deleteCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const category = await Category.findOneAndDelete({ slug: req.params.slug });

  if (!category) {
    res.status(404).json({ status: "error", message: "Category not found" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Category deleted" });
}
