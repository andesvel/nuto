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
        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between">
          {/* <div className="flex space-x-4">
            <Link
              to="https://TODO"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Disclaimer
            </Link>
          </div> */}
          <div className="flex space-x-4">
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
          <div className="h-5 flex space-x-4">
            <Separator
              orientation="vertical"
              className="hidden sm:inline-block"
            />
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
    </footer>
  );
}
