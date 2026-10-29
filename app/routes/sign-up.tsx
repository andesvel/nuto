import * as React from "react";
import { SignUp } from "@clerk/react-router";
import Footer from "@/components/footer";
import { privateMeta } from "@/utils/seo";
import { localeFromMatches, messagesFor } from "@/app/i18n";
import type { Route } from "./+types/sign-up";

export function meta({ matches }: Route.MetaArgs) {
  return privateMeta(messagesFor(localeFromMatches(matches)).meta.signUpTitle);
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <main className="c-root grow flex items-center justify-center">
        <SignUp />
      </main>
      <Footer />
    </div>
  );
}
