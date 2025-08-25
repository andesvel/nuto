import * as React from "react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import { ExpirationPicker } from "@components/links/expiration-picker";

import { generateShortCode } from "@utils/generate-short-code";
import { validateShortCode } from "@/utils/validate-short-code";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@components/ui/switch";
import { toast } from "sonner";

import { Plus, Shuffle, Eye, EyeOff, Eraser } from "lucide-react";

export default function CreateLink() {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const [open, setOpen] = useState(false);
  const [expires, setExpires] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [viewPassword, setViewPassword] = useState(false);

  const [selected, setSelected] = useState<Date>();

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        toast.success("Link created successfully!");
        clearForm();
        setOpen(false);
      }
      if (fetcher.data.error) {
        toast.error(fetcher.data.error);
      }
    }
  }, [fetcher.data, fetcher.state]);

  const [formData, setFormData] = useState({
    longUrl: "",
    shortCode: "",
    password: "",
    date: "",
  });

  const shortCodeValidation = validateShortCode(formData.shortCode);
  const { isValid, isReserved, hasValidChars } = shortCodeValidation;

  const shortCodeHasValue = formData.shortCode.trim().length > 0;
  const showShortCodeError = shortCodeHasValue && !isValid;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRandomize = () => {
    setFormData({
      ...formData,
      shortCode: generateShortCode(),
    });
  };

  const resetControls = () => {
    setExpires(false);
    setHasPassword(false);
    setSelected(undefined);
    setViewPassword(false);
  };

  const clearForm = () => {
    setFormData({
      longUrl: "",
      shortCode: "",
      password: "",
      date: "",
    });
    resetControls();
  };

  const handleClose = () => {
    setOpen(!open);
    setTimeout(() => {
      resetControls();
      setFormData({
        ...formData,
        shortCode: "",
        password: "",
        date: "",
      });
    }, 300);
  };

  const toggleExpires = () => {
    if (expires) {
      setSelected(undefined);
    }
    setExpires(!expires);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus strokeWidth={2} />
          <span className="hidden md:inline-block">New Link</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[512px]">
        <DialogHeader>
          <DialogTitle>Create a new short link</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new short link by filling out the form below.
          </DialogDescription>
        </DialogHeader>
        <fetcher.Form id="create-link-form" method="post" action="/api/links">
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
                  onClick={() => setFormData({ ...formData, longUrl: "" })}
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
                    onCheckedChange={setHasPassword}
                  />
                  <Label htmlFor="hasPassword" className="w-full">
                    Set password
                  </Label>
                </div>
                {hasPassword && (
                  <div className="flex gap-0 items-center space-x-2">
                    <Input
                      className="mr-0 rounded-none rounded-l-sm border-r-0"
                      id="password"
                      name="password"
                      type={viewPassword ? "text" : "password"}
                      placeholder="Protect this link"
                      autoComplete="new-password"
                      value={formData.password}
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
                  value={selected}
                  onChange={setSelected}
                />
              </div>
            </div>
          </div>
        </fetcher.Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="create-link-form"
            disabled={
              busy || !formData.longUrl || !formData.shortCode || !isValid
            }
          >
            {busy ? (
              "Creating"
            ) : (
              <>
                <Plus strokeWidth={2} />
                Create
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
