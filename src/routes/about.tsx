import { Link, createFileRoute } from "@tanstack/react-router";

import shareImage from "@/assets/attend-social.png";
import { getSiteOrigin } from "@/lib/site-meta.functions";
import { breadcrumbJsonLd, pageHead } from "@/lib/site-meta";

const description =
  "How Attend.™ calculates college attendance, forecasts target recovery, and stores your timetable data.";

export const Route = createFileRoute("/about")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) =>
    pageHead({
      title: "About Attend.™ — How It Calculates Attendance",
      description,
      path: "/about",
      includeShareImage: true,
      ...(loaderData ? { origin: loaderData } : {}),
      ...(loaderData
        ? {
            jsonLd: breadcrumbJsonLd(loaderData, [
              { name: "Calendar", path: "/" },
              { name: "About", path: "/about" },
            ]),
          }
        : {}),
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <nav aria-label="Breadcrumb" className="font-mono text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary hover:underline">Calendar</Link>
        <span aria-hidden className="mx-2">/</span>
        <span aria-current="page">About</span>
      </nav>

      <header>
        <p className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">Reference</p>
        <h1 className="font-display text-[2.125rem]">About Attend.™</h1>
        <p className="mt-2 max-w-2xl text-[16.5px] leading-7 text-muted-foreground">
          Attend.™ is a private, local-first college attendance tracker for semesters, subjects,
          timetable sessions, holidays, exams, and events.
        </p>
      </header>

      <img
        src={shareImage}
        alt="Attend.™ calendar showing present, absent, and unrecorded college sessions"
        width={1200}
        height={630}
        loading="lazy"
        className="w-full rounded-md border border-border"
      />

      <section className="space-y-2">
        <h2 className="font-display text-[22.5px]">Attendance percentage</h2>
        <p className="text-[16.5px] leading-7 text-muted-foreground">
          The percentage is counted attendance divided by counted sessions, multiplied by 100.
          Present and absent sessions are counted. Cancelled, future, holiday, and unrecorded
          sessions are excluded. Excused sessions follow the rule selected for the semester:
          counted as attended, excluded, or counted as absent.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-[22.5px]">Target forecast</h2>
        <p className="text-[16.5px] leading-7 text-muted-foreground">
          When attendance is at or above the target, Attend.™ calculates how many consecutive
          sessions may be missed while remaining at that target. When it is below target, it
          calculates how many consecutive sessions must be attended to recover. Calculations use
          full precision and round only for display.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-[22.5px]">Data and limitations</h2>
        <p className="text-[16.5px] leading-7 text-muted-foreground">
          Attend.™ is privacy-focused. No data is collected, and nothing you enter ever leaves your
          system — every record and every calculation is processed locally in your own browser.
          There are no accounts, no tracking, and no servers holding your attendance.
        </p>
        <p className="text-[16.5px] leading-7 text-muted-foreground">
          Because storage is local, your records can be lost: clearing browser data or site storage,
          browsing privately, switching browsers or devices, or losing the device will remove them
          permanently. Export a JSON backup regularly from the sidebar and keep it somewhere safe —
          you can restore it any time with Import.
        </p>
        <p className="text-[16.5px] leading-7 text-muted-foreground">
          Attend.™ does not replace your institution’s official attendance register, so compare
          important decisions with your college portal or instructor’s records.
        </p>
      </section>

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
        <Link to="/semester" className="text-primary underline">Configure a semester</Link>
        <span className="text-muted-foreground">, </span>
        <Link to="/reports" className="text-primary underline">review attendance reports</Link>
        <span className="text-muted-foreground">, or read the </span>
        <Link to="/terms" className="text-primary underline">terms of service</Link>.
      </p>
    </article>
  );
}