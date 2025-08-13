import { nanoid } from "nanoid";

export function generateShortCode() {
  return nanoid(8);
}
