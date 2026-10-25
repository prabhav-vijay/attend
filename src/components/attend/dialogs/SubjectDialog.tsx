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
import { uid } from "@/lib/attend/dates";
import { SESSION_TYPES, SUBJECT_COLORS, type SessionType, type Subject } from "@/lib/attend/types";
import { cn } from "@/lib/utils";

export function newSubject(semesterId: string, index = 0): Subject {
  return {
    id: uid(),
    semesterId,
    name: "",
    code: "",
    color: SUBJECT_COLORS[index % SUBJECT_COLORS.length] as string,
    types: ["lecture"],
  };
}

export function SubjectDialog({
  open,
  onOpenChange,
  initial,
  semesterId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Subject | null;
  semesterId: string;
  onSave: (s: Subject) => void;
}) {
  const [draft, setDraft] = useState<Subject>(initial ?? newSubject(semesterId));
  const set = <K extends keyof Subject>(k: K, v: Subject[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const toggleType = (t: SessionType) =>
    set(
      "types",
      draft.types.includes(t)
        ? draft.types.filter((x) => x !== t)
        : [...draft.types, t],
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit subject" : "New subject"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sub-name">Name</Label>
              <Input
                id="sub-name"
                value={draft.name}
                placeholder="Digital Electronics"
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-code">Short code</Label>
              <Input
                id="sub-code"
                value={draft.code}
                placeholder="DE"
                onChange={(e) => set("code", e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sub-teacher">Teacher</Label>
              <Input
                id="sub-teacher"
                value={draft.teacher ?? ""}
                onChange={(e) => set("teacher", e.target.value || undefined)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-room">Default room</Label>
              <Input
                id="sub-room"
                value={draft.room ?? ""}
                onChange={(e) => set("room", e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sub-target">Target override (%)</Label>
              <Input
                id="sub-target"
                type="number"
                min={0}
                max={100}
                value={draft.target ?? ""}
                placeholder="Semester default"
                onChange={(e) =>
                  set("target", e.target.value === "" ? undefined : Number(e.target.value))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-credits">Credits</Label>
              <Input
                id="sub-credits"
                type="number"
                min={0}
                value={draft.credits ?? ""}
                onChange={(e) =>
                  set(
                    "credits",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Session types</Label>
            <div className="flex flex-wrap gap-1.5">
              {SESSION_TYPES.map((t) => {
                const on = draft.types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleType(t)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 font-mono text-[12.5px] uppercase tracking-wider transition-colors",
                      on
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Colour</Label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Colour ${c}`}
                  aria-pressed={draft.color === c}
                  onClick={() => set("color", c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "h-7 w-7 rounded-md border transition-transform",
                    draft.color === c
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!draft.name.trim() || draft.types.length === 0}
            onClick={() => {
              onSave({
                ...draft,
                name: draft.name.trim(),
                code: (draft.code || draft.name.slice(0, 3)).toUpperCase(),
              });
              onOpenChange(false);
            }}
          >
            Save subject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
