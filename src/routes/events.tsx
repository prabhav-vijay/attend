import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Star } from "lucide-react";

import { ConfirmDialog } from "@/components/attend/ConfirmDialog";
import { EventDialog } from "@/components/attend/dialogs/EventDialog";
import { HolidayDialog } from "@/components/attend/dialogs/HolidayDialog";
import { useActive } from "@/components/attend/hooks";
import { Button } from "@/components/ui/button";
import { relativeDays, shortDate, todayISO } from "@/lib/attend/dates";
import { upcomingEvents } from "@/lib/attend/model";
import { RECURRENCE_LABEL, type AppEvent, type Holiday } from "@/lib/attend/types";
import { getSiteOrigin } from "@/lib/site-meta.functions";
import { pageHead } from "@/lib/site-meta";

export const Route = createFileRoute("/events")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) => pageHead({ title: "Events & Holidays — Attend.™", description: "Track exams, deadlines, reminders, and repeating college holidays.", path: "/events", ...(loaderData ? { origin: loaderData } : {}) }),
  component: EventsPage,
});

function EventsPage() {
  const { store, update, subjects } = useActive();
  const today = todayISO();
  const upcoming = useMemo(() => upcomingEvents(store, today, 365), [store, today]);
  const [editEvent, setEditEvent] = useState<AppEvent | null | undefined>(undefined);
  const [editHoliday, setEditHoliday] = useState<Holiday | null | undefined>(undefined);
  const [pending, setPending] = useState<
    null | { kind: "event" | "holiday"; id: string; title: string; impact: string[] }
  >(null);

  const removeIt = () => {
    if (!pending) return;
    update(
      (s) =>
        pending.kind === "event"
          ? { ...s, events: s.events.filter((e) => e.id !== pending.id) }
          : { ...s, holidays: s.holidays.filter((h) => h.id !== pending.id) },
      `${pending.kind === "event" ? "Event" : "Holiday"} deleted`,
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
            Planner
          </p>
          <h1 className="font-display text-2xl">Events & holidays</h1>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditEvent(null)}>
          Add event
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setEditHoliday(null)}>
          Add holiday
        </Button>
      </header>

      <section>
        <h2 className="mb-2 font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
          Upcoming events
        </h2>
        <ul className="space-y-2">
          {upcoming.map(({ event, date }) => (
            <li
              key={event.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {event.important && <Star className="mr-1 inline h-3.5 w-3.5 text-exam" />}
                  {event.title || "Untitled"}
                </p>
                <p className="font-mono text-[12.5px] text-muted-foreground">
                  {event.type} · {shortDate(date)} · {relativeDays(today, date)} ·{" "}
                  {RECURRENCE_LABEL[event.recurrence]}
                  {event.subjectId
                    ? ` · ${subjects.find((s) => s.id === event.subjectId)?.name ?? ""}`
                    : ""}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditEvent(event)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setPending({
                    kind: "event",
                    id: event.id,
                    title: event.title,
                    impact: [
                      `Next occurrence ${shortDate(date)}`,
                      `Repeats: ${RECURRENCE_LABEL[event.recurrence]}`,
                    ],
                  })
                }
              >
                Delete
              </Button>
            </li>
          ))}
          {upcoming.length === 0 && (
            <li className="panel p-4 text-sm text-muted-foreground">Nothing planned yet.</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
          Holidays
        </h2>
        <ul className="space-y-2">
          {store.holidays.map((h) => (
            <li
              key={h.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{h.title || "Untitled"}</p>
                <p className="font-mono text-[12.5px] text-muted-foreground">
                  {h.type} · {shortDate(h.start)}
                  {h.end !== h.start ? ` → ${shortDate(h.end)}` : ""} ·{" "}
                  {RECURRENCE_LABEL[h.recurrence]}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditHoliday(h)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setPending({
                    kind: "holiday",
                    id: h.id,
                    title: h.title,
                    impact: [
                      `${shortDate(h.start)} → ${shortDate(h.end)}`,
                      `Repeats: ${RECURRENCE_LABEL[h.recurrence]}`,
                      "Sessions on those dates become markable again.",
                    ],
                  })
                }
              >
                Delete
              </Button>
            </li>
          ))}
          {store.holidays.length === 0 && (
            <li className="panel p-4 text-sm text-muted-foreground">No holidays added.</li>
          )}
        </ul>
      </section>

      {editEvent !== undefined && (
        <EventDialog
          open
          onOpenChange={() => setEditEvent(undefined)}
          initial={editEvent}
          subjects={subjects}
          onSave={(e) =>
            update(
              (s) => ({
                ...s,
                events: s.events.some((x) => x.id === e.id)
                  ? s.events.map((x) => (x.id === e.id ? e : x))
                  : [...s.events, e],
              }),
              "Event saved",
            )
          }
        />
      )}
      {editHoliday !== undefined && (
        <HolidayDialog
          open
          onOpenChange={() => setEditHoliday(undefined)}
          initial={editHoliday}
          onSave={(h) =>
            update(
              (s) => ({
                ...s,
                holidays: s.holidays.some((x) => x.id === h.id)
                  ? s.holidays.map((x) => (x.id === h.id ? h : x))
                  : [...s.holidays, h],
              }),
              "Holiday saved",
            )
          }
        />
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(v) => !v && setPending(null)}
        title={`Delete ${pending?.title || "this item"}?`}
        description="This cannot be undone from here, but you can undo from the toast."
        impact={pending?.impact ?? []}
        confirmLabel="Delete"
        onConfirm={removeIt}
      />
    </div>
  );
}
