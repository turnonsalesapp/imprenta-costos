import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma único.
 *
 * En desarrollo, Next.js recarga los módulos con cada cambio. Sin este
 * singleton se abriría una conexión nueva en cada recarga hasta agotar el
 * límite de la base de datos.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
