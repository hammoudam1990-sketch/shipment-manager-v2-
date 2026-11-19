# Shipment Manager v2 — notes (multi-PO, 2026-10-01)

## Files
- **v1:** `Shipment_Manager.html`, unchanged (sha256 1643b2a8…55a9). There is also a copy in `v1_backup/`.
- **v2:** `Shipment_Manager_v2.html`. It now handles many POs and approved UOM definitions.
- **Rollback point:** `v2_backup/`.
  - It holds the single-PO v2 page, its tests and these notes as they were before the multi-PO work.
  - `v2_backup/HASHES.txt` records SHA-256 hashes of v1, v2 and the original Odoo exports at backup time.
  - To roll back, copy `v2_backup/Shipment_Manager_v2_single-PO_2026-10-01.html` back over `Shipment_Manager_v2.html`. The single-PO version still finds its own untouched browser session.
- **Tests:** in `v2_tests/`.
  - `run_tests.js`: 130 engine tests. Run `node run_tests.js --mutations` to add the 11 mutation checks.
  - `ui_smoke_test.js`: 34 UI checks on the real page, run in a simulated browser (jsdom).
  - `receiving_test.js`: focused dashboard, PO quantity and damage tests using synthetic data; run `node receiving_test.js` with `xlsx`, `jszip` and `jsdom` available.
  - Results: `TEST_RESULTS.md`.
  - Copies of the real exports: `fixtures/`. The originals are only ever read.
  - Sample outputs: `test_output/`.

## Final business rules
These are unchanged, from 2026-09-30.

| # | Rule |
|---|---|
| 1 | Known UOM conversions only when explicitly defined. Unknown UOMs go to NEEDS REVIEW. Never invent a conversion |
| 2 | A blank physical UOM is treated as the PO/Odoo UOM |
| 3 | A deterministic, valid conversion needs no extra confirmation, and the calculation is shown |
| 4 | An additional barcode needs confirmation before upload |
| 5 | When quantities differ, upload the received quantity converted to the Odoo UOM, never the ordered quantity |
| 6 | Formal barcode = exactly 13 digits, checked on the PO/Odoo barcode |
| 7 | Barcode on several genuinely different PO lines: choose the line manually |
| 8 | Different weight: hold, do not upload until resolved |
| 9 | Fractional quantities need explicit acceptance |

## UOM model (confirmed 2026-10-01)
- **Odoo UOM:** the authoritative Odoo UOM is `Stock Moves/Allowed Uom`. `Stock Moves/Quantity` is in that UOM: 120 CTN10 = 1,200 PCS.
- **Built-in rules:**
  - `CTN<n>` = n PCS, on both the Odoo and the physical side.
  - `PCS` = 1, exact text only. PC, EA, UNIT(S), PIECES and PI are **not** built in.
  - `Pack of <n>` = n PCS, on the **physical side only**.
- **Everything else is UOM NEEDS REVIEW** until an approved definition exists. That includes bare CTN, Tray, 6X4, By <n>, BOX12, PK6 and CTNP…
- **Undefined Odoo UOM gate (fix C1, 2026-10-01):** if the PO/Odoo UOM itself is undefined (CTNP10, bare CTN, Tray, blank, …), the row is **always** UOM CONVERSION — NEEDS REVIEW.
  - This applies even when the physical UOM is blank or the same text and no arithmetic conversion would be needed.
  - An Odoo UOM is defined only by: built-in CTN<n> or PCS, a pieces column in the PO file, or an approved definition whose side is Odoo or both.
  - The only way to resolve it on a single row is an explicit temporary conversion entered on that row.
  - Tests C1-1 to C1-10; mutation checks MUT-12 and MUT-13.
  - CTNP is not implemented.
  - `By <n>` is never worked out from its number.
  - `* 10` in a product description is never used to convert.
- **Approved definitions (permanent):**
  - Each one records: UOM text, PCS per unit, side (Odoo / physical / both), approved by, date and a note.
  - They are kept in the browser across shipments and survive "Clear session". They can be moved between computers by exporting/importing .json.
  - Built-in forms can't be redefined. `Pack of <n>` can be approved only as an **Odoo-side** definition.
