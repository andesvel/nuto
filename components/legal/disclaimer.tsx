import * as React from "react";
import type { Locale } from "@/app/i18n";
import { Button } from "@/components/ui/button";

const REPORT_ABUSE_URL =
  "https://github.com/andesvel/nuto/issues/new?assignees=&labels=abuse&title=%5BABUSE%5D%20Report%20short%20link&body=Add%20the%20short%20code%20or%20the%20full%20URL%20and%20the%20reason%20(offense%2C%20malicious%20software%2C%20piracy%2C%20etc.).";

function ReportAbuseButton({ children }: { children: React.ReactNode }) {
  return (
    <Button asChild>
      <a href={REPORT_ABUSE_URL} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </Button>
  );
}

// Legal prose is written per language rather than split into strings.
export function DisclaimerContent({ locale }: { locale: Locale }) {
  return locale === "es" ? <DisclaimerEs /> : <DisclaimerEn />;
}

function DisclaimerEn() {
  return (
    <>
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
        (malware, phishing, etc.) or copyright-infringing (piracy) content is
        strictly prohibited, and such links may be removed.
      </p>

      <div className="rounded-md border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Report abuse</h2>
        <p className="text-sm text-muted-foreground">
          If you find a short link that distributes malware, phishing, or
          hosts/directs to pirated content, please report it:
        </p>
        <ReportAbuseButton>Report abuse</ReportAbuseButton>
      </div>

      <p className="text-xs text-muted-foreground">
        By using this site, you agree that its use is at your own risk and
        that you may be subject to local laws and the terms of the linked
        services.
      </p>
    </>
  );
}

function DisclaimerEs() {
  return (
    <>
      <h1 className="text-3xl font-bold">Aviso legal</h1>

      <p className="text-sm text-muted-foreground">
        Este sitio es un proyecto personal con fines de demostración técnica y
        de portafolio. No es un servicio comercial y no ofrece garantías de
        ningún tipo. La información y las funciones se ofrecen “tal cual”, sin
        soporte ni compromiso de disponibilidad.
      </p>

      <p className="text-sm text-muted-foreground">
        Los links cortos los crean los usuarios. Nuto no aloja el contenido
        enlazado y no se hace responsable de su legalidad, exactitud ni
        seguridad. Está estrictamente prohibido usar la plataforma para
        enlazar contenido ilegal, malicioso (malware, phishing, etc.) o que
        infrinja derechos de autor (piratería), y esos links pueden ser
        eliminados.
      </p>

      <div className="rounded-md border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Reportar abuso</h2>
        <p className="text-sm text-muted-foreground">
          Si encuentras un link corto que distribuye malware o phishing, o que
          aloja o lleva a contenido pirata, repórtalo:
        </p>
        <ReportAbuseButton>Reportar abuso</ReportAbuseButton>
      </div>

      <p className="text-xs text-muted-foreground">
        Al usar este sitio, aceptas que lo haces bajo tu propio riesgo y que
        puedes estar sujeto a las leyes locales y a los términos de los
        servicios enlazados.
      </p>
    </>
  );
}
