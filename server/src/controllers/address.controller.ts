import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/lib/db";
import { AppError } from "@/middleware/errorHandler";
import { validate } from "@/lib/validators";
import {
  CreateAddressSchema,
  UpdateAddressSchema,
} from "@/schemas/address.schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const addressSelect = {
  id: true,
  label: true,
  street: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  isDefault: true,
} as const;

// Ownership check — throws 404 (not 403) to avoid leaking that the address exists
async function assertOwnership(
  addressId: string,
  userId: string,
): Promise<void> {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
    select: { userId: true },
  });

  if (!address || address.userId !== userId) {
    throw new AppError(404, "Address not found");
  }
}

// ─── GET /api/addresses ───────────────────────────────────────────────────────

export async function getAddresses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.userId },
      select: addressSelect,
      orderBy: [
        { isDefault: "desc" }, // default address always first
        { id: "asc" },
      ],
    });

    res.status(200).json({ status: "ok", data: addresses });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/addresses/:id ───────────────────────────────────────────────────

export async function getAddressById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const address = await prisma.address.findUnique({
      where: { id },
      select: { ...addressSelect, userId: true },
    });

    if (!address || address.userId !== req.userId) {
      throw new AppError(404, "Address not found");
    }

    const { userId: _uid, ...addressData } = address;

    res.status(200).json({ status: "ok", data: addressData });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/addresses ──────────────────────────────────────────────────────

export async function createAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validate(CreateAddressSchema, req.body, res);
    if (!body) return;

    const address = await prisma.$transaction(async (tx) => {
      // If this address is being set as default, clear all other defaults first
      if (body.isDefault) {
        await tx.address.updateMany({
          where: { userId: req.userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // If this is the user's first address, make it default automatically
      const existingCount = await tx.address.count({
        where: { userId: req.userId },
      });

      return tx.address.create({
        data: {
          ...body,
          userId: req.userId,
          isDefault: body.isDefault || existingCount === 0,
        },
        select: addressSelect,
      });
    });

    res.status(201).json({ status: "ok", data: address });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/addresses/:id ───────────────────────────────────────────────────

export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const body = validate(UpdateAddressSchema, req.body, res);
    if (!body) return;

    await assertOwnership(id, req.userId);

    const address = await prisma.$transaction(async (tx) => {
      // If setting this address as default, clear all others first
      if (body.isDefault) {
        await tx.address.updateMany({
          where: { userId: req.userId, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: body,
        select: addressSelect,
      });
    });

    res.status(200).json({ status: "ok", data: address });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/addresses/:id ────────────────────────────────────────────────

export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const address = await prisma.address.findUnique({
      where: { id },
      select: { userId: true, isDefault: true },
    });

    if (!address || address.userId !== req.userId) {
      throw new AppError(404, "Address not found");
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      // If the deleted address was the default, promote the next address
      // (oldest by id) to default so the user always has one if any remain
      if (address.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId: req.userId },
          orderBy: { id: "asc" },
          select: { id: true },
        });

        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    res.status(200).json({ status: "ok", message: "Address deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/addresses/:id/default ────────────────────────────────────────

export async function setDefaultAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    await assertOwnership(id, req.userId);

    const address = await prisma.$transaction(async (tx) => {
      // Clear existing default
      await tx.address.updateMany({
        where: { userId: req.userId, isDefault: true },
        data: { isDefault: false },
      });

      // Set new default
      return tx.address.update({
        where: { id },
        data: { isDefault: true },
        select: addressSelect,
      });
    });

    res.status(200).json({ status: "ok", data: address });
  } catch (err) {
    next(err);
  }
}
