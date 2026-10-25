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
import { Textarea } from "@/components/ui/textarea";
import { todayISO, uid } from "@/lib/attend/dates";
import {
  HOLIDAY_TYPES,
  RECURRENCES,
  RECURRENCE_LABEL,
  type Holiday,
  type HolidayType,
  type Recurrence,
} from "@/lib/attend/types";

export function newHoliday(date?: string): Holiday {
  const d = date ?? todayISO();
  return {
    id: uid(),
    title: "",
    start: d,
    end: d,
    type: "one day",
    recurrence: "once",
  };
}

export function HolidayDialog({
  open,
  onOpenChange,
  initial,
  defaultDate,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Holiday | null;
  defaultDate?: string;
  onSave: (h: Holiday) => void;
}) {
  const [draft, setDraft] = useState<Holiday>(initial ?? newHoliday(defaultDate));
  const set = <K extends keyof Holiday>(k: K, v: Holiday[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit holiday" : "Add holiday"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="hol-title">Title</Label>
            <Input
              id="hol-title"
              value={draft.title}
              placeholder="Diwali break"
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="hol-start">Starts</Label>
              <Input
                id="hol-start"
                type="date"
                value={draft.start}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((d) => ({ ...d, start: v, end: d.end < v ? v : d.end }));
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hol-end">Ends</Label>
              <Input
                id="hol-end"
                type="date"
                min={draft.start}
                value={draft.end}
                onChange={(e) => set("end", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={draft.type}
                onValueChange={(v) => set("type", v as HolidayType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOLIDAY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
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

          <div className="grid gap-2">
            <Label htmlFor="hol-note">Note</Label>
            <Textarea
              id="hol-note"
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
              onSave({ ...draft, title: draft.title.trim() || "Holiday" });
              onOpenChange(false);
            }}
          >
            Save holiday
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
