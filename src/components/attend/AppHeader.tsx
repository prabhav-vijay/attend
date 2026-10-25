import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Archive, Menu, PanelRight, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SemesterDialog } from "@/components/attend/dialogs/SemesterDialog";
import { useActive } from "@/components/attend/hooks";
import { shortDate, todayISO } from "@/lib/attend/dates";
import { useUi } from "@/lib/attend/ui";
import type { Semester } from "@/lib/attend/types";

export function AppHeader() {
  const { store, update, semester, subjects } = useActive();
  const ui = useUi();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [editing, setEditing] = useState<Semester | null | undefined>(undefined);

  const results = useMemo(
    () => ({
      subjects,
      events: store.events,
      holidays: store.holidays,
      notes: Object.entries(store.dateNotes),
    }),
    [store, subjects],
  );

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-3">
      <Button
        size="icon"
        variant="ghost"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={() => ui.setNavOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <Link to="/" aria-label="Attend. calendar" className="font-display text-2xl leading-none">
        attend<span className="text-primary">.</span>
        <span className="align-super text-[10.5px] tracking-normal">™</span>
      </Link>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="ml-2 hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/40 sm:flex"
      >
        <Search className="h-3.5 w-3.5" />
        Search subjects, events, holidays and notes
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => navigate({ to: "/today" })}>
          Today
        </Button>

        <Select
          value={semester?.id ?? ""}
          onValueChange={(v) => update((s) => ({ ...s, activeSemesterId: v }))}
        >
          <SelectTrigger className="hidden w-[180px] md:flex" aria-label="Active semester">
            <SelectValue placeholder="No semester" />
          </SelectTrigger>
          <SelectContent>
            {store.semesters.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.archived ? " (archived)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="icon"
          variant="ghost"
          aria-label="New semester"
          onClick={() => setEditing(null)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        {semester && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="hidden md:inline-flex"
              onClick={() => setEditing(semester)}
            >
              Edit
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={semester.archived ? "Unarchive semester" : "Archive semester"}
              onClick={() =>
                update(
                  (s) => ({
                    ...s,
                    semesters: s.semesters.map((x) =>
                      x.id === semester.id ? { ...x, archived: !x.archived } : x,
                    ),
                  }),
                  semester.archived ? "Semester restored" : "Semester archived",
                )
              }
            >
              <Archive className="h-4 w-4" />
            </Button>
          </>
        )}

        <Button
          size="icon"
          variant="ghost"
          aria-label={ui.panelOpen ? "Hide insights panel" : "Show insights panel"}
          aria-pressed={ui.panelOpen}
          onClick={() => ui.setPanelOpen(!ui.panelOpen)}
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search subjects, events, holidays, notes, dates…" />
        <CommandList>
          <CommandEmpty>Nothing matched.</CommandEmpty>
          <CommandGroup heading="Subjects">
            {results.subjects.map((s) => (
              <CommandItem
                key={s.id}
                value={`${s.name} ${s.code}`}
                onSelect={() => {
                  setSearchOpen(false);
                  navigate({ to: "/subjects/$id", params: { id: s.id } });
                }}
              >
                {s.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Events">
            {results.events.map((e) => (
              <CommandItem
                key={e.id}
                value={`${e.title} ${e.type} ${e.date}`}
                onSelect={() => {
                  setSearchOpen(false);
                  navigate({ to: "/events" });
                }}
              >
                {e.title}
                <span className="ml-auto font-mono text-[12.5px] text-muted-foreground">
                  {shortDate(e.date)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Holidays">
            {results.holidays.map((h) => (
              <CommandItem
                key={h.id}
                value={`${h.title} ${h.type} ${h.start}`}
                onSelect={() => {
                  setSearchOpen(false);
                  navigate({ to: "/list" });
                }}
              >
                {h.title}
                <span className="ml-auto font-mono text-[12.5px] text-muted-foreground">
                  {shortDate(h.start)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Notes">
            {results.notes.map(([date, note]) => (
              <CommandItem
                key={date}
                value={`${date} ${note}`}
                onSelect={() => {
                  setSearchOpen(false);
                  navigate({ to: "/list" });
                }}
              >
                <span className="truncate">{note}</span>
                <span className="ml-auto font-mono text-[12.5px] text-muted-foreground">
                  {shortDate(date)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {editing !== undefined && (
        <SemesterDialog
          key={editing?.id ?? "new"}
          open
          onOpenChange={(v) => !v && setEditing(undefined)}
          initial={editing}
          onSave={(sem) =>
            update((s) => ({
              ...s,
              activeSemesterId: sem.id,
              semesters: s.semesters.some((x) => x.id === sem.id)
                ? s.semesters.map((x) => (x.id === sem.id ? sem : x))
                : [...s.semesters, sem],
            }))
          }
        />
      )}
    </header>
  );
}

export const TODAY = todayISO;
