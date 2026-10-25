import { isFutureDate } from "./model";
import type { ExcusedRule, Occurrence, Semester } from "./types";

export type Counts = {
  attended: number;
  absent: number;
  excused: number;
  cancelled: number;
  unrecorded: number;
  /** sessions that count towards the denominator */
  held: number;
  scheduled: number;
  /** null when nothing has been recorded yet */
  percent: number | null;
};

export const emptyCounts: Counts = {
  attended: 0,
  absent: 0,
  excused: 0,
  cancelled: 0,
  unrecorded: 0,
  held: 0,
  scheduled: 0,
  percent: null,
};

/**
 * Cancelled, future and unrecorded sessions never enter the denominator.
 * Excused follows the semester rule.
 */
export function countOccurrences(occ: Occurrence[], rule: ExcusedRule): Counts {
  let attended = 0;
  let absent = 0;
  let excused = 0;
  let cancelled = 0;
  let unrecorded = 0;

  for (const o of occ) {
    switch (o.status) {
      case "present":
        attended++;
        break;
      case "absent":
        absent++;
        break;
      case "excused":
        excused++;
        break;
      case "cancelled":
        cancelled++;
        break;
      default:
        if (!isFutureDate(o.date)) unrecorded++;
    }
  }

  let num = attended;
  let den = attended + absent;
  if (rule === "attended") {
    num += excused;
    den += excused;
  } else if (rule === "absent") {
    den += excused;
  }

  return {
    attended,
    absent,
    excused,
    cancelled,
    unrecorded,
    held: den,
    scheduled: occ.length,
    percent: den === 0 ? null : (num / den) * 100,
  };
}

export function attendedCount(c: Counts, rule: ExcusedRule) {
  return rule === "attended" ? c.attended + c.excused : c.attended;
}

export type Forecast = {
  /** how many further sessions may be missed while staying at target */
  canMiss: number;
  /** how many consecutive sessions must be attended to reach target */
  mustAttend: number;
  atTarget: boolean;
};

export function forecast(c: Counts, rule: ExcusedRule, target: number): Forecast {
  const t = target / 100;
  const a = attendedCount(c, rule);
  const held = c.held;
  if (t <= 0) return { canMiss: Number.POSITIVE_INFINITY, mustAttend: 0, atTarget: true };
  if (held === 0) return { canMiss: 0, mustAttend: 0, atTarget: true };
  const current = a / held;
  if (current >= t) {
    const canMiss = Math.max(0, Math.floor(a / t - held));
    return { canMiss, mustAttend: 0, atTarget: true };
  }
  const mustAttend =
    t >= 1
      ? Number.POSITIVE_INFINITY
      : Math.max(0, Math.ceil((t * held - a) / (1 - t)));
  return { canMiss: 0, mustAttend, atTarget: false };
}

export type RiskLevel = "at risk" | "near target" | "safe";

export function riskLevel(
  percent: number | null,
  target: number,
  margin: number,
): RiskLevel {
  if (percent === null) return "near target";
  if (percent < target) return "at risk";
  if (percent < target + margin) return "near target";
  return "safe";
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

export const formatPercent = (p: number | null) =>
  p === null ? "—" : `${round1(p).toFixed(1)}%`;

export function pointsFromTarget(percent: number | null, target: number) {
  return percent === null ? null : round1(percent - target);
}

export function semesterTarget(sem: Semester | null) {
  return sem?.defaultTarget ?? 75;
}
