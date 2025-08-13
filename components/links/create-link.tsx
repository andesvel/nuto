import * as React from "react";
import { useFetcher, type AppLoadContext, useLoaderData } from "react-router";

import { generateShortCode } from "@utils/generate-short-code";

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

import { Plus, Shuffle } from "lucide-react";

// export async function action() {}

export default function CreateLink() {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";

  const initialData = useLoaderData() as {
    longUrl: string;
    shortCode: string;
    password?: string;
  };

  return (
    <Dialog>
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
        <fetcher.Form id="create-link-form">
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
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-l-none"
                  onClick={() => {
                    const shortCode = generateShortCode();
                    if (fetcher.formData) {
                      fetcher.formData.set("shortCode", shortCode);
                    }
                  }}
                >
                  <Shuffle strokeWidth={2} />
                  Randomize
                </Button>
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Password (Optional)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Protect this link"
                autoComplete="new-password"
              />
            </div>
          </div>
        </fetcher.Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="create-link-form" disabled={busy}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
