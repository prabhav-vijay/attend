import { cn } from "@/lib/utils";
import type { Status } from "@/lib/attend/types";

export const STATUS_LABEL: Record<Status, string> = {
  present: "Present",
  absent: "Absent",
  excused: "Excused",
  cancelled: "Cancelled",
  unrecorded: "Not recorded",
};

export const STATUS_TEXT: Record<Status, string> = {
  present: "text-present",
  absent: "text-absent",
  excused: "text-excused",
  cancelled: "text-cancelled",
  unrecorded: "text-muted-foreground",
};

export const STATUS_SOFT: Record<Status, string> = {
  present: "bg-present/15 text-present border-present/40",
  absent: "bg-absent/15 text-absent border-absent/40",
  excused: "bg-excused/15 text-excused border-excused/40",
  cancelled: "bg-cancelled/15 text-cancelled border-cancelled/40",
  unrecorded: "bg-muted text-muted-foreground border-border",
};

/**
 * Status is never conveyed by colour alone — each state also has its own
 * shape or fill pattern.
 */
export function StatusMark({
  status,
  className,
  title,
}: {
  status: Status;
  className?: string;
  title?: string;
}) {
  const base = "inline-block h-2.5 w-2.5 shrink-0 align-middle";
  const shape: Record<Status, string> = {
    present: "bg-present rounded-[2px]",
    absent: "border-2 border-absent rotate-45",
    excused: "border-2 border-excused rounded-full",
    cancelled: "h-0.5 w-3 bg-cancelled",
    unrecorded: "border border-dotted border-muted-foreground rounded-[2px]",
  };
  return (
    <span
      role="img"
      aria-label={title ?? STATUS_LABEL[status]}
      title={title ?? STATUS_LABEL[status]}
      className={cn(base, shape[status], className)}
    />
  );
}

export function HolidayMark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Holiday"
      title="Holiday"
      className={cn(
        "inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-holiday/30 ring-1 ring-holiday",
        className,
      )}
    />
  );
}

export function Legend() {
  const items: Status[] = ["present", "absent", "excused", "cancelled", "unrecorded"];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-3 py-2">
      {items.map((s) => (
        <span
          key={s}
          className="flex items-center gap-2 font-mono text-[12.5px] uppercase tracking-wider text-muted-foreground"
        >
          <StatusMark status={s} />
          {STATUS_LABEL[s]}
        </span>
      ))}
      <span className="flex items-center gap-2 font-mono text-[12.5px] uppercase tracking-wider text-muted-foreground">
        <HolidayMark />
        Holiday
      </span>
      <span className="flex items-center gap-2 font-mono text-[12.5px] uppercase tracking-wider text-muted-foreground">
        <span aria-hidden className="text-exam">
          ★
        </span>
        Important event
      </span>
    </div>
  );
}