- **Temporary conversions** (typed on one row) affect only that row and are labelled "Temporary — this row only". "Propose as permanent…" pre-fills the definition form, but nothing is saved until **Save** is clicked.
- **Workings shown:** every converted row shows how it was converted, through PCS. Every workbook has a "UOM Definitions Used" sheet.

## Multiple POs per shipment (approved B–K)
- Dashboard PO tiles and status cards open item details in a popup. The popup can apply the selection to the reconciliation table. Expand **View PO items** in the PO list for ordered, physically received, damaged and usable totals in the PO UOM. Only confirmed, counted matches are included; identical lines remain grouped, and unknown conversions show as pending.
- Manual check-in accepts a damaged quantity in the physical UOM. Section 8 lists damaged rows across all POs and links back to check-in for editing. Physical quantity includes damage; usable quantity is physical minus damaged. A row with damage is held out of the Odoo Upload File entirely, even after other review decisions. The physical received total still includes damaged items. Damaged and usable quantities are recorded in Receiving Detail and the master All Receiving sheet. Bulk import does not read damaged quantities; add or edit them in check-in.
- A damaged quantity must be non-negative and no greater than the physical quantity. Rows containing damage cannot be split between POs: enter separate rows with the correct quantity and damage for each PO instead. Old sessions without a damaged quantity remain valid.
- **One file = one PO.** The exception is a file with an explicit PO / Source Document column, which is split by that column.
- **PO reference** comes from the file name, e.g. `P00343.xlsx` → P00343. It is confirmed or edited at import. If a PO column disagrees with the file name, the import stops and asks.
- **Vendor** is required. It is typed or chosen at import, because receipt exports have no vendor column.
- **Receipt reference:** `Stock Moves/Reference` (e.g. BFL/IN/00067) is kept as the receipt reference, separately. It is never used as the PO reference.
- **Which PO a row belongs to:**
  - If a PO is chosen at check-in, or named in a bulk-import PO column, the row is compared **only** with that PO.
  - With "Auto":
    - If exactly one loaded PO has a certain match (barcode, exact name or internal ref), the row is linked to it automatically. The note states why (fix C2, 2026-10-01):
      - "…the only loaded PO with a matching line" when no other PO has any candidate;
      - "…the only loaded PO with a certain match; <other PO> had only a similar-name candidate, which was not used" otherwise.
      - When the only candidate anywhere is a similar name, the note says that match still needs confirmation.
    - If several POs contain it: **PO SELECTION REQUIRED**. The row is not counted or uploaded until a PO is chosen.
  - If the chosen PO lacks the product but another loaded PO has it: **PO MISMATCH — NEEDS REVIEW**. The tool never switches PO by itself, and doesn't call the row EXTRA.
  - **Implementation detail (my addition):** when exactly **one** PO is loaded, a row without a selected PO belongs to that PO, including extras. There is nothing to choose, so single-PO shipments behave exactly as before.
- **Quantities are never combined across POs.**
- **Split row:** one physical row becomes one row per PO.
  - The parts must add up exactly.
  - Each new row is linked to the original.
  - Undo is possible until a decision has been made on one of the new rows.
  - Quantities are never split or allocated automatically.
- **Identical duplicate lines within one PO** are received as one group with an ordered total. Example: Benina 5 + 3 = 8; receiving 6 gives −2, QUANTITY MISMATCH, and no line question.
  - Lines count as identical only when barcode, internal ref `[BL…]`, product name (case and spacing ignored), Allowed Uom, pieces per unit and the weight in the description all match. Any difference means a manual line choice.
  - The internal reference must match exactly: two lines with the same barcode where only one has a `[BL…]` code are treated as different. This is slightly stricter than "compare only when both have one", so the tool asks rather than guesses.
  - The original lines stay listed on the **PO Lines** sheet. Received quantity is marked "not allocated (identical group)".
- **Re-import of a loaded PO ref:**
  - A preview shows lines added, removed and changed, plus receipt-ref and vendor changes. Nothing changes until you confirm.
  - Received rows are kept, and manual confirmations follow their line.
  - A row whose line was removed goes to PRODUCT MATCH review with the reason. It is never dropped.
