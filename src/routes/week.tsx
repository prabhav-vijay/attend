import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MarkRow } from "@/components/attend/MarkRow";
import { useActive, useFilteredOccurrences } from "@/components/attend/hooks";
import { Button } from "@/components/ui/button";
import { addDays, prettyDate, shortDate, todayISO, weekDates } from "@/lib/attend/dates";
import { holidaysOn, isHoliday, occurrencesBetween } from "@/lib/attend/model";
import { getSiteOrigin } from "@/lib/site-meta.functions";
import { pageHead } from "@/lib/site-meta";

export const Route = createFileRoute("/week")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) => pageHead({ title: "Weekly Class Attendance — Attend.™", description: "Review and record a full week of scheduled college sessions.", path: "/week", ...(loaderData ? { origin: loaderData } : {}) }),
  component: WeekPage,
});

function WeekPage() {
  const { store, semester } = useActive();
  const [anchor, setAnchor] = useState(() => todayISO());
  const firstDay = semester?.firstDayOfWeek ?? 1;
  const days = useMemo(() => weekDates(anchor, firstDay), [anchor, firstDay]);

  const occ = useMemo(
    () =>
      semester
        ? occurrencesBetween(store, semester, days[0] as string, days[6] as string)
        : [],
    [store, semester, days],
  );
  const shown = useFilteredOccurrences(occ);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
            Week
          </p>
          <h1 className="font-display text-2xl">
            {shortDate(days[0] as string)} → {shortDate(days[6] as string)}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Previous week" onClick={() => setAnchor((a) => addDays(a, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAnchor(todayISO())}>
            This week
          </Button>
          <Button size="icon" variant="ghost" aria-label="Next week" onClick={() => setAnchor((a) => addDays(a, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {!semester && <p className="panel p-4 text-sm">Create a semester to see your week.</p>}

      {days.map((d) => {
        const list = shown.filter((o) => o.date === d);
        const hol = holidaysOn(store, d);
        return (
          <section key={d} className="panel p-3">
            <h2 className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-sm">{prettyDate(d)}</span>
              {hol.length > 0 && (
                <span className="font-mono text-[11.5px] uppercase tracking-wider text-holiday">
                  {hol.map((h) => h.title).join(", ")}
                </span>
              )}
            </h2>
            {list.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">No sessions.</p>
            ) : (
              <ul className="space-y-2">
                {list.map((o) => (
                  <MarkRow key={o.key} occurrence={o} locked={isHoliday(store, d)} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
