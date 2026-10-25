const FLAG = "attend-visited";

/** True when this device already holds Attend. data or has entered before. */
export async function hasReturningVisitor(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(FLAG) === "1") return true;
  } catch {
    /* storage blocked */
  }
  try {
    const { loadStore } = await import("./storage");
    const store = await loadStore();
    return (
      store.semesters.length > 0 ||
      store.subjects.length > 0 ||
      Object.keys(store.records ?? {}).length > 0
    );
  } catch {
    return false;
  }
}

export function markVisited() {
  try {
    window.localStorage.setItem(FLAG, "1");
  } catch {
    /* storage blocked */
  }
}
