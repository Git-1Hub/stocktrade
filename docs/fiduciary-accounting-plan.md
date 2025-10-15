# Fiduciary Accounting Software Plan (CA‑led; trusts, estates, conservatorships)

This plan implements a local‑first workflow on Mac to produce California‑ready fiduciary accountings for trusts, decedents’ estates, and conservatorships. It also includes a streamlined Excel‑centric process you can use immediately with CSV bank statements.

Scope confirmed by request:
- Entities: trusts, estates, conservatorships
- Reports: court‑ready (Probate Code §§ 1060–1064) and beneficiary statements (Probate Code §§ 16062–16063)
- Imports: CSV only (banks/brokers)
- Valuations: date of death (DOD) and on change of trustee as needed
- Security: offline only (encrypted local storage)
- Integrations: exclude 1041/706/709 for now

## Option A — Local Mac app (recommended roadmap)

- Local‑first desktop (Tauri or Electron + React) with SQLite/SQLCipher (encrypted at rest). No cloud.
- Double‑entry journal with principal/income split; UFIPA allocation rules (e.g., rents→income (§16344), entity capital distributions→principal (§16340), business accounted separately (§16342), fiduciary power to adjust (§16327) with audit notes). Court review standard (§16326).
- Reports
  - Court format per §§1060–1064: balancing Summary of Account + schedules (A Receipts, C Disbursements, B/D Gains/Losses, E Assets on Hand; §1063 market values).
  - Beneficiary account per §16063 with required notices.
- Imports: CSV mappers and reconciliation; manual DOD valuations or CSV import from your external tool.

## Option B — Streamlined Excel pipeline (usable now)

Keep your current process but eliminate copy/paste and auto‑build schedules from coded transactions.

1) A standard ledger CSV schema
```
date,account,description,amount,code,memo,lot_id
2025-02-01,Checking,"Deposit Rents",1500.00,RENT,
2025-02-15,Checking,"Brokerage Dividend",220.14,DIV,
2025-03-03,Checking,"Property tax",-3400.00,EXP_PROP_TAX,
2025-03-10,Brokerage,"Sell AAPL 25@180",-4500.00,SELL,lot-2023-09-01
2025-03-10,Brokerage,"Proceeds AAPL",4500.00,SELL,lot-2023-09-01
```

2) A simple code map (CSV) → allocation + schedule
```
code,schedule,allocation
RENT,A,income
DIV,A,income
EXP_PROP_TAX,C,principal
CAP_EXPN,C,principal
LEGAL_FEES,C,principal
DIST,BENEFICIARY,C,principal
SELL,B/D,realize
```

3) Use Power Query or a small Bun script to emit schedules

With Power Query:
- Load statements and code map.
- Merge on `code` to enrich transactions.
- Split into outputs:
  - Schedule A (Receipts): all positive amounts not from trades, with income/principal split from `allocation`.
  - Schedule C (Disbursements): all negatives (non‑trade) with split.
  - Schedules B/D (Gains/Losses): join lots and compute realized P/L.
  - Schedule E (Assets on Hand): list cash and non‑cash at carry values; maintain a holdings tab.
- Summary of Account: build a pivot or SUMIFS section mirroring §1061 (charges vs credits must balance).

With Bun (fits your environment) — example CLI outline:
```bash
bun run schedules.ts \
  --ledger ledger.csv \
  --codes code_map.csv \
  --start 2025-01-01 --end 2025-12-31 \
  --out out/
```

`schedules.ts` responsibilities:
- Read ledger + code map.
- Derive principal/income per row (e.g., income=amount for RENT/DIV; principal=amount for capital distributions/expenses).
- Emit CSVs: schedule_A.csv, schedule_C.csv, schedule_B.csv, schedule_D.csv, schedule_E.csv, and summary.csv (balancing sheet per §1061).

Minimal TypeScript snippet (illustrative):
```ts
type Row = { date:string; amount:number; code:string; description?:string };
type Map = { [code:string]: { schedule:'A'|'C'|'B/D'|'E'; allocation:'income'|'principal'|'realize' } };

function split(amount:number, allocation:string){
  if(allocation==='income') return {principal:0, income:amount};
  if(allocation==='principal') return {principal:amount, income:0};
  return {principal:0, income:0}; // trades handled separately
}
```

4) DOD and change‑of‑trustee valuations
- Keep using your external DOD valuation tool; export a CSV with date, asset id, carry value, market value. Import into the workbook/tool to produce §1063 market value schedule and assets‑on‑hand.

5) Deliverables
- A reusable Excel template (Power Query + pivot Summary) and a Bun CLI to generate schedules and the §1061 balancing summary from your coded transactions.

## Security (offline)

- Excel and the Bun CLI run fully offline. Store files on encrypted volumes (FileVault) and use per‑file passwords for sensitive exports. For the app path, database uses SQLCipher and macOS Keychain for keys.

## Why choose which path?

- Excel pipeline now: minimal change, high ROI, no cloud; removes manual copy/paste, enforces balancing.
- App later: stronger audit trail (append‑only journal, allocation audit), better investment lots/corporate actions, one‑click court and beneficiary reports.

## References (California)

- Trustee duty and contents: Prob. Code §§ 16062–16063.
- Court account format/schedules/market values: Prob. Code §§ 1060–1064 (incl. §1061 Summary).
- UFIPA allocations and discretion: §§ 16321, 16340, 16342, 16344, 16326, 16327.
