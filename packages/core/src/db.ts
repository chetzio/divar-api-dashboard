import { PrismaClient } from "../generated/prisma/index.js";

declare global {
  // eslint-disable-next-line no-var
  var __radiokarPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__radiokarPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__radiokarPrisma = prisma;
}
