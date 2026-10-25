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
import { iso, uid } from "@/lib/attend/dates";
import { WEEKDAY_NAMES } from "@/lib/attend/dates";
import type { ExcusedRule, Semester } from "@/lib/attend/types";
import { cn } from "@/lib/utils";

const EXCUSED_LABEL: Record<ExcusedRule, string> = {
  attended: "Counted as attended",
  excluded: "Excluded from the calculation",
  absent: "Counted as absent",
};

export function newSemester(): Semester {
  const today = new Date();
  const end = new Date(today);
  end.setMonth(end.getMonth() + 5);
  return {
    id: uid(),
    name: "",
    start: iso(today),
    end: iso(end),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    defaultTarget: 75,
    firstDayOfWeek: 1,
    workingDays: [1, 2, 3, 4, 5],
    excusedRule: "attended",
    riskMargin: 5,
  };
}

export function SemesterDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Semester | null;
  onSave: (s: Semester) => void;
}) {
  const [draft, setDraft] = useState<Semester>(initial ?? newSemester());
  const set = <K extends keyof Semester>(k: K, v: Semester[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const valid = draft.name.trim() && draft.start <= draft.end;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit semester" : "New semester"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sem-name">Name</Label>
            <Input
              id="sem-name"
              value={draft.name}
              placeholder="Semester 4"
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sem-start">Starts</Label>
              <Input
                id="sem-start"
                type="date"
                value={draft.start}
                onChange={(e) => set("start", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sem-end">Ends</Label>
              <Input
                id="sem-end"
                type="date"
                value={draft.end}
                onChange={(e) => set("end", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sem-target">Attendance target (%)</Label>
              <Input
                id="sem-target"
                type="number"
                min={0}
                max={100}
                value={draft.defaultTarget}
                onChange={(e) => set("defaultTarget", Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sem-margin">Risk margin (points)</Label>
              <Input
                id="sem-margin"
                type="number"
                min={0}
                max={50}
                value={draft.riskMargin}
                onChange={(e) => set("riskMargin", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Excused sessions</Label>
            <Select
              value={draft.excusedRule}
              onValueChange={(v) => set("excusedRule", v as ExcusedRule)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EXCUSED_LABEL) as ExcusedRule[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {EXCUSED_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>First day of week</Label>
              <Select
                value={String(draft.firstDayOfWeek)}
                onValueChange={(v) => set("firstDayOfWeek", Number(v) as 0 | 1)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sem-tz">Time zone</Label>
              <Input
                id="sem-tz"
                value={draft.timezone}
                onChange={(e) => set("timezone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Working days</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_NAMES.map((name, i) => {
                const on = draft.workingDays.includes(i);
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set(
                        "workingDays",
                        on
                          ? draft.workingDays.filter((d) => d !== i)
                          : [...draft.workingDays, i].sort(),
                      )
                    }
                    className={cn(
                      "rounded-md border px-2.5 py-1 font-mono text-[12.5px] uppercase tracking-wider transition-colors",
                      on
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onSave({ ...draft, name: draft.name.trim() });
              onOpenChange(false);
            }}
          >
            Save semester
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
