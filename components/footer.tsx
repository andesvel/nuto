import * as React from "react";
import { Link } from "react-router";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ExternalLink } from "lucide-react";
import { Separator } from "@ui/separator";

export default function Footer() {
  return (
    <footer className="c-root w-full backdrop-blur-xl backdrop-saturate-150 py-4">
      <div className="text-sm text-muted-foreground flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
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
        <Separator className="sm:hidden" decorative />
        <div className="h-4 flex flex-col gap-4 sm:flex-row sm:items-center w-full sm:w-auto justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex">
              <Link
                to="/todo"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Disclaimer
                <span className="sr-only">Disclaimer</span>
              </Link>
            </div>
            <div className="flex">
              <Link
                to="/todo"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Terms of Service
                <span className="sr-only">Terms of Service</span>
              </Link>
            </div>
            <div className="flex">
              <Link
                to="/todo"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Privacy Policy
                <span className="sr-only">Privacy Policy</span>
              </Link>
            </div>
          </div>
          <Separator
            orientation="vertical"
            className="hidden sm:block"
            decorative
          />
          <Separator className="sm:hidden" decorative />
          <div className="h-4 flex items-center w-full sm:w-auto justify-between sm:justify-start gap-6 sm:gap-4 mt-4 sm:mt-0">
            <div className="flex justify-between sm:justify-baseline">
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
            <Separator orientation="vertical" className="hidden sm:block" />
            <div className="h-5 flex">
              <Link
                to="https://github.com/andesvel/nuto"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">Nuto on GitHub</span>
                <SiGithub className="hover:text-foreground transition-colors duration-200 ease-in-out" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
