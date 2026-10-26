import { uid } from "./dates";
import { SUBJECT_COLORS, emptyStore, type Store } from "./types";

const DB = "attend-db";
const STORE = "state";
const KEY = "store-v2";
const LEGACY_KEY = "attendance-store-v1";
const SNAPSHOT_KEY = "attend-pre-upgrade-snapshot-v3";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key = KEY): Promise<T | null> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(value: unknown, key = KEY) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Turns the pre-subject local data into the semester/subject model. */
export function migrateLegacy(raw: string): Store | null {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const store: Store = { ...emptyStore, semesters: [], subjects: [] };

  for (const s of parsed.semesters ?? []) {
    store.semesters.push({
      id: s.id,
      name: s.name,
      start: s.start,
      end: s.end,
      defaultTarget: s.target ?? 75,
      firstDayOfWeek: 1,
      workingDays: [1, 2, 3, 4, 5],
      excusedRule: "attended",
      riskMargin: 5,
    });

    (s.sessions ?? []).forEach((sess: any, i: number) => {
      const code = String(sess.name ?? "Subject")
        .split(/\s+/)
        .map((w: string) => w[0])
        .join("")
        .slice(0, 4)
        .toUpperCase();
      const type = sess.type === "class test" ? "other" : (sess.type ?? "lecture");
      store.subjects.push({
        id: sess.id,
        semesterId: s.id,
        name: sess.name,
        code: code || `S${i + 1}`,
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] as string,
        types: [type],
      });

      const marks = (s.marks ?? {})[sess.id] ?? {};
      for (const [date, status] of Object.entries(marks)) {
        const id = uid();
        store.oneOffs.push({
          id,
          semesterId: s.id,
          subjectId: sess.id,
          type,
          date,
        });
        store.records[`off:${id}`] = { status: status as any };
      }
    });

    for (const d of s.holidays ?? []) {
      store.holidays.push({
        id: uid(),
        title: "Holiday",
        start: d,
        end: d,
        type: "one day",
        recurrence: "once",
      });
    }
    for (const d of s.exams ?? []) {
      store.events.push({
        id: uid(),
        title: "Exam",
        type: "exam",
        date: d,
        recurrence: "once",
        important: true,
      });
    }
  }

  for (const h of parsed.holidays ?? []) {
    store.holidays.push({
      id: h.id ?? uid(),
      title: h.name ?? "Holiday",
      start: h.date,
      end: h.date,
      type: "one day",
      recurrence: h.recurrence ?? "once",
    });
  }
  for (const e of parsed.events ?? []) {
    store.events.push({
      id: e.id ?? uid(),
      title: e.name ?? "Event",
      type: "other",
      date: e.date,
      recurrence: e.recurrence ?? "once",
      important: !!e.important,
    });
  }
  for (const d of parsed.examDays ?? []) {
    store.events.push({
      id: uid(),
      title: "Exam",
      type: "exam",
      date: d,
      recurrence: "once",
      important: true,
    });
  }

  store.activeSemesterId = parsed.activeId ?? store.semesters[0]?.id ?? null;
  return store;
}

export async function loadStore(): Promise<Store> {
  let saved: unknown = null;
  try {
    saved = await idbGet<unknown>();
  } catch {
    saved = null;
  }
  if (saved === null) {
    try {
      const fallback = localStorage.getItem(KEY);
      if (fallback) saved = JSON.parse(fallback) as unknown;
    } catch {
      saved = null;
    }
  }

  if (!isStore(saved)) {
    try {
      const fallback = localStorage.getItem(KEY);
      const parsedFallback = fallback ? (JSON.parse(fallback) as unknown) : null;
      if (isStore(parsedFallback)) saved = parsedFallback;
    } catch {
      /* keep checking the IndexedDB snapshot and legacy backup */
    }
  }

  if (isStore(saved)) {
    if (saved.version === 3) return { ...emptyStore, ...saved };
    try {
      await idbSet(saved, SNAPSHOT_KEY);
    } catch {
      try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(saved));
      } catch {
        /* The original IndexedDB value remains untouched until the upgrade save. */
      }
    }
    const upgraded: Store = { ...emptyStore, ...saved, version: 3 };
    await saveStore(upgraded);
    return upgraded;
  }

  // Restore the last known readable copy if a saved payload became unreadable.
  try {
    let snapshot: unknown = await idbGet<unknown>(SNAPSHOT_KEY);
    if (!isStore(snapshot)) {
      const snapshotRaw = localStorage.getItem(SNAPSHOT_KEY);
      snapshot = snapshotRaw ? (JSON.parse(snapshotRaw) as unknown) : null;
    }
    if (isStore(snapshot)) {
      const restored: Store = { ...emptyStore, ...snapshot, version: 3 };
      await saveStore(restored);
      return restored;
    }
  } catch {
    /* continue to the older migration path */
  }
  try {
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const migrated = migrateLegacy(legacyRaw);
      if (migrated) {
        localStorage.setItem(`${LEGACY_KEY}-backup`, legacyRaw);
        await saveStore(migrated);
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }
  return emptyStore;
}

function isStore(value: unknown): value is Store {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate["version"] === 2 || candidate["version"] === 3) &&
    Array.isArray(candidate["semesters"]) &&
    Array.isArray(candidate["subjects"]) &&
    Array.isArray(candidate["timetable"]) &&
    Array.isArray(candidate["oneOffs"]) &&
    !!candidate["records"] &&
    typeof candidate["records"] === "object" &&
    Array.isArray(candidate["holidays"]) &&
    Array.isArray(candidate["events"]) &&
    !!candidate["dateNotes"] &&
    typeof candidate["dateNotes"] === "object"
  );
}

export async function saveStore(store: Store) {
  try {
    await idbSet(store);
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch {
      /* storage full or unavailable */
    }
  }
}
