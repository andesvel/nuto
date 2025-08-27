import * as React from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export function meta() {
  return [
    { title: "Privacy policy · Nuto" },
    { name: "description", content: "Privacy policy" },
    { name: "robots", content: "noindex" },
  ];
}

export default function TermsOfService() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header />
      <main className="c-root grow flex items-start justify-center py-8">
        <section className="max-w-2xl w-full space-y-6">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Effective: 2025-08-27</p>

          <p className="text-sm text-muted-foreground">
            Nuto is a personal, non-commercial project that provides a URL
            shortening service. This policy explains what data is processed,
            why, and how it is handled.
          </p>

          <h2 className="text-lg font-semibold">Data we collect</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>
              Account data: If you sign in, we receive basic profile information
              from our identity provider (e.g., user ID and email).
            </li>
            <li>
              Link data: When you create a short link, we store the destination
              URL, the short code, optional metadata (a password to protect it), and
              optional expiration settings.
            </li>
            <li>
              Password-protected links: For links you protect with a password,
              the password is never stored in plaintext. A derived verifier is
              set in a cookie to remember access. The password itself is stored
              encrypted and/or hashed for verification only.
            </li>
            <li>
              Basic usage logs: On redirect, we may record timestamp, a
              truncated user-agent (up to 500 characters), and the country code
              derived by Cloudflare. We do not store IP addresses in application
              data.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">How we use data</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>
              Provide the service (create, resolve, and manage short links).
            </li>
            <li>Secure protected links and validate access.</li>
            <li>Detect abuse and maintain service integrity.</li>
            <li>
              Produce basic, non-personalized analytics (e.g., clicks by
              country/UA).
            </li>
          </ul>

          <h2 className="text-lg font-semibold">Cookies and local storage</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>Authentication cookies set by the identity provider.</li>
            <li>
              A short-lived cookie per protected link to remember successful
              access (stores a non-reversible verifier, not the password).
            </li>
            <li>
              Optional UI preferences (e.g., theme) may be stored in local
              storage.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">Third parties</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>
              Cloudflare (Workers, KV/D1, CDN) processes traffic to deliver the
              service and may process IP addresses to derive approximate
              geolocation (country).
            </li>
            <li>
              Clerk provides user authentication and manages account data per
              their own privacy terms.
            </li>
            <li>
              Abuse reports are handled via GitHub Issues. Submitting a report
              shares whatever you enter there publicly.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">Legal bases</h2>
          <p className="text-sm text-muted-foreground">
            Where applicable, we process data to perform the service you request
            and based on legitimate interests in operating, securing, and
            improving the service. We do not use data for advertising.
          </p>

          <h2 className="text-lg font-semibold">Retention</h2>
          <p className="text-sm text-muted-foreground">
            Account and link data are kept until you delete them or your account
            is removed. Basic click logs are retained only as needed for
            operation and abuse prevention and may be periodically pruned.
          </p>

          <h2 className="text-lg font-semibold">Security</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>Transport encryption (HTTPS) is required.</li>
            <li>
              Protected-link passwords are stored encrypted and/or as one-way
              hashes and are never saved in plaintext.
            </li>
            <li>
              Despite reasonable measures, no method of storage or transmission
              is 100% secure.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">Your rights</h2>
          <p className="text-sm text-muted-foreground">
            Depending on your location, you may have rights to access, correct,
            export, or delete your data. You can remove links you created and
            delete your account to stop further processing.
          </p>

          <h2 className="text-lg font-semibold">International transfers</h2>
          <p className="text-sm text-muted-foreground">
            Infrastructure is provided by Cloudflare and may process data in
            multiple regions. By using the service, you acknowledge these
            transfers.
          </p>

          <h2 className="text-lg font-semibold">Children’s privacy</h2>
          <p className="text-sm text-muted-foreground">
            The service is not directed to children under 13, and we do not
            knowingly collect data from them.
          </p>

          <h2 className="text-lg font-semibold">Changes</h2>
          <p className="text-sm text-muted-foreground">
            We may update this policy from time to time. Material changes will
            be reflected on this page with a new effective date.
          </p>

          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="text-sm text-muted-foreground">
            For privacy requests or questions, please open an issue at{" "}
            <a
              className="underline"
              href="https://github.com/andesvel/nuto/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/andesvel/nuto/issues
            </a>
            .
          </p>

          <p className="text-xs text-muted-foreground">
            This document is provided for transparency and does not constitute
            legal advice.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
