import * as React from "react";
import { Link } from "react-router";
import { SiGithub } from "@icons-pack/react-simple-icons";

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/5 backdrop-blur-xl backdrop-saturate-150 py-4 px-6">
      <div className="flex items-center justify-between c-root">
        <p>Made with ❤️ by Andres using Workers</p>
        <div className="flex space-x-4">
          <Link
            to="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SiGithub />
          </Link>
        </div>
      </div>
    </footer>
  );
}
