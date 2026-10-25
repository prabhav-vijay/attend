import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { useActive } from "@/components/attend/hooks";
import {
  countOccurrences,
  forecast,
  formatPercent,
  riskLevel,
} from "@/lib/attend/calc";
import { semesterOccurrences, subjectTarget } from "@/lib/attend/model";
import { getSiteOrigin } from "@/lib/site-meta.functions";
import { pageHead } from "@/lib/site-meta";

export const Route = createFileRoute("/subjects/")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) => pageHead({ title: "Subject Attendance — Attend.™", description: "Compare attendance percentages, targets, and risk across every subject.", path: "/subjects", ...(loaderData ? { origin: loaderData } : {}) }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const { store, semester, subjects } = useActive();
  const rule = semester?.excusedRule ?? "attended";
  const margin = semester?.riskMargin ?? 5;
  const all = useMemo(() => semesterOccurrences(store, semester), [store, semester]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <header>
        <p className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
          Subjects
        </p>
        <h1 className="font-display text-2xl">{semester?.name ?? "No semester"}</h1>
      </header>

      {subjects.length === 0 && (
        <p className="panel p-4 text-sm">
          No subjects yet — add them in semester setup.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {subjects.map((s) => {
          const counts = countOccurrences(
            all.filter((o) => o.subjectId === s.id),
            rule,
          );
          const target = subjectTarget(semester, s);
          const f = forecast(counts, rule, target);
          return (
            <li key={s.id}>
              <Link
                to="/subjects/$id"
                params={{ id: s.id }}
                className="panel block p-3 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-3 w-3 rounded-[4px]"
                    style={{ backgroundColor: s.color }}
                  />
                  <p className="min-w-0 flex-1 truncate text-sm">{s.name}</p>
                  <p className="font-display text-lg">{formatPercent(counts.percent)}</p>
                </div>
                <p className="mt-1 font-mono text-[12.5px] text-muted-foreground">
                  target {target}% · {riskLevel(counts.percent, target, margin)} ·{" "}
                  {f.atTarget ? `can miss ${f.canMiss}` : `must attend ${f.mustAttend}`}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
