ALTER TABLE "Article"
  ADD COLUMN "scheduledAt" TIMESTAMP(3),
  ADD COLUMN "previewToken" TEXT,
  ADD COLUMN "seriesOrder" INTEGER,
  ADD COLUMN "seriesId" TEXT;

CREATE TABLE "Tag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ArticleTag" (
  "articleId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("articleId", "tagId")
);
CREATE TABLE "Series" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ArticleRevision" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "altText" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Comment" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SearchQuery" (
  "id" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "lastSearched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Article_previewToken_key" ON "Article"("previewToken");
CREATE INDEX "Article_seriesId_seriesOrder_idx" ON "Article"("seriesId", "seriesOrder");
CREATE INDEX "Article_scheduledAt_idx" ON "Article"("scheduledAt");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX "Tag_name_idx" ON "Tag"("name");
CREATE INDEX "ArticleTag_tagId_idx" ON "ArticleTag"("tagId");
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");
CREATE INDEX "Series_name_idx" ON "Series"("name");
CREATE INDEX "ArticleRevision_articleId_createdAt_idx" ON "ArticleRevision"("articleId", "createdAt");
CREATE UNIQUE INDEX "MediaAsset_key_key" ON "MediaAsset"("key");
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");
CREATE INDEX "Comment_articleId_approved_createdAt_idx" ON "Comment"("articleId", "approved", "createdAt");
CREATE INDEX "Comment_approved_createdAt_idx" ON "Comment"("approved", "createdAt");
CREATE UNIQUE INDEX "SearchQuery_query_key" ON "SearchQuery"("query");
CREATE INDEX "SearchQuery_count_lastSearched_idx" ON "SearchQuery"("count", "lastSearched");
CREATE INDEX "Article_search_idx" ON "Article" USING GIN (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("excerpt", '') || ' ' || coalesce("content", '')));

ALTER TABLE "Article" ADD CONSTRAINT "Article_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
