import { createHash } from "node:crypto";
import type { Request, RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";

export const ADMIN_SESSION_COOKIE = "term_academy_session";
export const READER_SESSION_COOKIE = "term_academy_reader";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function getAdminSession(req: Request) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE];
  if (typeof token !== "string" || token.length < 32) return null;

  return prisma.adminSession.findFirst({
    where: { tokenHash: hashSessionToken(token), expiresAt: { gt: new Date() } },
    select: { id: true, user: { select: { id: true, email: true } } },
  });
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  return Boolean(await getAdminSession(req));
}

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Sign in with an administrator account" },
      });
      return;
    }

    res.locals.admin = session.user;
    next();
  } catch (error) {
    next(error);
  }
};

async function getReaderSession(req: Request) {
  const token = req.cookies?.[READER_SESSION_COOKIE];
  if (typeof token !== "string" || token.length < 32) return null;
  return prisma.readerSession.findFirst({
    where: { tokenHash: hashSessionToken(token), expiresAt: { gt: new Date() } },
    select: { id: true, user: { select: { id: true, email: true } } },
  });
}

export const requireReader: RequestHandler = async (req, res, next) => {
  try {
    const session = await getReaderSession(req);
    if (!session) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Sign in to sync your library" } });
      return;
    }
    res.locals.reader = session.user;
    res.locals.readerSessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
};
