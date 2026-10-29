import * as React from "react";
import { Link, useNavigation } from "react-router";
import { SignedIn, SignedOut, SignInButton } from "@clerk/react-router";
import { ArrowRight, Loader } from "lucide-react";
import { Button } from "./ui/button";
import { useT } from "@/app/i18n";

/**
 * Primary call to action: "Go to dashboard" for signed-in visitors,
 * "Get started" (sign-in modal) for everyone else.
 */
export function GetStartedButton() {
  const t = useT();
  const navigation = useNavigation();
  const isNavigatingToDashboard =
    navigation.state === "loading" &&
    navigation.location.pathname === "/dashboard";

  return (
    <>
      <SignedIn>
        {isNavigatingToDashboard ? (
          <Button disabled>
            <Loader size={24} strokeWidth={2} className="animate-spin" />
            <span>{t.common.loading}</span>
          </Button>
        ) : (
          <Button asChild className="group">
            <Link to="/dashboard" viewTransition>
              <span>{t.header.goToDashboard}</span>
              <ArrowRight
                size={24}
                strokeWidth={2}
                className="duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
        )}
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button className="group">
            <span>{t.hero.getStarted}</span>
            <ArrowRight
              size={24}
              strokeWidth={2}
              className="duration-300 group-hover:translate-x-0.5"
            />
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
