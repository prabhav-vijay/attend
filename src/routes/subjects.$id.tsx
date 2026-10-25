import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { MarkRow } from "@/components/attend/MarkRow";
import { useActive } from "@/components/attend/hooks";
import {
  countOccurrences,
  forecast,
  formatPercent,
  pointsFromTarget,
  riskLevel,
} from "@/lib/attend/calc";
import { WEEKDAY_NAMES, shortDate } from "@/lib/attend/dates";
import { semesterOccurrences, subjectTarget } from "@/lib/attend/model";
import { getSiteOrigin } from "@/lib/site-meta.functions";
import { breadcrumbJsonLd, pageHead } from "@/lib/site-meta";

export const Route = createFileRoute("/subjects/$id")({
  loader: () => getSiteOrigin(),
  head: ({ params, loaderData }) => {
    const path = `/subjects/${params.id}`;
    return pageHead({
      title: "Subject Attendance Details — Attend.™",
      description: "Review this subject’s attendance history, timetable sessions, target, and recovery forecast.",
      path,
      ...(loaderData ? { origin: loaderData } : {}),
      ...(loaderData
        ? {
            jsonLd: breadcrumbJsonLd(loaderData, [
              { name: "Calendar", path: "/" },
              { name: "Subjects", path: "/subjects" },
              { name: "Subject details", path },
            ]),
          }
        : {}),
    });
  },
  component: SubjectDetail,
});

function SubjectDetail() {
  const { id } = Route.useParams();
  const { store, semester } = useActive();
  const subject = store.subjects.find((s) => s.id === id) ?? null;
  const rule = semester?.excusedRule ?? "attended";
  const margin = semester?.riskMargin ?? 5;

  const occ = useMemo(
    () => semesterOccurrences(store, semester).filter((o) => o.subjectId === id),
    [store, semester, id],
  );
  const entries = store.timetable.filter(
    (t) => t.subjectId === id && t.semesterId === semester?.id,
  );

  if (!subject) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary hover:underline">Calendar</Link>
          <span aria-hidden className="mx-2">/</span>
          <Link to="/subjects" className="hover:text-primary hover:underline">Subjects</Link>
          <span aria-hidden className="mx-2">/</span>
          <span aria-current="page">Not found</span>
        </nav>
        <h1 className="font-display text-2xl">Subject not found</h1>
        <p className="panel p-4 text-sm text-muted-foreground">
          That subject no longer exists.{" "}
          <Link to="/subjects" className="text-primary underline">
            Back to subjects
          </Link>
        </p>
      </main>
    );
  }

  const counts = countOccurrences(occ, rule);
  const target = subjectTarget(semester, subject);
  const f = forecast(counts, rule, target);
  const delta = pointsFromTarget(counts.percent, target);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary hover:underline">Calendar</Link>
        <span aria-hidden className="mx-2">/</span>
        <Link to="/subjects" className="hover:text-primary hover:underline">Subjects</Link>
        <span aria-hidden className="mx-2">/</span>
        <span aria-current="page">{subject.name}</span>
      </nav>
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-8 w-2 rounded-full"
          style={{ backgroundColor: subject.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
            {subject.code || "Subject"}
          </p>
          <h1 className="font-display text-2xl">{subject.name}</h1>
        </div>
        <Link to="/subjects" className="font-mono text-xs text-primary hover:underline">
          All subjects
        </Link>
      </header>

      <section className="panel grid gap-3 p-4 sm:grid-cols-4">
        <Cell label="Attendance" value={formatPercent(counts.percent)} />
        <Cell label="Target" value={`${target}%`} />
        <Cell
          label="Δ target"
          value={delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
        />
        <Cell
          label={f.atTarget ? "Can miss" : "Must attend"}
          value={f.atTarget ? f.canMiss : f.mustAttend}
        />
      </section>
      <p className="font-mono text-xs text-muted-foreground">
        {riskLevel(counts.percent, target, margin)} · {counts.attended} present ·{" "}
        {counts.absent} absent · {counts.excused} excused · {counts.cancelled} cancelled ·{" "}
        {counts.unrecorded} unrecorded
      </p>

      {entries.length > 0 && (
        <section className="panel p-3">
          <h2 className="mb-2 font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
            Timetable
          </h2>
          <ul className="space-y-1 font-mono text-xs text-muted-foreground">
            {entries.map((t) => (
              <li key={t.id}>
                {WEEKDAY_NAMES[t.weekday]} {t.start}–{t.end} · {t.type} ·{" "}
                {shortDate(t.from)} → {shortDate(t.to)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
          Sessions ({occ.length})
        </h2>
        <ul className="space-y-2">
          {occ.map((o) => (
            <MarkRow key={o.key} occurrence={o} showDate />
          ))}
        </ul>
        {occ.length === 0 && (
          <p className="panel p-4 text-sm text-muted-foreground">No sessions scheduled.</p>
        )}
      </section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-xl">{value}</p>
    </div>
  );
}
