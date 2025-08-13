import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Plus, Shuffle } from "lucide-react";

export function CreateLink() {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button>
            <Plus strokeWidth={2} />
            <span className="hidden md:inline-block">New Link</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new short link</DialogTitle>
            {/* <DialogDescription>
              Create a new short link by filling out the form below.
            </DialogDescription> */}
          </DialogHeader>
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
                // defaultValue="https://www.example.com"
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
                  variant="outline"
                  className="rounded-l-none"
                  onClick={() => {
                    // Randomize short code
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
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
