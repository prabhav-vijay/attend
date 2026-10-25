import { useMemo } from "react";

import { activeSemester, subjectsOf } from "@/lib/attend/model";
import { useStore } from "@/lib/attend/store";
import { useUi, type StatusFilter } from "@/lib/attend/ui";
import type { Occurrence, Store } from "@/lib/attend/types";

export function useActive() {
  const { store, update, replace, hydrated } = useStore();
  const semester = useMemo(() => activeSemester(store), [store]);
  const subjects = useMemo(
    () => subjectsOf(store, semester?.id).filter((s) => !s.archived),
    [store, semester],
  );
  return { store, update, replace, hydrated, semester, subjects };
}

export function filterOccurrences(
  occ: Occurrence[],
  subjectIds: string[],
  statuses: StatusFilter[],
) {
  const statusSet = statuses.filter((s) => s !== "holiday" && s !== "important" && s !== "note");
  return occ.filter((o) => {
    if (subjectIds.length > 0 && !subjectIds.includes(o.subjectId)) return false;
    if (statusSet.length > 0 && !statusSet.includes(o.status)) return false;
    if (statuses.includes("note") && !o.note) return false;
    return true;
  });
}

export function useFilteredOccurrences(occ: Occurrence[]) {
  const { subjectIds, statuses } = useUi();
  return useMemo(
    () => filterOccurrences(occ, subjectIds, statuses),
    [occ, subjectIds, statuses],
  );
}

export const subjectMap = (store: Store) =>
  new Map(store.subjects.map((s) => [s.id, s] as const));
