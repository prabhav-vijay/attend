import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/attend/ConfirmDialog";
import { SemesterDialog } from "@/components/attend/dialogs/SemesterDialog";
import { SubjectDialog } from "@/components/attend/dialogs/SubjectDialog";
import { TimetableDialog } from "@/components/attend/dialogs/TimetableDialog";
import { useActive } from "@/components/attend/hooks";
import { Button } from "@/components/ui/button";
import { WEEKDAY_NAMES, shortDate } from "@/lib/attend/dates";
import { semesterOccurrences } from "@/lib/attend/model";
import type { Semester, Subject, TimetableEntry } from "@/lib/attend/types";
import { getSiteOrigin } from "@/lib/site-meta.functions";
import { pageHead } from "@/lib/site-meta";

export const Route = createFileRoute("/semester")({
  loader: () => getSiteOrigin(),
  head: ({ loaderData }) => pageHead({ title: "Semester & Timetable Setup — Attend.™", description: "Set semester dates, attendance targets, subjects, and a repeating college timetable.", path: "/semester", ...(loaderData ? { origin: loaderData } : {}) }),
  component: SemesterPage,
});

export function SemesterPage() {
  const { store, update, semester, subjects } = useActive();
  const [editSem, setEditSem] = useState<Semester | null | undefined>(undefined);
  const [editSubject, setEditSubject] = useState<Subject | null | undefined>(undefined);
  const [editEntry, setEditEntry] = useState<TimetableEntry | null | undefined>(undefined);
  const [pending, setPending] = useState<
    null | { kind: "semester" | "subject" | "entry"; id: string; title: string; impact: string[] }
  >(null);

  const entries = useMemo(
    () =>
      store.timetable
        .filter((t) => t.semesterId === semester?.id)
        .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start)),
    [store.timetable, semester],
  );
  const occ = useMemo(() => semesterOccurrences(store, semester), [store, semester]);

  const confirmDelete = () => {
    if (!pending) return;
    const { kind, id } = pending;
    update((s) => {
      if (kind === "semester") {
        const keepRecords = Object.fromEntries(
          Object.entries(s.records).filter(([k]) => {
            const ttId = k.startsWith("tt:") ? k.split(":")[1] : null;
            const offId = k.startsWith("off:") ? k.slice(4) : null;
            const tt = s.timetable.find((t) => t.id === ttId);
            const off = s.oneOffs.find((o) => o.id === offId);
            return (tt?.semesterId ?? off?.semesterId) !== id;
          }),
        );
        return {
          ...s,
          semesters: s.semesters.filter((x) => x.id !== id),
          subjects: s.subjects.filter((x) => x.semesterId !== id),
          timetable: s.timetable.filter((x) => x.semesterId !== id),
          oneOffs: s.oneOffs.filter((x) => x.semesterId !== id),
          records: keepRecords,
          activeSemesterId:
            s.activeSemesterId === id
              ? (s.semesters.find((x) => x.id !== id)?.id ?? null)
              : s.activeSemesterId,
        };
      }
      if (kind === "subject") {
        return {
          ...s,
          subjects: s.subjects.filter((x) => x.id !== id),
          timetable: s.timetable.filter((x) => x.subjectId !== id),
          oneOffs: s.oneOffs.filter((x) => x.subjectId !== id),
        };
      }
      return { ...s, timetable: s.timetable.filter((x) => x.id !== id) };
    }, "Deleted");
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
            Setup
          </p>
          <h1 className="font-display text-2xl">{semester?.name ?? "No semester yet"}</h1>
          {semester && (
            <p className="font-mono text-xs text-muted-foreground">
              {shortDate(semester.start)} → {shortDate(semester.end)} · target{" "}
              {semester.defaultTarget}% · excused {semester.excusedRule} · {occ.length}{" "}
              scheduled sessions
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditSem(null)}>
          New semester
        </Button>
        {semester && (
          <>
            <Button size="sm" variant="ghost" onClick={() => setEditSem(semester)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setPending({
                  kind: "semester",
                  id: semester.id,
                  title: semester.name,
                  impact: [
                    `${shortDate(semester.start)} → ${shortDate(semester.end)}`,
                    `${subjects.length} subjects, ${entries.length} timetable entries`,
                    `${occ.length} sessions and their records`,
                  ],
                })
              }
            >
              Delete
            </Button>
          </>
        )}
      </header>

      {!semester && (
        <p className="panel p-4 text-sm">
          Create a semester to add subjects and a timetable. Holidays and events work without one.
        </p>
      )}

      {semester && (
        <>
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
                Subjects
              </h2>
              <Button size="sm" variant="secondary" onClick={() => setEditSubject(null)}>
                Add subject
              </Button>
            </div>
            <ul className="space-y-2">
              {subjects.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2"
                >
                  <span
                    aria-hidden
                    className="h-4 w-4 rounded-[4px]"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {s.name} <span className="text-muted-foreground">{s.code}</span>
                    </p>
                    <p className="font-mono text-[12.5px] text-muted-foreground">
                      {s.types.join(", ")}
                      {s.target ? ` · target ${s.target}%` : ""}
                      {s.teacher ? ` · ${s.teacher}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditSubject(s)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setPending({
                        kind: "subject",
                        id: s.id,
                        title: s.name,
                        impact: [
                          `${entries.filter((e) => e.subjectId === s.id).length} timetable entries`,
                          `${occ.filter((o) => o.subjectId === s.id).length} sessions`,
                        ],
                      })
                    }
                  >
                    Delete
                  </Button>
                </li>
              ))}
              {subjects.length === 0 && (
                <li className="panel p-4 text-sm text-muted-foreground">No subjects yet.</li>
              )}
            </ul>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-mono text-[12.5px] uppercase tracking-widest text-muted-foreground">
                Weekly timetable
              </h2>
              <Button
                size="sm"
                variant="secondary"
                disabled={subjects.length === 0}
                onClick={() => setEditEntry(null)}
              >
                Add entry
              </Button>
            </div>
            <ul className="space-y-2">
              {entries.map((t) => {
                const sub = subjects.find((s) => s.id === t.subjectId);
                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {WEEKDAY_NAMES[t.weekday]} · {t.start}–{t.end} ·{" "}
                        {sub?.name ?? "Unknown"}
                      </p>
                      <p className="font-mono text-[12.5px] text-muted-foreground">
                        {t.type}
                        {t.location ? ` · ${t.location}` : ""} ·{" "}
                        {t.interval === 2 ? "every other week" : "weekly"} ·{" "}
                        {shortDate(t.from)} → {shortDate(t.to)}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditEntry(t)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setPending({
                          kind: "entry",
                          id: t.id,
                          title: `${sub?.name ?? "Entry"} on ${WEEKDAY_NAMES[t.weekday]}`,
                          impact: [
                            `${occ.filter((o) => o.key.startsWith(`tt:${t.id}:`)).length} sessions removed`,
                          ],
                        })
                      }
                    >
                      Delete
                    </Button>
                  </li>
                );
              })}
              {entries.length === 0 && (
                <li className="panel p-4 text-sm text-muted-foreground">
                  No timetable entries yet.
                </li>
              )}
            </ul>
          </section>
        </>
      )}

      {editSem !== undefined && (
        <SemesterDialog
          open
          onOpenChange={() => setEditSem(undefined)}
          initial={editSem}
          onSave={(s) =>
            update(
              (prev) => ({
                ...prev,
                semesters: prev.semesters.some((x) => x.id === s.id)
                  ? prev.semesters.map((x) => (x.id === s.id ? s : x))
                  : [...prev.semesters, s],
                activeSemesterId: prev.activeSemesterId ?? s.id,
              }),
              "Semester saved",
            )
          }
        />
      )}
      {editSubject !== undefined && semester && (
        <SubjectDialog
          open
          onOpenChange={() => setEditSubject(undefined)}
          initial={editSubject}
          semesterId={semester.id}
          onSave={(s) =>
            update(
              (prev) => ({
                ...prev,
                subjects: prev.subjects.some((x) => x.id === s.id)
                  ? prev.subjects.map((x) => (x.id === s.id ? s : x))
                  : [...prev.subjects, s],
              }),
              "Subject saved",
            )
          }
        />
      )}
      {editEntry !== undefined && semester && subjects.length > 0 && (
        <TimetableDialog
          open
          onOpenChange={() => setEditEntry(undefined)}
          initial={editEntry}
          semester={semester}
          subjects={subjects}
          existing={entries}
          onSave={(e) =>
            update(
              (prev) => ({
                ...prev,
                timetable: prev.timetable.some((x) => x.id === e.id)
                  ? prev.timetable.map((x) => (x.id === e.id ? e : x))
                  : [...prev.timetable, e],
              }),
              "Timetable saved",
            )
          }
        />
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(v) => !v && setPending(null)}
        title={`Delete ${pending?.title || "this"}?`}
        description="This removes the item and everything scheduled from it."
        impact={pending?.impact ?? []}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
