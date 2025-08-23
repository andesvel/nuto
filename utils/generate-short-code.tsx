import { customAlphabet } from "nanoid";

export function generateShortCode() {
  const random = customAlphabet(
    "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVXYZ",
    8
  );
  return random();
}
