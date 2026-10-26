import { uid } from "./dates";
import { offKey } from "./model";
import {
  MARKABLE,
  SESSION_TYPES,
  SUBJECT_COLORS,
  emptyStore,
  type OneOffSession,
  type Semester,
  type SessionType,
  type Store,
  type Subject,
} from "./types";

/** Split one CSV document into rows of fields, honouring quoted values. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  };

  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") pushField();
    else if (ch === "\n") pushRow();
    else if (ch === "\r") {
      /* handled by \n */
    } else field += ch;
  }
  if (quoted) return [];
  if (field !== "" || row.length > 0) pushRow();
  return rows;
}

const isDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [year, month, day] = v.split("-").map(Number);
  const value = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));
  return (
    value.getUTCFullYear() === year &&
    value.getUTCMonth() === (month ?? 0) - 1 &&
    value.getUTCDate() === day
  );
};
const isTime = (v: string) => {
  const match = /^(\d{2}):(\d{2})$/.exec(v);
  return !!match && Number(match[1]) < 24 && Number(match[2]) < 60;
};

export type CsvResult = {
  ok: boolean;
  error?: string;
  data?: Store;
  invalidRows: number;
};

/**
 * Builds a store from an Attend.™ session CSV. A CSV cannot describe a repeating
 * timetable, so every row becomes an individual dated session.
 */
export function storeFromCsv(text: string, current: Store): CsvResult {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { ok: false, error: "That CSV has no session rows.", invalidRows: 0 };
  }

  const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const iSemester = col("semester");
  const iDate = col("date");
  const iSubject = col("subject");
  if (iSemester < 0 || iDate < 0 || iSubject < 0) {
    return {
      ok: false,
      error: "That CSV is missing the semester, date or subject column.",
      invalidRows: 0,
    };
  }
  const iCode = col("code");
  const iType = col("type");
  const iStart = col("start");
  const iEnd = col("end");
  const iStatus = col("status");
  const iNote = col("note");

  const data: Store = {
    ...emptyStore,
    semesters: [],
    subjects: [],
    timetable: [],
    oneOffs: [],
    records: {},
    holidays: [],
    events: [],
    dateNotes: {},
    activeSemesterId: null,
  };

  const semesterByName = new Map<string, Semester>();
  const subjectByKey = new Map<string, Subject>();
  const bounds = new Map<string, { min: string; max: string }>();
  let invalid = 0;
  let colorIndex = 0;

  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");

  for (const raw of rows.slice(1)) {
    const semName = get(raw, iSemester) || "Imported semester";
    const date = get(raw, iDate);
    const subjectName = get(raw, iSubject);
    if (!isDate(date) || !subjectName) {
      invalid++;
      continue;
    }
    const status = get(raw, iStatus).toLowerCase();
    if (status && status !== "unrecorded" && !(MARKABLE as string[]).includes(status)) {
      invalid++;
      continue;
    }

    let semester = semesterByName.get(semName.toLowerCase());
    if (!semester) {
      const existing = current.semesters.find(
        (s) => s.name.toLowerCase() === semName.toLowerCase(),
      );
      semester =
        existing ??
        ({
          id: uid(),
          name: semName,
          start: date,
          end: date,
          defaultTarget: 75,
          firstDayOfWeek: 1,
          workingDays: [1, 2, 3, 4, 5],
          excusedRule: "attended",
          riskMargin: 5,
        } satisfies Semester);
      semesterByName.set(semName.toLowerCase(), semester);
      data.semesters.push(semester);
      bounds.set(semester.id, { min: semester.start, max: semester.end });
    }

    const b = bounds.get(semester.id);
    if (b) {
      if (date < b.min) b.min = date;
      if (date > b.max) b.max = date;
    }

    const code = get(raw, iCode);
    const subjKey = `${semester.id}|${(code || subjectName).toLowerCase()}`;
    let subject = subjectByKey.get(subjKey);
    if (!subject) {
      const existing = current.subjects.find(
        (s) =>
          s.semesterId === semester.id &&
          (code
            ? s.code.toLowerCase() === code.toLowerCase()
            : s.name.toLowerCase() === subjectName.toLowerCase()),
      );
      subject =
        (existing ? { ...existing, types: [...existing.types] } : null) ??
        ({
          id: uid(),
          semesterId: semester.id,
          name: subjectName,
          code,
          color: SUBJECT_COLORS[colorIndex++ % SUBJECT_COLORS.length] ?? "#7f9db5",
          types: [],
        } satisfies Subject);
      subjectByKey.set(subjKey, subject);
      data.subjects.push(subject);
    }

    const rawType = get(raw, iType).toLowerCase();
    const type: SessionType = (SESSION_TYPES as string[]).includes(rawType)
      ? (rawType as SessionType)
      : "other";
    if (!subject.types.includes(type)) subject.types = [...subject.types, type];

    const start = get(raw, iStart);
    const end = get(raw, iEnd);
    const session: OneOffSession = {
      id: uid(),
      semesterId: semester.id,
      subjectId: subject.id,
      type,
      date,
      ...(isTime(start) ? { start } : {}),
      ...(isTime(end) ? { end } : {}),
    };
    data.oneOffs.push(session);

    const note = get(raw, iNote);
    if ((MARKABLE as string[]).includes(status)) {
      data.records[offKey(session.id)] = {
        status: status as (typeof MARKABLE)[number],
        ...(note ? { note } : {}),
      };
    }
  }

  if (data.oneOffs.length === 0) {
    return { ok: false, error: "No usable session rows were found in that CSV.", invalidRows: invalid };
  }

  data.semesters = data.semesters.map((s) => {
    const b = bounds.get(s.id);
    if (!b) return s;
    return { ...s, start: b.min < s.start ? b.min : s.start, end: b.max > s.end ? b.max : s.end };
  });
  data.activeSemesterId = data.semesters[0]?.id ?? null;

  return { ok: true, data, invalidRows: invalid };
}
