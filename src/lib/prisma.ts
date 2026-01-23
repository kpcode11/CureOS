import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * IMPORTANT:
 * - Next.js dev hot reload can create multiple Prisma clients and exhaust connections.
 * - This global singleton pattern prevents that.
 * - Also keep logging minimal to reduce overhead.
 */
export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
