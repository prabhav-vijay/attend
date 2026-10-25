import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { MarkRow } from "@/components/attend/MarkRow";
import { useActive, useFilteredOccurrences } from "@/components/attend/hooks";
import { Button } from "@/components/ui/button";
import { countOccurrences, formatPercent } from "@/lib/attend/calc";
import { prettyDate, todayISO } from "@/lib/attend/dates";
import {
  eventsOn,
  holidaysOn,
  inSemester,
  isHoliday,
  occurrencesOn,
  semesterOccurrences,
  unrecordedPast,
} from "@/lib/attend/model";
import { getSiteOrigin } from "@/lib/site-meta.functions";
import { pageHead } from "@/lib/site-meta";

export const Route = createFileRoute("/today")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) => pageHead({ title: "Today’s Classes — Attend.™", description: "Review and mark every college class scheduled today.", path: "/today", ...(loaderData ? { origin: loaderData } : {}) }),
  component: TodayPage,
});

function TodayPage() {
  const { store, update, semester } = useActive();
  const today = todayISO();
  const occ = useMemo(
    () => occurrencesOn(store, semester, today),
    [store, semester, today],
  );
  const shown = useFilteredOccurrences(occ);
  const holidays = holidaysOn(store, today);
  const events = eventsOn(store, today);
  const holiday = isHoliday(store, today);
  const within = inSemester(semester, today);

  const all = useMemo(() => semesterOccurrences(store, semester), [store, semester]);
  const pending = useMemo(() => unrecordedPast(all).filter((o) => o.date < today), [all, today]);
  const counts = countOccurrences(all, semester?.excusedRule ?? "attended");

  const markAll = (status: "present" | "absent") =>
    update((s) => {
      const records = { ...s.records };
      for (const o of occ) records[o.key] = { ...records[o.key], status };
      return { ...s, records };
    }, `Today marked ${status}`);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <header>
        <p className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
          Today
        </p>
        <h1 className="font-display text-2xl">{prettyDate(today)}</h1>
        <p className="font-mono text-xs text-muted-foreground">
          Semester so far: {formatPercent(counts.percent)} · {counts.held} counted sessions
        </p>
      </header>

      {holidays.length > 0 && (
        <p className="panel p-3 text-sm">
          Holiday: {holidays.map((h) => h.title).join(", ")} — no sessions to record.
        </p>
      )}
      {events.length > 0 && (
        <p className="panel p-3 text-sm">
          Events today: {events.map((e) => e.title).join(", ")}
        </p>
      )}

      {!semester && <p className="panel p-4 text-sm">Create a semester to start recording.</p>}
      {semester && !within && (
        <p className="panel p-4 text-sm">Today falls outside {semester.name}.</p>
      )}

      {shown.length > 0 && !holiday && (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => markAll("present")}>
            Mark all present
          </Button>
          <Button size="sm" variant="ghost" onClick={() => markAll("absent")}>
            Mark all absent
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {shown.map((o) => (
          <MarkRow key={o.key} occurrence={o} locked={holiday} />
        ))}
      </ul>
      {shown.length === 0 && semester && within && !holiday && (
        <p className="panel p-4 text-sm text-muted-foreground">No classes scheduled today.</p>
      )}

      {pending.length > 0 && (
        <section className="panel p-3">
          <h2 className="mb-2 font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
            Still unrecorded ({pending.length})
          </h2>
          <ul className="space-y-2">
            {pending.slice(0, 10).map((o) => (
              <MarkRow key={o.key} occurrence={o} showDate />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
