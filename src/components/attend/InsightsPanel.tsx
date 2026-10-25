import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useActive, useFilteredOccurrences } from "@/components/attend/hooks";
import {
  countOccurrences,
  forecast,
  formatPercent,
  pointsFromTarget,
  riskLevel,
  round1,
} from "@/lib/attend/calc";
import { relativeDays, shortDate, todayISO } from "@/lib/attend/dates";
import {
  nextHoliday,
  semesterOccurrences,
  subjectTarget,
  upcomingEvents,
} from "@/lib/attend/model";
import { cn } from "@/lib/utils";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-surface px-2.5 py-2">
      <p className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-lg leading-tight">{value}</p>
    </div>
  );
}

export function InsightsPanel() {
  const { store, semester, subjects } = useActive();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const today = todayISO();

  const all = useMemo(() => semesterOccurrences(store, semester), [store, semester]);
  const occ = useFilteredOccurrences(all);
  const rule = semester?.excusedRule ?? "attended";
  const target = semester?.defaultTarget ?? 75;
  const margin = semester?.riskMargin ?? 5;
  const counts = countOccurrences(occ, rule);
  const f = forecast(counts, rule, target);
  const delta = pointsFromTarget(counts.percent, target);

  const holidayCount = useMemo(() => store.holidays.length, [store.holidays]);
  const events = useMemo(() => upcomingEvents(store, today, 365), [store, today]);
  const holiday = useMemo(() => nextHoliday(store, today), [store, today]);

  const perSubject = subjects.map((s) => {
    const c = countOccurrences(
      occ.filter((o) => o.subjectId === s.id),
      rule,
    );
    const t = subjectTarget(semester, s);
    return { subject: s, counts: c, target: t, risk: riskLevel(c.percent, t, margin) };
  });

  if (!semester) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Create a semester to see attendance insights.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      <section className="panel p-3">
        <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
          Overall
        </h2>
        {counts.percent === null ? (
          <p className="mt-2 text-sm text-muted-foreground">No attendance recorded yet.</p>
        ) : (
          <>
            <p className="font-display text-4xl leading-tight">
              {formatPercent(counts.percent)}
            </p>
            <p
              className={cn(
                "font-mono text-[12.5px]",
                (delta ?? 0) < 0 ? "text-exam" : "text-present",
              )}
            >
              {(delta ?? 0) >= 0 ? "+" : ""}
              {delta} points vs {target}% target
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {counts.attended + (rule === "attended" ? counts.excused : 0)} of{" "}
              {counts.held} held sessions attended
            </p>
            <div className="relative mt-3 h-2 rounded-full bg-muted">
              <div
                className={cn(
                  "h-2 rounded-full",
                  (delta ?? 0) < 0 ? "bg-exam" : "bg-present",
                )}
                style={{ width: `${Math.min(100, round1(counts.percent))}%` }}
              />
              <span
                aria-hidden
                className="absolute -top-1 h-4 w-0.5 bg-foreground"
                style={{ left: `${Math.min(100, target)}%` }}
              />
            </div>
          </>
        )}
      </section>

      <section className="panel p-3">
        <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
          Forecast
        </h2>
        <p className="mt-1 text-sm">
          {counts.held === 0
            ? "Record a few sessions to see a forecast."
            : f.atTarget
              ? f.canMiss === 0
                ? "You cannot miss any further session without dropping below target."
                : `You can miss ${f.canMiss} more session${f.canMiss === 1 ? "" : "s"} and stay at ${target}%.`
              : f.mustAttend === Number.POSITIVE_INFINITY
                ? "A 100% target cannot be recovered once a session is missed."
                : `Attend the next ${f.mustAttend} session${f.mustAttend === 1 ? "" : "s"} to reach ${target}%.`}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <Stat label="Attended" value={counts.attended} />
        <Stat label="Absent" value={counts.absent} />
        <Stat label="Held" value={counts.held} />
        <Stat label="Unmarked" value={counts.unrecorded} />
        <Stat label="Cancelled" value={counts.cancelled} />
        <Stat label="Holidays" value={holidayCount} />
      </section>

      <section className="panel p-3">
        <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
          Subject risk
        </h2>
        {perSubject.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">No subjects yet.</p>
        )}
        <ul className="mt-2 space-y-1.5">
          {perSubject.map(({ subject, counts: c, risk }) => (
            <li key={subject.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="truncate text-sm">{subject.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-xs">{formatPercent(c.percent)}</span>
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 font-mono text-[11.5px] uppercase tracking-wider",
                    risk === "at risk"
                      ? "border-absent/40 bg-absent/15 text-absent"
                      : risk === "near target"
                        ? "border-exam/40 bg-exam/15 text-exam"
                        : "border-present/40 bg-present/15 text-present",
                  )}
                >
                  {risk}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-3">
        <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
          Upcoming
        </h2>
        <ul className="mt-2 space-y-1.5 text-sm">
          <li className="flex items-center justify-between gap-2">
            <span className="truncate text-muted-foreground">Next event</span>
            <span className="truncate">
              {events[0]
                ? `${events[0].event.title} · ${relativeDays(today, events[0].date)}`
                : "None"}
            </span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="truncate text-muted-foreground">Next holiday</span>
            <span className="truncate">
              {holiday
                ? `${holiday.holiday.title} · ${relativeDays(today, holiday.date)}`
                : "None"}
            </span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="truncate text-muted-foreground">Semester ends</span>
            <span className="truncate">
              {shortDate(semester.end)} · {relativeDays(today, semester.end)}
            </span>
          </li>
        </ul>
      </section>

      <section className="panel">
        <button
          type="button"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2 font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          Details
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", detailsOpen && "rotate-180")}
          />
        </button>
        {detailsOpen && (
          <dl className="space-y-1 px-3 pb-3 font-mono text-[12.5px] text-muted-foreground">
            <div className="flex justify-between">
              <dt>Scheduled sessions</dt>
              <dd>{counts.scheduled}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Excused</dt>
              <dd>
                {counts.excused} ({rule})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Target</dt>
              <dd>{target}%</dd>
            </div>
            <div className="flex justify-between">
              <dt>Risk margin</dt>
              <dd>{margin} points</dd>
            </div>
            <div className="flex justify-between">
              <dt>Time zone</dt>
              <dd>{semester.timezone}</dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  );
}
