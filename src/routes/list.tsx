import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { MarkRow } from "@/components/attend/MarkRow";
import { useActive, useFilteredOccurrences } from "@/components/attend/hooks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countOccurrences, formatPercent } from "@/lib/attend/calc";
import { todayISO } from "@/lib/attend/dates";
import { isHoliday, occurrencesBetween } from "@/lib/attend/model";
import { getSiteOrigin } from "@/lib/site-meta.functions";
import { pageHead } from "@/lib/site-meta";

export const Route = createFileRoute("/list")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) => pageHead({ title: "College Session List — Attend.™", description: "Filter and review college sessions by date with live attendance totals.", path: "/list", ...(loaderData ? { origin: loaderData } : {}) }),
  component: ListPage,
});

function ListPage() {
  const { store, semester } = useActive();
  const [from, setFrom] = useState(() => semester?.start ?? todayISO());
  const [to, setTo] = useState(() => semester?.end ?? todayISO());

  const occ = useMemo(
    () => (semester ? occurrencesBetween(store, semester, from, to) : []),
    [store, semester, from, to],
  );
  const shown = useFilteredOccurrences(occ);
  const counts = countOccurrences(shown, semester?.excusedRule ?? "attended");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <header>
        <p className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
          List
        </p>
        <h1 className="font-display text-2xl">Sessions</h1>
      </header>

      <div className="panel flex flex-wrap items-end gap-3 p-3">
        <div className="grid gap-1">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {shown.length} sessions · {formatPercent(counts.percent)}
        </p>
      </div>

      {!semester && <p className="panel p-4 text-sm">Create a semester to list sessions.</p>}

      <ul className="space-y-2">
        {shown.map((o) => (
          <MarkRow key={o.key} occurrence={o} showDate locked={isHoliday(store, o.date)} />
        ))}
      </ul>
      {semester && shown.length === 0 && (
        <p className="panel p-4 text-sm text-muted-foreground">Nothing in this range.</p>
      )}
    </div>
  );
}
