import { Link } from "react-router";
import { Button } from "@components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 backdrop-blur-xl supports-[backdrop-filter]:bg-card/30">
      <div className="flex h-16 items-center justify-between center-root">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-black text-white">
              <span className="text-lg font-bold">N</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Nuto</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <ThemeSwitcher />
          <Button className="font-medium tracking-wide">Log in</Button>
          <Button className="hover:bg-primary/90 text-primary-foreground tracking-wide">
            Sign up
          </Button>
        </div>
      </div>
    </header>
  );
}
