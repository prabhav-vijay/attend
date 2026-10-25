import {
  addDays,
  daysBetween,
  eachDate,
  iso,
  parseISO,
  todayISO,
  weekdayOf,
} from "./dates";
import type {
  AppEvent,
  Holiday,
  Occurrence,
  Recurrence,
  Semester,
  Store,
  Subject,
} from "./types";

export const activeSemester = (store: Store) =>
  store.semesters.find((s) => s.id === store.activeSemesterId) ?? null;

export const subjectsOf = (store: Store, semesterId?: string | null) =>
  store.subjects.filter((s) => !semesterId || s.semesterId === semesterId);

export const subjectById = (store: Store, id: string) =>
  store.subjects.find((s) => s.id === id) ?? null;

export const subjectTarget = (sem: Semester | null, subject: Subject | null) =>
  subject?.target ?? sem?.defaultTarget ?? 75;

/* ---------------------------------------------------------------- holidays */

function repeats(anchor: string, date: string, recurrence: Recurrence) {
  if (recurrence === "once") return false;
  if (date < anchor) return false;
  const a = parseISO(anchor);
  const b = parseISO(date);
  if (recurrence === "weekly") return a.getDay() === b.getDay();
  if (recurrence === "monthly") return a.getDate() === b.getDate();
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
}

export function holidayCovers(h: Holiday, date: string) {
  if (h.recurrence === "once") return date >= h.start && date <= h.end;
  const span = Math.max(0, daysBetween(h.start, h.end));
  for (let i = 0; i <= span; i++) {
    if (repeats(addDays(h.start, i), date, h.recurrence)) return true;
  }
  return false;
}

export const holidaysOn = (store: Store, date: string) =>
  store.holidays.filter((h) => holidayCovers(h, date));

export const isHoliday = (store: Store, date: string) =>
  store.holidays.some((h) => holidayCovers(h, date));

/* ------------------------------------------------------------------ events */

export function eventOccursOn(e: AppEvent, date: string) {
  return e.recurrence === "once" ? e.date === date : repeats(e.date, date, e.recurrence);
}

export const eventsOn = (store: Store, date: string) =>
  store.events.filter((e) => eventOccursOn(e, date));

/** Next occurrences of every event from `from`, sorted, within `days`. */
export function upcomingEvents(store: Store, from = todayISO(), days = 365) {
  const out: { event: AppEvent; date: string }[] = [];
  for (const e of store.events) {
    for (let i = 0; i <= days; i++) {
      const d = addDays(from, i);
      if (eventOccursOn(e, d)) {
        out.push({ event: e, date: d });
        break;
      }
    }
  }
  return out.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      Number(!!b.event.important) - Number(!!a.event.important),
  );
}

export function nextHoliday(store: Store, from = todayISO(), days = 365) {
  for (let i = 0; i <= days; i++) {
    const d = addDays(from, i);
    const hit = holidaysOn(store, d)[0];
    if (hit) return { holiday: hit, date: d };
  }
  return null;
}

/* ------------------------------------------------------------- occurrences */

export const ttKey = (entryId: string, date: string) => `tt:${entryId}:${date}`;
export const offKey = (id: string) => `off:${id}`;

export const inSemester = (sem: Semester | null, date: string) =>
  !!sem && date >= sem.start && date <= sem.end;

export const isFutureDate = (date: string) => date > todayISO();

/** Every scheduled session on a date for a semester, chronologically. */
export function occurrencesOn(
  store: Store,
  sem: Semester | null,
  date: string,
): Occurrence[] {
  if (!sem || !inSemester(sem, date)) return [];
  const holiday = isHoliday(store, date);
  const list: Occurrence[] = [];

  if (!holiday) {
    for (const t of store.timetable) {
      if (t.semesterId !== sem.id) continue;
      if (t.weekday !== weekdayOf(date)) continue;
      if (date < t.from || date > t.to) continue;
      if (t.interval === 2) {
        const weeks = Math.floor(daysBetween(t.from, date) / 7);
        if (weeks % 2 !== 0) continue;
      }
      const key = ttKey(t.id, date);
      const rec = store.records[key];
      list.push({
        key,
        semesterId: sem.id,
        subjectId: t.subjectId,
        type: t.type,
        date,
        start: t.start,
        end: t.end,
        location: t.location,
        status: rec?.status ?? "unrecorded",
        note: rec?.note,
      });
    }
  }

  for (const o of store.oneOffs) {
    if (o.semesterId !== sem.id || o.date !== date) continue;
    const key = offKey(o.id);
    const rec = store.records[key];
    list.push({
      key,
      semesterId: sem.id,
      subjectId: o.subjectId,
      type: o.type,
      date,
      start: o.start,
      end: o.end,
      location: o.location,
      status: rec?.status ?? "unrecorded",
      note: rec?.note,
    });
  }

  return list.sort((a, b) => (a.start ?? "99:99").localeCompare(b.start ?? "99:99"));
}

/** Every occurrence between two dates (inclusive). */
export function occurrencesBetween(
  store: Store,
  sem: Semester | null,
  start: string,
  end: string,
): Occurrence[] {
  if (!sem) return [];
  const from = start < sem.start ? sem.start : start;
  const to = end > sem.end ? sem.end : end;
  if (from > to) return [];
  return eachDate(from, to).flatMap((d) => occurrencesOn(store, sem, d));
}

export const semesterOccurrences = (store: Store, sem: Semester | null) =>
  sem ? occurrencesBetween(store, sem, sem.start, sem.end) : [];

/** Past scheduled sessions with no recorded status. */
export const unrecordedPast = (occ: Occurrence[]) =>
  occ.filter((o) => o.status === "unrecorded" && !isFutureDate(o.date));

export const monthOf = (date: string) => date.slice(0, 7);

export const nowMonth = () => iso(new Date()).slice(0, 7);
