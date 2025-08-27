import * as React from "react";
import { Link } from "react-router";
import { ExternalLink } from "lucide-react";
import { Separator } from "@ui/separator";

export default function Footer() {
  return (
    <footer className="c-root w-full backdrop-blur-xl backdrop-saturate-150 py-4">
      <div className="text-xs text-muted-foreground flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 sm:justify-start">
          <p className="whitespace-nowrap w-full">
            Made by Andres using{" "}
            <Link
              to="https://reactrouter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              React Router
              <ExternalLink className="ml-1 inline" size={14} />
            </Link>
          </p>
          <div className="block sm:hidden">
            <Link
              to="https://github.com/andesvel/nuto/issues/new?assignees=&labels=bug&template=bug_report.md&title="
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline whitespace-nowrap"
            >
              Report a bug
              <span className="sr-only">Report a bug</span>
              <ExternalLink className="ml-1 inline" size={14} />
            </Link>
          </div>
        </div>

        <div className="h-4 flex w-full items-center gap-2 sm:justify-end">
          <Link to="/disclaimer" className="hover:underline">
            Disclaimer
          </Link>
          <Separator orientation="vertical" />
          <Link to="/privacy" className="hover:underline">
            Privacy policy
          </Link>
          <Separator orientation="vertical" className="hidden sm:block" />
          <div className="hidden sm:block">
            <Link
              to="https://github.com/andesvel/nuto/issues/new?assignees=&labels=bug&template=bug_report.md&title="
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Report a bug
              <span className="sr-only">Report a bug</span>
              <ExternalLink className="ml-1 inline" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
