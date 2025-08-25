/**
 * Converts a date in int64 format to ISO 8601 string
 * @param int64Date - The date as a 64-bit integer (timestamp in milliseconds or seconds)
 * @param isInSeconds - If true, the timestamp is in seconds; if false, in milliseconds (default: false)
 * @returns String in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
export function int64ToIso8601(
  int64Date: number | bigint,
  isInSeconds: boolean = false
): string {
  // Convert bigint to number if necessary
  const timestamp =
    typeof int64Date === "bigint" ? Number(int64Date) : int64Date;

  // Convert to milliseconds if it's in seconds
  const timestampMs = isInSeconds ? timestamp * 1000 : timestamp;

  // Create Date object and convert to ISO 8601
  const date = new Date(timestampMs);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${int64Date}`);
  }

  return date.toISOString();
}

/**
 * Converts a date in int64 format to ISO 8601 string with local timezone
 * @param int64Date - The date as a 64-bit integer
 * @param isInSeconds - If true, the timestamp is in seconds; if false, in milliseconds (default: false)
 * @returns String in ISO 8601 format with local timezone offset
 */
export function int64ToLocalIso8601(
  int64Date: number | bigint,
  isInSeconds: boolean = false
): string {
  const timestamp =
    typeof int64Date === "bigint" ? Number(int64Date) : int64Date;
  const timestampMs = isInSeconds ? timestamp * 1000 : timestamp;
  const date = new Date(timestampMs);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${int64Date}`);
  }

  // Get timezone offset in minutes
  const timezoneOffset = date.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
  const offsetMinutes = Math.abs(timezoneOffset) % 60;
  const offsetSign = timezoneOffset <= 0 ? "+" : "-";

  // Format the date manually to include the offset
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetSign}${String(
    offsetHours
  ).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
}

/**
 * Automatically detects if a timestamp is in seconds or milliseconds
 * based on typical value ranges
 * @param timestamp - The timestamp to analyze
 * @returns true if it's in seconds, false if it's in milliseconds
 */
export function detectTimestampUnit(timestamp: number | bigint): boolean {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;

  // Typical timestamps:
  // Seconds: ~1.7 billion (year 2024)
  // Milliseconds: ~1.7 trillion (year 2024)
  // If the number is less than 1e12, it's probably in seconds
  return ts < 1e12;
}

/**
 * Converts int64 to ISO 8601 with automatic unit detection
 * @param int64Date - The date as a 64-bit integer
 * @returns String in ISO 8601 format
 */
export function int64ToIso8601Auto(int64Date: number | bigint): string {
  const isInSeconds = detectTimestampUnit(int64Date);
  return int64ToIso8601(int64Date, isInSeconds);
}
