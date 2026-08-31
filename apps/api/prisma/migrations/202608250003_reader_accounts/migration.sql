CREATE TABLE "ReaderUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleSubject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReaderUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReaderSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ReaderSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReaderBookmark" (
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReaderBookmark_pkey" PRIMARY KEY ("userId", "articleId")
);

CREATE TABLE "ReaderReadingProgress" (
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReaderReadingProgress_pkey" PRIMARY KEY ("userId", "articleId")
);

CREATE UNIQUE INDEX "ReaderUser_email_key" ON "ReaderUser"("email");
CREATE UNIQUE INDEX "ReaderUser_googleSubject_key" ON "ReaderUser"("googleSubject");
CREATE UNIQUE INDEX "ReaderSession_tokenHash_key" ON "ReaderSession"("tokenHash");
CREATE INDEX "ReaderSession_userId_idx" ON "ReaderSession"("userId");
CREATE INDEX "ReaderSession_expiresAt_idx" ON "ReaderSession"("expiresAt");
CREATE INDEX "ReaderBookmark_userId_createdAt_idx" ON "ReaderBookmark"("userId", "createdAt");
CREATE INDEX "ReaderBookmark_articleId_idx" ON "ReaderBookmark"("articleId");
CREATE INDEX "ReaderReadingProgress_userId_visitedAt_idx" ON "ReaderReadingProgress"("userId", "visitedAt");
CREATE INDEX "ReaderReadingProgress_articleId_idx" ON "ReaderReadingProgress"("articleId");

ALTER TABLE "ReaderSession" ADD CONSTRAINT "ReaderSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReaderBookmark" ADD CONSTRAINT "ReaderBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReaderBookmark" ADD CONSTRAINT "ReaderBookmark_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReaderReadingProgress" ADD CONSTRAINT "ReaderReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReaderReadingProgress" ADD CONSTRAINT "ReaderReadingProgress_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
