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
            <span className="font-mono text-medium">{link.shortCode}</span>.
            This action will permanently delete this short link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={fetcher.state === "submitting"}
            onClick={() => {
              fetcher.submit(null, {
                method: "DELETE",
                action: `/api/links?shortCode=${link.shortCode}`,
              });
            }}
          >
            {fetcher.state === "submitting" ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
