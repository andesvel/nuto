import * as React from "react";
import { Link } from "react-router";
import type { Route } from "./+types/disclaimer";

import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Disclaimer · Nuto" },
    { name: "description", content: "Disclaimer" },
    { name: "robots", content: "noindex" },
  ];
}

export default function Disclaimer() {
  const reportAbuseUrl =
    "https://github.com/andesvel/nuto/issues/new?assignees=&labels=abuse&title=%5BABUSE%5D%20Report%20short%20link&body=Add%20the%20short%20code%20or%20the%20full%20URL%20and%20the%20reason%20(offense%2C%20malicious%20software%2C%20piracy%2C%20etc.).";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header />
      <main className="c-root grow flex items-start justify-center py-8">
        <section className="max-w-2xl w-full space-y-6">
          <h1 className="text-3xl font-bold">Disclaimer</h1>

          <p className="text-sm text-muted-foreground">
            This site is a personal project for technical demonstration and
            portfolio purposes. It is not a commercial service and offers no
            guarantees of any kind. The information and functionalities are
            provided “as is,” without support or commitment to availability.
          </p>

          <p className="text-sm text-muted-foreground">
            Short links can be created by users. Nuto does not host the linked
            content and is not responsible for its legality, accuracy, or
            security. The use of the platform to link to illegal, malicious
            (malware, phishing, etc.) or copyright-infringing (piracy) content
            is strictly prohibited, and such links may be removed.
          </p>

          <div className="rounded-md border p-4 space-y-3">
            <h2 className="text-lg font-semibold">Report abuse</h2>
            <p className="text-sm text-muted-foreground">
              If you find a short link that distributes malware, phishing, or
              hosts/directs to pirated content, please report it:
            </p>
            <Link to={reportAbuseUrl} target="_blank" rel="noopener noreferrer">
              <Button className="group">Report abuse</Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            By using this site, you agree that its use is at your own risk and
            that you may be subject to local laws and the terms of the linked
            services.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
