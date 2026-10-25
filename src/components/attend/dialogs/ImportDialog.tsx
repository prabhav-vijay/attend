import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mergeStores, previewImport, type ImportPreview } from "@/lib/attend/backup";
import { storeFromCsv } from "@/lib/attend/csv-import";
import { useStore } from "@/lib/attend/store";

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { store, replace } = useStore();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      setPreview({
        ok: false,
        error: "That file could not be read. Please choose a valid JSON or CSV file.",
        semesters: 0,
        subjects: 0,
        timetable: 0,
        sessions: 0,
        records: 0,
        holidays: 0,
        events: 0,
        duplicateSemesters: [],
        unknownSubjects: 0,
        invalidRows: 0,
      });
      return;
    }
    const isJson = file.name.toLowerCase().endsWith(".json");
    const isCsv = file.name.toLowerCase().endsWith(".csv") || (!isJson && !text.trimStart().startsWith("{"));
    if (!isCsv) {
      setPreview({ ...previewImport(text, store), importFormat: "json" });
      return;
    }
    const result = storeFromCsv(text, store);
    if (!result.ok || !result.data) {
      setPreview({
        ok: false,
        error: result.error ?? "That CSV could not be read.",
        semesters: 0,
        subjects: 0,
        timetable: 0,
        sessions: 0,
        records: 0,
        holidays: 0,
        events: 0,
        duplicateSemesters: [],
        unknownSubjects: 0,
        invalidRows: result.invalidRows,
        importFormat: "csv",
      });
      return;
    }
    setPreview({
      ok: true,
      data: result.data,
      semesters: result.data.semesters.length,
      subjects: result.data.subjects.length,
      timetable: 0,
      sessions: result.data.oneOffs.length,
      records: Object.keys(result.data.records).length,
      holidays: 0,
      events: 0,
      duplicateSemesters: result.data.semesters
        .filter((semester) => store.semesters.some((current) => current.id === semester.id))
        .map((semester) => semester.name),
      unknownSubjects: 0,
      invalidRows: result.invalidRows,
      importFormat: "csv",
    });
  };

  const apply = (mode: "merge" | "replace") => {
    if (!preview?.data) return;
    replace(mode === "merge" ? mergeStores(store, preview.data) : preview.data);
    toast.success(
      mode === "merge" ? "Backup merged into your data." : "Data replaced from backup.",
    );
    setPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setPreview(null);
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import backup</DialogTitle>
          <DialogDescription>
            Nothing is written until you choose merge or replace.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.currentTarget.value = "";
            if (f) void readFile(f);
          }}
        />

        {!preview && (
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Choose a JSON or CSV file
          </Button>
        )}

        {preview && !preview.ok && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <p>{preview.error}</p>
            {preview.invalidRows > 0 && (
              <p className="mt-1">{preview.invalidRows} invalid rows skipped.</p>
            )}
          </div>
        )}

        {preview?.ok && (
          <ul className="space-y-1 rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
            <li>{preview.semesters} semesters</li>
            <li>{preview.subjects} subjects</li>
            <li>{preview.timetable} timetable classes</li>
            <li>{preview.sessions} one-off sessions</li>
            {preview.importFormat === "csv" && (
              <li>CSV rows import as dated sessions; repeating timetable entries are not included.</li>
            )}
            <li>{preview.records} recorded statuses</li>
            <li>{preview.holidays} holidays</li>
            <li>{preview.events} events</li>
            {preview.duplicateSemesters.length > 0 && (
              <li className="text-exam">
                duplicates: {preview.duplicateSemesters.join(", ")}
              </li>
            )}
            {preview.unknownSubjects > 0 && (
              <li className="text-exam">
                {preview.unknownSubjects} rows dropped — unknown subject
              </li>
            )}
            {preview.invalidRows > 0 && (
              <li className="text-destructive">
                {preview.invalidRows} invalid rows dropped
              </li>
            )}
          </ul>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {preview?.ok && (
            <>
              <Button variant="secondary" onClick={() => apply("merge")}>
                Merge
              </Button>
              <Button variant="destructive" onClick={() => apply("replace")}>
                Replace everything
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
