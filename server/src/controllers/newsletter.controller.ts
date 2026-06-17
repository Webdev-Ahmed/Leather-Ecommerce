import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validate } from "@/lib/validators";
import { AppError } from "@/middleware/errorHandler";
import { sendBatchEmails } from "@/lib/resend";
import { newsletterEmail } from "@/lib/email-templates";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SubscribeSchema = z.object({
  email: z.email("Invalid email address"),
  name: z.string().trim().min(1).max(100).optional().default("Friend"),
});

const BlastSchema = z.object({
  subject: z.string().min(1).max(200).trim(),
  heading: z.string().min(1).max(200).trim(),
  body: z.string().min(1).trim(),
  ctaText: z.string().min(1).max(100).trim(),
  ctaUrl: z.string().url("CTA URL must be a valid URL"),
});

// ─── POST /api/newsletter/subscribe ──────────────────────────────────────────
// Public — called from the frontend footer newsletter form.
// If the email belongs to an existing user, flips their newsletterOptIn flag.
// If it's a new email (not yet registered), we just acknowledge —
// a full subscriber list feature can be added later.

export async function subscribe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validate(SubscribeSchema, req.body, res);
    if (!body) return;

    const { email } = body;

    // If email matches a registered user, update their preference
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, newsletterOptIn: true },
    });

    if (user) {
      if (user.newsletterOptIn) {
        res.status(200).json({
          status: "ok",
          message: "You are already subscribed to our newsletter",
        });
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { newsletterOptIn: true },
      });
    }

    res.status(200).json({
      status: "ok",
      message: "Thank you for subscribing! You'll hear from us soon.",
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/newsletter/unsubscribe ────────────────────────────────────────
// Public — called from the unsubscribe link in emails.

export async function unsubscribe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body as { email?: string };

    if (!email || typeof email !== "string") {
      throw new AppError(400, "Email is required");
    }

    await prisma.user.updateMany({
      where: { email },
      data: { newsletterOptIn: false },
    });

    res.status(200).json({
      status: "ok",
      message: "You have been unsubscribed successfully",
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/newsletter/blast ───────────────────────────────────────────────
// Admin only — send a promotional email to all newsletterOptIn users.
// This is a heavy operation — do not call this in a hot path.
// For large lists (1000+), move to a queue (BullMQ etc.) in a later phase.

export async function blast(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validate(BlastSchema, req.body, res);
    if (!body) return;

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3001";

    // Fetch all opted-in users in batches to avoid loading thousands into memory
    const FETCH_SIZE = 500;
    let cursor: string | undefined;
    const emails: { to: string; subject: string; html: string }[] = [];

    while (true) {
      const users = await prisma.user.findMany({
        where: { newsletterOptIn: true },
        select: { id: true, name: true, email: true },
        take: FETCH_SIZE,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { id: "asc" },
      });

      if (users.length === 0) break;

      for (const user of users) {
        const unsubscribeUrl = `${frontendUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(user.email)}`;
        const { subject, html } = newsletterEmail({
          name: user.name,
          subject: body.subject,
          heading: body.heading,
          body: body.body,
          ctaText: body.ctaText,
          ctaUrl: body.ctaUrl,
          unsubscribeUrl,
        });
        emails.push({ to: user.email, subject, html });
      }

      cursor = users[users.length - 1]?.id;
      if (users.length < FETCH_SIZE) break;
    }

    if (emails.length === 0) {
      res.status(200).json({
        status: "ok",
        message: "No subscribed users to send to",
        sent: 0,
      });
      return;
    }

    const sent = await sendBatchEmails(emails);

    res.status(200).json({
      status: "ok",
      message: `Newsletter sent to ${sent} of ${emails.length} subscribers`,
      sent,
      total: emails.length,
    });
  } catch (err) {
    next(err);
  }
}
