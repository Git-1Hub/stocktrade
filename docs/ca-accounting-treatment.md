# California Fiduciary Accounting — Treatment Guide (Loans, Transfers, Rentals)

This guide summarizes common treatments to align with California Probate Code requirements for fiduciary accountings (trusts, estates, conservatorships).

- Court accounts: Probate Code §§ 1060–1064 (Summary of Account and detailed schedules)
- Trustee duty and content: Probate Code §§ 16062–16063
- UFIPA allocations: Probate Code Chapter 3 (e.g., §§ 16321, 16340, 16342, 16344, 16326, 16327)

## 1) Loans (e.g., mortgages)

- Record loan proceeds as principal receipts (Schedule A if within period) and the resulting liability in the beneficiary-facing account (§16063 assets/liabilities). In the court Summary (§1061) you show cash/property activity via schedules; liabilities are not a line in the Summary but may be disclosed in the petition/report.
- Payments:
  - Interest portion → disbursement allocated to income (Schedule C; ordinary expense of income production).
  - Principal portion → disbursement allocated to principal (Schedule C; reduces encumbrance).
- Asset on hand (Schedule E): show the encumbered asset at carry value; liabilities are disclosed separately in the §16063 account.

## 2) Transfers between trust/estate accounts

- Pure transfers between fiduciary accounts are “changes in the form of assets,” not receipts or disbursements. Exclude from Schedules A/C and list in the required “purchases or other changes in the form of assets” detail per §1062. This avoids double-counting.

## 3) Rental income and property management

Two approaches:

- Default (not separately accounted under §16342):
  - Rents → allocate to income (§16344); list in Schedule A.
  - Ordinary expenses (management fees, routine repairs, insurance, property taxes) → allocate to income; list in Schedule C.
  - Capital improvements → allocate to principal; list in Schedule C (principal column).
  - Refundable security deposits → add to principal and hold; not distributable income until obligations satisfied (§16344).

- Business accounting election (§16342):
  - You may account separately for a rental activity, retaining working capital and determining how much of net receipts is income vs principal in the general records. Document the election and reasoning; maintain a sub-ledger for the activity. Judicial review of discretionary decisions applies (§16326). Use the “power to adjust” if needed (§16327) and record rationale.

## 4) Suggested coding (CSV → schedules)

- RENT income → Schedule A; allocation=income
- MGMT_FEE, REPAIRS, INSURANCE, PROP_TAX → Schedule C; allocation=income
- CAP_IMPROVEMENT → Schedule C; allocation=principal
- MORT_INT → Schedule C; allocation=income
- MORT_PRIN → Schedule C; allocation=principal
- XFER (between trust accounts) → exclude from A/C; include in “changes in form” list
- SEC_DEP_RCVD → principal increase (held); disclose separately
- SEC_DEP_RETURN → disbursement from principal when obligation ends

## 5) Documentation

- Keep backup statements, management invoices, loan amortization schedules, and valuation sources.
- For any discretionary “power to adjust” use, add an audit note with the factors considered.
