import * as React from "react";
import { SignIn } from "@clerk/react-router";
import Footer from "@/components/footer";

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
