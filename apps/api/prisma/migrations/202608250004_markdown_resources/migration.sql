CREATE TABLE "MarkdownResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarkdownResource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarkdownResource_slug_key" ON "MarkdownResource"("slug");
CREATE INDEX "MarkdownResource_published_publishedAt_idx" ON "MarkdownResource"("published", "publishedAt");
CREATE INDEX "MarkdownResource_category_idx" ON "MarkdownResource"("category");
