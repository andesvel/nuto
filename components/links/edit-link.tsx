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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@components/ui/switch";
import { toast } from "sonner";

import { ExpirationPicker } from "@/components/links/expiration-picker";
import { generateShortCode } from "@utils/generate-short-code";

import { Plus, Shuffle, Eye, EyeOff, Eraser, Edit, Loader } from "lucide-react";

export default function EditLink({
  children,
  link,
}: {
  children?: React.ReactNode;
  link: LinkType;
}) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const [open, setOpen] = useState<boolean>(false);
  const [expires, setExpires] = useState(link.expiresAt !== null);
  const [hasPassword, setHasPassword] = useState(link.password !== null);
  const [viewPassword, setViewPassword] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    link.expiresAt ? new Date(link.expiresAt) : undefined
  );
  const [formData, setFormData] = useState<LinkType>(link);

  const shortCodeValidation = validateShortCode(formData.shortCode ?? "");
  const { isValid, isReserved, hasValidChars } = shortCodeValidation;
  const shortCodeHasValue = (formData.shortCode ?? "").trim().length > 0;
  const showShortCodeError = shortCodeHasValue && !isValid;

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        toast.success("Link edited successfully!");
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
      password: (link.password ?? "").trim(),
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
    link.password,
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
      setHasPassword(link.password !== null);
      setViewPassword(false);
      setSelectedDate(link.expiresAt ? new Date(link.expiresAt) : undefined);
      setFormData(link);
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
          <DialogTitle>Edit link</DialogTitle>
          <DialogDescription>
            Edit the details of your link below.
          </DialogDescription>
        </DialogHeader>

        <p className="font-mono text-sm mb-3 text-foreground/50 truncate w-full">
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
              <Label htmlFor="longUrl">Long URL</Label>
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
                  <span className="sr-only">Clear</span>
                  <Eraser strokeWidth={2} />
                </Button>
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="shortCode">Short code</Label>
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
                  value={formData.shortCode}
                  onChange={handleInputChange}
                  aria-invalid={showShortCodeError || undefined}
                  aria-describedby={
                    showShortCodeError ? "shortCode-error" : undefined
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-l-none"
                  onClick={handleRandomize}
                >
                  <Shuffle strokeWidth={2} />
                  Randomize
                </Button>
              </div>
              {formData.shortCode && hasValidChars === false && (
                <p
                  id="shortCode-error"
                  className="text-xs text-destructive mt-1"
                >
                  Only letters and numbers are allowed.
                </p>
              )}
              {formData.shortCode && hasValidChars === true && isReserved && (
                <p
                  id="shortCode-error"
                  className="text-xs text-destructive mt-1"
                >
                  This short code is reserved. Please choose another one.
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
                    Set password
                  </Label>
                </div>
                {hasPassword ? (
                  <div className="flex gap-0 items-center space-x-2">
                    <Input
                      className="mr-0 rounded-none rounded-l-sm border-r-0"
                      id="password"
                      name="password"
                      type={viewPassword ? "text" : "password"}
                      placeholder="Protect this link"
                      autoComplete="new-password"
                      value={formData.password ?? ""}
                      onChange={handleInputChange}
                    />
                    <Button
                      aria-label="Toggle password visibility"
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
                    Set due date
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
              Cancel
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
                  className="mr-2 animate-spin"
                />
                Editing
              </>
            ) : (
              <>
                <Edit strokeWidth={2} />
                Edit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
