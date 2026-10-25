export type SessionType =
  | "lecture"
  | "lab"
  | "tutorial"
  | "practical"
  | "seminar"
  | "workshop"
  | "other";

export const SESSION_TYPES: SessionType[] = [
  "lecture",
  "lab",
  "tutorial",
  "practical",
  "seminar",
  "workshop",
  "other",
];

/** A recorded or pending attendance state for one class session. */
export type Status = "present" | "absent" | "excused" | "cancelled" | "unrecorded";

export const MARKABLE: Exclude<Status, "unrecorded">[] = [
  "present",
  "absent",
  "excused",
  "cancelled",
];

/** How excused sessions enter the calculation. */
export type ExcusedRule = "attended" | "excluded" | "absent";

export type Recurrence = "once" | "weekly" | "monthly" | "yearly";

export const RECURRENCES: Recurrence[] = ["once", "weekly", "monthly", "yearly"];

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  once: "One time",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export type HolidayType =
  | "one day"
  | "multi day"
  | "semester break"
  | "department holiday"
  | "institution holiday"
  | "examination break"
  | "non-teaching period";

export const HOLIDAY_TYPES: HolidayType[] = [
  "one day",
  "multi day",
  "semester break",
  "department holiday",
  "institution holiday",
  "examination break",
  "non-teaching period",
];

export type EventType =
  | "exam"
  | "quiz"
  | "assignment deadline"
  | "project submission"
  | "presentation"
  | "practical examination"
  | "university event"
  | "attendance deadline"
  | "personal reminder"
  | "other";

export const EVENT_TYPES: EventType[] = [
  "exam",
  "quiz",
  "assignment deadline",
  "project submission",
  "presentation",
  "practical examination",
  "university event",
  "attendance deadline",
  "personal reminder",
  "other",
];

export type Semester = {
  id: string;
  name: string;
  start: string;
  end: string;
  timezone: string;
  defaultTarget: number;
  /** 0 = Sunday, 1 = Monday */
  firstDayOfWeek: 0 | 1;
  /** weekday numbers considered teaching days */
  workingDays: number[];
  excusedRule: ExcusedRule;
  /** percentage points above target still considered "near target" */
  riskMargin: number;
  archived?: boolean | undefined;
};

export type Subject = {
  id: string;
  semesterId: string;
  name: string;
  code: string;
  teacher?: string | undefined;
  /** overrides the semester default when set */
  target?: number | undefined;
  color: string;
  credits?: number | undefined;
  room?: string | undefined;
  types: SessionType[];
  archived?: boolean | undefined;
};

export type TimetableEntry = {
  id: string;
  semesterId: string;
  subjectId: string;
  type: SessionType;
  /** 0 = Sunday */
  weekday: number;
  start: string;
  end: string;
  location?: string | undefined;
  from: string;
  to: string;
  /** every week, or every other week */
  interval: 1 | 2;
};

/** A session created directly on one date, outside the timetable. */
export type OneOffSession = {
  id: string;
  semesterId: string;
  subjectId: string;
  type: SessionType;
  date: string;
  start?: string | undefined;
  end?: string | undefined;
  location?: string | undefined;
};

export type Record_ = {
  status: Exclude<Status, "unrecorded">;
  note?: string | undefined;
};

export type Holiday = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: HolidayType;
  note?: string | undefined;
  recurrence: Recurrence;
};

export type AppEvent = {
  id: string;
  title: string;
  type: EventType;
  date: string;
  start?: string | undefined;
  end?: string | undefined;
  subjectId?: string | undefined;
  important?: boolean | undefined;
  note?: string | undefined;
  recurrence: Recurrence;
};

export type Store = {
  version: 2 | 3;
  semesters: Semester[];
  subjects: Subject[];
  timetable: TimetableEntry[];
  oneOffs: OneOffSession[];
  /** occurrence key -> recorded status + note */
  records: Record<string, Record_>;
  holidays: Holiday[];
  events: AppEvent[];
  /** ISO date -> note */
  dateNotes: Record<string, string>;
  activeSemesterId: string | null;
};

/** One class session on one date, resolved from the timetable or a one-off. */
export type Occurrence = {
  key: string;
  semesterId: string;
  subjectId: string;
  type: SessionType;
  date: string;
  start?: string | undefined;
  end?: string | undefined;
  location?: string | undefined;
  status: Status;
  note?: string | undefined;
};

export const SUBJECT_COLORS = [
  "#7f9db5",
  "#8fae9b",
  "#b09a86",
  "#a292b3",
  "#9fb08d",
  "#b0918f",
  "#8ba9ae",
  "#a9a37f",
];

export const emptyStore: Store = {
  version: 3,
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
