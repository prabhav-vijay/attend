import { semesterOccurrences, subjectById } from "./model";
import { emptyStore, type Semester, type Store } from "./types";

export function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function scopedStore(store: Store, semester: Semester | null): Store {
  if (!semester) return store;
  return {
    ...store,
    semesters: [semester],
    subjects: store.subjects.filter((s) => s.semesterId === semester.id),
    timetable: store.timetable.filter((t) => t.semesterId === semester.id),
    oneOffs: store.oneOffs.filter((o) => o.semesterId === semester.id),
    activeSemesterId: semester.id,
  };
}

export function exportJSON(store: Store, semester: Semester | null) {
  const data = scopedStore(store, semester);
  download(
    `attend-backup-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(data, null, 2),
    "application/json",
  );
}

/** One row per session occurrence. */
export function exportCSV(store: Store, semester: Semester | null) {
  const semesters = semester ? [semester] : store.semesters;
  const rows = [
    ["semester", "date", "subject", "code", "type", "start", "end", "status", "note"],
  ];
  for (const sem of semesters) {
    for (const o of semesterOccurrences(store, sem)) {
      const subject = subjectById(store, o.subjectId);
      rows.push([
        sem.name,
        o.date,
        subject?.name ?? "Unknown",
        subject?.code ?? "",
        o.type,
        o.start ?? "",
        o.end ?? "",
        o.status,
        (o.note ?? "").replace(/[\r\n]+/g, " "),
      ]);
    }
  }
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  download(
    `attend-sessions-${new Date().toISOString().slice(0, 10)}.csv`,
    csv,
    "text/csv",
  );
}

export type ImportPreview = {
  ok: boolean;
  error?: string;
  data?: Store;
  semesters: number;
  subjects: number;
  timetable: number;
  sessions: number;
  records: number;
  holidays: number;
  events: number;
  duplicateSemesters: string[];
  unknownSubjects: number;
  invalidRows: number;
  importFormat?: "csv" | "json";
};

const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function previewImport(raw: string, current: Store): ImportPreview {
  const base: ImportPreview = {
    ok: false,
    semesters: 0,
    subjects: 0,
    timetable: 0,
    sessions: 0,
    records: 0,
    holidays: 0,
    events: 0,
    duplicateSemesters: [],
    unknownSubjects: 0,
    invalidRows: 0,
    importFormat: "json",
  };
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...base, error: "That file is not valid JSON." };
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.semesters)) {
    return { ...base, error: "That file is not an Attend.™ backup." };
  }

  const data: Store = { ...emptyStore, ...parsed, version: 3 };
  const subjectIds = new Set(data.subjects.map((s) => s.id));
  let invalid = 0;
  let unknown = 0;

  data.semesters = data.semesters.filter((s) => {
    const valid = s && s.id && s.name && isDate(s.start) && isDate(s.end);
    if (!valid) invalid++;
    return valid;
  });
  data.oneOffs = data.oneOffs.filter((o) => {
    if (!subjectIds.has(o.subjectId)) {
      unknown++;
      return false;
    }
    if (!isDate(o.date)) {
      invalid++;
      return false;
    }
    return true;
  });
  data.timetable = data.timetable.filter((t) => {
    if (!subjectIds.has(t.subjectId)) {
      unknown++;
      return false;
    }
    return true;
  });

  const currentIds = new Set(current.semesters.map((s) => s.id));

  return {
    ...base,
    ok: true,
    data,
    semesters: data.semesters.length,
    subjects: data.subjects.length,
    timetable: data.timetable.length,
    sessions: data.oneOffs.length,
    records: Object.keys(data.records ?? {}).length,
    holidays: data.holidays.length,
    events: data.events.length,
    duplicateSemesters: data.semesters
      .filter((s) => currentIds.has(s.id))
      .map((s) => s.name),
    unknownSubjects: unknown,
    invalidRows: invalid,
  };
}

const mergeById = <T extends { id: string }>(a: T[], b: T[]) => {
  const map = new Map(a.map((x) => [x.id, x]));
  for (const x of b) map.set(x.id, x);
  return [...map.values()];
};

export function mergeStores(current: Store, incoming: Store): Store {
  return {
    version: 3,
    semesters: mergeById(current.semesters, incoming.semesters),
    subjects: mergeById(current.subjects, incoming.subjects),
    timetable: mergeById(current.timetable, incoming.timetable),
    oneOffs: mergeById(current.oneOffs, incoming.oneOffs),
    records: { ...current.records, ...incoming.records },
    holidays: mergeById(current.holidays, incoming.holidays),
    events: mergeById(current.events, incoming.events),
    dateNotes: { ...current.dateNotes, ...incoming.dateNotes },
    activeSemesterId: current.activeSemesterId ?? incoming.activeSemesterId,
  };
}

export function printReport() {
  window.print();
}
