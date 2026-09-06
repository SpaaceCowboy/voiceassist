import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function subscribeToNewsletter(req: Request, res: Response) {
  const email = String(req.body.email).trim().toLowerCase();

  try {
    await prisma.newsletterSubscriber.create({
      data: { email },
    });
    res.status(202).json({ data: { submitted: true } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(202).json({ data: { submitted: true } });
      return;
    }

    throw err;
  }
}
