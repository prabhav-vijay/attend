import { useMemo, useState } from "react";
import { Plus, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/attend/ConfirmDialog";
import { EventDialog } from "@/components/attend/dialogs/EventDialog";
import { HolidayDialog } from "@/components/attend/dialogs/HolidayDialog";
import { STATUS_LABEL, STATUS_SOFT, StatusMark } from "@/components/attend/StatusMark";
import { useActive } from "@/components/attend/hooks";
import { prettyDate, uid } from "@/lib/attend/dates";
import {
  eventsOn,
  holidaysOn,
  inSemester,
  isFutureDate,
  occurrencesOn,
  offKey,
} from "@/lib/attend/model";
import { MARKABLE, type Status } from "@/lib/attend/types";
import { cn } from "@/lib/utils";

export function DateEditor({
  date,
  onClose,
}: {
  date: string | null;
  onClose: () => void;
}) {
  const { store, update, semester, subjects } = useActive();
  const [confirmAll, setConfirmAll] = useState<null | "present" | "absent">(null);
  const [addEvent, setAddEvent] = useState(false);
  const [addHoliday, setAddHoliday] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState<string>("");

  const occurrences = useMemo(
    () => (date ? occurrencesOn(store, semester, date) : []),
    [store, semester, date],
  );
  if (!date) return null;

  const holidays = holidaysOn(store, date);
  const events = eventsOn(store, date);
  const withinSemester = inSemester(semester, date);
  const future = isFutureDate(date);

  const setStatus = (key: string, status: Exclude<Status, "unrecorded">) =>
    update((s) => {
      const records = { ...s.records };
      if (records[key]?.status === status) delete records[key];
      else records[key] = { ...records[key], status };
      return { ...s, records };
    }, `Marked ${STATUS_LABEL[status].toLowerCase()}`);

  const clearStatus = (key: string) =>
    update((s) => {
      const records = { ...s.records };
      delete records[key];
      return { ...s, records };
    }, "Status cleared");

  const setSessionNote = (key: string, note: string) =>
    update((s) => {
      const existing = s.records[key];
      if (!existing && !note) return s;
      return {
        ...s,
        records: {
          ...s.records,
          [key]: { status: existing?.status ?? "present", note: note || undefined },
        },
      };
    });

  const markAll = (status: "present" | "absent") =>
    update((s) => {
      const records = { ...s.records };
      for (const o of occurrences) records[o.key] = { ...records[o.key], status };
      return { ...s, records };
    }, `All sessions marked ${status}`);

  const addSession = () => {
    if (!semester || !newSubjectId) return;
    const subject = subjects.find((s) => s.id === newSubjectId);
    if (!subject) return;
    update((s) => ({
      ...s,
      oneOffs: [
        ...s.oneOffs,
        {
          id: uid(),
          semesterId: semester.id,
          subjectId: subject.id,
          type: subject.types[0] ?? "lecture",
          date,
        },
      ],
    }), "Session added");
    setNewSubjectId("");
  };

  const removeSession = (key: string) =>
    update((s) => {
      const id = key.startsWith("off:") ? key.slice(4) : null;
      if (!id) return s;
      const records = { ...s.records };
      delete records[offKey(id)];
      return { ...s, oneOffs: s.oneOffs.filter((o) => o.id !== id), records };
    }, "Session removed");

  return (
    <>
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{prettyDate(date)}</DialogTitle>
            <DialogDescription>
              {holidays.length > 0
                ? holidays.map((h) => h.title).join(", ")
                : occurrences.length === 0
                  ? withinSemester
                    ? "No class scheduled."
                    : "This date is outside the active semester."
                  : future
                    ? "Scheduled — you can record these once the day arrives."
                    : "Record each session below."}
            </DialogDescription>
          </DialogHeader>

          {holidays.length > 0 && (
            <div className="rounded-md border border-holiday/40 bg-holiday/10 px-3 py-2 text-sm text-holiday">
              Holiday — session marking is disabled and these sessions are excluded from
              your percentage.
            </div>
          )}

          {occurrences.length > 0 && holidays.length === 0 && (
            <div className="space-y-2">
              {occurrences.map((o) => {
                const subject = subjects.find((s) => s.id === o.subjectId);
                return (
                  <div
                    key={o.key}
                    className="rounded-lg border border-border bg-surface p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="h-3 w-3 rounded-[3px]"
                          style={{ backgroundColor: subject?.color }}
                        />
                        <span className="font-medium">{subject?.name ?? "Unknown"}</span>
                        <span className="font-mono text-[12.5px] uppercase tracking-wider text-muted-foreground">
                          {o.type}
                          {o.start ? ` · ${o.start}–${o.end}` : ""}
                          {o.location ? ` · ${o.location}` : ""}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {MARKABLE.map((s) => (
                          <button
                            key={s}
                            type="button"
                            aria-pressed={o.status === s}
                            onClick={() => setStatus(o.key, s)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[12.5px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              o.status === s
                                ? STATUS_SOFT[s]
                                : "border-border text-muted-foreground hover:bg-accent",
                            )}
                          >
                            <StatusMark status={s} />
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                        {o.status !== "unrecorded" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => clearStatus(o.key)}
                          >
                            Clear
                          </Button>
                        )}
                        {o.key.startsWith("off:") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSession(o.key)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <Textarea
                      className="mt-2"
                      rows={1}
                      placeholder="Session note"
                      defaultValue={o.note ?? ""}
                      onBlur={(e) => setSessionNote(o.key, e.target.value)}
                    />
                  </div>
                );
              })}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setConfirmAll("present")}
                >
                  Mark all present
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setConfirmAll("absent")}
                >
                  Mark all absent
                </Button>
              </div>
            </div>
          )}

          {withinSemester && subjects.length > 0 && holidays.length === 0 && (
            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-3">
              <div className="min-w-[200px] flex-1">
                <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                  <SelectTrigger aria-label="Subject for a one-time session">
                    <SelectValue placeholder="Add a one-time session" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" disabled={!newSubjectId} onClick={addSession}>
                <Plus className="mr-1 h-4 w-4" /> Add session
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
              Events
            </h3>
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            )}
            {events.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  {e.important && <Star className="h-3.5 w-3.5 text-exam" />}
                  {e.title}
                  <span className="font-mono text-[12.5px] uppercase tracking-wider text-muted-foreground">
                    {e.type}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    update(
                      (s) => ({ ...s, events: s.events.filter((x) => x.id !== e.id) }),
                      "Event removed",
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setAddEvent(true)}>
                Add event
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setAddHoliday(true)}>
                Add holiday
              </Button>
              {holidays.map((h) => (
                <Button
                  key={h.id}
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    update(
                      (s) => ({
                        ...s,
                        holidays: s.holidays.filter((x) => x.id !== h.id),
                      }),
                      "Holiday removed",
                    )
                  }
                >
                  Remove “{h.title}”
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
              Note for this date
            </h3>
            <Textarea
              rows={2}
              defaultValue={store.dateNotes[date] ?? ""}
              placeholder="Anything worth remembering"
              onBlur={(e) =>
                update((s) => {
                  const dateNotes = { ...s.dateNotes };
                  if (e.target.value) dateNotes[date] = e.target.value;
                  else delete dateNotes[date];
                  return { ...s, dateNotes };
                })
              }
            />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmAll !== null}
        onOpenChange={(v) => !v && setConfirmAll(null)}
        title={`Mark all sessions ${confirmAll ?? ""}?`}
        description="This overwrites every session already recorded on this date."
        impact={[`${occurrences.length} sessions on ${date}`]}
        destructive={false}
        confirmLabel="Mark all"
        onConfirm={() => confirmAll && markAll(confirmAll)}
      />

      {addEvent && (
        <EventDialog
          open
          onOpenChange={setAddEvent}
          defaultDate={date}
          subjects={subjects}
          onSave={(e) => update((s) => ({ ...s, events: [...s.events, e] }), "Event added")}
        />
      )}
      {addHoliday && (
        <HolidayDialog
          open
          onOpenChange={setAddHoliday}
          defaultDate={date}
          onSave={(h) =>
            update((s) => ({ ...s, holidays: [...s.holidays, h] }), "Holiday added")
          }
        />
      )}
    </>
  );
}
