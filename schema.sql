PRAGMA foreign_keys = ON;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  subscription_plan TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Short URLs
CREATE TABLE IF NOT EXISTS urls (
  id TEXT PRIMARY KEY,              -- short code
  long_url TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,                  -- nullable until first update
  expires_at TEXT,                  -- ISO string or NULL
  password TEXT,                    -- SHA-256 (legacy) or NULL
  password_enc TEXT,                -- AES-GCM (iv.base64.cipher.base64) or NULL
  last_clicked TEXT,                -- datetime since last click or NULL
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at);
CREATE INDEX IF NOT EXISTS idx_urls_last_clicked ON urls(last_clicked);
CREATE INDEX IF NOT EXISTS idx_urls_expires_at ON urls(expires_at);

-- Click logs
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url_id TEXT NOT NULL,
  clicked_at TEXT NOT NULL,         -- datetime('now')
  country TEXT,
  user_agent TEXT,
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks(url_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);

-- Global settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default URL limit per user
INSERT OR IGNORE INTO settings (key, value)
VALUES ('default_max_links_per_user', '50');

-- User-specific URL limits (overrides default)
CREATE TABLE IF NOT EXISTS user_limits (
  user_id TEXT PRIMARY KEY,
  max_links INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Trigger: avoids inserting new URLs if user has reached their limit
CREATE TRIGGER IF NOT EXISTS prevent_excess_urls
BEFORE INSERT ON urls
WHEN NEW.user_id IS NOT NULL AND (
  (SELECT COUNT(*) FROM urls WHERE user_id = NEW.user_id)
) >= COALESCE(
  (SELECT max_links FROM user_limits WHERE user_id = NEW.user_id),
  CAST((SELECT value FROM settings WHERE key = 'default_max_links_per_user') AS INTEGER)
)
BEGIN
  SELECT RAISE(ABORT, 'url limit reached');
END;