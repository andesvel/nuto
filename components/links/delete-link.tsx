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
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";

import { Trash } from "lucide-react";

import type { Link } from "@routes/dashboard";
import { cn } from "@/lib/utils";

export default function DeleteLink({ link }: { link: Link }) {
  const fetcher = useFetcher();

  React.useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        toast.info("Link successfully deleted.");
      }
    }
  }, [fetcher.data, fetcher.state]);

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
            <span className="font-mono font-semibold rounded-md bg-muted text-foreground px-1">
              <span className="text-muted-foreground">/</span>
              {link.shortCode}
            </span>
            . This action will permanently delete this short link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            asChild
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            <Button
              className="group"
              disabled={fetcher.state === "submitting"}
              onClick={() => {
                fetcher.submit(null, {
                  method: "DELETE",
                  action: `/api/links?shortCode=${link.shortCode}`,
                });
              }}
            >
              <Trash className="w-4 h-4 duration-300 group-hover:translate-x-0.5" />
              {fetcher.state === "submitting" ? "Deleting" : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
