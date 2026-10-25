import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HolidayMark, StatusMark } from "@/components/attend/StatusMark";
import { useActive, useFilteredOccurrences } from "@/components/attend/hooks";
import {
  addDays,
  iso,
  monthGrid,
  monthLabel,
  todayISO,
  weekdayLabels,
} from "@/lib/attend/dates";
import { countOccurrences } from "@/lib/attend/calc";
import {
  eventsOn,
  holidaysOn,
  inSemester,
  isFutureDate,
  occurrencesBetween,
} from "@/lib/attend/model";
import { useUi } from "@/lib/attend/ui";
import { cn } from "@/lib/utils";

export function MonthGrid({
  month,
  onMonthChange,
  onOpenDate,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  onOpenDate: (date: string) => void;
}) {
  const { store, semester } = useActive();
  const { statuses } = useUi();
  const gridRef = useRef<HTMLDivElement>(null);
  const firstDay = semester?.firstDayOfWeek ?? 1;
  const cells = useMemo(() => monthGrid(month, firstDay), [month, firstDay]);
  const today = todayISO();

  const all = useMemo(
    () =>
      semester
        ? occurrencesBetween(store, semester, cells[0] as string, cells[cells.length - 1] as string)
        : [],
    [store, semester, cells],
  );
  const filtered = useFilteredOccurrences(all);
  const byDate = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const o of filtered) map.set(o.date, [...(map.get(o.date) ?? []), o]);
    return map;
  }, [filtered]);

  const move = (from: string, delta: number) => {
    const next = addDays(from, delta);
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-date="${next}"]`);
    if (el) {
      el.focus();
    } else {
      const d = new Date(next);
      onMonthChange(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="font-display text-xl">{monthLabel(month)}</h2>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Previous month"
            onClick={() =>
              onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onMonthChange(new Date())}
          >
            This month
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Next month"
            onClick={() =>
              onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-border">
        {weekdayLabels(firstDay).map((d) => (
          <div
            key={d}
            className="px-2 py-1.5 text-center font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div ref={gridRef} className="grid min-h-0 flex-1 grid-cols-7 auto-rows-fr">
        {cells.map((date) => {
          const inMonth = date.slice(0, 7) === iso(month).slice(0, 7);
          const holidays = holidaysOn(store, date);
          const events = eventsOn(store, date);
          const occ = byDate.get(date) ?? [];
          const counts = countOccurrences(occ, semester?.excusedRule ?? "attended");
          const target = semester?.defaultTarget ?? 75;
          const belowTarget =
            counts.percent !== null && counts.percent < target;
          const pastUnrecorded =
            !isFutureDate(date) &&
            date !== today &&
            occ.length > 0 &&
            occ.every((o) => o.status === "unrecorded");
          const note = store.dateNotes[date];
          const important = events.some((e) => e.important);

          if (statuses.includes("holiday") && holidays.length === 0) {
            // filtered out below via muted rendering
          }

          const label = [
            date,
            holidays.length ? `holiday ${holidays.map((h) => h.title).join(", ")}` : "",
            occ.length ? `${occ.length} sessions` : "",
            counts.held ? `${counts.attended} of ${counts.held} attended` : "",
            pastUnrecorded ? "not yet recorded" : "",
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <div
              key={date}
              data-date={date}
              role="button"
              tabIndex={0}
              aria-label={label}
              onClick={() => onOpenDate(date)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenDate(date);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  move(date, 1);
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  move(date, -1);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  move(date, 7);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  move(date, -7);
                }
              }}
              className={cn(
                "flex min-h-[92px] cursor-pointer flex-col gap-1 border-b border-r border-border p-1.5 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                !inMonth && "opacity-40",
                !inSemester(semester, date) && "bg-muted/20",
                holidays.length > 0 && "bg-holiday/5",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-mono text-xs",
                    date === today
                      ? "rounded bg-primary px-1.5 py-0.5 text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {Number(date.slice(8))}
                </span>
                <span className="flex items-center gap-1">
                  {important && <Star className="h-3 w-3 text-exam" aria-label="Important" />}
                  {note && (
                    <span
                      aria-label="Has a note"
                      title="Has a note"
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    />
                  )}
                  {holidays.length > 0 && <HolidayMark />}
                </span>
              </div>

              {holidays.length > 0 ? (
                <p className="truncate text-[12.5px] text-holiday">{holidays[0]?.title}</p>
              ) : occ.length === 0 ? null : (
                <>
                  <div className="flex flex-wrap gap-1">
                    {occ.slice(0, 6).map((o) => (
                      <StatusMark
                        key={o.key}
                        status={o.status}
                        title={`${o.type} — ${o.status}`}
                      />
                    ))}
                    {occ.length > 6 && (
                      <span className="font-mono text-[11.5px] text-muted-foreground">
                        +{occ.length - 6}
                      </span>
                    )}
                  </div>
                  {pastUnrecorded ? (
                    <p className="font-mono text-[11.5px] uppercase tracking-wider text-exam">
                      Not yet recorded
                    </p>
                  ) : (
                    counts.held > 0 && (
                      <p
                        className={cn(
                          "font-mono text-[11.5px]",
                          belowTarget ? "text-exam" : "text-muted-foreground",
                        )}
                      >
                        {counts.attended}/{counts.held} attended
                      </p>
                    )
                  )}
                </>
              )}

              {events.length > 0 && holidays.length === 0 && (
                <p className="truncate text-[12.5px] text-muted-foreground">
                  {events[0]?.title}
                  {events.length > 1 ? ` +${events.length - 1}` : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
