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
import { useT } from "@/app/i18n";

import { Trash, Loader } from "lucide-react";

import type { Link } from "@routes/dashboard";
import { cn } from "@/lib/utils";

export default function DeleteLink({ link }: { link: Link }) {
  const t = useT();
  const fetcher = useFetcher();

  React.useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        toast.info(t.deleteLink.deleted);
      } else if (fetcher.data.error) {
        toast.error(fetcher.data.error);
      }
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="icon"
          className="rounded-none rounded-r-sm px-2"
          aria-label={t.deleteLink.label(link.shortCode)}
        >
          <Trash className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteLink.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.deleteLink.bodyStart}{" "}
            <span
              translate="no"
              className="font-mono font-semibold rounded-md bg-muted text-foreground px-1"
            >
              <span className="text-muted-foreground">/</span>
              {link.shortCode}
            </span>
            {t.deleteLink.bodyEnd}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
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
              {fetcher.state === "submitting" ? (
                <>
                  <Loader
                    size={16}
                    strokeWidth={2}
                    className="mr-2 animate-spin"
                  />
                  <span>{t.deleteLink.deleting}</span>
                </>
              ) : (
                <span>{t.deleteLink.delete}</span>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
