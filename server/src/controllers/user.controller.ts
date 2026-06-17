import type { NextFunction, Request, Response } from "express";
import { prisma } from "@/lib/db";
import { AppError } from "@/middleware/errorHandler";
import { validate } from "@/lib/validators";
import { UserQuerySchema, UpdateUserRoleSchema } from "@/schemas/user.schema";
import type { Role } from "@/lib/roles";

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  newsletterOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
  password: string | null;
  accounts: { provider: string }[];
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    newsletterOptIn: user.newsletterOptIn,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    hasPassword: user.password !== null,
    linkedProviders: user.accounts.map((account) => account.provider),
  };
}

const managedUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  newsletterOptIn: true,
  createdAt: true,
  updatedAt: true,
  password: true,
  accounts: { select: { provider: true } },
} as const;

export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = validate(UserQuerySchema, req.query, res);
    if (!query) return;

    const { page, limit, search, role } = query;

    const where = {
      ...(role !== undefined && { role }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: managedUserSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.status(200).json({
      status: "ok",
      data: users.map(sanitizeUser),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const body = validate(UpdateUserRoleSchema, req.body, res);
    if (!body) return;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      throw new AppError(404, "User not found");
    }

    if (existingUser.id === req.userId && body.role !== "owner") {
      throw new AppError(400, "Owners cannot change their own role");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: managedUserSelect,
    });

    res.status(200).json({
      status: "ok",
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}
