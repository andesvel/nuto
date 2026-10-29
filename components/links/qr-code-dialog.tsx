import * as React from "react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/app/i18n";
import { qrFileName, qrSvg, svgToPng, type QrOptions } from "@/utils/qr";
import { cn } from "@/lib/utils";

const COLORS = { brand: "#5a58ff", black: "#0a0a0a" } as const;
const PNG_PIXELS = 1024;

// The QR opens the short link with ?q so scans can be told apart from taps
export function qrTarget(origin: string, shortCode: string): string {
  return `${origin}/${encodeURIComponent(shortCode)}?q`;
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; swatch?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium mb-2">{label}</legend>
      <div className="flex gap-2" role="radiogroup">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              value === option.value && "border-primary ring-1 ring-primary",
            )}
          >
            {option.swatch && (
              <span
                aria-hidden
                className="size-3 rounded-full border"
                style={{ background: option.swatch }}
              />
            )}
            <span>{option.label}</span>
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

/** Loaded on demand from the link card, so the QR encoder never weighs on the dashboard. */
export default function QrCodeDialog({
  shortCode,
  origin,
  open,
  onOpenChange,
}: {
  shortCode: string;
  origin: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const [color, setColor] = React.useState<keyof typeof COLORS>("brand");
  const [background, setBackground] = React.useState<"white" | "transparent">(
    "white",
  );
  const [logo, setLogo] = React.useState(true);

  const target = qrTarget(origin, shortCode);
  const svg = React.useMemo(() => {
    const options: QrOptions = {
      foreground: COLORS[color],
      background: background === "white" ? "#ffffff" : null,
      logo,
    };
    return qrSvg(target, options);
  }, [target, color, background, logo]);
  const canCopy =
    typeof window !== "undefined" &&
    "ClipboardItem" in window &&
    !!navigator.clipboard?.write;

  const downloadPng = async () => {
    try {
      saveBlob(await svgToPng(svg, PNG_PIXELS), qrFileName(shortCode, "png"));
    } catch {
      toast.error(t.qr.failed);
    }
  };

  const downloadSvg = () =>
    saveBlob(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      qrFileName(shortCode, "svg"),
    );

  const copyImage = async () => {
    try {
      // Safari only accepts the promise form, created inside the click
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": svgToPng(svg, PNG_PIXELS) }),
      ]);
      toast.success(t.qr.copied);
    } catch {
      toast.error(t.qr.failed);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.qr.title}</DialogTitle>
          <DialogDescription>
            <span translate="no">{t.qr.description(shortCode)}</span>
          </DialogDescription>
        </DialogHeader>

        <div
          // Checkerboard shows through a transparent background
          className={cn(
            "mx-auto w-full max-w-64 aspect-square rounded-lg border p-2",
            background === "transparent" &&
              "bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]",
          )}
          role="img"
          aria-label={t.qr.open(shortCode)}
          // Generated locally from the short link; contains no user markup
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        <div className="grid gap-4">
          <Choice
            label={t.qr.color}
            value={color}
            onChange={setColor}
            options={[
              { value: "brand", label: t.qr.brand, swatch: COLORS.brand },
              { value: "black", label: t.qr.black, swatch: COLORS.black },
            ]}
          />
          <Choice
            label={t.qr.background}
            value={background}
            onChange={setBackground}
            options={[
              { value: "white", label: t.qr.white },
              { value: "transparent", label: t.qr.transparent },
            ]}
          />
          <div className="flex items-center justify-between">
            <Label htmlFor="qr-logo">{t.qr.logo}</Label>
            <Switch id="qr-logo" checked={logo} onCheckedChange={setLogo} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {canCopy && (
            <Button variant="ghost" onClick={copyImage}>
              <Copy size={16} />
              <span>{t.qr.copy}</span>
            </Button>
          )}
          <Button variant="outline" onClick={downloadSvg}>
            <Download size={16} />
            <span>{t.qr.downloadSvg}</span>
          </Button>
          <Button onClick={downloadPng}>
            <Download size={16} />
            <span>{t.qr.downloadPng}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
