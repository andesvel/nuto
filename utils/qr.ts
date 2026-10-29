import { encode } from "uqr";
import {
  NUTO_ICON_PATH,
  NUTO_ICON_VIEWBOX,
} from "@/components/icons/nuto-path";

export interface QrOptions {
  /** Module color */
  foreground: string;
  /** Background color, or null for transparent */
  background: string | null;
  /** Put the Nuto mark in the middle (uses the highest error correction) */
  logo: boolean;
}

/** Modules of empty margin around the code; the spec asks for 4. */
export const QR_QUIET_ZONE = 4;

// Share of the code's width the logo badge covers. With error correction H
// (30% recoverable) a centered badge this size still scans reliably.
const LOGO_RATIO = 0.22;

/**
 * Renders `text` as a standalone SVG string, one module per user unit, so
 * it scales crisply to any size. The SVG doubles as the PNG source.
 */
export function qrSvg(text: string, options: QrOptions): string {
  const { data, size } = encode(text, {
    ecc: options.logo ? "H" : "M",
    border: 0,
  });
  const total = size + QR_QUIET_ZONE * 2;

  // The logo sits on a badge; modules under it are left out so the badge
  // reads as a clean cut-out rather than noise behind the mark.
  const badge = options.logo ? Math.ceil(size * LOGO_RATIO) | 1 : 0;
  const badgeStart = Math.floor((size - badge) / 2);
  const underBadge = (x: number, y: number) =>
    badge > 0 &&
    x >= badgeStart - 1 &&
    x < badgeStart + badge + 1 &&
    y >= badgeStart - 1 &&
    y < badgeStart + badge + 1;

  let path = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y][x] && !underBadge(x, y)) {
        path += `M${x + QR_QUIET_ZONE} ${y + QR_QUIET_ZONE}h1v1h-1z`;
      }
    }
  }

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`,
  ];
  if (options.background) {
    parts.push(
      `<rect width="${total}" height="${total}" fill="${options.background}"/>`,
    );
  }
  parts.push(`<path fill="${options.foreground}" d="${path}"/>`);
  if (badge > 0) {
    const origin = badgeStart + QR_QUIET_ZONE;
    const scale = badge / NUTO_ICON_VIEWBOX;
    parts.push(
      `<rect x="${origin}" y="${origin}" width="${badge}" height="${badge}" rx="${badge * 0.22}" fill="${options.background ?? "#ffffff"}"/>`,
      `<path fill="${options.foreground}" transform="translate(${origin} ${origin}) scale(${scale})" shape-rendering="geometricPrecision" d="${NUTO_ICON_PATH}"/>`,
    );
  }
  parts.push("</svg>");
  return parts.join("");
}

/** Download name for a link's QR: nuto-<slug>.<ext>, filesystem-safe. */
export function qrFileName(shortCode: string, extension: "png" | "svg"): string {
  const safe = shortCode.replace(/[^a-zA-Z0-9_-]/g, "_") || "link";
  return `nuto-${safe}.${extension}`;
}

/** Rasterizes an SVG string to a PNG blob of `pixels`×`pixels` (browser only). */
export async function svgToPng(svg: string, pixels: number): Promise<Blob> {
  const url = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = pixels;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is not available");
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, pixels, pixels);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
