import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APP_VERSION, CHANGELOG } from "@/lib/attend/changelog";
import { useStore } from "@/lib/attend/store";

const SEEN_KEY = "attend-seen-version";

export function UpdateNotice() {
  const { hydrated, store } = useStore();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hydrated || checked) return;
    let seen = "";
    try {
      seen = localStorage.getItem(SEEN_KEY) ?? "";
    } catch {
      /* Keep the notice available for the current page view. */
    }
    const hasUserData =
      store.semesters.length > 0 ||
      store.subjects.length > 0 ||
      Object.keys(store.records).length > 0;
    if (seen !== APP_VERSION) {
      if (hasUserData) setOpen(true);
      else {
        try {
          localStorage.setItem(SEEN_KEY, APP_VERSION);
        } catch {
          /* New visitors remain without a release notice for this visit. */
        }
      }
    }
    setChecked(true);
  }, [checked, hydrated, store.records, store.semesters.length, store.subjects.length]);

  const rememberAndClose = (next: boolean) => {
    if (!next) {
      try {
        localStorage.setItem(SEEN_KEY, APP_VERSION);
      } catch {
        /* Closing still works when browser storage is unavailable. */
      }
    }
    setOpen(next);
  };

  // New visitors do not get a release notice before they have any app data.
  const hasUserData =
    store.semesters.length > 0 ||
    store.subjects.length > 0 ||
    Object.keys(store.records).length > 0;
  if (!checked || !hasUserData) return null;

  return (
    <Dialog open={open} onOpenChange={rememberAndClose}>
      <DialogContent className="max-w-md" overlayClassName="backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>New Update!</DialogTitle>
          <DialogDescription>Attend.™ has been updated.</DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
          {CHANGELOG.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </DialogContent>
    </Dialog>
  );
}