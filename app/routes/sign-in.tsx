import * as React from "react";
import { SignIn } from "@clerk/react-router";
import Footer from "@/components/footer";
import { privateMeta } from "@/utils/seo";
import { localeFromMatches, messagesFor } from "@/app/i18n";
import type { Route } from "./+types/sign-in";

export function meta({ matches }: Route.MetaArgs) {
  return privateMeta(messagesFor(localeFromMatches(matches)).meta.signInTitle);
}

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <main className="c-root grow flex items-center justify-center">
        <SignIn />
      </main>
      <Footer />
    </div>
  );
}
