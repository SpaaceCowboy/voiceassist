CREATE TABLE "MarketplaceCreator" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "handle" TEXT NOT NULL, "initials" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false, "bio" TEXT NOT NULL, "followers" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceCreator_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MarketplaceCategory" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "MarketplaceCategory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MarketplaceProduct" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL, "outcome" TEXT NOT NULL,
  "description" TEXT NOT NULL, "priceMinor" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'USD', "pricingModel" TEXT NOT NULL,
  "platforms" TEXT[] NOT NULL, "models" TEXT[] NOT NULL, "rating" DECIMAL(2,1) NOT NULL DEFAULT 0, "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "usageCount" INTEGER NOT NULL DEFAULT 0, "purchaseCount" INTEGER NOT NULL DEFAULT 0, "version" TEXT NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT false, "trending" BOOLEAN NOT NULL DEFAULT false, "verified" BOOLEAN NOT NULL DEFAULT false,
  "tags" TEXT[] NOT NULL, "packageFileCount" INTEGER, "packageSizeBytes" INTEGER, "benefits" TEXT[] NOT NULL, "useCases" JSONB,
  "includedFiles" JSONB, "exampleInput" TEXT, "exampleOutputTitle" TEXT, "exampleOutputBody" TEXT,
  "installationSteps" TEXT[] NOT NULL, "previewFiles" TEXT[] NOT NULL, "previewExcerpt" TEXT, "requirements" TEXT, "permissions" TEXT,
  "license" TEXT, "updatesPolicy" TEXT, "refundPolicy" TEXT, "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "creatorId" TEXT NOT NULL, "categoryId" TEXT NOT NULL,
  CONSTRAINT "MarketplaceProduct_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MarketplaceProductVersion" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "version" TEXT NOT NULL, "notes" TEXT NOT NULL, "releasedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceProductVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MarketplaceReview" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "author" TEXT NOT NULL, "rating" INTEGER NOT NULL, "body" TEXT NOT NULL,
  "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false, "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MarketplaceReview_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MarketplaceFavorite" (
  "userId" TEXT NOT NULL, "productId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketplaceFavorite_pkey" PRIMARY KEY ("userId", "productId")
);
CREATE TABLE "MarketplaceOrder" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "productId" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "amountMinor" INTEGER NOT NULL, "currency" TEXT NOT NULL, "status" TEXT NOT NULL, "providerRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketplaceCreator_handle_key" ON "MarketplaceCreator"("handle");
CREATE INDEX "MarketplaceCreator_verified_followers_idx" ON "MarketplaceCreator"("verified", "followers");
CREATE UNIQUE INDEX "MarketplaceCategory_slug_key" ON "MarketplaceCategory"("slug");
CREATE INDEX "MarketplaceCategory_position_name_idx" ON "MarketplaceCategory"("position", "name");
CREATE UNIQUE INDEX "MarketplaceProduct_slug_key" ON "MarketplaceProduct"("slug");
CREATE INDEX "MarketplaceProduct_published_featured_usageCount_idx" ON "MarketplaceProduct"("published", "featured", "usageCount");
CREATE INDEX "MarketplaceProduct_published_type_idx" ON "MarketplaceProduct"("published", "type");
CREATE INDEX "MarketplaceProduct_published_categoryId_idx" ON "MarketplaceProduct"("published", "categoryId");
CREATE INDEX "MarketplaceProduct_published_verified_idx" ON "MarketplaceProduct"("published", "verified");
CREATE INDEX "MarketplaceProduct_updatedAt_idx" ON "MarketplaceProduct"("updatedAt");
CREATE UNIQUE INDEX "MarketplaceProductVersion_productId_version_key" ON "MarketplaceProductVersion"("productId", "version");
CREATE INDEX "MarketplaceProductVersion_productId_releasedAt_idx" ON "MarketplaceProductVersion"("productId", "releasedAt");
CREATE INDEX "MarketplaceReview_productId_published_createdAt_idx" ON "MarketplaceReview"("productId", "published", "createdAt");
CREATE INDEX "MarketplaceFavorite_userId_createdAt_idx" ON "MarketplaceFavorite"("userId", "createdAt");
CREATE INDEX "MarketplaceFavorite_productId_idx" ON "MarketplaceFavorite"("productId");
CREATE UNIQUE INDEX "MarketplaceOrder_idempotencyKey_key" ON "MarketplaceOrder"("idempotencyKey");
CREATE INDEX "MarketplaceOrder_userId_createdAt_idx" ON "MarketplaceOrder"("userId", "createdAt");
CREATE INDEX "MarketplaceOrder_productId_status_idx" ON "MarketplaceOrder"("productId", "status");
ALTER TABLE "MarketplaceProduct" ADD CONSTRAINT "MarketplaceProduct_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "MarketplaceCreator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceProduct" ADD CONSTRAINT "MarketplaceProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MarketplaceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceProductVersion" ADD CONSTRAINT "MarketplaceProductVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceReview" ADD CONSTRAINT "MarketplaceReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceFavorite" ADD CONSTRAINT "MarketplaceFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceFavorite" ADD CONSTRAINT "MarketplaceFavorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ReaderUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
