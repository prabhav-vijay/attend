import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEEKDAY_NAMES, uid } from "@/lib/attend/dates";
import type {
  Semester,
  SessionType,
  Subject,
  TimetableEntry,
} from "@/lib/attend/types";

export function newEntry(sem: Semester, subject: Subject): TimetableEntry {
  return {
    id: uid(),
    semesterId: sem.id,
    subjectId: subject.id,
    type: subject.types[0] ?? "lecture",
    weekday: sem.workingDays[0] ?? 1,
    start: "09:00",
    end: "10:00",
    from: sem.start,
    to: sem.end,
    interval: 1,
  };
}

/** Two entries clash when they share a weekday and their times overlap. */
export function overlaps(a: TimetableEntry, b: TimetableEntry) {
  if (a.id === b.id || a.weekday !== b.weekday) return false;
  if (a.to < b.from || b.to < a.from) return false;
  return a.start < b.end && b.start < a.end;
}

export function TimetableDialog({
  open,
  onOpenChange,
  initial,
  semester,
  subjects,
  existing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: TimetableEntry | null;
  semester: Semester;
  subjects: Subject[];
  existing: TimetableEntry[];
  onSave: (e: TimetableEntry) => void;
}) {
  const first = subjects[0];
  const [draft, setDraft] = useState<TimetableEntry | null>(
    initial ?? (first ? newEntry(semester, first) : null),
  );
  if (!draft) return null;

  const set = <K extends keyof TimetableEntry>(k: K, v: TimetableEntry[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const subject = subjects.find((s) => s.id === draft.subjectId);
  const clashes = existing.filter((e) => overlaps(draft, e));
  const invalidTime = draft.start >= draft.end;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit class" : "Add class to timetable"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select
                value={draft.subjectId}
                onValueChange={(v) => set("subjectId", v)}
              >
                <SelectTrigger>
                  <SelectValue />
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
            <div className="grid gap-2">
              <Label>Session type</Label>
              <Select
                value={draft.type}
                onValueChange={(v) => set("type", v as SessionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(subject?.types ?? ["lecture"]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Weekday</Label>
              <Select
                value={String(draft.weekday)}
                onValueChange={(v) => set("weekday", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_NAMES.map((n, i) => (
                    <SelectItem key={n} value={String(i)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tt-start">Starts</Label>
              <Input
                id="tt-start"
                type="time"
                value={draft.start}
                onChange={(e) => set("start", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tt-end">Ends</Label>
              <Input
                id="tt-end"
                type="time"
                value={draft.end}
                onChange={(e) => set("end", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="tt-from">Repeat from</Label>
              <Input
                id="tt-from"
                type="date"
                value={draft.from}
                onChange={(e) => set("from", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tt-to">Repeat until</Label>
              <Input
                id="tt-to"
                type="date"
                value={draft.to}
                onChange={(e) => set("to", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Recurrence</Label>
              <Select
                value={String(draft.interval)}
                onValueChange={(v) => set("interval", Number(v) as 1 | 2)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every week</SelectItem>
                  <SelectItem value="2">Every other week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tt-loc">Room</Label>
              <Input
                id="tt-loc"
                value={draft.location ?? ""}
                onChange={(e) => set("location", e.target.value || undefined)}
              />
            </div>
          </div>

          {invalidTime && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              The end time must come after the start time.
            </p>
          )}
          {clashes.length > 0 && (
            <p className="rounded-md border border-exam/40 bg-exam/10 px-3 py-2 text-xs text-exam">
              Overlaps {clashes.length} existing class
              {clashes.length > 1 ? "es" : ""} on the same weekday. You can still save
              it if that is intentional.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={invalidTime}
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            Save class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
