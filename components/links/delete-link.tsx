import * as React from "react";
import { useFetcher } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { Trash } from "lucide-react";

import type { Link } from "@routes/dashboard";

export default function DeleteLink({ link }: { link: Link }) {
  const fetcher = useFetcher();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="icon" className="rounded-none rounded-r-sm px-2">
          <Trash className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;re about to delete{" "}
            <span className="font-mono text-medium rounded-md bg-muted text-foreground px-2">
              <span className="text-muted-foreground">/</span>
              {link.shortCode}
            </span>
            . This action will permanently delete this short link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              className="group"
              variant="destructive"
              disabled={fetcher.state === "submitting"}
              onClick={() => {
                fetcher.submit(null, {
                  method: "DELETE",
                  action: `/api/links?shortCode=${link.shortCode}`,
                });
              }}
            >
              <Trash className="w-4 h-4 duration-300 group-hover:translate-x-0.5" />
              {fetcher.state === "submitting" ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
