import { Link, createFileRoute } from "@tanstack/react-router";

import { getSiteOrigin } from "@/lib/site-meta.functions";
import { breadcrumbJsonLd, pageHead } from "@/lib/site-meta";

const description =
  "Terms of service for Attend.™ — permitted use, intellectual property, local data handling, warranties, and liability.";

export const Route = createFileRoute("/terms")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) =>
    pageHead({
      title: "Terms of Service — Attend.™",
      description,
      path: "/terms",
      ...(loaderData ? { origin: loaderData } : {}),
      ...(loaderData
        ? {
            jsonLd: breadcrumbJsonLd(loaderData, [
              { name: "Calendar", path: "/" },
              { name: "About", path: "/about" },
              { name: "Terms of service", path: "/terms" },
            ]),
          }
        : {}),
    }),
  component: TermsPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-[22.5px]">{title}</h2>
      <p className="text-[16.5px] leading-7 text-muted-foreground">{children}</p>
    </section>
  );
}

function TermsPage() {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <nav aria-label="Breadcrumb" className="font-mono text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary hover:underline">Calendar</Link>
        <span aria-hidden className="mx-2">/</span>
        <Link to="/about" className="hover:text-primary hover:underline">About</Link>
        <span aria-hidden className="mx-2">/</span>
        <span aria-current="page">Terms of service</span>
      </nav>

      <header>
        <p className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
          Legal
        </p>
        <h1 className="font-display text-[2.125rem]">Terms of Service</h1>
        <p className="mt-2 max-w-2xl text-[16.5px] leading-7 text-muted-foreground">
          These terms govern your use of Attend.™, a local-first college attendance tracker.
        </p>
      </header>

      <Section title="1. Acceptance of these terms">
        By opening or using Attend.™ you agree to these terms. If you do not agree with any part of
        them, please stop using the service.
      </Section>

      <Section title="2. The service">
        Attend.™ lets you record semesters, subjects, timetable sessions, holidays, exams, and
        events, and calculates attendance percentages and target forecasts from what you enter. It
        is offered free of charge, without accounts or sign-in.
      </Section>

      <Section title="3. Your data stays on your device">
        Attend.™ is privacy-focused. No personal data is collected, transmitted, or sold. Everything
        you enter is stored and processed locally in your own browser. Because of this, your records
        exist only on the device you used: clearing browser data, private browsing, uninstalling the
        browser, or losing the device will erase them. Export a JSON backup regularly and restore it
        through Import.
      </Section>

      <Section title="4. Your responsibilities">
        You are responsible for the accuracy of the records you enter and for keeping your own
        backups. Attend.™ is a personal planning aid and is not an official attendance register.
        Always confirm anything that affects your academic standing with your institution&rsquo;s
        official records.
      </Section>

      <Section title="5. Intellectual property">
        The name and mark &ldquo;Attend.&rdquo; (Attend.™), the logo and wordmark, the source code,
        the user interface and user experience design, layout, typography choices, colour system,
        iconography, artwork, copy, and all other material forming part of the service are owned by
        the operator of Attend.™ and are protected by trademark and copyright law. No licence to any
        of it is granted except the limited personal use described below.
      </Section>

      <Section title="6. Permitted and prohibited use">
        You may use Attend.™ for your own personal, non-commercial attendance tracking. You may not
        copy, clone, resell, sublicense, or redistribute the service or its interface; reverse
        engineer or decompile it beyond what applicable law permits; remove or alter branding or
        trademark notices; scrape or automate access at scale; or use it unlawfully or in a way that
        disrupts the service or other users.
      </Section>

      <Section title="7. No warranty">
        Attend.™ is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties
        of any kind, express or implied, including fitness for a particular purpose, accuracy of
        calculations, or uninterrupted availability.
      </Section>

      <Section title="8. Limitation of liability">
        To the fullest extent permitted by law, the operator of Attend.™ is not liable for any loss
        of data, academic consequence, missed attendance requirement, or any indirect, incidental, or
        consequential damages arising from the use of, or inability to use, the service.
      </Section>

      <Section title="9. Third-party services">
        The interface loads web fonts from a third-party font service for display purposes. Their
        delivery is governed by that provider&rsquo;s own terms. No attendance data is ever shared
        with them or with any other third party.
      </Section>

      <Section title="10. Changes to these terms">
        These terms may be updated as the service evolves. Continued use after a change means you
        accept the updated terms.
      </Section>

      <Section title="11. Contact and governing terms">
        These terms are construed under the laws applicable where the operator of Attend.™ resides.
        For questions about these terms, use the contact channel published alongside the project.
      </Section>

      <p className="text-[16.5px] leading-7">
        <strong className="font-semibold text-foreground">GitHub Repo</strong>
        <span className="text-muted-foreground">— </span>
        <a
          href="https://github.com/prabhav-vijay/attend"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline hover:no-underline"
        >
          github.com/prabhav-vijay/attend
        </a>
      </p>

      <p className="text-[16.5px] leading-7">
        <Link to="/about" className="text-primary underline">Back to About</Link>
        <span className="text-muted-foreground"> or </span>
        <Link to="/" className="text-primary underline">open the calendar</Link>.
      </p>
    </article>
  );
}
