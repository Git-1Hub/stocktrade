# Usage

## Option A — Excel (Power Query)
Follow docs/excel-power-query.md. Paste the provided M scripts into Power Query and point `FolderPath` to your repo directory. Load Schedule A, Schedule C, and Summary 1061 to sheets. Refresh to update.

## Option B — CLI (Node/Bun)
Prerequisite: Node 18+ (or Bun 1.0+). This repo is Node-first; Bun also works.

Generate schedules from a coded ledger and the code map:
```
npm run generate -- --ledger=examples/ledger_sample.csv --codemap=templates/code_map.csv --out-dir=out
```
Outputs:
- out/schedule_A_receipts.csv
- out/schedule_C_disbursements.csv
- out/summary_1061.csv (partial; add E and B/D for full balancing)

Optional: include assets-on-hand to populate the Summary end-cash line:
```
npm run generate -- --ledger=examples/ledger_sample.csv --codemap=templates/code_map.csv --assets-on-hand=templates/schedule_E_assets_on_hand.csv --out-dir=out
```

## Tests
Run:
```
npm test
```
