-- Click attribution for dashboard analytics: QR scans, in-app browsers and
-- device family, plus an index for per-link time ranges. Run once on
-- databases created before these columns existed, BEFORE deploying the
-- code that writes them:
--   wrangler d1 execute nuto-db --remote --file=migrations/0002_click_attribution.sql
-- Fresh databases get everything from schema.sql and must skip this file.
ALTER TABLE clicks ADD COLUMN source TEXT;
ALTER TABLE clicks ADD COLUMN app TEXT;
ALTER TABLE clicks ADD COLUMN device TEXT;

CREATE INDEX IF NOT EXISTS idx_clicks_url_id_clicked_at ON clicks(url_id, clicked_at);

-- Best-effort backfill from the stored user agents, so existing history
-- shows up in the device and app breakdowns. QR scans can't be recovered.
UPDATE clicks SET device = CASE
  WHEN user_agent LIKE '%iPhone%' OR user_agent LIKE '%iPad%' OR user_agent LIKE '%iPod%' THEN 'ios'
  WHEN user_agent LIKE '%Android%' THEN 'android'
  WHEN user_agent LIKE '%Windows%' OR user_agent LIKE '%Macintosh%' OR user_agent LIKE '%X11%' OR user_agent LIKE '%CrOS%' THEN 'desktop'
  ELSE 'other'
END
WHERE device IS NULL;

UPDATE clicks SET app = CASE
  WHEN user_agent LIKE '%Instagram%' THEN 'instagram'
  WHEN user_agent LIKE '%Barcelona%' THEN 'threads'
  WHEN user_agent LIKE '%FB_IAB%' AND user_agent LIKE '%Orca%' THEN 'messenger'
  WHEN user_agent LIKE '%FBAN%' OR user_agent LIKE '%FBAV%' OR user_agent LIKE '%FB_IAB%' THEN 'facebook'
  WHEN user_agent LIKE '%BytedanceWebview%' OR user_agent LIKE '%musical_ly%' OR user_agent LIKE '%trill_%' THEN 'tiktok'
  WHEN user_agent LIKE '%WhatsApp%' THEN 'whatsapp'
  WHEN user_agent LIKE '%Twitter%' THEN 'twitter'
  WHEN user_agent LIKE '%LinkedInApp%' THEN 'linkedin'
  WHEN user_agent LIKE '%Snapchat%' THEN 'snapchat'
  WHEN user_agent LIKE '% Line/%' THEN 'line'
  WHEN user_agent LIKE '%MicroMessenger%' THEN 'wechat'
  WHEN user_agent LIKE '%GSA/%' THEN 'gsa'
  ELSE NULL
END
WHERE app IS NULL;
