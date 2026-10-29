import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useFetcher } from "react-router";
import type { Link as LinkType } from "@routes/dashboard";
import { validateShortCode } from "@utils/validate-short-code";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@components/ui/switch";
import { toast } from "sonner";
import { useT } from "@/app/i18n";
import { forgetLinkPassword, useLinkPassword } from "./use-link-password";

import { ExpirationPicker } from "@/components/links/expiration-picker";
import { generateShortCode } from "@utils/generate-short-code";

import {
  Plus,
  Shuffle,
  Eye,
  EyeOff,
  Eraser,
  Edit,
  Loader,
  Lock,
  Unlock,
  CircleAlert,
} from "lucide-react";

export default function EditLink({
  children,
  link,
}: {
  children?: React.ReactNode;
  link: LinkType;
}) {
  const t = useT();
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const [open, setOpen] = useState<boolean>(false);
  const [expires, setExpires] = useState(link.expiresAt !== null);
  const [hasPassword, setHasPassword] = useState(link.hasPassword);
  // The current password isn't in the dashboard data; it's fetched when the
  // dialog opens so it can be shown and edited, and compared for isPristine
  const current = useLinkPassword(link.shortCode);
  const loadPassword = current.load;
  const [viewPassword, setViewPassword] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    link.expiresAt ? new Date(link.expiresAt) : undefined
  );
  const [formData, setFormData] = useState<LinkType & { password: string }>({
    ...link,
    password: "",
  });

  useEffect(() => {
    if (!open || !link.hasPassword) return;
    let cancelled = false;
    loadPassword().then((value) => {
      if (!cancelled && value !== null) {
        setFormData((prev) => (prev.password ? prev : { ...prev, password: value }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, link.hasPassword, loadPassword]);

  const shortCodeValidation = validateShortCode(formData.shortCode ?? "");
  const { isValid, isReserved, hasValidChars } = shortCodeValidation;
  const shortCodeHasValue = (formData.shortCode ?? "").trim().length > 0;
  const showShortCodeError = shortCodeHasValue && !isValid;
  const [isShortCodeLocked, setIsShortCodeLocked] = useState(true);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        forgetLinkPassword(link.shortCode);
        forgetLinkPassword(formData.shortCode);
        toast.success(t.linkForm.edited);
        setOpen(!open);
      } else if (fetcher.data.error) {
        toast.error(fetcher.data.error);
      }
    }
  }, [fetcher.data, fetcher.state]);

  const isPristine = useMemo(() => {
    const current = {
      longUrl: formData.longUrl.trim(),
      shortCode: formData.shortCode.trim(),
      password: (hasPassword ? formData.password ?? "" : "").trim(),
      expiresAt: expires && selectedDate ? selectedDate.toISOString() : null,
    };

    const original = {
      longUrl: (link.longUrl ?? "").trim(),
      shortCode: (link.shortCode ?? "").trim(),
      password: (link.hasPassword ? (current.password ?? "") : "").trim(),
      expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString() : null,
    };

    return (
      current.longUrl === original.longUrl &&
      current.shortCode === original.shortCode &&
      current.password === original.password &&
      current.expiresAt === original.expiresAt
    );
  }, [
    formData.longUrl,
    formData.shortCode,
    formData.password,
    hasPassword,
    expires,
    selectedDate,
    link.longUrl,
    link.shortCode,
    link.hasPassword,
    current.password,
    link.expiresAt,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleHasPasswordChange = (checked: boolean) => {
    setHasPassword(checked);
    if (!checked) {
      setFormData((prev) => ({ ...prev, password: "" }));
    }
  };

  const handleRandomize = () => {
    setFormData({
      ...formData,
      shortCode: generateShortCode(),
    });
  };

  const toggleExpires = () => {
    if (expires) {
      setSelectedDate(undefined);
    }
    setExpires(!expires);
  };

  const handleCancel = () => {
    setOpen(!open);
    setTimeout(() => {
      setExpires(link.expiresAt !== null);
      setHasPassword(link.hasPassword);
      setViewPassword(false);
      setIsShortCodeLocked(true);
      setSelectedDate(link.expiresAt ? new Date(link.expiresAt) : undefined);
      setFormData({ ...link, password: current.password ?? "" });
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Plus /> Edit Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[512px]">
        <DialogHeader>
          <DialogTitle>{t.linkForm.editTitle}</DialogTitle>
          <DialogDescription>{t.linkForm.editDescription}</DialogDescription>
        </DialogHeader>

        <p
          translate="no"
          className="font-mono text-sm mb-3 text-foreground/50 truncate w-full"
        >
          Currently editing{" "}
          <span className="bg-accent font-mono text-sm font-semibold px-2 py-1 rounded-sm break-all">
            /{link.shortCode}
          </span>
        </p>

        <fetcher.Form id="edit-link-form" method="put" action="/api/links">
          <input
            type="hidden"
            name="originalShortCode"
            value={link.shortCode}
          />
          <input
            type="hidden"
            name="expiresAt"
            value={expires && selectedDate ? selectedDate.toISOString() : ""}
          />
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="longUrl">{t.linkForm.longUrl}</Label>
              <div className="flex">
                <Input
                  required
                  type="url"
                  id="longUrl"
                  name="longUrl"
                  placeholder="https://"
                  autoComplete="off"
                  value={formData.longUrl}
                  onChange={handleInputChange}
                  className="flex-1 rounded-r-none border-r-0"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!formData.longUrl}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, longUrl: "" }))
                  }
                  className="rounded-l-none"
                >
                  <span className="sr-only">{t.common.clear}</span>
                  <Eraser strokeWidth={2} />
                </Button>
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="shortCode">{t.linkForm.shortCode}</Label>
              <div className="flex">
                <Input
                  required
                  id="shortCode"
                  name="shortCode"
                  placeholder="abc123"
                  className="flex-1 rounded-r-none border-r-0"
                  minLength={4}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                  pattern="[0-9A-Za-z]+"
                  disabled={isShortCodeLocked}
                  value={formData.shortCode}
                  onChange={handleInputChange}
                  aria-invalid={showShortCodeError || undefined}
                  aria-describedby={
                    showShortCodeError ? "shortCode-error" : undefined
                  }
                />
                {isShortCodeLocked && (
                  <input
                    type="hidden"
                    name="shortCode"
                    value={formData.shortCode}
                  />
                )}
                {isShortCodeLocked ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-l-none"
                      >
                        <Lock strokeWidth={2} />
                        <span>{t.linkForm.unlock}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none flex items-center">
                            <CircleAlert className="inline mr-2 h-4 w-4" />
                            {t.linkForm.unlockTitle}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {t.linkForm.unlockBody}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => setIsShortCodeLocked(false)}
                        >
                          <Unlock className="mr-2 h-4 w-4" />
                          <span>{t.linkForm.unlockConfirm}</span>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none"
                    onClick={handleRandomize}
                  >
                    <Shuffle strokeWidth={2} />
                    <span>{t.linkForm.randomize}</span>
                  </Button>
                )}
              </div>
              {formData.shortCode && hasValidChars === false && (
                <p
                  id="shortCode-error"
                  className="text-xs text-destructive mt-1"
                >
                  {t.linkForm.onlyAlphanumeric}
                </p>
              )}
              {formData.shortCode && hasValidChars === true && isReserved && (
                <p
                  id="shortCode-error"
                  className="text-xs text-destructive mt-1"
                >
                  {t.linkForm.reserved}
                </p>
              )}
            </div>
            <div className="grid py-2 gap-6">
              <div className="flex flex-col gap-4">
                {/* Password protection */}
                <div className="flex flex-row-reverse items-center space-x-2">
                  <Switch
                    id="hasPassword"
                    checked={hasPassword}
                    onCheckedChange={handleHasPasswordChange}
                  />
                  <Label htmlFor="hasPassword" className="w-full">
                    {t.linkForm.setPassword}
                  </Label>
                </div>
                {hasPassword ? (
                  <div className="flex gap-0 items-center space-x-2">
                    <Input
                      className="mr-0 rounded-none rounded-l-sm border-r-0"
                      id="password"
                      name="password"
                      type={viewPassword ? "text" : "password"}
                      placeholder={t.linkForm.passwordPlaceholder}
                      autoComplete="new-password"
                      value={formData.password ?? ""}
                      onChange={handleInputChange}
                    />
                    <Button
                      aria-label={t.common.togglePassword}
                      className="rounded-none rounded-r-sm border"
                      type="button"
                      variant="icon"
                      onClick={() => setViewPassword(!viewPassword)}
                    >
                      {viewPassword ? <Eye /> : <EyeOff />}
                    </Button>
                  </div>
                ) : (
                  <input type="hidden" name="password" value="" />
                )}
              </div>
              <div className="flex flex-col gap-4">
                {/* Link expiration */}
                <div className="flex flex-row-reverse items-center space-x-2">
                  <Switch
                    defaultChecked={false}
                    checked={expires}
                    onCheckedChange={toggleExpires}
                    id="expires"
                  />
                  <Label htmlFor="expires" className="w-full">
                    {t.linkForm.setExpiry}
                  </Label>
                </div>
                <ExpirationPicker
                  enabled={expires}
                  value={selectedDate}
                  onChange={setSelectedDate}
                />
              </div>
            </div>
          </div>
        </fetcher.Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" onClick={handleCancel}>
              {t.common.cancel}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="edit-link-form"
            disabled={
              busy ||
              isPristine ||
              !formData.longUrl ||
              !formData.shortCode ||
              !isValid
            }
          >
            {busy ? (
              <>
                <Loader
                  size={16}
                  strokeWidth={2}
                  className="animate-spin"
                />
                <span>{t.linkForm.editing}</span>
              </>
            ) : (
              <>
                <Edit strokeWidth={2} />
                <span>{t.linkForm.edit}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
