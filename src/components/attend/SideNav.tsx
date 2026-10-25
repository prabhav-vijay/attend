import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  Download,
  FileBarChart,
  Info,
  List,
  Plus,
  Settings2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EventDialog } from "@/components/attend/dialogs/EventDialog";
import { HolidayDialog } from "@/components/attend/dialogs/HolidayDialog";
import { ImportDialog } from "@/components/attend/dialogs/ImportDialog";
import { SubjectDialog } from "@/components/attend/dialogs/SubjectDialog";
import { STATUS_LABEL } from "@/components/attend/StatusMark";
import { useActive } from "@/components/attend/hooks";
import { exportCSV, exportJSON } from "@/lib/attend/backup";
import { formatPercent } from "@/lib/attend/calc";
import { shortDate } from "@/lib/attend/dates";
import { STATUS_FILTERS, useUi, type StatusFilter } from "@/lib/attend/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Calendar", icon: CalendarDays },
  { to: "/today", label: "Today", icon: CheckSquare },
  { to: "/week", label: "Week", icon: CalendarRange },
  { to: "/list", label: "List", icon: List },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/events", label: "Upcoming events", icon: CalendarRange },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/semester", label: "Semester setup", icon: Settings2 },
] as const;

const FILTER_LABEL = (f: StatusFilter) =>
  f === "holiday"
    ? "Holidays"
    : f === "important"
      ? "Important"
      : f === "note"
        ? "Notes"
        : STATUS_LABEL[f];

export function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { store, update, semester, subjects } = useActive();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const ui = useUi();
  const [dialog, setDialog] = useState<
    null | "subject" | "event" | "holiday" | "import"
  >(null);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      <section className="panel p-3">
        <p className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
          Active semester
        </p>
        <p className="truncate font-display text-lg leading-tight">
          {semester?.name ?? "None yet"}
        </p>
        {semester && (
          <p className="font-mono text-[12.5px] text-muted-foreground">
            {shortDate(semester.start)} → {shortDate(semester.end)} · target{" "}
            {formatPercent(semester.defaultTarget)}
          </p>
        )}
      </section>

      <nav aria-label="Main" className="space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md border-l-2 px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-exam bg-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-accent/50",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <section>
        <h2 className="mb-2 font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-1.5">
          <Button size="sm" variant="secondary" asChild>
            <Link to="/today" onClick={onNavigate}>
              Mark today
            </Link>
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setDialog("event")}>
            Add event
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setDialog("holiday")}>
            Add holiday
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!semester}
            onClick={() => setDialog("subject")}
          >
            Add subject
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <Link to="/semester" onClick={onNavigate}>
              Edit timetable
            </Link>
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setDialog("import")}>
            <Upload className="mr-1 h-3.5 w-3.5" /> Import
          </Button>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => exportJSON(store, semester)}
          >
            <Download className="mr-1 h-3.5 w-3.5" /> JSON
          </Button>
          <Button size="sm" variant="ghost" onClick={() => exportCSV(store, semester)}>
            <Download className="mr-1 h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-mono text-[11.5px] uppercase tracking-widest text-muted-foreground">
            Filters {ui.filtersActive && <span className="text-exam">• active</span>}
          </h2>
          {ui.filtersActive && (
            <button
              type="button"
              onClick={ui.resetFilters}
              className="font-mono text-[11.5px] uppercase tracking-wider text-primary hover:underline"
            >
              Reset all
            </button>
          )}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => ui.setSubjects([])}
            className={cn(
              "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              ui.subjectIds.length === 0
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            All subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={ui.subjectIds.includes(s.id)}
              onClick={() => ui.toggleSubject(s.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                ui.subjectIds.includes(s.id)
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50",
              )}
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={ui.statuses.includes(f)}
              onClick={() => ui.toggleStatus(f)}
              className={cn(
                "rounded-md border px-2 py-1 font-mono text-[11.5px] uppercase tracking-wider transition-colors",
                ui.statuses.includes(f)
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {FILTER_LABEL(f)}
            </button>
          ))}
        </div>
      </section>

      <footer className="mt-auto space-y-1 border-t border-border pt-3">
        <Link
          to="/about"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 font-display text-base transition-colors hover:bg-accent hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            pathname.startsWith("/about")
              ? "bg-accent text-foreground"
              : "text-muted-foreground",
          )}
        >
          <Info className="h-4 w-4" aria-hidden />
          About
        </Link>
        <Link
          to="/terms"
          onClick={onNavigate}
          className={cn(
            "block rounded-md px-2 py-1 font-mono text-[12.5px] uppercase tracking-wider transition-colors hover:bg-accent hover:text-primary hover:underline",
            pathname.startsWith("/terms") ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Terms of service
        </Link>
      </footer>

      {dialog === "subject" && semester && (
        <SubjectDialog
          open
          onOpenChange={() => setDialog(null)}
          initial={null}
          semesterId={semester.id}
          onSave={(s) =>
            update((prev) => ({ ...prev, subjects: [...prev.subjects, s] }), "Subject added")
          }
        />
      )}
      {dialog === "event" && (
        <EventDialog
          open
          onOpenChange={() => setDialog(null)}
          subjects={subjects}
          onSave={(e) =>
            update((prev) => ({ ...prev, events: [...prev.events, e] }), "Event added")
          }
        />
      )}
      {dialog === "holiday" && (
        <HolidayDialog
          open
          onOpenChange={() => setDialog(null)}
          onSave={(h) =>
            update((prev) => ({ ...prev, holidays: [...prev.holidays, h] }), "Holiday added")
          }
        />
      )}
      {dialog === "import" && (
        <ImportDialog open onOpenChange={() => setDialog(null)} />
      )}
    </div>
  );
}

export const AddIcon = Plus;
