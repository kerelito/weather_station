import { PrismaClient } from "@prisma/client";

declare global {
  var __weatherPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__weatherPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__weatherPrisma = prisma;
}
