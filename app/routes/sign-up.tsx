import * as React from "react";
import { SignUp } from "@clerk/react-router";
import Footer from "@/components/footer";
import { privateMeta } from "@/utils/seo";

export function meta() {
  return privateMeta("Sign up · Nuto");
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
