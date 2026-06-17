import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/db";
import { AppError } from "@/middleware/errorHandler";
import {
  buildJazzCashFormData,
  verifySecureHash,
  JAZZCASH_CHECKOUT_URL,
  type JazzCashCallback,
} from "@/lib/jazzcash";
import { sendEmail } from "@/lib/resend";
import { orderConfirmationEmail } from "@/lib/email-templates";

// ─── POST /api/payments/jazzcash/initiate ────────────────────────────────────
// Called by the frontend after order creation when paymentMethod === "jazzcash".
// Returns the form fields the frontend posts to JazzCash's hosted checkout URL.

export async function initiateJazzCashPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { orderId } = req.body as { orderId?: string };

    if (!orderId) {
      throw new AppError(400, "orderId is required");
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        merchantRef: true,
        userId: true,
        items: { select: { name: true }, take: 1 },
      },
    });

    if (!order) throw new AppError(404, "Order not found");

    if (order.userId !== req.userId) throw new AppError(404, "Order not found");

    if (order.paymentMethod !== "jazzcash") {
      throw new AppError(400, "This order is not a JazzCash order");
    }

    if (order.paymentStatus === "paid") {
      throw new AppError(409, "This order has already been paid");
    }

    if (!order.merchantRef) {
      throw new AppError(500, "Order is missing a merchant reference");
    }

    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4008";

    const description = order.items[0]?.name ?? "Leather Goods Order";

    const formData = buildJazzCashFormData({
      merchantRef: order.merchantRef,
      amount: order.totalAmount,
      description,
      returnUrl: `${backendUrl}/api/payments/jazzcash/callback`,
    });

    res.status(200).json({
      status: "ok",
      data: {
        jazzcashUrl: JAZZCASH_CHECKOUT_URL,
        formData,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/payments/jazzcash/callback ────────────────────────────────────
// JazzCash redirects the customer's browser to this URL after payment.
// Because this is a browser redirect (not a server-to-server call) we redirect
// the user to the frontend after processing — we don't just return JSON.
//
// JazzCash response codes:
//   "000" = Successful
//   "157" = Transaction Expired
//   "999" = General Error / Failed

export async function jazzCashCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3001";

  try {
    // JazzCash posts form data — body is already parsed by express.urlencoded
    const body = req.body as JazzCashCallback;

    const { pp_BillReference, pp_ResponseCode, pp_TxnRefNo } = body;

    if (!pp_BillReference) {
      console.error("[JazzCash] Callback missing pp_BillReference");
      res.redirect(`${frontendUrl}/checkout?error=jazzcash_invalid`);
      return;
    }

    const order = await prisma.order.findUnique({
      where: { merchantRef: pp_BillReference },
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
        items: {
          select: {
            name: true,
            price: true,
            quantity: true,
            color: true,
            size: true,
            image: true,
          },
        },
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      console.error(
        `[JazzCash] No order found for merchantRef: ${pp_BillReference}`,
      );
      res.redirect(`${frontendUrl}/checkout?error=jazzcash_order_not_found`);
      return;
    }

    // Already processed — redirect straight to success
    if (order.paymentStatus === "paid") {
      res.redirect(`${frontendUrl}/order-confirmed/${order.id}`);
      return;
    }

    // Verify secure hash — throws AppError on mismatch
    try {
      verifySecureHash(body);
    } catch (verifyError) {
      console.error("[JazzCash] Hash verification failed:", verifyError);
      res.redirect(`${frontendUrl}/checkout?error=jazzcash_verification_failed`);
      return;
    }

    if (pp_ResponseCode === "000") {
      // Payment successful
      await prisma.order.update({
        where: { merchantRef: pp_BillReference },
        data: {
          paymentStatus: "paid",
          status: "processing",
          events: {
            create: {
              status: "processing",
              note: `Payment confirmed via JazzCash (ref: ${pp_TxnRefNo})`,
            },
          },
        },
      });

      console.log(
        `[JazzCash] Payment confirmed for order ${pp_BillReference}`,
      );

      // Send confirmation email — fire and forget
      const { subject, html } = orderConfirmationEmail({
        name: order.user.name,
        orderId: order.id,
        totalAmount: order.totalAmount,
        paymentMethod: "jazzcash",
        items: order.items,
      });

      sendEmail({ to: order.user.email, subject, html }).catch(
        (err: unknown) => {
          console.error("[Resend] JazzCash order confirmation email failed:", err);
        },
      );

      res.redirect(`${frontendUrl}/order-confirmed/${order.id}`);
    } else {
      // Payment failed or expired
      await prisma.order.update({
        where: { merchantRef: pp_BillReference },
        data: {
          paymentStatus: "unpaid",
          events: {
            create: {
              status: "pending",
              note: `JazzCash payment failed — code: ${pp_ResponseCode}, ref: ${pp_TxnRefNo}`,
            },
          },
        },
      });

      console.log(
        `[JazzCash] Payment failed for order ${pp_BillReference} (code: ${pp_ResponseCode})`,
      );

      res.redirect(
        `${frontendUrl}/checkout?error=jazzcash_failed&orderId=${order.id}`,
      );
    }
  } catch (err) {
    next(err);
  }
}
