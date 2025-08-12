import * as React from "react";
import { Link } from "react-router";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/5 backdrop-blur-xl backdrop-saturate-150 py-4 px-6">
      <div className="flex items-center justify-between c-root text-sm text-muted-foreground">
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
        <div className="flex space-x-4">
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
    </footer>
  );
}
