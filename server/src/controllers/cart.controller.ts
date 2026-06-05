import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/db";
import { validate } from "@/lib/validators";
import { AddToCartSchema, UpdateCartSchema } from "@/lib/validators";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cartItemSelect = {
  id: true,
  quantity: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discountPrice: true,
      images: true,
      stock: true,
    },
  },
  variant: {
    select: {
      id: true,
      color: true,
      colorHex: true,
      size: true,
      sku: true,
      stock: true,
      priceOverride: true,
      images: true,
    },
  },
} as const;

// ─── GET /api/cart ────────────────────────────────────────────────────────────

export async function getCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.userId },
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
    const body = validate(AddToCartSchema, req.body, res);
    if (!body) return;

    const { productId, variantId, quantity } = body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, variants: { select: { id: true } } },
    });
    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found" });
      return;
    }

    // When the product has variants, a variantId is required
    if (product.variants.length > 0 && !variantId) {
      res.status(422).json({
        status: "error",
        message: "This product has variants — please select a colour or size",
        errors: [
          {
            field: "variantId",
            message: "variantId is required for this product",
          },
        ],
      });
      return;
    }

    // Resolve the stock source: variant stock when a variant is selected,
    // product-level stock otherwise
    let availableStock = product.stock;

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true, productId: true },
      });

      if (!variant || variant.productId !== productId) {
        res.status(404).json({ status: "error", message: "Variant not found" });
        return;
      }

      availableStock = variant.stock;
    }

    // Check combined quantity (already in cart + requested)
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cart: { userId: req.userId },
        productId,
        variantId: variantId ?? null,
      },
      select: { id: true, quantity: true },
    });

    const currentQty = existingItem?.quantity ?? 0;
    const newTotalQty = currentQty + quantity;

    if (newTotalQty > availableStock) {
      res.status(422).json({
        status: "error",
        message: `Only ${availableStock} unit(s) available (${currentQty} already in cart)`,
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
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        items: {
          create: { productId, variantId: variantId ?? null, quantity },
        },
      },
      update: {
        items: existingItem
          ? {
              update: {
                where: { id: existingItem.id },
                data: { quantity: newTotalQty },
              },
            }
          : { create: { productId, variantId: variantId ?? null, quantity } },
      },
      select: { id: true, items: { select: cartItemSelect } },
    });

    res.status(200).json({ status: "ok", data: cart });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/cart/:cartItemId ────────────────────────────────────────────────
// Route param is now cartItemId (not productId) — because the same product in
// two different variants creates two separate cart rows, so productId alone
// is no longer a unique identifier within the cart.

export async function updateCartItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validate(UpdateCartSchema, req.body, res);
    if (!body) return;

    const { cartItemId } = req.params as { cartItemId: string };

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cart: { userId: req.userId } },
      select: {
        id: true,
        productId: true,
        variantId: true,
        product: { select: { stock: true } },
        variant: { select: { stock: true } },
      },
    });

    if (!cartItem) {
      res.status(404).json({ status: "error", message: "Cart item not found" });
      return;
    }

    const availableStock = cartItem.variant?.stock ?? cartItem.product.stock;

    if (body.quantity > availableStock) {
      res.status(422).json({
        status: "error",
        message: `Only ${availableStock} unit(s) available`,
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
      where: { userId: req.userId },
      select: { id: true, items: { select: cartItemSelect } },
    });

    res.status(200).json({ status: "ok", data: cart });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/cart/:cartItemId ─────────────────────────────────────────────

export async function removeFromCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cartItemId } = req.params as { cartItemId: string };

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cart: { userId: req.userId } },
      select: { id: true },
    });

    if (!cartItem) {
      res.status(404).json({ status: "error", message: "Cart item not found" });
      return;
    }

    await prisma.cartItem.delete({ where: { id: cartItem.id } });

    const cart = await prisma.cart.findUnique({
      where: { userId: req.userId },
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
    const cart = await prisma.cart.findUnique({
      where: { userId: req.userId },
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
