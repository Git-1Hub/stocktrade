# Excel Power Query setup (wired to CSV templates)

This guide provides M scripts and steps to build an Excel workbook that outputs California court-ready schedules using the CSV templates in this repo.

What you get
- Schedule A (Receipts) and Schedule C (Disbursements) automatically from `ledger.csv` + `code_map.csv`
- Optional pass-through for Schedule E (Assets on Hand) and §1063 (market values)
- Summary of Account (§1061) totals from A and C (gains/losses can be added later)

Folder layout (recommended)
```
repo/
  templates/
  examples/
  excel/
    PowerQuery/
      Ledger.pq
      CodeMap.pq
      ScheduleA.pq
      ScheduleC.pq
      Summary1061.pq
```

## Step 1 — Place your CSVs
- Copy your working CSVs (or start from the samples):
  - `ledger.csv` → start from `templates/ledger_schema.csv` or `examples/ledger_sample.csv`
  - `code_map.csv` → `templates/code_map.csv`
  - optional: `schedule_E_assets_on_hand.csv`, `market_values_1063.csv`

## Step 2 — Create a new workbook and add parameters
1) Data → Get Data → Launch Power Query Editor
2) Manage Parameters → New Parameter:
   - `FolderPath` (Text) → set to your repo directory full path

## Step 3 — Add queries (paste M below)

Create blank queries named exactly as below and paste code.

Ledger.pq
```
let
  Source = Csv.Document(File.Contents(FolderPath & "/examples/ledger_sample.csv"),[Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
  Promote = Table.PromoteHeaders(Source, [PromoteAllScalars=true])
in
  Promote
```

CodeMap.pq
```
let
  Source = Csv.Document(File.Contents(FolderPath & "/templates/code_map.csv"),[Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
  Promote = Table.PromoteHeaders(Source, [PromoteAllScalars=true])
in
  Promote
```

ScheduleA.pq
```
let
  L = Ledger,
  M = CodeMap,
  Mapped = Table.NestedJoin(L, {"code"}, M, {"code"}, "map", JoinKind.LeftOuter),
  Expanded = Table.ExpandTableColumn(Mapped, "map", {"schedule","allocation"}, {"schedule","allocation"}),
  FilterA = Table.SelectRows(Expanded, each [schedule] = "A"),
  Amount = Table.TransformColumnTypes(FilterA, {{"amount", type number}}),
  PrincipalAmt = Table.AddColumn(Amount, "principal_amount", each if [allocation] = "principal" then [amount] else 0, type number),
  IncomeAmt = Table.AddColumn(PrincipalAmt, "income_amount", each if [allocation] = "income" then [amount] else 0, type number),
  Select = Table.SelectColumns(IncomeAmt, {"date","account","description","amount","principal_amount","income_amount","code","memo"}),
  Rename = Table.RenameColumns(Select, {{"account","payor"},{"code","category"},{"memo","notes"}})
in
  Rename
```

ScheduleC.pq
```
let
  L = Ledger,
  M = CodeMap,
  Mapped = Table.NestedJoin(L, {"code"}, M, {"code"}, "map", JoinKind.LeftOuter),
  Expanded = Table.ExpandTableColumn(Mapped, "map", {"schedule","allocation"}, {"schedule","allocation"}),
  FilterC = Table.SelectRows(Expanded, each [schedule] = "C"),
  Amount = Table.TransformColumnTypes(FilterC, {{"amount", type number}}),
  PrincipalAmt = Table.AddColumn(Amount, "principal_amount", each if [allocation] = "principal" then [amount] else 0, type number),
  IncomeAmt = Table.AddColumn(PrincipalAmt, "income_amount", each if [allocation] = "income" then [amount] else 0, type number),
  Select = Table.SelectColumns(IncomeAmt, {"date","account","description","amount","principal_amount","income_amount","code","memo"}),
  Rename = Table.RenameColumns(Select, {{"account","payee"},{"code","category"},{"memo","notes"}}),
  AddCourtRef = Table.AddColumn(Rename, "court_order_ref", each "", type text)
in
  AddCourtRef
```

Summary1061.pq
```
let
  A = ScheduleA,
  C = ScheduleC,
  TotalA = List.Sum(Table.Column(A, "amount")),
  TotalC = List.Sum(Table.Column(C, "amount")),
  ToTable = #table({"side","label","schedule_ref","amount"},
            {{"CHARGES","Receipts during period","Schedule A", Number.ToText(TotalA, "F2")},
             {"CREDITS","Disbursements during period","Schedule C", Number.ToText(TotalC, "F2")}})
in
  ToTable
```

## Step 4 — Load to Sheets
For each query (ScheduleA, ScheduleC, Summary1061): Close & Load → Table (new worksheet).

## Step 5 — Refresh
Place CSVs in the same paths, then Data → Refresh All.

Notes
- Transfers (`XFER`) are intentionally excluded from A/C and should be listed in a separate “changes in form” sheet.
- For Gains/Losses and full §1061 balancing, provide realized trades separately or extend the Ledger schema with proceeds and cost basis.
