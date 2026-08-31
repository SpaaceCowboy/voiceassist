import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function listAuthors(_req: Request, res: Response) {
  const authors = await prisma.author.findMany({
    select: {
      id: true,
      name: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { articles: true } },
    },
    orderBy: { name: "asc" },
  });
  res.json({ data: authors });
}