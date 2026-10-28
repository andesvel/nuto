import schema from "../schema.sql?raw";

// D1's exec() splits its input on newlines, which breaks multi-line
// statements, so schema.sql is flattened to one line without comments or
// PRAGMAs before it's applied.
const executableSchema = schema
  .replace(/--.*/g, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/PRAGMA[^;]*;/gi, "")
  .replace(/\s+/g, " ")
  .trim();

export async function applySchema(db: D1Database): Promise<void> {
  await db.exec(executableSchema);
}

// Fixed 32-byte PASSCODE_ENC_KEY so tests don't depend on .dev.vars
// (absent in CI).
export const TEST_ENC_KEY = btoa(
  String.fromCharCode(...new Uint8Array(32).fill(7)),
);
