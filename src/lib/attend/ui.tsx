import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Status } from "./types";

export type StatusFilter = Status | "holiday" | "important" | "note";

export const STATUS_FILTERS: StatusFilter[] = [
  "present",
  "absent",
  "excused",
  "cancelled",
  "unrecorded",
  "holiday",
  "important",
  "note",
];

type Ctx = {
  subjectIds: string[];
  toggleSubject: (id: string) => void;
  setSubjects: (ids: string[]) => void;
  statuses: StatusFilter[];
  toggleStatus: (s: StatusFilter) => void;
  resetFilters: () => void;
  filtersActive: boolean;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
  navOpen: boolean;
  setNavOpen: (v: boolean) => void;
};

// Same rationale as store.tsx: keep context identity stable across hot reloads.
type UiG = typeof globalThis & {
  __attendUiContext?: ReturnType<typeof createContext<Ctx | null>>;
};
const UiContext = ((globalThis as UiG).__attendUiContext ??=
  createContext<Ctx | null>(null));

export function UiProvider({ children }: { children: ReactNode }) {
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<StatusFilter[]>([]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  const value = useMemo<Ctx>(
    () => ({
      subjectIds,
      setSubjects: setSubjectIds,
      toggleSubject: (id) =>
        setSubjectIds((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        ),
      statuses,
      toggleStatus: (s) =>
        setStatuses((prev) =>
          prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
        ),
      resetFilters: () => {
        setSubjectIds([]);
        setStatuses([]);
      },
      filtersActive: subjectIds.length > 0 || statuses.length > 0,
      panelOpen,
      setPanelOpen,
      navOpen,
      setNavOpen,
    }),
    [subjectIds, statuses, panelOpen, navOpen],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside UiProvider");
  return ctx;
}
