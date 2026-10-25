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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { todayISO, uid } from "@/lib/attend/dates";
import {
  EVENT_TYPES,
  RECURRENCES,
  RECURRENCE_LABEL,
  type AppEvent,
  type EventType,
  type Recurrence,
  type Subject,
} from "@/lib/attend/types";

export function newEvent(date?: string): AppEvent {
  return {
    id: uid(),
    title: "",
    type: "exam",
    date: date ?? todayISO(),
    recurrence: "once",
  };
}

export function EventDialog({
  open,
  onOpenChange,
  initial,
  defaultDate,
  subjects,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: AppEvent | null;
  defaultDate?: string;
  subjects: Subject[];
  onSave: (e: AppEvent) => void;
}) {
  const [draft, setDraft] = useState<AppEvent>(initial ?? newEvent(defaultDate));
  const set = <K extends keyof AppEvent>(k: K, v: AppEvent[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit event" : "Add event"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              value={draft.title}
              placeholder="Mid-semester exam"
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={draft.type} onValueChange={(v) => set("type", v as EventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-date">Date</Label>
              <Input
                id="ev-date"
                type="date"
                value={draft.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ev-start">Starts (optional)</Label>
              <Input
                id="ev-start"
                type="time"
                value={draft.start ?? ""}
                onChange={(e) => set("start", e.target.value || undefined)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-end">Ends (optional)</Label>
              <Input
                id="ev-end"
                type="time"
                value={draft.end ?? ""}
                onChange={(e) => set("end", e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select
                value={draft.subjectId ?? "none"}
                onValueChange={(v) => set("subjectId", v === "none" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No subject</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Repeats</Label>
              <Select
                value={draft.recurrence}
                onValueChange={(v) => set("recurrence", v as Recurrence)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RECURRENCE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="ev-important">Mark as important</Label>
            <Switch
              id="ev-important"
              checked={!!draft.important}
              onCheckedChange={(v) => set("important", v || undefined)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ev-note">Note</Label>
            <Textarea
              id="ev-note"
              rows={2}
              value={draft.note ?? ""}
              onChange={(e) => set("note", e.target.value || undefined)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave({ ...draft, title: draft.title.trim() || "Event" });
              onOpenChange(false);
            }}
          >
            Save event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
