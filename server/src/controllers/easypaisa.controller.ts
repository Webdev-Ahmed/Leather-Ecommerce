import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/db";
import { AppError } from "@/middleware/errorHandler";
import {
  buildEasypaisaFormData,
  verifyEasypaisaCallback,
  EASYPAISA_CHECKOUT_URL,
  type EasypaisaCallback,
} from "@/lib/easypaisa";
import { sendEmail } from "@/lib/resend";
import { orderConfirmationEmail } from "@/lib/email-templates";

// ─── POST /api/payments/easypaisa/initiate ───────────────────────────────────
// Called by the frontend after order creation when paymentMethod === "easypaisa".
// Returns the form fields the frontend posts to Easypaisa's hosted checkout URL.

export async function initiateEasypaisaPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { orderId, mobileAccountNo } = req.body as {
      orderId?: string;
      mobileAccountNo?: string;
    };

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
      },
    });

    if (!order) throw new AppError(404, "Order not found");

    if (order.userId !== req.userId) throw new AppError(404, "Order not found");

    if (order.paymentMethod !== "easypaisa") {
      throw new AppError(400, "This order is not an Easypaisa order");
    }

    if (order.paymentStatus === "paid") {
      throw new AppError(409, "This order has already been paid");
    }

    if (!order.merchantRef) {
      throw new AppError(500, "Order is missing a merchant reference");
    }

    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4008";

    const formData = buildEasypaisaFormData({
      merchantRef: order.merchantRef,
      amount: order.totalAmount,
      postBackUrl: `${backendUrl}/api/payments/easypaisa/callback`,
      mobileAccountNo,
    });

    res.status(200).json({
      status: "ok",
      data: {
        easypaisaUrl: EASYPAISA_CHECKOUT_URL,
        formData,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/payments/easypaisa/callback ───────────────────────────────────
// Easypaisa POSTs the transaction result to this endpoint (postBackURL).
// Unlike JazzCash this is a server-to-server POST, not a browser redirect —
// so we return JSON and let the frontend poll or use a separate return URL.
//
// Easypaisa response codes:
//   "0000" = Paid Successfully
//   "0001" = Failure
//   "0002" = Process Pending
//   "0131" = Invalid Transaction

export async function easypaisaCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Acknowledge immediately — always 200 so Easypaisa doesn't retry
  res.status(200).json({ status: "ok" });

  try {
    const body = req.body as EasypaisaCallback;

    const { orderId: orderRefNum, responseCode, transactionId } = body;

    if (!orderRefNum) {
      console.error("[Easypaisa] Callback missing orderId (orderRefNum)");
      return;
    }

    // Easypaisa sends orderRefNum which maps to our sanitised merchantRef
    // We stored the sanitised version in buildEasypaisaFormData — look up by it
    const order = await prisma.order.findFirst({
      where: {
        merchantRef: {
          // merchantRef may contain hyphens that were stripped for Easypaisa;
          // match by the sanitised prefix stored in formData.orderRefNum
          startsWith: orderRefNum.slice(0, 8),
        },
      },
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
        merchantRef: true,
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
        `[Easypaisa] No order found for orderRefNum: ${orderRefNum}`,
      );
      return;
    }

    // Skip duplicate callbacks
    if (order.paymentStatus === "paid") {
      console.log(
        `[Easypaisa] Order ${orderRefNum} already marked paid — skipping`,
      );
      return;
    }

    // Verify hash — using the fields Easypaisa echoes back in the callback.
    // In sandbox, encryptedHashRequest may be absent; verifyEasypaisaCallback
    // handles that gracefully and skips verification in non-production mode.
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4008";

    try {
      verifyEasypaisaCallback(body, {
        amount: Math.round(order.totalAmount * 100).toString(),
        orderRefNum,
        paymentMethod: "InitialRequest",
        postBackURL: `${backendUrl}/api/payments/easypaisa/callback`,
        storeId: process.env.EASYPAISA_STORE_ID!,
        timeStamp: body.transactionDateTime ?? "",
      });
    } catch (verifyError) {
      console.error("[Easypaisa] Hash verification failed:", verifyError);
      return;
    }

    if (responseCode === "0000") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "paid",
          status: "processing",
          events: {
            create: {
              status: "processing",
              note: `Payment confirmed via Easypaisa (txnId: ${transactionId})`,
            },
          },
        },
      });

      console.log(`[Easypaisa] Payment confirmed for order ${orderRefNum}`);

      // Send confirmation email — fire and forget
      const { subject, html } = orderConfirmationEmail({
        name: order.user.name,
        orderId: order.id,
        totalAmount: order.totalAmount,
        paymentMethod: "easypaisa",
        items: order.items,
      });

      sendEmail({ to: order.user.email, subject, html }).catch(
        (err: unknown) => {
          console.error(
            "[Resend] Easypaisa order confirmation email failed:",
            err,
          );
        },
      );
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "unpaid",
          events: {
            create: {
              status: "pending",
              note: `Easypaisa payment failed — code: ${responseCode}, txnId: ${transactionId}`,
            },
          },
        },
      });

      console.log(
        `[Easypaisa] Payment failed for order ${orderRefNum} (code: ${responseCode})`,
      );
    }
  } catch (err) {
    console.error("[Easypaisa] Unexpected error in callback:", err);
  }
}
