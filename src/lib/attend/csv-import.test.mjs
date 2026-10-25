import { describe, expect, test } from "vitest";

import { parseCsv, storeFromCsv } from "./csv-import";
import { emptyStore } from "./types";

describe("CSV attendance import", () => {
  test("reads quoted commas and doubles quotes", () => {
    expect(parseCsv('name,note\n"Math, II","He said ""yes"""')).toEqual([
      ["name", "note"],
      ["Math, II", 'He said "yes"'],
    ]);
  });

  test("imports valid dated sessions and statuses while counting invalid rows", () => {
    const csv = [
      "semester,date,subject,code,type,start,end,status,note",
      "Spring,2026-01-05,Mathematics,MTH,lecture,09:00,10:00,present,First class",
      "Spring,not-a-date,Mathematics,MTH,lecture,,,absent,Invalid date",
    ].join("\n");

    const result = storeFromCsv(csv, emptyStore);
    expect(result.ok).toBe(true);
    expect(result.data?.oneOffs).toHaveLength(1);
    expect(Object.values(result.data?.records ?? {})[0]?.status).toBe("present");
    expect(result.invalidRows).toBe(1);
  });

  test("rejects unknown statuses rather than creating a partial session", () => {
    const result = storeFromCsv(
      "semester,date,subject,status\nSpring,2026-01-05,Mathematics,unknown",
      emptyStore,
    );
    expect(result.ok).toBe(false);
    expect(result.invalidRows).toBe(1);
  });

  test("rejects impossible calendar dates", () => {
    const result = storeFromCsv(
      "semester,date,subject\nSpring,2026-02-30,Mathematics",
      emptyStore,
    );
    expect(result.ok).toBe(false);
    expect(result.invalidRows).toBe(1);
  });
});