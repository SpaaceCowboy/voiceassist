import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const storageMode = process.env.MEDIA_STORAGE ?? "local";

function safeKey(originalName: string): string {
  const stem = path.basename(originalName, path.extname(originalName)).replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return `articles/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${stem || "image"}.webp`;
}

function r2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is selected but R2 credentials are incomplete");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function storeImage(input: { buffer: Buffer; originalName: string; contentType: string }) {
  const key = safeKey(input.originalName);
  if (storageMode === "r2") {
    const bucket = process.env.R2_BUCKET;
    const publicUrl = process.env.MEDIA_PUBLIC_URL;
    if (!bucket || !publicUrl) throw new Error("R2_BUCKET and MEDIA_PUBLIC_URL are required for R2 storage");
    await r2Client().send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return { key, url: `${publicUrl.replace(/\/$/, "")}/${key}` };
  }

  const uploadRoot = path.resolve(process.cwd(), "uploads");
  const destination = path.join(uploadRoot, key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, input.buffer);
  const publicUrl = process.env.MEDIA_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4001}/media`;
  return { key, url: `${publicUrl.replace(/\/$/, "")}/${key}` };
}

export async function deleteImage(key: string): Promise<void> {
  if (!key.startsWith("articles/") || key.includes("..")) throw new Error("Invalid media key");
  if (storageMode === "r2") {
    const bucket = process.env.R2_BUCKET;
    if (!bucket) throw new Error("R2_BUCKET is required for R2 storage");
    await r2Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }
  await unlink(path.resolve(process.cwd(), "uploads", key)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
