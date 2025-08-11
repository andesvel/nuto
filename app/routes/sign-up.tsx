import * as React from "react";
import { SignUp } from "@clerk/react-router";
import Footer from "@/components/footer";

export default function SignUpPage() {
  <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
    <main className="c-root grow flex items-center justify-center">
      <SignUp />
    </main>
    <Footer />
  </div>;
}
