export const uid = () => Math.random().toString(36).slice(2, 10);

export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export const parseISO = (s: string) => {
  const p = s.split("-").map(Number);
  return new Date(p[0] ?? 1970, (p[1] ?? 1) - 1, p[2] ?? 1);
};

export const todayISO = () => iso(new Date());

export const addDays = (s: string, n: number) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const weekdayOf = (s: string) => parseISO(s).getDay();

export const prettyDate = (s: string) =>
  parseISO(s).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const shortDate = (s: string) =>
  parseISO(s).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const monthLabel = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

export function daysBetween(a: string, b: string) {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}

export function relativeDays(from: string, to: string) {
  const n = daysBetween(from, to);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${Math.abs(n)} days ago`;
}

/** Monday-based academic week number inside the semester. */
export function academicWeek(semesterStart: string, date: string) {
  return Math.floor(daysBetween(semesterStart, date) / 7) + 1;
}

/** All ISO dates of the month grid, padded to whole weeks. */
export function monthGrid(month: Date, firstDayOfWeek: 0 | 1) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (first.getDay() - firstDayOfWeek + 7) % 7;
  const startDate = new Date(first);
  startDate.setDate(1 - lead);
  const cells: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push(iso(d));
    if (i >= 27 && d.getMonth() !== month.getMonth() && (i + 1) % 7 === 0) break;
  }
  return cells;
}

export function weekDates(anchor: string, firstDayOfWeek: 0 | 1) {
  const back = (weekdayOf(anchor) - firstDayOfWeek + 7) % 7;
  const start = addDays(anchor, -back);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayLabels(firstDayOfWeek: 0 | 1) {
  return Array.from(
    { length: 7 },
    (_, i) => WEEKDAY_NAMES[(i + firstDayOfWeek) % 7] as string,
  );
}

export function eachDate(start: string, end: string) {
  const out: string[] = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard++ < 2000) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}
