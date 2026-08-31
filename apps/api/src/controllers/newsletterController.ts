import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function subscribeToNewsletter(req: Request, res: Response) {
  const email = String(req.body.email).trim().toLowerCase();

  try {
    const subscriber = await prisma.newsletterSubscriber.create({
      data: { email },
      select: { id: true, email: true, subscribedAt: true },
    });

    res.status(201).json({ data: subscriber });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const subscriber = await prisma.newsletterSubscriber.update({
        where: { email },
        data: { active: true },
        select: { id: true, email: true, subscribedAt: true },
      });

      res.json({ data: subscriber });
      return;
    }

    throw err;
  }
}
