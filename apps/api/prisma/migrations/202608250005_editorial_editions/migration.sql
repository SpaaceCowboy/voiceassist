CREATE TABLE "Edition" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "editorialNote" TEXT,
    "coverImage" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#b45309',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Edition_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EditionArticle" (
    "editionId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "EditionArticle_pkey" PRIMARY KEY ("editionId", "articleId")
);
CREATE UNIQUE INDEX "Edition_number_key" ON "Edition"("number");
CREATE UNIQUE INDEX "Edition_slug_key" ON "Edition"("slug");
CREATE INDEX "Edition_published_publishedAt_idx" ON "Edition"("published", "publishedAt");
CREATE UNIQUE INDEX "EditionArticle_editionId_position_key" ON "EditionArticle"("editionId", "position");
CREATE INDEX "EditionArticle_articleId_idx" ON "EditionArticle"("articleId");
ALTER TABLE "EditionArticle" ADD CONSTRAINT "EditionArticle_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EditionArticle" ADD CONSTRAINT "EditionArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
