export interface LinkRow {
  id: string;
  long_url: string;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  expires_at: string | null;
  password: string | null;
  password_enc: string | null;
  last_clicked: string | null;
}

export async function existsById(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 FROM urls WHERE id = ? LIMIT 1")
    .bind(id)
    .first();
  return row !== null;
}

export async function getLongUrlById(
  db: D1Database,
  id: string,
): Promise<string | null> {
  const row = await db
    .prepare("SELECT long_url FROM urls WHERE id = ?")
    .bind(id)
    .first<{ long_url: string }>();
  return row?.long_url ?? null;
}

export async function getRedirectTargetById(
  db: D1Database,
  id: string,
): Promise<{ long_url: string; password: string | null } | null> {
  return db
    .prepare("SELECT long_url, password FROM urls WHERE id = ?")
    .bind(id)
    .first<{ long_url: string; password: string | null }>();
}

export async function getRedirectWithExpiryById(
  db: D1Database,
  id: string,
): Promise<{
  long_url: string;
  password: string | null;
  expires_at: string | null;
} | null> {
  return db
    .prepare("SELECT long_url, password, expires_at FROM urls WHERE id = ?")
    .bind(id)
    .first<{ long_url: string; password: string | null; expires_at: string | null }>();
}

export async function findOwnedById(
  db: D1Database,
  id: string,
  userId: string,
): Promise<LinkRow | null> {
  return db
    .prepare("SELECT * FROM urls WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first<LinkRow>();
}

export interface LinkDetails {
  shortCode: string;
  longUrl: string;
  createdAt: string;
  expiresAt: string | null;
  password: string | null;
  clicks: number;
}

export async function getLinkDetailsByIdAndUser(
  db: D1Database,
  shortCode: string,
  userId: string,
): Promise<LinkDetails | null> {
  return db
    .prepare(
      `SELECT
        urls.id as shortCode,
        urls.long_url as longUrl,
        urls.created_at as createdAt,
        urls.expires_at as expiresAt,
        urls.password,
        COUNT(clicks.id) as clicks
      FROM urls
      LEFT JOIN clicks ON urls.id = clicks.url_id
      WHERE urls.id = ? AND urls.user_id = ?
      GROUP BY urls.id`,
    )
    .bind(shortCode, userId)
    .first<LinkDetails>();
}

export interface DashboardLinkRow {
  shortCode: string;
  longUrl: string;
  createdAt: string;
  expiresAt: string | null;
  passwordEnc: string | null;
  clicks: number;
  lastClicked: string | null;
}

export async function listActiveLinksForUser(
  db: D1Database,
  userId: string,
): Promise<DashboardLinkRow[]> {
  const result = await db
    .prepare(
      `SELECT
         urls.id AS shortCode,
         urls.long_url AS longUrl,
         urls.created_at AS createdAt,
         urls.expires_at AS expiresAt,
         urls.password_enc AS passwordEnc,
         COUNT(clicks.id) AS clicks,
         urls.last_clicked AS lastClicked
       FROM urls
       LEFT JOIN clicks ON urls.id = clicks.url_id
       WHERE urls.user_id = ? AND (urls.expires_at IS NULL OR urls.expires_at > datetime('now'))
       GROUP BY urls.id
       ORDER BY COALESCE(urls.last_clicked, urls.created_at) DESC`,
    )
    .bind(userId)
    .all<DashboardLinkRow>();
  return result.results || [];
}

export interface NewLink {
  id: string;
  longUrl: string;
  userId: string;
  expiresAt: string | null;
  password: string | null;
  passwordEnc: string | null;
}

export async function insertLink(db: D1Database, link: NewLink): Promise<void> {
  await db
    .prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, expires_at, password, password_enc)
     VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`,
    )
    .bind(link.id, link.longUrl, link.userId, link.expiresAt, link.password, link.passwordEnc)
    .run();
}

export async function insertLinkWithCreatedAt(
  db: D1Database,
  link: {
    id: string;
    longUrl: string;
    userId: string;
    createdAt: string;
    password: string | null;
  },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO urls (id, long_url, user_id, created_at, password) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(link.id, link.longUrl, link.userId, link.createdAt, link.password)
    .run();
}

export async function renameLink(
  db: D1Database,
  link: {
    newId: string;
    longUrl: string;
    password: string | null;
    passwordEnc: string | null;
    updatedAt: string;
    expiresAt: string | null;
    currentId: string;
    userId: string;
  },
): Promise<void> {
  await db
    .prepare(
      "UPDATE urls SET id = ?, long_url = ?, password = ?, password_enc = ?, updated_at = ?, expires_at = ? WHERE id = ? AND user_id = ?",
    )
    .bind(
      link.newId,
      link.longUrl,
      link.password,
      link.passwordEnc,
      link.updatedAt,
      link.expiresAt,
      link.currentId,
      link.userId,
    )
    .run();
}

export async function updateLinkById(
  db: D1Database,
  link: {
    longUrl: string;
    password: string | null;
    passwordEnc: string | null;
    updatedAt: string;
    expiresAt: string | null;
    id: string;
  },
): Promise<void> {
  await db
    .prepare(
      "UPDATE urls SET long_url = ?, password = ?, password_enc = ?, updated_at = ?, expires_at = ? WHERE id = ?",
    )
    .bind(
      link.longUrl,
      link.password,
      link.passwordEnc,
      link.updatedAt,
      link.expiresAt,
      link.id,
    )
    .run();
}

export async function deleteLinkById(db: D1Database, id: string): Promise<void> {
  await db
    .prepare("DELETE FROM urls WHERE id = ?")
    .bind(id)
    .run();
}
