import type { Request, Response } from "express";
import { Cart } from "../models";

export async function getCart(req: Request, res: Response): Promise<void> {
  // req.userId will be set by auth middleware — placeholder for now
  const userId = (req as Request & { userId?: string }).userId;

  const cart = await Cart.findOne({ user: userId })
    .populate("items.product", "name slug price discountPrice images stock")
    .lean();

  if (!cart) {
    // Return an empty cart shape instead of 404 — better UX
    res.status(200).json({ status: "ok", data: { items: [] } });
    return;
  }

  res.status(200).json({ status: "ok", data: cart });
}

export async function addToCart(req: Request, res: Response): Promise<void> {
  const userId = (req as Request & { userId?: string }).userId;
  const { productId, quantity = 1 } = req.body;

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity }],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
  }

  await cart.populate(
    "items.product",
    "name slug price discountPrice images stock",
  );

  res.status(200).json({ status: "ok", data: cart });
}

export async function updateCartItem(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as Request & { userId?: string }).userId;
  const { quantity } = req.body;
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    res.status(404).json({ status: "error", message: "Cart not found" });
    return;
  }

  const item = cart.items.find((item) => item.product.toString() === productId);

  if (!item) {
    res.status(404).json({ status: "error", message: "Item not in cart" });
    return;
  }

  item.quantity = quantity;
  await cart.save();
  await cart.populate(
    "items.product",
    "name slug price discountPrice images stock",
  );

  res.status(200).json({ status: "ok", data: cart });
}

export async function removeFromCart(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as Request & { userId?: string }).userId;
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    res.status(404).json({ status: "error", message: "Cart not found" });
    return;
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId,
  );

  await cart.save();

  res.status(200).json({ status: "ok", data: cart });
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  const userId = (req as Request & { userId?: string }).userId;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    res.status(404).json({ status: "error", message: "Cart not found" });
    return;
  }

  cart.items = [];
  await cart.save();

  res.status(200).json({ status: "ok", message: "Cart cleared" });
}
