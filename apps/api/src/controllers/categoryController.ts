import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  _count: { select: { articles: true } },
};

export async function listCategories(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    select: categorySelect,
    orderBy: { name: "asc" },
  });
  res.json({ data: categories });
}

export async function createCategory(req: Request, res: Response) {
  const body = req.body;
  const category = await prisma.category.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
    },
    select: categorySelect,
  });
  res.status(201).json({ data: category });
}

export async function updateCategory(req: Request, res: Response) {
  const id = String(req.params.id);
  const body = req.body;
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    },
    select: categorySelect,
  });
  res.json({ data: category });
}

export async function deleteCategory(req: Request, res: Response) {
  const id = String(req.params.id);
  await prisma.category.delete({ where: { id } });
  res.status(204).send();
}