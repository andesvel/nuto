import { Link } from "react-router";
import {
  SiFacebook,
  SiX,
  SiInstagram,
  SiLinkerd,
  SiGithub,
} from "@icons-pack/react-simple-icons";

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/5 backdrop-blur-lg py-4 px-6">
      <div className="flex items-center justify-between center-root">
        <p>Made with ❤️ using Cloudflare Workers by Andres Estrada</p>
        <div className="flex space-x-4">
          <Link
            to="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SiFacebook />
          </Link>
          <Link
            to="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SiInstagram />
          </Link>
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