- **PO status:**
  - NOT STARTED: no rows linked.
  - NEEDS REVIEW: anything pending or on hold.
  - RESOLVED WITH DIFFERENCES: everything reviewed, but with an accepted difference, a non-READY outcome, missing lines or extras.
  - COMPLETE: every line READY, nothing missing, no extras.
- **Totals** are in PCS and include only deterministic conversions. Lines or rows with an undefined UOM are counted separately, not silently left out.

## Outputs
- **One workbook per PO:** `<shipment>_<PO ref>_reconciliation.xlsx`. It contains:
  - Summary (PO ref, vendor, receipt refs, status, PCS totals)
  - **Odoo Upload File**: columns A–D as in v1, then Odoo UOM, Possible Duplicate?, Item, Source row No., PO Ref, Receipt Ref
  - Upload Validation
  - Receiving Detail (with PCS columns)
  - **PO Lines**
  - Needs Review
  - Odoo Changes Required
  - one sheet per status
  - missing
  - UOM Definitions Used
  - PO data notes
- **Master workbook:** `<shipment>_MASTER_reconciliation.xlsx`. It contains:
  - **PO Summary**: per PO, total ordered/received/difference in PCS, ready, qty mismatch, missing, extra, UOM review, weight hold, other unresolved, rows in upload and overall status, plus a TOTAL row
  - **Unassigned**
  - **Cross-PO Validation**: every row appears in exactly one place; upload rows add up exactly; same barcode under several POs is a warning; missing vendors are listed
  - **All Receiving**
  - UOM Definitions Used
- **Downloads:** "Download all (.zip)" gives N PO workbooks plus the master. There are also individual buttons. Validation runs first, and failures or pending rows are listed before anything downloads.
- **Barcode uploaded:** unchanged from v1. READY, an accepted difference or an additional barcode upload the PO barcode. An exchange or a new product uploads the physical barcode, after the change is made in Odoo.

## Sessions and compatibility
- **Storage:** the v3 session is stored under `bfl_shipment_manager_v3_session`. The v1 key (`bfl_shipment_session_v3`) and the v2 key (`bfl_shipment_manager_v2_session`) are never written or deleted.
- **Backup:** session data is local to the browser and site address, not stored in Git. Download a session backup from section 7 before refreshing or changing devices. If browser storage fails, the page warns the user to download a backup without closing the page.
- **Old single-PO v2 session in the browser:** a **copy** is migrated on first open. It becomes one PO, with its reference from the old file name, and you are asked to enter the vendor. Statuses are identical to before (test SES-1).
- **Session backups (.json):** v1 and v2 backups can be loaded. A v1 backup loads as rows with no PO.
- **UOM definitions in a backup:** a v3 backup includes a snapshot of the definitions. When loaded, missing ones are only offered for adding, and a conflicting definition is never overwritten.

## Performance
- Check-in previews reuse the current PO matching index; changing a display filter does not re-evaluate the shipment.
- PO details are built when opened, and individual workbook downloads build only the requested workbook. Full ZIP exports still contain all workbooks and run the same cross-PO validation.

## Validation results (2026-10-01, after fixes C1 + C2)
| Suite | Result |
|---|---|
| Engine tests (A–M, P1–P9, UOM, REAL P00343 + shipment_sep_2026, DUP, MPO, SPLIT, REIMP, WB, ZIP, MATCH, SES, C1, C2) | **143 / 143** |
| Mutation checks (forbidden behaviours put back → their tests fail) | **14 / 14** |
| UI checks (real page in jsdom: import dialogs, receiving, PO choice, split, UOM definitions, re-import, ZIP / per-PO / master export, sessions) | **34 / 34** |
| v1, original Odoo exports and backups unchanged (SHA-256 vs `v2_backup/HASHES.txt`) | **verified** |

**Effect on the real files:**
- P00343: all CTN10/14/5, unaffected.
- shipment_sep_2026: 566 of its 571 lines are CTN<n>, unaffected. The 5 lines with a blank PCK SIZE (and no barcode or quantity) now go to UOM review if received.

**Not yet done:** v2 has not been used in a real browser on a real shipment. That trial should come before production use.
