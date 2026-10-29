import * as React from "react";
import type { Locale } from "@/app/i18n";

// Legal prose is written per language rather than split into strings.
export function PrivacyContent({ locale }: { locale: Locale }) {
  return locale === "es" ? <PrivacyEs /> : <PrivacyEn />;
}

function PrivacyEn() {
  return (
    <>
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
            A cookie with your language choice, if you pick one.
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
    </>
  );
}

function PrivacyEs() {
  return (
    <>
        <h1 className="text-3xl font-bold">Política de privacidad</h1>
        <p className="text-xs text-muted-foreground">Vigente desde: 2025-08-27</p>

        <p className="text-sm text-muted-foreground">
          Nuto es un proyecto personal y sin fines comerciales que ofrece un
          servicio para acortar URLs. Esta política explica qué datos se
          procesan, para qué y cómo se tratan.
        </p>

        <h2 className="text-lg font-semibold">Datos que recopilamos</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li>
            Datos de la cuenta: si inicias sesión, recibimos información básica
            de tu perfil desde nuestro proveedor de identidad (por ejemplo, tu
            ID de usuario y tu correo).
          </li>
          <li>
            Datos de los links: cuando creas un link corto, guardamos la URL de
            destino, el código corto, datos opcionales (una contraseña para
            protegerlo) y la fecha de vencimiento si la configuras.
          </li>
          <li>
            Links con contraseña: la contraseña nunca se guarda en texto plano.
            Una cookie guarda un verificador derivado para recordar que ya
            entraste. La contraseña en sí se guarda cifrada y/o como hash, solo
            para verificarla.
          </li>
          <li>
            Registros básicos de uso: en cada redirección podemos registrar la
            hora, un user agent recortado (hasta 500 caracteres) y el código de
            país que deduce Cloudflare. No guardamos direcciones IP en los datos
            de la aplicación.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">Cómo usamos los datos</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li>Prestar el servicio (crear, resolver y gestionar links cortos).</li>
          <li>Proteger los links con contraseña y validar el acceso.</li>
          <li>Detectar abusos y mantener la integridad del servicio.</li>
          <li>
            Generar estadísticas básicas y no personalizadas (por ejemplo, clics
            por país o por user agent).
          </li>
        </ul>

        <h2 className="text-lg font-semibold">Cookies y almacenamiento local</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li>Cookies de autenticación del proveedor de identidad.</li>
          <li>
            Una cookie de corta duración por cada link protegido, para recordar
            que ya entraste (guarda un verificador irreversible, no la
            contraseña).
          </li>
          <li>Una cookie con el idioma que elegiste, si eliges uno.</li>
          <li>
            Preferencias opcionales de la interfaz (por ejemplo, el tema) en el
            almacenamiento local.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">Terceros</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li>
            Cloudflare (Workers, KV/D1, CDN) procesa el tráfico para prestar el
            servicio y puede procesar direcciones IP para deducir la ubicación
            aproximada (país).
          </li>
          <li>
            Clerk se encarga de la autenticación y gestiona los datos de la
            cuenta según sus propios términos de privacidad.
          </li>
          <li>
            Los reportes de abuso se gestionan en GitHub Issues. Lo que escribas
            en un reporte queda público.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">Bases legales</h2>
        <p className="text-sm text-muted-foreground">
          Cuando corresponde, procesamos los datos para prestar el servicio que
          solicitas y por el interés legítimo de operar, proteger y mejorar el
          servicio. No usamos los datos para publicidad.
        </p>

        <h2 className="text-lg font-semibold">Conservación</h2>
        <p className="text-sm text-muted-foreground">
          Los datos de la cuenta y de los links se conservan hasta que los
          elimines o se elimine tu cuenta. Los registros básicos de clics se
          guardan solo el tiempo necesario para operar y prevenir abusos, y
          pueden depurarse periódicamente.
        </p>

        <h2 className="text-lg font-semibold">Seguridad</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li>Se exige cifrado en tránsito (HTTPS).</li>
          <li>
            Las contraseñas de los links protegidos se guardan cifradas y/o como
            hash de un solo sentido, nunca en texto plano.
          </li>
          <li>
            Aunque tomamos medidas razonables, ningún método de almacenamiento o
            transmisión es 100 % seguro.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">Tus derechos</h2>
        <p className="text-sm text-muted-foreground">
          Según dónde vivas, puedes tener derecho a acceder, corregir, exportar
          o eliminar tus datos. Puedes borrar los links que creaste y eliminar
          tu cuenta para que dejemos de procesarlos.
        </p>

        <h2 className="text-lg font-semibold">Transferencias internacionales</h2>
        <p className="text-sm text-muted-foreground">
          La infraestructura la provee Cloudflare y puede procesar datos en
          varias regiones. Al usar el servicio, aceptas estas transferencias.
        </p>

        <h2 className="text-lg font-semibold">Privacidad de menores</h2>
        <p className="text-sm text-muted-foreground">
          El servicio no está dirigido a menores de 13 años y no recopilamos sus
          datos de forma intencional.
        </p>

        <h2 className="text-lg font-semibold">Cambios</h2>
        <p className="text-sm text-muted-foreground">
          Podemos actualizar esta política de vez en cuando. Los cambios
          importantes se publicarán en esta página con una nueva fecha de
          vigencia.
        </p>

        <h2 className="text-lg font-semibold">Contacto</h2>
        <p className="text-sm text-muted-foreground">
          Para solicitudes o preguntas sobre privacidad, abre un issue en{" "}
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
          Este documento se ofrece por transparencia y no constituye asesoría
          legal.
        </p>
    </>
  );
}
