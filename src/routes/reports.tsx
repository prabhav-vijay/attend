import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { useActive } from "@/components/attend/hooks";
import { Button } from "@/components/ui/button";
import {
  countOccurrences,
  forecast,
  formatPercent,
  pointsFromTarget,
  riskLevel,
} from "@/lib/attend/calc";
import { exportCSV, exportJSON, printReport } from "@/lib/attend/backup";
import { semesterOccurrences, subjectTarget } from "@/lib/attend/model";
import { getSiteOrigin } from "@/lib/site-meta.functions";
import { pageHead } from "@/lib/site-meta";

export const Route = createFileRoute("/reports")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) => pageHead({ title: "Attendance Reports & Forecasts — Attend.™", description: "Review subject attendance, risk levels, and how many classes you can miss or must attend.", path: "/reports", ...(loaderData ? { origin: loaderData } : {}) }),
  component: ReportsPage,
});

function ReportsPage() {
  const { store, semester, subjects } = useActive();
  const rule = semester?.excusedRule ?? "attended";
  const margin = semester?.riskMargin ?? 5;
  const all = useMemo(() => semesterOccurrences(store, semester), [store, semester]);
  const overall = countOccurrences(all, rule);
  const overallTarget = semester?.defaultTarget ?? 75;
  const overallForecast = forecast(overall, rule, overallTarget);

  const rows = subjects.map((s) => {
    const occ = all.filter((o) => o.subjectId === s.id);
    const counts = countOccurrences(occ, rule);
    const target = subjectTarget(semester, s);
    return { subject: s, counts, target, f: forecast(counts, rule, target) };
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
            Reports
          </p>
          <h1 className="font-display text-2xl">{semester?.name ?? "No semester"}</h1>
        </div>
        <Button size="sm" variant="secondary" onClick={printReport}>
          Print
        </Button>
        <Button size="sm" variant="ghost" onClick={() => exportCSV(store, semester)}>
          CSV
        </Button>
        <Button size="sm" variant="ghost" onClick={() => exportJSON(store, semester)}>
          JSON
        </Button>
      </header>

      <section className="panel grid gap-3 p-4 sm:grid-cols-4">
        <Cell label="Overall" value={formatPercent(overall.percent)} />
        <Cell label="Target" value={`${overallTarget}%`} />
        <Cell label="Counted" value={overall.held} />
        <Cell
          label={overallForecast.atTarget ? "Can miss" : "Must attend"}
          value={
            overallForecast.atTarget ? overallForecast.canMiss : overallForecast.mustAttend
          }
        />
      </section>

      {!semester && <p className="panel p-4 text-sm">Create a semester to see reports.</p>}

      {rows.length > 0 && (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-right">Present</th>
                <th className="px-3 py-2 text-right">Absent</th>
                <th className="px-3 py-2 text-right">Excused</th>
                <th className="px-3 py-2 text-right">%</th>
                <th className="px-3 py-2 text-right">Δ target</th>
                <th className="px-3 py-2 text-left">Standing</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ subject, counts, target, f }) => {
                const delta = pointsFromTarget(counts.percent, target);
                const risk = riskLevel(counts.percent, target, margin);
                return (
                  <tr key={subject.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2">
                      <span
                        aria-hidden
                        className="mr-2 inline-block h-2.5 w-2.5 rounded-[3px] align-middle"
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{counts.attended}</td>
                    <td className="px-3 py-2 text-right font-mono">{counts.absent}</td>
                    <td className="px-3 py-2 text-right font-mono">{counts.excused}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatPercent(counts.percent)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {risk} ·{" "}
                      {f.atTarget
                        ? `can miss ${f.canMiss}`
                        : `must attend ${f.mustAttend}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
