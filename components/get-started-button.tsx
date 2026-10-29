import * as React from "react";
import { Link, useNavigation } from "react-router";
import { SignedIn, SignedOut, SignInButton } from "@clerk/react-router";
import { ArrowRight, Loader } from "lucide-react";
import { Button } from "./ui/button";

/**
 * Primary call to action: "Go to dashboard" for signed-in visitors,
 * "Get started" (sign-in modal) for everyone else.
 */
export function GetStartedButton() {
  const navigation = useNavigation();
  const isNavigatingToDashboard =
    navigation.state === "loading" &&
    navigation.location.pathname === "/dashboard";

  return (
    <>
      <SignedIn>
        {isNavigatingToDashboard ? (
          <Button size="lg" disabled>
            <Loader size={24} strokeWidth={2} className="mr-2 animate-spin" />
            Loading
          </Button>
        ) : (
          <Button asChild className="group" size="lg">
            <Link to="/dashboard" viewTransition>
              Go to dashboard
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
          <Button className="group" size="lg">
            Get started
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
