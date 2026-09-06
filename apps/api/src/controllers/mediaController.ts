import type { Request, Response } from "express";
import sharp from "sharp";
import { prisma } from "../lib/prisma.js";
import { deleteImage, storeImage } from "../lib/mediaStorage.js";

const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function listMedia(_req: Request, res: Response) {
  const assets = await prisma.mediaAsset.findMany({ where: { deletionRequestedAt: null, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 100 });
  res.json({ data: assets });
}

export async function uploadMedia(req: Request, res: Response) {
  if (!req.file || !supportedTypes.has(req.file.mimetype)) {
    res.status(400).json({ error: { code: "INVALID_IMAGE", message: "Upload a JPEG, PNG, WebP, or AVIF image" } });
    return;
  }

  const width = Math.min(2400, Math.max(320, Number(req.body.width) || 2000));
  const height = Number(req.body.height) > 0 ? Math.min(2400, Math.max(200, Number(req.body.height))) : undefined;
  const altText = String(req.body.altText ?? "").trim();
  if (!altText || altText.length > 240) {
    res.status(400).json({ error: { code: "INVALID_ALT_TEXT", message: "Alt text is required and must be under 240 characters" } });
    return;
  }

  const sourceMetadata = await sharp(req.file.buffer, { limitInputPixels: 40_000_000 }).metadata();
  if (!sourceMetadata.width || !sourceMetadata.height || sourceMetadata.width * sourceMetadata.height > 40_000_000) {
    res.status(400).json({ error: { code: "IMAGE_TOO_LARGE", message: "Image dimensions are too large" } });
    return;
  }

  const pipeline = sharp(req.file.buffer, { limitInputPixels: 40_000_000 }).rotate().resize({ width, height, fit: height ? "cover" : "inside", withoutEnlargement: true });
  const buffer = await pipeline.webp({ quality: 82 }).toBuffer();
  const metadata = await sharp(buffer).metadata();
  const stored = await storeImage({ buffer, originalName: req.file.originalname, contentType: "image/webp" });
  let asset;
  try {
    asset = await prisma.mediaAsset.create({
      data: {
        ...stored,
        altText,
        mimeType: "image/webp",
        size: buffer.length,
        width: metadata.width,
        height: metadata.height,
      },
    });
  } catch (error) {
    await deleteImage(stored.key).catch((cleanupError) => req.log?.error({ err: cleanupError, key: stored.key }, "Failed to clean up media object"));
    throw error;
  }
  res.status(201).json({ data: asset });
}

export async function removeMedia(req: Request, res: Response) {
  const result = await prisma.$transaction(async (tx) => {
    const asset = await tx.mediaAsset.findUnique({ where: { id: String(req.params.id) } });
    if (!asset) return { state: "missing" as const };
    if (asset.deletedAt) return { state: "deleted" as const };

    const [articleReference, editionReference, revisionReference] = await Promise.all([
      tx.article.findFirst({ where: { heroImage: asset.url }, select: { id: true } }),
      tx.edition.findFirst({ where: { coverImage: asset.url }, select: { id: true } }),
      tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "ArticleRevision" WHERE "snapshot" ->> 'heroImage' = ${asset.url} LIMIT 1`,
    ]);
    if (articleReference || editionReference || revisionReference.length > 0) return { state: "in-use" as const };

    const marked = asset.deletionRequestedAt ? asset : await tx.mediaAsset.update({
      where: { id: asset.id },
      data: { deletionRequestedAt: new Date() },
    });
    return { state: "ready" as const, asset: marked };
  }, { isolationLevel: "Serializable" });

  if (result.state === "missing") {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Media asset not found" } });
    return;
  }
  if (result.state === "deleted") {
    res.status(204).send();
    return;
  }
  if (result.state === "in-use") {
    res.status(409).json({ error: { code: "MEDIA_IN_USE", message: "Media is still referenced by content or revision history" } });
    return;
  }

  await deleteImage(result.asset.key);
  await prisma.mediaAsset.update({ where: { id: result.asset.id }, data: { deletedAt: new Date() } });
  res.status(204).send();
}
