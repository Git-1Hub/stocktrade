import { describe, it, expect } from "bun:test";
import { $ } from "bun";
import { readFileSync } from "fs";

function parseCSV(text: string): string[][] {
  return text.trim().split(/\r?\n/).map((l) => l.split(","));
}

describe("generate-schedules CLI", () => {
  it("produces A, C, and Summary from sample ledger", async () => {
    await $`rm -rf out && mkdir -p out`;
    await $`bun run src/generate-schedules.ts --ledger=examples/ledger_sample.csv --codemap=templates/code_map.csv --out-dir=out`;
    const a = readFileSync("out/schedule_A_receipts.csv", "utf8");
    const c = readFileSync("out/schedule_C_disbursements.csv", "utf8");
    const s = readFileSync("out/summary_1061.csv", "utf8");
    const aRows = parseCSV(a);
    const cRows = parseCSV(c);
    const sRows = parseCSV(s);
    // Headers present
    expect(aRows[0].slice(0,4)).toEqual(["date","payor","description","account"]);
    expect(cRows[0].slice(0,4)).toEqual(["date","payee","description","account"]);
    // Totals
    // A should have 1 data row with 2500.00 amount
    expect(aRows.length).toBe(2);
    expect(aRows[1][4]).toBe("2500.00");
    // C should have 3 data rows with amounts -200, -1200, -800, -500 are in sample with XFER excluded
    // Our generator uses signed amounts; summary should sum magnitudes as written
    expect(cRows.length).toBe(4);
    // Summary should have two rows
    expect(sRows.length).toBe(3); // header + 2 rows
  });
});
