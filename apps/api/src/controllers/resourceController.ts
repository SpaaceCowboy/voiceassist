import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const summarySelect = { id: true, title: true, slug: true, description: true, category: true, fileName: true, size: true, published: true, publishedAt: true, createdAt: true, updatedAt: true } as const;

export async function listPublishedResources(_req: Request, res: Response) {
  const resources = await prisma.markdownResource.findMany({ where: { published: true }, orderBy: [{ publishedAt: "desc" }, { title: "asc" }], select: summarySelect });
  res.json({ data: resources });
}

export async function getPublishedResource(req: Request, res: Response) {
  const resource = await prisma.markdownResource.findFirst({ where: { slug: String(req.params.slug), published: true } });
  if (!resource) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Resource not found" } }); return; }
  res.json({ data: resource });
}

export async function downloadPublishedResource(req: Request, res: Response) {
  const resource = await prisma.markdownResource.findFirst({ where: { slug: String(req.params.slug), published: true } });
  if (!resource) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Resource not found" } }); return; }
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${resource.fileName.replace(/[^a-z0-9._-]/gi, "-")}"`);
  res.send(resource.content);
}

export async function listAdminResources(_req: Request, res: Response) {
  res.json({ data: await prisma.markdownResource.findMany({ orderBy: { updatedAt: "desc" } }) });
}

export async function uploadResource(req: Request, res: Response) {
  if (!req.file || (!req.file.originalname.toLowerCase().endsWith(".md") && !["text/markdown", "text/plain", "application/octet-stream"].includes(req.file.mimetype))) {
    res.status(400).json({ error: { code: "INVALID_MARKDOWN", message: "Upload a .md Markdown file" } }); return;
  }
  const content = req.file.buffer.toString("utf8");
  if (!content.trim() || content.includes("\u0000")) { res.status(400).json({ error: { code: "INVALID_MARKDOWN", message: "The Markdown file must contain valid UTF-8 text" } }); return; }
  const published = Boolean(req.body.published);
  const resource = await prisma.markdownResource.create({ data: { title: req.body.title, slug: req.body.slug, description: req.body.description, category: req.body.category, fileName: req.file.originalname.replace(/[^a-z0-9._-]/gi, "-"), content, size: req.file.size, published, publishedAt: published ? new Date() : null } });
  res.status(201).json({ data: resource });
}

export async function updateResource(req: Request, res: Response) {
  const existing = await prisma.markdownResource.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Resource not found" } }); return; }
  const data = { ...req.body, ...(req.body.published === true && !existing.published ? { publishedAt: new Date() } : {}), ...(req.body.published === false ? { publishedAt: null } : {}) };
  res.json({ data: await prisma.markdownResource.update({ where: { id: existing.id }, data }) });
}

export async function deleteResource(req: Request, res: Response) {
  await prisma.markdownResource.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
}
