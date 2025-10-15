/*
  Bun CLI to generate California fiduciary accounting schedules from CSV inputs.

  Inputs:
    - ledger CSV matching templates/ledger_schema.csv
    - code_map CSV matching templates/code_map.csv
    - optional: assets_on_hand CSV (templates/schedule_E_assets_on_hand.csv)
    - optional: market_values CSV (templates/market_values_1063.csv)

  Outputs (to --out-dir, default ./out):
    - schedule_A_receipts.csv
    - schedule_C_disbursements.csv
    - summary_1061.csv (partial if E or B/D not provided)

  Notes:
    - Transfers (code XFER) excluded from A/C and listed in changes_in_form.csv
    - Gains/Losses (B/D) not computed unless separate trades inputs are added later
*/

type Row = Record<string, string>;

function parseCSV(text: string): Row[] {
  const rows: Row[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length === 0) return rows;
  const header = splitCSVLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = splitCSVLine(line);
    const row: Row = {};
    header.forEach((h, idx) => (row[h] = cols[idx] ?? ""));
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = "";
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

function toCSV(rows: Row[], header: string[]): string {
  const esc = (s: string) => {
    if (s == null) s = "";
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  return [header.join(","), ...rows.map(r => header.map(h => esc(r[h] ?? "")).join(","))].join("\n");
}

function num(x: string | number | undefined): number {
  if (typeof x === "number") return x;
  if (!x) return 0;
  const v = Number(String(x).replace(/[,\s]/g, ""));
  return isNaN(v) ? 0 : v;
}

function fmt(n: number): string {
  return n.toFixed(2);
}

async function readFile(path: string): Promise<string> {
  const data = await Bun.file(path).text();
  return data;
}

async function writeFile(path: string, content: string): Promise<void> {
  await Bun.write(path, content);
}

type CodeMap = {
  schedule: string; // A | C | FORM | B/D
  allocation: string; // income | principal | exclude | realize
};

async function main() {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.split("=");
      args.set(k, v ?? "true");
    }
  }

  const ledgerPath = args.get("--ledger") || "examples/ledger_sample.csv";
  const codeMapPath = args.get("--codemap") || "templates/code_map.csv";
  const outDir = args.get("--out-dir") || "out";
  const assetsPath = args.get("--assets-on-hand");

  await Bun.$`mkdir -p ${outDir}`;

  const ledger = parseCSV(await readFile(ledgerPath));
  const codeMapRows = parseCSV(await readFile(codeMapPath));
  const codeMap = new Map<string, CodeMap>();
  for (const r of codeMapRows) {
    codeMap.set((r["code"] || "").trim().toUpperCase(), {
      schedule: (r["schedule"] || "").trim().toUpperCase(),
      allocation: (r["allocation"] || "").trim().toLowerCase(),
    });
  }

  const receipts: Row[] = [];
  const disb: Row[] = [];
  const formChanges: Row[] = [];

  for (const r of ledger) {
    const code = (r["code"] || "").trim().toUpperCase();
    const map = codeMap.get(code);
    if (!map) continue;
    const amt = num(r["amount"]);
    if (map.schedule === "A") {
      const incomeAmt = map.allocation === "income" ? amt : 0;
      const principalAmt = map.allocation === "principal" ? amt : 0;
      receipts.push({
        date: r["date"] ?? "",
        payor: r["account"] ?? "",
        description: r["description"] ?? "",
        account: r["account"] ?? "",
        amount: fmt(amt),
        principal_amount: fmt(principalAmt),
        income_amount: fmt(incomeAmt),
        category: code,
        notes: r["memo"] ?? "",
      });
    } else if (map.schedule === "C") {
      const incomeAmt = map.allocation === "income" ? amt : 0;
      const principalAmt = map.allocation === "principal" ? amt : 0;
      disb.push({
        date: r["date"] ?? "",
        payee: r["account"] ?? "",
        description: r["description"] ?? "",
        account: r["account"] ?? "",
        amount: fmt(amt),
        principal_amount: fmt(principalAmt),
        income_amount: fmt(incomeAmt),
        category: code,
        court_order_ref: "",
        notes: r["memo"] ?? "",
      });
    } else if (map.schedule === "FORM") {
      formChanges.push({
        date: r["date"] ?? "",
        from_account: r["account"] ?? "",
        description: r["description"] ?? "",
        amount: fmt(amt),
        category: code,
        notes: r["memo"] ?? "",
      });
    }
  }

  const aHeader = [
    "date",
    "payor",
    "description",
    "account",
    "amount",
    "principal_amount",
    "income_amount",
    "category",
    "notes",
  ];
  const cHeader = [
    "date",
    "payee",
    "description",
    "account",
    "amount",
    "principal_amount",
    "income_amount",
    "category",
    "court_order_ref",
    "notes",
  ];
  const formHeader = ["date", "from_account", "description", "amount", "category", "notes"];

  await writeFile(`${outDir}/schedule_A_receipts.csv`, toCSV(receipts, aHeader));
  await writeFile(`${outDir}/schedule_C_disbursements.csv`, toCSV(disb, cHeader));
  if (formChanges.length) await writeFile(`${outDir}/changes_in_form.csv`, toCSV(formChanges, formHeader));

  // Summary 1061 (partial)
  const totalA = receipts.reduce((s, r) => s + num(r.amount), 0);
  const totalC = disb.reduce((s, r) => s + num(r.amount), 0);
  let endCash = "";
  if (assetsPath) {
    try {
      const assets = parseCSV(await readFile(assetsPath));
      const cash = assets.filter(a => (a["type"] || "").toLowerCase() === "cash");
      const sum = cash.reduce((s, r) => s + num(r["carry_value"]), 0);
      endCash = fmt(sum);
    } catch {}
  }
  const summary: Row[] = [
    { side: "CHARGES", label: "Receipts during period", schedule_ref: "Schedule A", amount: fmt(totalA) },
    { side: "CREDITS", label: "Disbursements during period", schedule_ref: "Schedule C", amount: fmt(totalC) },
  ];
  if (endCash) summary.push({ side: "CREDITS", label: "Property on hand at end (cash)", schedule_ref: "Schedule E", amount: endCash });
  const sHeader = ["side", "label", "schedule_ref", "amount"];
  await writeFile(`${outDir}/summary_1061.csv`, toCSV(summary, sHeader));

  console.log(`Generated: ${outDir}/schedule_A_receipts.csv, schedule_C_disbursements.csv, summary_1061.csv`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
