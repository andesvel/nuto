-- Denormalized click counter for the dashboard (replaces COUNT(clicks) per
-- load). Run once on databases created before this column existed:
--   wrangler d1 execute nuto-db --remote --file=migrations/0001_click_count.sql
-- Fresh databases get the column from schema.sql and must skip this file.
ALTER TABLE urls ADD COLUMN click_count INTEGER NOT NULL DEFAULT 0;

UPDATE urls
SET click_count = (SELECT COUNT(*) FROM clicks WHERE clicks.url_id = urls.id);
