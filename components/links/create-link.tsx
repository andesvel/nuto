import * as React from "react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import { generateShortCode } from "@utils/generate-short-code";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@components/ui/switch";

import { ChevronDownIcon, Plus, Shuffle, Eye, EyeClosed } from "lucide-react";

export default function CreateLink() {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const [open, setOpen] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [expires, setExpires] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [viewPassword, setViewPassword] = useState(false);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        clearForm();
        setOpen(false);
      }
    }
  }, [fetcher.data, fetcher.state]);

  const [formData, setFormData] = useState({
    longUrl: "",
    shortCode: "",
    password: "",
  });

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

  const clearForm = () => {
    setFormData({
      longUrl: "",
      shortCode: "",
      password: "",
    });
    setExpires(false);
    setHasPassword(false);
    setDate(undefined);
    setViewPassword(false);
  };

  const handleClose = () => {
    setOpen(!open);
    setTimeout(() => {
      setExpires(false);
      setHasPassword(false);
      setDate(undefined);
      setViewPassword(false);
      setFormData({
        ...formData,
        shortCode: "",
        password: "",
      });
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus strokeWidth={2} />
          <span className="hidden md:inline-block">New Link</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
              <Input
                required
                type="url"
                id="longUrl"
                name="longUrl"
                placeholder="https://"
                autoComplete="off"
                value={formData.longUrl}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="shortCode">Short Code</Label>
              <div className="flex">
                <Input
                  required
                  id="shortCode"
                  name="shortCode"
                  placeholder="abc123"
                  className="flex-1 rounded-r-none border-r-0"
                  autoComplete="off"
                  value={formData.shortCode}
                  onChange={handleInputChange}
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
            </div>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasPassword"
                    checked={hasPassword}
                    onCheckedChange={setHasPassword}
                  />
                  <Label htmlFor="hasPassword" className="w-full">
                    Password
                  </Label>
                </div>
                {hasPassword && (
                  <div className="flex gap-0 items-center space-x-2">
                    <Input
                      className="mr-0 rounded-none rounded-l-sm"
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
                      className="rounded-none rounded-r-sm border border-l-none"
                      type="button"
                      variant="icon"
                      onClick={() => setViewPassword(!viewPassword)}
                    >
                      {viewPassword ? <Eye /> : <EyeClosed />}
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    defaultChecked={false}
                    checked={expires}
                    onCheckedChange={() => setExpires(!expires)}
                    id="expires"
                  />
                  <Label htmlFor="expires" className="w-full">
                    Will expire
                  </Label>
                </div>
                {expires && (
                  <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date-picker"
                        className="w-full justify-between font-normal"
                      >
                        {date ? date.toLocaleDateString() : "Select date"}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          setDate(date);
                          setOpenCalendar(false);
                        }}
                      />
                      <div className="px-4 pb-4 flex gap-2 items-center justify-center">
                        <Label htmlFor="time-picker" className="grow">
                          Time
                        </Label>
                        <Input
                          type="time"
                          id="time-picker"
                          step="1"
                          defaultValue="10:30:00"
                          className="mx-auto w-fit appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>
        </fetcher.Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form="create-link-form" disabled={busy}>
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
