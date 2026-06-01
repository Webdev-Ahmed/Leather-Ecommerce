import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/db";
import { validate, AddToCartSchema, UpdateCartSchema } from "@/lib/validators";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cartItemSelect = {
  id: true,
  quantity: true,
  product: {
    select: {
      name: true,
      slug: true,
      price: true,
      discountPrice: true,
      images: true,
      stock: true,
    },
  },
} as const;

function getUserId(req: Request, res: Response): string | null {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) {
    res.status(401).json({ status: "error", message: "Unauthorized" });
    return null;
  }
  return userId;
}

// ─── GET /api/cart ────────────────────────────────────────────────────────────

export async function getCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true, items: { select: cartItemSelect } },
    });

    res.status(200).json({ status: "ok", data: cart ?? { items: [] } });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/cart ───────────────────────────────────────────────────────────

export async function addToCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const body = validate(AddToCartSchema, req.body, res);
    if (!body) return;

    const { productId, quantity } = body;

    // Verify the product exists and has sufficient stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found" });
      return;
    }

    // Get existing cart item quantity (if any) to check combined stock
    const existingItem = await prisma.cartItem.findFirst({
      where: { cart: { userId }, productId },
      select: { id: true, quantity: true },
    });

    const currentQty = existingItem?.quantity ?? 0;
    const newTotalQty = currentQty + quantity;

    if (newTotalQty > product.stock) {
      res.status(422).json({
        status: "error",
        message: `Only ${product.stock} unit(s) available (${currentQty} already in cart)`,
        errors: [
          {
            field: "quantity",
            message: "Requested quantity exceeds available stock",
          },
        ],
      });
      return;
    }

    const cart = await prisma.cart.upsert({
      where: { userId },
      create: {
        userId,
        items: { create: { productId, quantity } },
      },
      update: {
        items: existingItem
          ? {
              update: {
                where: { id: existingItem.id },
                data: { quantity: newTotalQty },
              },
            }
          : { create: { productId, quantity } },
      },
      select: { id: true, items: { select: cartItemSelect } },
    });

    res.status(200).json({ status: "ok", data: cart });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/cart/:productId ─────────────────────────────────────────────────

export async function updateCartItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const body = validate(UpdateCartSchema, req.body, res);
    if (!body) return;

    const { productId } = req.params as { productId: string };

    const cartItem = await prisma.cartItem.findFirst({
      where: { cart: { userId }, productId },
      select: { id: true },
    });

    if (!cartItem) {
      res.status(404).json({ status: "error", message: "Item not in cart" });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found" });
      return;
    }

    if (body.quantity > product.stock) {
      res.status(422).json({
        status: "error",
        message: `Only ${product.stock} unit(s) available`,
        errors: [
          {
            field: "quantity",
            message: "Requested quantity exceeds available stock",
          },
        ],
      });
      return;
    }

    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: body.quantity },
    });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true, items: { select: cartItemSelect } },
    });

    res.status(200).json({ status: "ok", data: cart });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/cart/:productId ──────────────────────────────────────────────

export async function removeFromCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { productId } = req.params as { productId: string };

    const cartItem = await prisma.cartItem.findFirst({
      where: { cart: { userId }, productId },
      select: { id: true },
    });

    if (!cartItem) {
      res.status(404).json({ status: "error", message: "Item not in cart" });
      return;
    }

    await prisma.cartItem.delete({ where: { id: cartItem.id } });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true, items: { select: cartItemSelect } },
    });

    res.status(200).json({ status: "ok", data: cart ?? { items: [] } });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────

export async function clearCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      res.status(404).json({ status: "error", message: "Cart not found" });
      return;
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.status(200).json({ status: "ok", message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
}
