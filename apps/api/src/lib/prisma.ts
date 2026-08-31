import { PrismaClient } from "@prisma/client";

/**
 * Shared Prisma client instance.
 * In production, a single client is reused across the process to avoid
 * exhausting database connections.
 */
export const prisma = new PrismaClient();