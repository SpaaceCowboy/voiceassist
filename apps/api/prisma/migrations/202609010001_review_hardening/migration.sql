ALTER TABLE "MediaAsset"
  ADD COLUMN "deletionRequestedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "MediaAsset_url_idx" ON "MediaAsset"("url");
CREATE INDEX "MediaAsset_deletionRequestedAt_deletedAt_idx" ON "MediaAsset"("deletionRequestedAt", "deletedAt");

CREATE INDEX "Article_search_simple_idx" ON "Article" USING GIN (
  to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("excerpt", '') || ' ' || coalesce("content", ''))
);

-- Raw visitor searches are no longer collected or exposed. Purge the legacy
-- telemetry so potentially sensitive query text is not retained indefinitely.
TRUNCATE TABLE "SearchQuery";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "MarketplaceOrder"
    GROUP BY "userId", "productId"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one marketplace entitlement per user/product: duplicate orders exist';
  END IF;
END $$;

CREATE UNIQUE INDEX "MarketplaceOrder_userId_productId_key" ON "MarketplaceOrder"("userId", "productId");

CREATE FUNCTION reject_unavailable_article_media() RETURNS trigger AS $$
BEGIN
  IF NEW."heroImage" IS NOT NULL AND EXISTS (
    SELECT 1 FROM "MediaAsset"
    WHERE "url" = NEW."heroImage"
      AND ("deletionRequestedAt" IS NOT NULL OR "deletedAt" IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Referenced article media is being deleted or has been deleted' USING ERRCODE = '23503';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Article_reject_unavailable_media"
BEFORE INSERT OR UPDATE OF "heroImage" ON "Article"
FOR EACH ROW EXECUTE FUNCTION reject_unavailable_article_media();

CREATE FUNCTION reject_unavailable_edition_media() RETURNS trigger AS $$
BEGIN
  IF NEW."coverImage" IS NOT NULL AND EXISTS (
    SELECT 1 FROM "MediaAsset"
    WHERE "url" = NEW."coverImage"
      AND ("deletionRequestedAt" IS NOT NULL OR "deletedAt" IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Referenced edition media is being deleted or has been deleted' USING ERRCODE = '23503';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Edition_reject_unavailable_media"
BEFORE INSERT OR UPDATE OF "coverImage" ON "Edition"
FOR EACH ROW EXECUTE FUNCTION reject_unavailable_edition_media();
