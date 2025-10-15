import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function parseCSV(text){ return text.trim().split(/\r?\n/).map(l=>l.split(',')); }

test('CLI produces A, C and Summary from sample ledger', () => {
  execSync('rm -rf out && mkdir -p out', { stdio: 'inherit' });
  execSync('node src/generate-schedules.mjs --ledger=examples/ledger_sample.csv --codemap=templates/code_map.csv --out-dir=out', { stdio: 'inherit' });
  const a = readFileSync('out/schedule_A_receipts.csv', 'utf8');
  const c = readFileSync('out/schedule_C_disbursements.csv', 'utf8');
  const s = readFileSync('out/summary_1061.csv', 'utf8');
  const aRows = parseCSV(a);
  const cRows = parseCSV(c);
  const sRows = parseCSV(s);
  assert.deepEqual(aRows[0].slice(0,4), ["date","payor","description","account"]);
  assert.deepEqual(cRows[0].slice(0,4), ["date","payee","description","account"]);
  assert.equal(aRows.length, 2);
  assert.equal(aRows[1][4], "2500.00");
  assert.equal(cRows.length, 5);
  assert.equal(sRows.length, 3);
});
