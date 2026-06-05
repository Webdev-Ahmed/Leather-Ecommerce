import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/db";
import { AppError } from "@/middleware/errorHandler";
import { validate } from "@/lib/validators";
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  OrderQuerySchema,
} from "@/schemas/order.schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const orderSelect = {
  id: true,
  totalAmount: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  shippingAddress: true,
  trackingNumber: true,
  merchantRef: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      name: true,
      price: true,
      quantity: true,
      image: true,
      color: true,
      size: true,
      sku: true,
      productId: true,
      variantId: true,
    },
  },
  events: {
    select: { id: true, status: true, note: true, createdAt: true },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

// ─── GET /api/orders ──────────────────────────────────────────────────────────

export async function getOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = validate(OrderQuerySchema, req.query, res);
    if (!query) return;

    const { page, limit, status, paymentStatus, userId } = query;
    const isAdmin = req.userRole === "admin" || req.userRole === "manager";

    const userFilter = isAdmin
      ? userId !== undefined
        ? { userId }
        : {}
      : { userId: req.userId };

    const where = {
      ...userFilter,
      ...(status !== undefined && { status }),
      ...(paymentStatus !== undefined && { paymentStatus }),
    };

    const [total, orders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        select: orderSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.status(200).json({
      status: "ok",
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────

export async function getOrderById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const order = await prisma.order.findUnique({
      where: { id },
      select: { ...orderSelect, userId: true },
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    const isAdmin = req.userRole === "admin" || req.userRole === "manager";

    if (!isAdmin && order.userId !== req.userId) {
      throw new AppError(404, "Order not found");
    }

    const { userId: _userId, ...orderData } = order;

    res.status(200).json({ status: "ok", data: orderData });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validate(CreateOrderSchema, req.body, res);
    if (!body) return;

    const { paymentMethod, addressId, shippingAddress: inlineAddress } = body;

    // ── 1. Resolve shipping address ───────────────────────────────────────────
    let shippingAddress: object;

    if (addressId !== undefined) {
      const saved = await prisma.address.findUnique({
        where: { id: addressId },
        select: {
          label: true,
          street: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          userId: true,
        },
      });

      if (!saved) throw new AppError(404, "Address not found");
      if (saved.userId !== req.userId) {
        throw new AppError(403, "That address does not belong to you");
      }

      const { userId: _uid, ...addressData } = saved;
      shippingAddress = addressData;
    } else {
      shippingAddress = inlineAddress!;
    }

    // ── 2. Load cart ──────────────────────────────────────────────────────────
    const cart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      select: {
        id: true,
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
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
                size: true,
                sku: true,
                stock: true,
                priceOverride: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError(400, "Your cart is empty");
    }

    // ── 3. Validate stock ─────────────────────────────────────────────────────
    const stockErrors: {
      product: string;
      available: number;
      requested: number;
    }[] = [];

    for (const item of cart.items) {
      const availableStock = item.variant?.stock ?? item.product.stock;
      if (item.quantity > availableStock) {
        stockErrors.push({
          product: item.variant?.color
            ? `${item.product.name} (${item.variant.color}${item.variant.size ? ` / ${item.variant.size}` : ""})`
            : item.product.name,
          available: availableStock,
          requested: item.quantity,
        });
      }
    }

    if (stockErrors.length > 0) {
      res.status(422).json({
        status: "error",
        message: "Some items in your cart exceed available stock",
        errors: stockErrors.map((e) => ({
          field: "quantity",
          message: `"${e.product}" only has ${e.available} unit(s) available (${e.requested} requested)`,
        })),
      });
      return;
    }

    // ── 4. Calculate total ────────────────────────────────────────────────────
    const totalAmount = cart.items.reduce((sum, item) => {
      const effectivePrice =
        item.variant?.priceOverride ??
        item.product.discountPrice ??
        item.product.price;
      return sum + effectivePrice * item.quantity;
    }, 0);

    // ── 5. Persist everything in one transaction ───────────────────────────────
    const order = await prisma.$transaction(async (tx) => {
      const merchantRef = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const newOrder = await tx.order.create({
        data: {
          userId: req.userId,
          totalAmount,
          paymentMethod,
          paymentStatus: "unpaid",
          shippingAddress,
          merchantRef,
          items: {
            create: cart.items.map((item) => {
              const effectivePrice =
                item.variant?.priceOverride ??
                item.product.discountPrice ??
                item.product.price;

              const image =
                (item.variant?.images.length ?? 0) > 0
                  ? item.variant!.images[0]!
                  : (item.product.images[0] ?? "");

              return {
                productId: item.product.id,
                variantId: item.variant?.id ?? null,
                name: item.product.name,
                price: effectivePrice,
                quantity: item.quantity,
                image,
                color: item.variant?.color ?? null,
                size: item.variant?.size ?? null,
                sku: item.variant?.sku ?? null,
              };
            }),
          },
          events: {
            create: { status: "pending", note: "Order placed" },
          },
        },
        select: orderSelect,
      });

      // Decrement variant stock when selected, product stock otherwise
      await Promise.all(
        cart.items.map((item) =>
          item.variant
            ? tx.productVariant.update({
                where: { id: item.variant.id },
                data: { stock: { decrement: item.quantity } },
              })
            : tx.product.update({
                where: { id: item.product.id },
                data: { stock: { decrement: item.quantity } },
              }),
        ),
      );

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    res.status(201).json({ status: "ok", data: order });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/orders/:id/status ─────────────────────────────────────────────

export async function updateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const body = validate(UpdateOrderStatusSchema, req.body, res);
    if (!body) return;

    const { status, trackingNumber, note } = body;

    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        // Fetch variantId alongside productId so stock restoration targets the right row
        items: { select: { productId: true, variantId: true, quantity: true } },
      },
    });

    if (!existing) {
      throw new AppError(404, "Order not found");
    }

    const terminalStatuses = ["delivered", "cancelled"] as const;
    if (
      terminalStatuses.includes(
        existing.status as (typeof terminalStatuses)[number],
      )
    ) {
      throw new AppError(
        409,
        `Order is already ${existing.status} and cannot be updated`,
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          ...(trackingNumber !== undefined && { trackingNumber }),
          events: { create: { status, note: note ?? null } },
        },
        select: orderSelect,
      });

      // Restore stock to the correct target when cancelling
      if (status === "cancelled") {
        await Promise.all(
          existing.items.map((item) =>
            item.variantId
              ? tx.productVariant.update({
                  where: { id: item.variantId },
                  data: { stock: { increment: item.quantity } },
                })
              : tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { increment: item.quantity } },
                }),
          ),
        );
      }

      return updated;
    });

    res.status(200).json({ status: "ok", data: order });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/orders/:id/cancel ─────────────────────────────────────────────

export async function cancelOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        userId: true,
        // variantId is required to restore stock to the right target
        items: { select: { productId: true, variantId: true, quantity: true } },
      },
    });

    if (!existing) {
      throw new AppError(404, "Order not found");
    }

    if (existing.userId !== req.userId) {
      throw new AppError(404, "Order not found");
    }

    if (existing.status !== "pending") {
      throw new AppError(
        409,
        "Only pending orders can be cancelled. Please contact support for assistance.",
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: "cancelled",
          events: {
            create: { status: "cancelled", note: "Cancelled by customer" },
          },
        },
        select: orderSelect,
      });

      // Restore variant stock when the item was ordered with a variant,
      // product stock otherwise — mirrors the decrement logic in createOrder
      await Promise.all(
        existing.items.map((item) =>
          item.variantId
            ? tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              })
            : tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              }),
        ),
      );

      return updated;
    });

    res.status(200).json({ status: "ok", data: order });
  } catch (err) {
    next(err);
  }
}
