import { STATUS_LABEL, STATUS_SOFT, StatusMark } from "@/components/attend/StatusMark";
import { useActive } from "@/components/attend/hooks";
import { isFutureDate } from "@/lib/attend/model";
import { MARKABLE, type Occurrence, type Status } from "@/lib/attend/types";
import { cn } from "@/lib/utils";

/** One scheduled session with inline status buttons. Pressing the current status clears it. */
export function MarkRow({
  occurrence,
  showDate = false,
  locked = false,
}: {
  occurrence: Occurrence;
  showDate?: boolean;
  locked?: boolean;
}) {
  const { store, update } = useActive();
  const subject = store.subjects.find((s) => s.id === occurrence.subjectId);
  const future = isFutureDate(occurrence.date);

  const setStatus = (status: Exclude<Status, "unrecorded">) =>
    update((s) => {
      const records = { ...s.records };
      if (records[occurrence.key]?.status === status) delete records[occurrence.key];
      else records[occurrence.key] = { ...records[occurrence.key], status };
      return { ...s, records };
    }, `Marked ${STATUS_LABEL[status].toLowerCase()}`);

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
      <span
        aria-hidden
        className="h-6 w-1 rounded-full"
        style={{ backgroundColor: subject?.color ?? "var(--color-border)" }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {subject?.name ?? "Unknown subject"}{" "}
          <span className="font-mono text-[12.5px] uppercase tracking-wider text-muted-foreground">
            {occurrence.type}
          </span>
        </p>
        <p className="font-mono text-[12.5px] text-muted-foreground">
          {showDate && <span>{occurrence.date} · </span>}
          {occurrence.start ? `${occurrence.start}–${occurrence.end ?? ""}` : "No time set"}
          {occurrence.location ? ` · ${occurrence.location}` : ""}
        </p>
      </div>

      {locked || future ? (
        <span className="flex items-center gap-2 font-mono text-[12.5px] uppercase tracking-wider text-muted-foreground">
          <StatusMark status={occurrence.status} />
          {locked ? "Holiday" : STATUS_LABEL[occurrence.status]}
        </span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {MARKABLE.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={occurrence.status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md border px-2 py-1 font-mono text-[11.5px] uppercase tracking-wider transition-colors",
                occurrence.status === s
                  ? STATUS_SOFT[s]
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
