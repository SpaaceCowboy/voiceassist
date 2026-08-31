import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function listPublicComments(req: Request, res: Response) {
  const comments = await prisma.comment.findMany({
    where: { article: { slug: String(req.query.article), published: true }, approved: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, body: true, createdAt: true },
  });
  res.json({ data: comments });
}

export async function createComment(req: Request, res: Response) {
  if (req.body.website) {
    res.status(202).json({ data: { submitted: true } });
    return;
  }
  const article = await prisma.article.findFirst({
    where: { slug: String(req.params.slug), published: true },
    select: { id: true },
  });
  if (!article) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found" } });
    return;
  }
  await prisma.comment.create({
    data: { articleId: article.id, name: req.body.name, email: req.body.email, body: req.body.body },
  });
  res.status(202).json({ data: { submitted: true, message: "Comment submitted for moderation" } });
}

export async function listAdminComments(_req: Request, res: Response) {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { article: { select: { title: true, slug: true } } },
  });
  res.json({ data: comments });
}

export async function approveComment(req: Request, res: Response) {
  const comment = await prisma.comment.update({
    where: { id: String(req.params.id) },
    data: { approved: true, approvedAt: new Date() },
  });
  res.json({ data: comment });
}

export async function deleteComment(req: Request, res: Response) {
  await prisma.comment.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
}
