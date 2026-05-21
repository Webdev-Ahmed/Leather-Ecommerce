import type { Request, Response } from "express";
import { Product } from "../models";

export async function getProducts(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 12);
  const skip = (page - 1) * limit;
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;

  const filter: Record<string, unknown> = {};

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
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
}

export async function getProductBySlug(
  req: Request,
  res: Response,
): Promise<void> {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category", "name slug")
    .lean();

  if (!product) {
    res.status(404).json({ status: "error", message: "Product not found" });
    return;
  }

  res.status(200).json({ status: "ok", data: product });
}

export async function createProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const product = await Product.create(req.body);

  res.status(201).json({ status: "ok", data: product });
}

export async function updateProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const product = await Product.findOneAndUpdate(
    { slug: req.params.slug },
    req.body,
    { new: true, runValidators: true },
  ).lean();

  if (!product) {
    res.status(404).json({ status: "error", message: "Product not found" });
    return;
  }

  res.status(200).json({ status: "ok", data: product });
}

export async function deleteProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const product = await Product.findOneAndDelete({ slug: req.params.slug });

  if (!product) {
    res.status(404).json({ status: "error", message: "Product not found" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Product deleted" });
}
