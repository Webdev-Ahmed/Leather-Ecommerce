import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/db";
import { AppError } from "@/middleware/errorHandler";
import {
  buildPaymentFormData,
  verifyITN,
  PAYFAST_URL,
  type PayFastITN,
} from "@/lib/payfast";
import { sendEmail } from "@/lib/resend";
import { orderConfirmationEmail } from "@/lib/email-templates";

// ─── POST /api/payments/initiate ──────────────────────────────────────────────
// Called by the frontend after order creation when paymentMethod === "payfast".
// Returns the form data fields the frontend needs to submit to PayFast.

export async function initiatePayment(
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
        user: { select: { name: true, email: true } },
        items: { select: { name: true }, take: 1 },
      },
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    // Only the order owner can initiate payment
    if (order.userId !== req.userId) {
      throw new AppError(404, "Order not found");
    }

    if (order.paymentMethod !== "payfast") {
      throw new AppError(400, "This order is not a PayFast order");
    }

    if (order.paymentStatus === "paid") {
      throw new AppError(409, "This order has already been paid");
    }

    if (!order.merchantRef) {
      throw new AppError(500, "Order is missing a merchant reference");
    }

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3001";
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4008";

    const nameParts = order.user.name.trim().split(" ");
    const firstName = nameParts[0] ?? order.user.name;
    const lastName = nameParts.slice(1).join(" ") || "-";

    // itemName: use first item name, truncated to 100 chars
    const itemName = order.items[0]?.name ?? "Leather Goods Order";

    const formData = buildPaymentFormData({
      merchantRef: order.merchantRef,
      amount: order.totalAmount,
      itemName,
      email: order.user.email,
      firstName,
      lastName,
      returnUrl: `${frontendUrl}/order-confirmed/${order.id}`,
      cancelUrl: `${frontendUrl}/checkout?cancelled=true`,
      notifyUrl: `${backendUrl}/api/payments/itn`,
    });

    res.status(200).json({
      status: "ok",
      data: {
        payfastUrl: PAYFAST_URL,
        formData,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/payments/itn ───────────────────────────────────────────────────
// PayFast Instant Transaction Notification webhook.
// PayFast POSTs to this endpoint after every payment attempt.
// Must return HTTP 200 immediately — PayFast retries on non-200 responses.
// This route is public (no requireAuth) — PayFast calls it server-to-server.

export async function itn(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Acknowledge immediately — PayFast expects 200 before we do any heavy work
  res.status(200).send("OK");

  // All processing happens after the response is sent
  try {
    const body = req.body as PayFastITN;

    const { m_payment_id, pf_payment_id, payment_status } = body;

    if (!m_payment_id) {
      console.error("[PayFast ITN] Missing m_payment_id in body");
      return;
    }

    const order = await prisma.order.findUnique({
      where: { merchantRef: m_payment_id },
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
        paymentMethod: true,
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
        `[PayFast ITN] No order found for merchantRef: ${m_payment_id}`,
      );
      return;
    }

    // Skip if already processed — PayFast can send duplicate ITNs
    if (order.paymentStatus === "paid") {
      console.log(
        `[PayFast ITN] Order ${m_payment_id} already marked paid — skipping`,
      );
      return;
    }

    // Verify the ITN — throws if anything is wrong
    try {
      await verifyITN(body, order.totalAmount);
    } catch (verifyError) {
      console.error("[PayFast ITN] Verification failed:", verifyError);
      return;
    }

    if (payment_status === "COMPLETE") {
      // Mark order as paid and store PayFast's token
      await prisma.order.update({
        where: { merchantRef: m_payment_id },
        data: {
          paymentStatus: "paid",
          payfastToken: pf_payment_id,
          status: "processing",
          events: {
            create: {
              status: "processing",
              note: `Payment confirmed via PayFast (${pf_payment_id})`,
            },
          },
        },
      });

      console.log(`[PayFast ITN] Payment confirmed for order ${m_payment_id}`);

      // Send order confirmation email — fire and forget
      const { subject, html } = orderConfirmationEmail({
        name: order.user.name,
        orderId: order.id,
        totalAmount: order.totalAmount,
        paymentMethod: "payfast",
        items: order.items,
      });

      sendEmail({ to: order.user.email, subject, html }).catch(
        (err: unknown) => {
          console.error("[Resend] Order confirmation email failed:", err);
        },
      );
    } else if (payment_status === "FAILED") {
      await prisma.order.update({
        where: { merchantRef: m_payment_id },
        data: {
          paymentStatus: "unpaid",
          events: {
            create: {
              status: "pending",
              note: `PayFast payment failed (${pf_payment_id})`,
            },
          },
        },
      });

      console.log(`[PayFast ITN] Payment failed for order ${m_payment_id}`);
    }
  } catch (err) {
    // Never let ITN processing errors propagate — response already sent
    console.error("[PayFast ITN] Unexpected error:", err);
  }
}
