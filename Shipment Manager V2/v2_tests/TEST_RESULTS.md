# Shipment Manager v2 — test results

Run: 2026-10-01T12:20:26.339Z

| ID | Test | Expected | Actual | Result |
|---|---|---|---|---|
| R1 | Formal barcode = exactly 13 digits (12-digit, 8-digit, 14-digit, alphanumeric, blank = non-formal) | `[false,true,false,false,false,false,false]` | `[false,true,false,false,false,false,false]` | PASS |
| R2 | UOM text → pieces, physical side, no definitions (only CTN<n>, PCS, Pack of <n> built in; nothing guessed) | `[8,null,6,null,1,null,null,null]` | `[8,null,6,null,1,null,null,null]` | PASS |
| R3 | PO parsed by header names (No. column first) | `{"n":19,"bc":"6281100410072","uom":"CTN8","qty":10,"pieces":8}` | `{"n":19,"bc":"6281100410072","uom":"CTN8","qty":10,"pieces":8}` | PASS |
| A | Same barcode / same qty → READY, auto, in upload with PO barcode | `{"status":"READY","case":1,"odooQty":10,"inUpload":true,"uploadBC":"6281100410072"}` | `{"status":"READY","case":1,"odooQty":10,"inUpload":true,"uploadBC":"6281100410072"}` | PASS |
| B | Same barcode / different qty → QUANTITY MISMATCH, pending, not uploaded | `{"status":"QUANTITY MISMATCH","case":2,"odooQty":12,"inUpload":false,"uploadBC":null}` | `{"status":"QUANTITY MISMATCH","case":2,"odooQty":12,"inUpload":false,"uploadBC":null}` | PASS |
| C | Diff barcode / same qty / formal PO → ADDITIONAL BARCODE, pending confirm | `{"status":"ADDITIONAL BARCODE","case":3,"odooQty":5,"inUpload":false,"uploadBC":null}` | `{"status":"ADDITIONAL BARCODE","case":3,"odooQty":5,"inUpload":false,"uploadBC":null}` | PASS |
| D | Diff barcode / same qty / non-formal PO → NEW PRODUCT / EXCHANGE REVIEW (no auto choice) | `{"status":"NEW PRODUCT / EXCHANGE BARCODE REVIEW","case":3,"odooQty":15,"inUpload":false,"uploadBC":null}` | `{"status":"NEW PRODUCT / EXCHANGE BARCODE REVIEW","case":3,"odooQty":15,"inUpload":false,"uploadBC":null}` | PASS |
| D2 | Case D offers exchange AND new product, nothing preselected | `{"options":["exchange","new_product","hold"],"value":null}` | `{"options":["exchange","new_product","hold"],"value":null}` | PASS |
| D3 | Numeric 8-digit PO barcode is NON-formal → NEW PRODUCT / EXCHANGE REVIEW (v1 would have said additional) | `{"status":"NEW PRODUCT / EXCHANGE BARCODE REVIEW","case":3,"odooQty":2,"inUpload":false,"uploadBC":null}` | `{"status":"NEW PRODUCT / EXCHANGE BARCODE REVIEW","case":3,"odooQty":2,"inUpload":false,"uploadBC":null}` | PASS |
| E | Diff barcode / diff qty / formal PO → ADDITIONAL BARCODE + QTY DIFFERENCE REVIEW | `{"status":"ADDITIONAL BARCODE + QUANTITY DIFFERENCE REVIEW","case":4,"odooQty":10,"inUpload":false,"uploadBC":null}` | `{"status":"ADDITIONAL BARCODE + QUANTITY DIFFERENCE REVIEW","case":4,"odooQty":10,"inUpload":false,"uploadBC":null}` | PASS |
| F | Diff barcode / diff qty / non-formal PO → NEW PRODUCT / EXCHANGE + QTY DIFFERENCE REVIEW | `{"status":"NEW PRODUCT / EXCHANGE BARCODE REVIEW + QUANTITY DIFFERENCE REVIEW","case":4,"odooQty":4,"inUpload":false,"uploadBC":null}` | `{"status":"NEW PRODUCT / EXCHANGE BARCODE REVIEW + QUANTITY DIFFERENCE REVIEW","case":4,"odooQty":4,"inUpload":false,"uploadBC":null}` | PASS |
| G | Ordered, not received → MISSING (beef stock cubes) | `["PLEIN SOLEIL BEEF STOCK CUBES 24X20G"]` | `["PLEIN SOLEIL BEEF STOCK CUBES 24X20G"]` | PASS |
| H | Received, not ordered → EXTRA / NOT ON PO, not uploaded | `{"status":"EXTRA / NOT ON PO","case":6,"odooQty":null,"inUpload":false,"uploadBC":null}` | `{"status":"EXTRA / NOT ON PO","case":6,"odooQty":null,"inUpload":false,"uploadBC":null}` | PASS |
| I | Fizz: Odoo By 24 vs physical pack of 6, 40 packs → 240 pcs → 10 By 24, READY | `{"status":"READY","case":1,"odooQty":10,"inUpload":true,"uploadBC":"5449000131805","factor":0.25,"poUom":"By 24","physUom":"Pack of 6","physQty":40}` | `{"status":"READY","case":1,"odooQty":10,"inUpload":true,"uploadBC":"5449000131805","factor":0.25,"poUom":"By 24","physUom":"Pack of 6","physQty":40}` | PASS |
| J | Al Amir: same barcode/description, 750g vs PO 500g → WEIGHT / SPEC MISMATCH, not READY | `{"status":"WEIGHT / SPECIFICATION MISMATCH","case":1,"odooQty":6,"inUpload":false,"uploadBC":null}` | `{"status":"WEIGHT / SPECIFICATION MISMATCH","case":1,"odooQty":6,"inUpload":false,"uploadBC":null}` | PASS |
| K1 | Duplicate PO barcode → PRODUCT MATCH NEEDS CONFIRMATION (no silent pick) + PO issue raised | `{"status":"PRODUCT MATCH — NEEDS CONFIRMATION","inUpload":false,"candidates":2,"poIssue":true}` | `{"status":"PRODUCT MATCH — NEEDS CONFIRMATION","inUpload":false,"candidates":2,"poIssue":true}` | PASS |
| K2 | Duplicate physical entry → 2nd row flagged POSSIBLE DUPLICATE, excluded from line total | `{"first":"QUANTITY MISMATCH","second":"POSSIBLE DUPLICATE ENTRY — NEEDS REVIEW","firstInUpload":false,"secondInUpload":false}` | `{"first":"QUANTITY MISMATCH","second":"POSSIBLE DUPLICATE ENTRY — NEEDS REVIEW","firstInUpload":false,"secondInUpload":false}` | PASS |
| L1 | Blank physical barcode (matched by exact name) → BARCODE BLANK / MALFORMED review | `{"status":"BARCODE BLANK / MALFORMED — NEEDS REVIEW","case":null,"odooQty":5,"inUpload":false,"uploadBC":null}` | `{"status":"BARCODE BLANK / MALFORMED — NEEDS REVIEW","case":null,"odooQty":5,"inUpload":false,"uploadBC":null}` | PASS |
| L2 | Scientific-notation barcode → BARCODE BLANK / MALFORMED review | `{"status":"BARCODE BLANK / MALFORMED — NEEDS REVIEW","inUpload":false,"note":true}` | `{"status":"BARCODE BLANK / MALFORMED — NEEDS REVIEW","inUpload":false,"note":true}` | PASS |
| M | Ambiguous product-name match → NEEDS CONFIRMATION, both Perrier lines offered | `{"status":"PRODUCT MATCH — NEEDS CONFIRMATION","inUpload":false,"candidates":["PERRIER MINERAL WATER 330ML * 24","PERRIER SPARKLING WATER 330ML * 24"]}` | `{"status":"PRODUCT MATCH — NEEDS CONFIRMATION","inUpload":false,"candidates":["PERRIER MINERAL WATER 330ML * 24","PERRIER SPARKLING WATER 330ML * 24"]}` | PASS |
| S1 | Split lots (1 + 3 vs PO 4) compared as a line total → READY for both rows | `["READY","READY"]` | `["READY","READY"]` | PASS |
| U1 | Unknown physical UOM ("Tray") → UOM CONVERSION NEEDS REVIEW, no invented conversion | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false}` | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false}` | PASS |
| U2 | PO/Odoo missing lines awaiting match not reported as plain missing | `true` | `true` | PASS |
| V1 | Before review: upload holds only auto-READY rows (A, I, split lots) | `[1,8,16,17]` | `[1,8,16,17]` | PASS |
| V2 | Upload qty for Fizz is in Odoo UOM (10 By 24), not physical 40 packs | `{"qty":10,"uom":"By 24"}` | `{"qty":10,"uom":"By 24"}` | PASS |
| B+ | Qty mismatch accepted → uploaded with received qty 12 on PO barcode | `{"inUpload":true,"bc":"8718951207394","qty":12}` | `{"inUpload":true,"bc":"8718951207394","qty":12}` | PASS |
| C+ | Additional barcode confirmed → uploaded with PO (Odoo) barcode + listed in Odoo Changes | `{"inUpload":true,"bc":"6212900002143"}` | `{"inUpload":true,"bc":"6212900002143"}` | PASS |
| D+ | Exchange barcode chosen → uploaded with physical barcode | `{"inUpload":true,"bc":"5285000835615"}` | `{"inUpload":true,"bc":"5285000835615"}` | PASS |
| E+ | Case 4 formal needs BOTH decisions; both given → uploaded | `{"inUpload":true,"bc":"8001090421548","qty":10}` | `{"inUpload":true,"bc":"8001090421548","qty":10}` | PASS |
| F+ | Any HOLD keeps the row out of the upload | `{"inUpload":false,"review":"ON HOLD"}` | `{"inUpload":false,"review":"ON HOLD"}` | PASS |
| J+ | Spec mismatch on hold → never uploaded | `false` | `false` | PASS |
| K1+ | Duplicate-PO-barcode row after manual line choice → READY, uploaded | `{"status":"READY","inUpload":true}` | `{"status":"READY","inUpload":true}` | PASS |
| K2+ | Duplicate held → excluded from upload; original row (2 vs PO 4) stays QUANTITY MISMATCH | `{"first":"QUANTITY MISMATCH","second":false}` | `{"first":"QUANTITY MISMATCH","second":false}` | PASS |
| L1+ | Blank barcode + identity confirmed (formal PO) → uploaded with PO barcode | `{"inUpload":true,"bc":"5285001522651"}` | `{"inUpload":true,"bc":"5285001522651"}` | PASS |
| L2+ | Malformed barcode left unresolved → still not uploaded | `false` | `false` | PASS |
| M+ | Ambiguous row confirmed to Sparkling line; physical bc differs, PO formal → ADDITIONAL BARCODE pending | `{"status":"ADDITIONAL BARCODE","inUpload":false}` | `{"status":"ADDITIONAL BARCODE","inUpload":false}` | PASS |
| U1+ | User-entered conversion 10/10 → factor 1, qty 12 vs PO 6 → QUANTITY MISMATCH | `{"status":"QUANTITY MISMATCH","odooQty":12,"source":"Temporary — this row only"}` | `{"status":"QUANTITY MISMATCH","odooQty":12,"source":"Temporary — this row only"}` | PASS |
| G+ | Missing list: beef stock cubes still MISSING; Perrier Mineral missing after the ambiguity is resolved | `["PERRIER MINERAL WATER 330ML * 24","PLEIN SOLEIL BEEF STOCK CUBES 24X20G"]` | `["PERRIER MINERAL WATER 330ML * 24","PLEIN SOLEIL BEEF STOCK CUBES 24X20G"]` | PASS |
| V3 | Upload rows = exactly the resolved/validated rows | `[1,2,3,4,5,8,10,13,16,17]` | `[1,2,3,4,5,8,10,13,16,17]` | PASS |
| V4 | Upload validation has zero FAIL checks | `0` | `0` | PASS |
| V5 | No unresolved / held / extra / missing row reached the upload | `true` | `true` | PASS |
| W1 | Workbook contains Summary, Odoo Upload File, Upload Validation, Receiving Detail, Needs Review, Odoo Changes Required, missing | `true` | `true` | PASS |
| W2 | Odoo Upload File columns A–D keep v1 positions; Fizz row = 5449000131805 / 10 / By 24 | `{"header":["Barcode","Qty (Odoo UOM)","Qty in Pieces","Expiry Date","Odoo UOM"],"fizz":["5449000131805",10,"","01/03/2027","By 24"]}` | `{"header":["Barcode","Qty (Odoo UOM)","Qty in Pieces","Expiry Date","Odoo UOM"],"fizz":["5449000131805",10,"","01/03/2027","By 24"]}` | PASS |
| W3 | Receiving Detail shows every required column | `true` | `true` | PASS |
| W4 | Odoo Changes Required lists additional barcode, exchange, new product, extra | `true` | `true` | PASS |
| X1 | v1 import column order still accepted (no header detected) | `{"n":1,"item":"FIZZ COLA 330ML","bc":"5449000131805","qty":40,"uom":"Pack of 6"}` | `{"n":1,"item":"FIZZ COLA 330ML","bc":"5449000131805","qty":40,"uom":"Pack of 6"}` | PASS |
| P1a | Rule 1: physical "CTN" (count not defined) vs Odoo By 24 → UOM NEEDS REVIEW, no qty | `["UOM CONVERSION — NEEDS REVIEW",null,false]` | `["UOM CONVERSION — NEEDS REVIEW",null,false]` | PASS |
| P1b | Rule 1: physical "Tray" → UOM NEEDS REVIEW | `["UOM CONVERSION — NEEDS REVIEW",null]` | `["UOM CONVERSION — NEEDS REVIEW",null]` | PASS |
| P1c | Rule 1: physical "6X4" → UOM NEEDS REVIEW (not guessed as 24) | `["UOM CONVERSION — NEEDS REVIEW",null]` | `["UOM CONVERSION — NEEDS REVIEW",null]` | PASS |
| P1d | Rule 1: Odoo UOM "CTN" (undefined) + physical "Pack of 6" → UOM NEEDS REVIEW | `["UOM CONVERSION — NEEDS REVIEW",null]` | `["UOM CONVERSION — NEEDS REVIEW",null]` | PASS |
| P1e | Rule 1: once the user defines the "Tray" conversion (6 pcs/tray, 24 pcs/By 24) it converts: 40 trays → 10 | `["READY",10,true,"Temporary — this row only"]` | `["READY",10,true,"Temporary — this row only"]` | PASS |
| P2 | Rule 2: blank physical UOM → treated as Odoo UOM (factor 1), even if an old session carries the setting off | `["READY",10,1,true]` | `["READY",10,1,true]` | PASS |
| P3 | Rule 3: Fizz 40 × Pack of 6 → 10 By 24, READY, no review decision, calculation shown | `{"status":"READY","review":"AUTO — no review needed","decisions":0,"inUpload":true,"qty":10,"calc":"40 × 6 pcs = 240 pcs ÷ 24 pcs per By 24 = 10"}` | `{"status":"READY","review":"AUTO — no review needed","decisions":0,"inUpload":true,"qty":10,"calc":"40 × 6 pcs = 240 pcs ÷ 24 pcs per By 24 = 10"}` | PASS |
| P4 | Rule 4: additional barcode NOT uploaded until confirmed; after confirmation uploaded on the PO barcode | `[false,true,"5449000131805"]` | `[false,true,"5449000131805"]` | PASS |
| P5 | Rule 5: ordered 10 By 24, received 36 × Pack of 6 = 9 By 24 → after acceptance upload 9 (not 10, not 36) | `{"status":"QUANTITY MISMATCH","before":false,"after":true,"uploadQty":9}` | `{"status":"QUANTITY MISMATCH","before":false,"after":true,"uploadQty":9}` | PASS |
| P6 | Rule 6: PO barcode 13 digits → ADDITIONAL BARCODE; 12, 14, 8 digits and alphanumeric → NEW PRODUCT / EXCHANGE REVIEW | `["ADDITIONAL BARCODE","NEW PRODUCT / EXCHANGE BARCODE REVIEW","NEW PRODUCT / EXCHANGE BARCODE REVIEW","NEW PRODUCT / EXCHANGE BARCODE REVIEW","NEW PRODUCT / EXCHANGE BARCODE REVIEW"]` | `["ADDITIONAL BARCODE","NEW PRODUCT / EXCHANGE BARCODE REVIEW","NEW PRODUCT / EXCHANGE BARCODE REVIEW","NEW PRODUCT / EXCHANGE BARCODE REVIEW","NEW PRODUCT / EXCHANGE BARCODE REVIEW"]` | PASS |
| P7 | Rule 7: barcode on 2 PO lines → manual selection required; chosen line (qty 5) is used, the other becomes MISSING | `{"before":"PRODUCT MATCH — NEEDS CONFIRMATION","cands":2,"after":"READY","poQty":5,"missing":["FIZZ COLA 330ML MULTIPACK"]}` | `{"before":"PRODUCT MATCH — NEEDS CONFIRMATION","cands":2,"after":"READY","poQty":5,"missing":["FIZZ COLA 330ML MULTIPACK"]}` | PASS |
| P8 | Rule 8: same barcode/qty but 750g vs PO 500g → WEIGHT/SPEC MISMATCH, not uploaded (pending and on hold) | `{"status":"WEIGHT / SPECIFICATION MISMATCH","pending":false,"held":false,"heldReview":"ON HOLD"}` | `{"status":"WEIGHT / SPECIFICATION MISMATCH","pending":false,"held":false,"heldReview":"ON HOLD"}` | PASS |
| P9 | Rule 9: 38 × Pack of 6 = 228 pcs = 9.5 By 24 → needs acceptance; after acceptance uploads 9.5 | `{"status":"UOM CONVERSION — NEEDS REVIEW","before":false,"after":true,"qty":9.5}` | `{"status":"UOM CONVERSION — NEEDS REVIEW","before":false,"after":true,"qty":9.5}` | PASS |
| P9b | Rule 9: fractional accepted but quantity difference not yet accepted → still not uploaded | `false` | `false` | PASS |
| UOM-1 | Built-in CTN<n> on both sides and exact PCS: CTN10=10, CTN14=14, CTN5=5, PCS=1 | `[10,14,5,1,10,14,5,1]` | `[10,14,5,1,10,14,5,1]` | PASS |
| UOM-2 | Only exact PCS: PC, EA, UNIT, UNITS, PIECES, PI are NOT built in | `[null,null,null,null,null,null]` | `[null,null,null,null,null,null]` | PASS |
| UOM-3 | CTNP is undefined: CTNP10, CTNP12, CTNP 6x4 → no conversion (both sides) | `[null,null,null,null]` | `[null,null,null,null]` | PASS |
| UOM-4 | Bare CTN, Tray, 6X4, BOX12, PK6, CASE12, X6 → no conversion | `[null,null,null,null,null,null,null]` | `[null,null,null,null,null,null,null]` | PASS |
| UOM-5 | By 24 is NOT inferred from the number; converts only once an approved definition exists | `[null,null,24,24]` | `[null,null,24,24]` | PASS |
| UOM-6 | Pack of <n> is built in on the PHYSICAL side only; as an Odoo UOM it needs an approved odoo definition | `[6,12,null,6]` | `[6,12,null,6]` | PASS |
| UOM-7 | Definition side is respected (odoo-only definition does not apply to physical) | `[12,null]` | `[12,null]` | PASS |
| UOM-8 | Fizz WITHOUT the By 24 definition → UOM CONVERSION NEEDS REVIEW (no guess), not uploaded | `["UOM CONVERSION — NEEDS REVIEW",null,false]` | `["UOM CONVERSION — NEEDS REVIEW",null,false]` | PASS |
| UOM-9 | Temporary row conversion affects ONLY its row and never the definitions table | `{"row1temp":true,"row1qty":20,"row2":"UOM CONVERSION — NEEDS REVIEW","defsAfter":1}` | `{"row1temp":true,"row1qty":20,"row2":"UOM CONVERSION — NEEDS REVIEW","defsAfter":1}` | PASS |
| UOM-10 | The "* 10" in a product description is never a conversion source (Odoo UOM blank → undefined) | `[null,null]` | `[null,null]` | PASS |
| UOM-11 | PCS chain: 120 CTN10 received as 1,200 PCS → 120 CTN10; 1,195 PCS → 119.5 (fractional → review) | `[120,1200,"READY",119.5,"UOM CONVERSION — NEEDS REVIEW"]` | `[120,1200,"READY",119.5,"UOM CONVERSION — NEEDS REVIEW"]` | PASS |
| UOM-12 | Validation of a permanent definition: built-ins cannot be redefined, approver required, duplicate refused, Pack of <n> only as odoo | `[true,true,true,true,false]` | `[true,true,true,true,false]` | PASS |
| REAL-1 | P00343: 38 lines; PO ref P00343 from the FILENAME; receipt ref BFL/IN/00067 kept separately, never the PO ref | `{"lines":38,"ref":"P00343","refSource":"filename","receiptRefs":["BFL/IN/00067"],"uomCol":true,"poColumn":false}` | `{"lines":38,"ref":"P00343","refSource":"filename","receiptRefs":["BFL/IN/00067"],"uomCol":true,"poColumn":false}` | PASS |
| REAL-2 | P00343 line 1: Allowed Uom CTN10 is the Odoo UOM; 120 CTN10 = 1,200 PCS; internal ref BL00133 | `{"bc":"5283001104785","uom":"CTN10","qty":120,"pcsPerUnit":10,"qtyPcs":1200,"internalRef":"BL00133","receiptRef":"BFL/IN/00067"}` | `{"bc":"5283001104785","uom":"CTN10","qty":120,"pcsPerUnit":10,"qtyPcs":1200,"internalRef":"BL00133","receiptRef":"BFL/IN/00067"}` | PASS |
| REAL-3 | P00343: every Allowed Uom resolves by the built-in CTN<n> rule; all 38 barcodes formal; no duplicates → 38 receiving targets | `{"uoms":["CTN10","CTN14","CTN5"],"resolved":38,"formal":38,"targets":38,"groups":0}` | `{"uoms":["CTN10","CTN14","CTN5"],"resolved":38,"formal":38,"targets":38,"groups":0}` | PASS |
| REAL-4 | P00343: ABIDO SEVEN SPICES received 120 (UOM blank) → READY 120 CTN10 = 1,200 PCS; upload carries PO P00343 + receipt ref | `{"status":"READY","odooQty":120,"physPcs":1200,"poRef":"P00343","upload":{"barcode":"5283001104785","qty":120,"uom":"CTN10","poRef":"P00343","receiptRef":"BFL/IN/00067"}}` | `{"status":"READY","odooQty":120,"physPcs":1200,"poRef":"P00343","upload":{"barcode":"5283001104785","qty":120,"uom":"CTN10","poRef":"P00343","receiptRef":"BFL/IN/00067"}}` | PASS |
| REAL-5 | P00343: same line received as 1,200 PCS → 120 CTN10, READY (conversion through PCS) | `["READY",120]` | `["READY",120]` | PASS |
| REAL-6 | Receipt ref is never used as the PO ref: without a filename the PO ref stays blank and the import is refused | `{"draftRef":"","errors":["PO reference is required"]}` | `{"draftRef":"","errors":["PO reference is required"]}` | PASS |
| REAL-7 | shipment_sep_2026 (old layout BARCODE/ITEM/PCK SIZE/CTN) still parses: 571 lines, UOM from PCK SIZE, qty from CTN | `{"lines":571,"first":{"bc":"6281100410072","uom":"CTN8","qty":10}}` | `{"lines":571,"first":{"bc":"6281100410072","uom":"CTN8","qty":10}}` | PASS |
| REAL-8 | shipment_sep_2026 as ONE PO: exactly 8 identical-duplicate groups and 1 genuinely-different duplicate barcode (Deroni) | `{"groups":8,"different":["52850015220176"],"benina":{"qty":8,"rows":[90,91]}}` | `{"groups":8,"different":["52850015220176"],"benina":{"qty":8,"rows":[90,91]}}` | PASS |
| DUP-1 | Benina 5 + 3 ordered, 6 received → one group, ordered 8, difference −2, QUANTITY MISMATCH, NO line-selection question | `{"status":"QUANTITY MISMATCH","ordered":8,"received":6,"diff":-2,"isGroup":true,"lines":2,"decisions":["qty"]}` | `{"status":"QUANTITY MISMATCH","ordered":8,"received":6,"diff":-2,"isGroup":true,"lines":2,"decisions":["qty"]}` | PASS |
| DUP-2 | Group 5 + 3: 8 received in one row → READY; 8 received as two lots (5 + 3) → both READY | `["READY","READY","READY"]` | `["READY","READY","READY"]` | PASS |
| DUP-3 | Group of THREE identical lines (2 + 2 + 2), 6 received → READY | `["READY",6,3]` | `["READY",6,3]` | PASS |
| DUP-4 | Same barcode + name but DIFFERENT UOM (CTN20 vs CTN10) → genuinely separate → manual line choice | `{"status":"PRODUCT MATCH — NEEDS CONFIRMATION","candidates":2}` | `{"status":"PRODUCT MATCH — NEEDS CONFIRMATION","candidates":2}` | PASS |
| DUP-5 | Same barcode but different WEIGHT in the name (500G vs 1K) → manual line choice | `"PRODUCT MATCH — NEEDS CONFIRMATION"` | `"PRODUCT MATCH — NEEDS CONFIRMATION"` | PASS |
| DUP-6 | Same barcode + same name but different internal ref [BL01001] vs [BL01002] → manual line choice | `"PRODUCT MATCH — NEEDS CONFIRMATION"` | `"PRODUCT MATCH — NEEDS CONFIRMATION"` | PASS |
| DUP-7 | Group with UOM conversion: 5 + 3 CTN20 ordered, 160 PCS received → 8 CTN20 → READY | `["READY",8,160]` | `["READY",8,160]` | PASS |
| DUP-8 | Group difference accepted → ONE upload row with the RECEIVED qty (6), not the ordered 8, not per line | `[{"barcode":"5285001032167","qty":6}]` | `[{"barcode":"5285001032167","qty":6}]` | PASS |
| DUP-9 | Group never received → ONE missing entry listing both original lines (5 and 3) | `{"missing":1,"lineQtys":[5,3],"ordered":8}` | `{"missing":1,"lineQtys":[5,3],"ordered":8}` | PASS |
| DUP-10 | Real file: OMO LIQ LAVENDER (11 + 10) received 21 → READY; Deroni 14-digit shared barcode → manual line choice | `["READY","PRODUCT MATCH — NEEDS CONFIRMATION"]` | `["READY","PRODUCT MATCH — NEEDS CONFIRMATION"]` | PASS |
| MPO-1 | Two PO files → two independent POs (ref, vendor, receipt ref, own line ids) | `{"refs":["PA001","PB002"],"vendors":["Vendor A","Vendor B"],"receipt":[["IN/A"],["IN/B"]],"idsUnique":true}` | `{"refs":["PA001","PB002"],"vendors":["Vendor A","Vendor B"],"receipt":[["IN/A"],["IN/B"]],"idsUnique":true}` | PASS |
| MPO-2 | A file WITH an explicit PO column is split by that column (one file → 2 POs) | `[["P1","column",1],["P2","column",2]]` | `[["P1","column",1],["P2","column",2]]` | PASS |
| MPO-3 | PO column disagreeing with the filename → conflict flagged for the user (import must stop and ask) | `{"column":"P00999","filename":"P00343"}` | `{"column":"P00999","filename":"P00343"}` | PASS |
| MPO-4 | Vendor is required; the same PO ref cannot be loaded twice (re-import instead) | `[["Vendor is required"],["PO PA001 is already loaded — use Re-import to replace it"]]` | `[["Vendor is required"],["PO PA001 is already loaded — use Re-import to replace it"]]` | PASS |
| MPO-5 | Product on exactly ONE loaded PO, no PO selected → linked automatically to that PO and READY | `{"status":"READY","poRef":"PB002","auto":true}` | `{"status":"READY","poRef":"PB002","auto":true}` | PASS |
| MPO-6 | Same barcode on PO A (5) and PO B (3), no PO selected → PO SELECTION REQUIRED, 2 candidates, NOT combined, NOT uploaded | `{"status":"PO SELECTION REQUIRED","candidates":["PA001","PB002"],"odooQty":null,"inUpload":false,"missingPending":2}` | `{"status":"PO SELECTION REQUIRED","candidates":["PA001","PB002"],"odooQty":null,"inUpload":false,"missingPending":2}` | PASS |
| MPO-7 | Same product on A and B, receiver selected PO A, received 5 → compared ONLY with A (5) → READY; B stays missing | `{"status":"READY","poRef":"PA001","missing":["PB002"]}` | `{"status":"READY","poRef":"PA001","missing":["PB002"]}` | PASS |
| MPO-8 | Identical lines on DIFFERENT POs are never grouped: A 5 + B 3, 8 received against A → A QUANTITY MISMATCH (8 vs 5), B MISSING | `{"status":"QUANTITY MISMATCH","ordered":5,"received":8,"targets":2,"missing":["PB002"]}` | `{"status":"QUANTITY MISMATCH","ordered":5,"received":8,"targets":2,"missing":["PB002"]}` | PASS |
| MPO-9 | Selected PO A lacks the product but PO B has it → PO MISMATCH review (no silent switch); choosing B → READY on B | `{"before":"PO MISMATCH — NEEDS REVIEW","cands":["PB002"],"beforeUpload":false,"after":"READY","afterPo":"PB002"}` | `{"before":"PO MISMATCH — NEEDS REVIEW","cands":["PB002"],"beforeUpload":false,"after":"READY","afterPo":"PB002"}` | PASS |
| MPO-10 | PO MISMATCH resolved as "keep on selected PO as extra" → EXTRA on PO A, not uploaded | `{"status":"EXTRA / NOT ON PO","poRef":"PA001","inUpload":false}` | `{"status":"EXTRA / NOT ON PO","poRef":"PA001","inUpload":false}` | PASS |
| MPO-11 | Extra received against a selected PO belongs to that PO; extra with no PO is unassigned | `[["EXTRA / NOT ON PO","PA001"],["EXTRA / NOT ON PO",null]]` | `[["EXTRA / NOT ON PO","PA001"],["EXTRA / NOT ON PO",null]]` | PASS |
| MPO-12 | Bulk import PO column: a loaded ref links the row; an unknown ref → PO SELECTION REQUIRED ("not loaded") | `{"recs":["PA001","P99999"],"known":"PA001","unknownStatus":"PO SELECTION REQUIRED","note":true}` | `{"recs":["PA001","P99999"],"known":"PA001","unknownStatus":"PO SELECTION REQUIRED","note":true}` | PASS |
| MPO-13 | Missing lines are reported per PO (each missing entry carries its PO ref) | `[["PA001","PRODUCT BETA 1L * 12 [BLB01]"],["PB002","PRODUCT ALPHA 330ML * 24 [BLA01]"]]` | `[["PA001","PRODUCT BETA 1L * 12 [BLB01]"],["PB002","PRODUCT ALPHA 330ML * 24 [BLA01]"]]` | PASS |
| MPO-14 | Quantities never combined across POs: A 5 and B 3 received as separate rows → each READY against its own PO; uploads per PO | `{"statuses":["READY","READY"],"upA":[5],"upB":[3]}` | `{"statuses":["READY","READY"],"upA":[5],"upB":[3]}` | PASS |
| SPLIT-1 | Split validation: parts must add up EXACTLY, at least two parts, each PO once, qty > 0 | `[true,true,true,true]` | `[true,true,true,true]` | PASS |
| SPLIT-2 | Split 8 → A 5 + B 3: two new rows inherit barcode/expiry/notes, carry the split link, have no decisions; original replaced | `{"count":2,"qtys":[5,3],"pos":["PA001","PB002"],"inherit":true,"links":true,"noDecisions":true,"origGone":true}` | `{"count":2,"qtys":[5,3],"pos":["PA001","PB002"],"inherit":true,"links":true,"noDecisions":true,"origGone":true}` | PASS |
| SPLIT-3 | No automatic allocation: evaluating a multi-PO row never changes the rows, and the engine has no allocation function | `{"itemsBefore":1,"itemsAfter":1,"status":"PO SELECTION REQUIRED","allocFns":[]}` | `{"itemsBefore":1,"itemsAfter":1,"status":"PO SELECTION REQUIRED","allocFns":[]}` | PASS |
| SPLIT-4 | Undo split is allowed before any decision, blocked once a split row has a decision | `{"undoOk":true,"restoredQty":8,"blocked":true}` | `{"undoOk":true,"restoredQty":8,"blocked":true}` | PASS |
| SPLIT-5 | Each split row reconciles against ITS OWN PO: A ordered 5 got 5 → READY; B ordered 4 got 3 → QUANTITY MISMATCH | `[["PA001","READY"],["PB002","QUANTITY MISMATCH"]]` | `[["PA001","READY"],["PB002","QUANTITY MISMATCH"]]` | PASS |
| REIMP-1 | Preview: 1 added (DELTA), 1 removed (GAMMA), 1 changed (BETA qty 2 → 3), 1 unchanged (ALPHA) | `{"added":["PRODUCT DELTA [BLD01]"],"removed":["PRODUCT GAMMA 500G * 6 [BLG01]"],"changed":[["PRODUCT BETA 1L * 12 [BLB01]","qty 2 → 3"]],"unchanged":1}` | `{"added":["PRODUCT DELTA [BLD01]"],"removed":["PRODUCT GAMMA 500G * 6 [BLG01]"],"changed":[["PRODUCT BETA 1L * 12 [BLB01]","qty 2 → 3"]],"unchanged":1}` | PASS |
| REIMP-2 | Preview (and cancel) changes nothing in the session | `true` | `true` | PASS |
| REIMP-3 | Apply keeps received rows; a manual line confirmation survives when the line still exists (remapped to the new line id) | `{"items":2,"remapped":1,"status":"ADDITIONAL BARCODE","confirmed":"confirmed","line":"PRODUCT BETA 1L * 12 [BLB01]"}` | `{"items":2,"remapped":1,"status":"ADDITIONAL BARCODE","confirmed":"confirmed","line":"PRODUCT BETA 1L * 12 [BLB01]"}` | PASS |
| REIMP-4 | A row received on a line REMOVED by the re-import is never dropped: it goes to PRODUCT MATCH review with the reason | `{"kept":true,"orphans":1,"status":"PRODUCT MATCH — NEEDS CONFIRMATION","reason":true,"inUpload":false}` | `{"kept":true,"orphans":1,"status":"PRODUCT MATCH — NEEDS CONFIRMATION","reason":true,"inUpload":false}` | PASS |
| REIMP-5 | Apply records history (version 2, +1 −1 ~1) and replaces receipt refs; PO ref unchanged | `{"version":2,"history":{"added":1,"removed":1,"changed":1},"ref":"PA001","receipt":["IN/A2"]}` | `{"version":2,"history":{"added":1,"removed":1,"changed":1},"ref":"PA001","receipt":["IN/A2"]}` | PASS |
| WB-1 | Each PO workbook contains ONLY that PO's rows (Receiving Detail PO Ref column) | `{"P00343":[1,2],"PA001":[3,4],"PB002":[5,7]}` | `{"P00343":[1,2],"PA001":[3,4],"PB002":[5,7]}` | PASS |
| WB-2 | Upload conservation: upload rows across all PO workbooks = shipment eligible rows, no duplicates, no losses | `{"perPo":4,"eligible":4,"unique":true,"cross":"PASS"}` | `{"perPo":4,"eligible":4,"unique":true,"cross":"PASS"}` | PASS |
| WB-3 | Master PO Summary equals the per-PO figures (ordered/received PCS, statuses) and sums correctly | `{"rows":[["P00343","ABIDO supplier","BFL/IN/00067","NEEDS REVIEW"],["PA001","Vendor A","IN/A","COMPLETE"],["PB002","Vendor B","IN/B","RESOLVED WITH DIFFERENCES"]],"totalsOk":true,"p343Received":1700,"aReceived":280}` | `{"rows":[["P00343","ABIDO supplier","BFL/IN/00067","NEEDS REVIEW"],["PA001","Vendor A","IN/A","COMPLETE"],["PB002","Vendor B","IN/B","RESOLVED WITH DIFFERENCES"]],"totalsOk":true,"p343Received":1700,"aReceived":280}` | PASS |
| WB-4 | PO status matrix: NOT STARTED / NEEDS REVIEW / RESOLVED WITH DIFFERENCES / COMPLETE | `["NOT STARTED","NEEDS REVIEW","RESOLVED WITH DIFFERENCES","COMPLETE"]` | `["NOT STARTED","NEEDS REVIEW","RESOLVED WITH DIFFERENCES","COMPLETE"]` | PASS |
| WB-5 | PO Lines sheet keeps BOTH original Benina lines (5 and 3) with group totals and "not allocated (identical group)" | `{"lines":[[5,8,8,0,"not allocated (identical group)"],[3,8,8,0,"not allocated (identical group)"]]}` | `{"lines":[[5,8,8,0,"not allocated (identical group)"],[3,8,8,0,"not allocated (identical group)"]]}` | PASS |
| WB-6 | Per-PO Odoo Upload File: columns A–D unchanged, then Odoo UOM … PO Ref, Receipt Ref; P00343 row = 120 CTN10 + BFL/IN/00067 | `{"head":["Barcode","Qty (Odoo UOM)","Qty in Pieces","Expiry Date","Odoo UOM","Possible Duplicate?","Item (reference only)","Source row No.","PO Ref","Receipt Ref"],"row":["5283001104785",120,"","01/01/2028","CTN10","","ABIDO SEVEN SPICES (MIX SPICE) 50G * 10 [BL00133]",1,"P00343","BFL/IN/00067"]}` | `{"head":["Barcode","Qty (Odoo UOM)","Qty in Pieces","Expiry Date","Odoo UOM","Possible Duplicate?","Item (reference only)","Source row No.","PO Ref","Receipt Ref"],"row":["5283001104785",120,"","01/01/2028","CTN10","","ABIDO SEVEN SPICES (MIX SPICE) 50G * 10 [BL00133]",1,"P00343","BFL/IN/00067"]}` | PASS |
| WB-7 | File names: one per PO + master, filesystem-safe (no / : \ * ? [ ]) and unique | `["TEST Shipment - Oct-2026_P00343_reconciliation.xlsx","TEST Shipment - Oct-2026_PA001_reconciliation.xlsx","TEST Shipment - Oct-2026_PB002_reconciliation.xlsx","TEST Shipment - Oct-2026_MASTER_reconciliation.xlsx"]` | `["TEST Shipment - Oct-2026_P00343_reconciliation.xlsx","TEST Shipment - Oct-2026_PA001_reconciliation.xlsx","TEST Shipment - Oct-2026_PB002_reconciliation.xlsx","TEST Shipment - Oct-2026_MASTER_reconciliation.xlsx"]` | PASS |
| WB-8 | Master has Unassigned (the PO-selection row), Cross-PO Validation and All Receiving sheets; unassigned row is in no PO workbook | `{"sheets":true,"unassigned":[6],"cross":{"Every received row is in exactly one PO workbook or in Unassigned":"PASS","Rows waiting for a PO choice (not in any PO workbook)":"WARN"}}` | `{"sheets":true,"unassigned":[6],"cross":{"Every received row is in exactly one PO workbook or in Unassigned":"PASS","Rows waiting for a PO choice (not in any PO workbook)":"WARN"}}` | PASS |
| MATCH-1 | Single similar-name TOKEN match (one candidate) → PRODUCT MATCH — NEEDS CONFIRMATION, not uploaded; after confirmation → classified | `{"before":"PRODUCT MATCH — NEEDS CONFIRMATION","conf":"uncertain","inUpload":false,"after":"ADDITIONAL BARCODE"}` | `{"before":"PRODUCT MATCH — NEEDS CONFIRMATION","conf":"uncertain","inUpload":false,"after":"ADDITIONAL BARCODE"}` | PASS |
| MATCH-2 | Single FUZZY name match (one candidate) → PRODUCT MATCH — NEEDS CONFIRMATION, not uploaded | `{"status":"PRODUCT MATCH — NEEDS CONFIRMATION","conf":"uncertain","inUpload":false}` | `{"status":"PRODUCT MATCH — NEEDS CONFIRMATION","conf":"uncertain","inUpload":false}` | PASS |
| C1-1 | CTNP10 Odoo UOM + BLANK physical UOM → UOM NEEDS REVIEW, not uploaded | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false,"upload":0}` | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false,"upload":0}` | PASS |
| C1-2 | CTNP10 Odoo UOM + physical CTNP10 (identical text) → UOM NEEDS REVIEW, not uploaded | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false,"upload":0}` | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false,"upload":0}` | PASS |
| C1-3 | Bare CTN Odoo UOM + BLANK physical UOM → UOM NEEDS REVIEW, not uploaded | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false,"upload":0}` | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false,"upload":0}` | PASS |
| C1-4 | Tray Odoo UOM + BLANK physical UOM → UOM NEEDS REVIEW, not uploaded | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false,"upload":0}` | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false,"upload":0}` | PASS |
| C1-5 | Arbitrary undefined Odoo UOM "BUNDLE-X7" + BLANK physical UOM → UOM NEEDS REVIEW, not uploaded | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false,"upload":0}` | `{"status":"UOM CONVERSION — NEEDS REVIEW","odooQty":null,"inUpload":false,"upload":0}` | PASS |
| C1-6 | Other undefined forms also gated: bare CTN + physical CTN, Tray + physical Tray, BLANK Odoo UOM + blank physical, By 24 (not approved) + blank | `["UOM CONVERSION — NEEDS REVIEW","UOM CONVERSION — NEEDS REVIEW","UOM CONVERSION — NEEDS REVIEW","UOM CONVERSION — NEEDS REVIEW"]` | `["UOM CONVERSION — NEEDS REVIEW","UOM CONVERSION — NEEDS REVIEW","UOM CONVERSION — NEEDS REVIEW","UOM CONVERSION — NEEDS REVIEW"]` | PASS |
| C1-7 | Defined UOMs stay valid: CTN10 + blank → READY; PCS + blank → READY; approved odoo-side "Tray"=6 + blank → READY; approved "By 24" + blank → READY | `["READY","READY","READY","READY"]` | `["READY","READY","READY","READY"]` | PASS |
| C1-8 | A physical-only definition does NOT define an Odoo UOM: "Tray" approved for physical side only, Odoo UOM Tray + blank → still UOM NEEDS REVIEW | `"UOM CONVERSION — NEEDS REVIEW"` | `"UOM CONVERSION — NEEDS REVIEW"` | PASS |
| C1-9 | The review shows the reason and offers the per-row temporary conversion as the only in-row resolution; with it the row converts (marked temporary) | `{"reason":true,"offersTemp":true,"after":"READY","temporary":true}` | `{"reason":true,"offersTemp":true,"after":"READY","temporary":true}` | PASS |
| C1-10 | Real file shipment_sep_2026: a line with a BLANK UOM (no PCK SIZE), received 5 with blank physical UOM → UOM NEEDS REVIEW because the Odoo UOM is undefined | `{"blankUomLines":5,"status":"UOM CONVERSION — NEEDS REVIEW","reason":true,"inUpload":false}` | `{"blankUomLines":5,"status":"UOM CONVERSION — NEEDS REVIEW","reason":true,"inUpload":false}` | PASS |
| C2-1 | Certain match on PO A, only a similar-name candidate on PO B → auto to A; note says "certain match" and names B; never "only loaded PO containing this product" | `{"po":"PA","certain":true,"namesB":true,"oldWording":false}` | `{"po":"PA","certain":true,"namesB":true,"oldWording":false}` | PASS |
| C2-2 | Product matched on exactly one PO and nowhere else → note says "only loaded PO with a matching line" and the match method | `true` | `true` | PASS |
| C2-3 | Only a similar-name candidate on one PO → note does NOT claim the PO was determined by a certain match; row still needs match confirmation | `{"status":"PRODUCT MATCH — NEEDS CONFIRMATION","honest":true}` | `{"status":"PRODUCT MATCH — NEEDS CONFIRMATION","honest":true}` | PASS |
| SES-1 | v2 single-PO session → one PO (ref from old file name, vendor to be entered), manual line choice + old per-row conversion carried over, SAME statuses as before | `{"pos":1,"ref":"shipment sep 2026","refSource":"migrated from v2 session","vendor":"","allOnPO1":true,"sameStatuses":true,"manualKept":true,"tempKept":true}` | `{"pos":1,"ref":"shipment sep 2026","refSource":"migrated from v2 session","vendor":"","allOnPO1":true,"sameStatuses":true,"manualKept":true,"tempKept":true}` | PASS |
| SES-2 | v1 session backup → rows kept with no PO (they classify once POs are loaded); note shown | `{"items":1,"poId":null,"note":true}` | `{"items":1,"poId":null,"note":true}` | PASS |
| SES-3 | Migration never modifies its input | `true` | `true` | PASS |
| SES-4 | v3 snapshot round-trip keeps POs, rows, decisions, split archive and the definitions snapshot | `{"same":true,"defs":1}` | `{"same":true,"defs":1}` | PASS |
| SES-5 | Definitions from a backup are only OFFERED: missing ones listed, conflicting ones reported, current table never changed | `{"add":["Tray"],"conflicts":["By 24"],"currentUnchanged":true}` | `{"add":["Tray"],"conflicts":["By 24"],"currentUnchanged":true}` | PASS |
| ZIP-1 | ZIP contains N + 1 files (3 PO workbooks + master), each a valid workbook with the expected sheets | `{"count":4,"valid":true,"names":["TEST Shipment - Oct-2026_MASTER_reconciliation.xlsx","TEST Shipment - Oct-2026_P00343_reconciliation.xlsx","TEST Shipment - Oct-2026_PA001_reconciliation.xlsx","TEST Shipment - Oct-2026_PB002_reconciliation.xlsx"]}` | `{"count":4,"valid":true,"names":["TEST Shipment - Oct-2026_MASTER_reconciliation.xlsx","TEST Shipment - Oct-2026_P00343_reconciliation.xlsx","TEST Shipment - Oct-2026_PA001_reconciliation.xlsx","TEST Shipment - Oct-2026_PB002_reconciliation.xlsx"]}` | PASS |

**143 / 143 passed.**

## Mutation checks

Each mutant re-introduces a forbidden behaviour into a temporary copy of the page; the named tests must fail.

| ID | Mutation | Must fail | Failed | Result |
|---|---|---|---|---|
| MUT-1 | Group identical lines on barcode only | DUP-4, DUP-5, DUP-6 | K1, K1+, V3, P7, REAL-8, DUP-4, DUP-5, DUP-6, DUP-10 | PASS |
| MUT-2 | Group / combine lines ACROSS POs | MPO-8 | MPO-5, MPO-6, MPO-7, MPO-8, MPO-9, MPO-11, MPO-13, MPO-14, SPLIT-3, SPLIT-5, WB-1, WB-2, WB-3, WB-5, WB-7, WB-8, C2-1, C2-2, C2-3, ZIP-1 | PASS |
| MUT-3 | Auto-pick a PO when the product is on several POs | MPO-6 | MPO-6, SPLIT-3, WB-1, WB-2, WB-3, WB-8 | PASS |
| MUT-4 | Treat By <n> as automatic (inferred from the number) | UOM-5, UOM-8 | R2, UOM-5, UOM-8, C1-6 | PASS |
| MUT-5 | Temporary row conversion treated as a global definition | UOM-9 | UOM-9 | PASS |
| MUT-6 | Receipt reference used as the PO reference | REAL-1, REAL-6 | REAL-1, REAL-4, REAL-6, MPO-1, MPO-4, MPO-5, MPO-6, MPO-7, MPO-8, MPO-9, MPO-10, MPO-11, MPO-12, MPO-13, SPLIT-2, SPLIT-5, REIMP-5, WB-1, WB-3, WB-6, WB-7, C2-1, C2-2 | PASS |
| MUT-7 | v1 formal-barcode rule (12 or 13 digits) | R1, P6 | R1, P6 | PASS |
| MUT-8 | Trust a single TOKEN (similar-name) match without confirmation | MATCH-1 | MATCH-1, C2-3 | PASS |
| MUT-11 | Trust a single FUZZY name match without confirmation | MATCH-2 | MATCH-2, C2-1 | PASS |
| MUT-9 | Split allowed when parts do not add up | SPLIT-1 | SPLIT-1 | PASS |
| MUT-12 | Bypass the undefined-Odoo-UOM gate (C1) — remove it | C1-1, C1-2, C1-3, C1-4, C1-5, C1-6, C1-8, C1-10 | C1-1, C1-2, C1-3, C1-4, C1-5, C1-6, C1-8, C1-9, C1-10 | PASS |
| MUT-13 | Gate bypass via the blank-physical-UOM shortcut placed before the gate | C1-1, C1-2, C1-3, C1-4, C1-5 | C1-1, C1-2, C1-3, C1-4, C1-5, C1-6, C1-8, C1-9, C1-10 | PASS |
| MUT-14 | Old misleading automatic-PO wording (C2) | C2-1 | C2-1 | PASS |
| MUT-10 | Upload the ORDERED qty instead of the received qty | P5, DUP-8 | B, E, F, B+, E+, U1+, P5, P9, UOM-9, UOM-11, DUP-8 | PASS |

**14 / 14 mutation checks passed.**

## UI checks (jsdom, real page)

Run: 2026-10-01T12:21:01.210Z

| # | Check | Result |
|---|---|---|
| 1 | page loads with no script errors  | PASS |
| 2 | import dialog opens; PO ref prefilled from the FILE NAME (P00343) | PASS |
| 3 | dialog shows receipt ref BFL/IN/00067 as a separate receipt reference | PASS |
| 4 | vendor is required — PO not added without it | PASS |
| 5 | P00343 listed with vendor, receipt ref and 38 lines | PASS |
| 6 | import preview reports 1 identical duplicate-line group (Benina 5 + 3) | PASS |
| 7 | two POs loaded and listed separately | PASS |
| 8 | "Receiving against PO" selector offers Auto + both POs | PASS |
| 9 | preview: product on two POs with Auto → PO SELECTION REQUIRED | PASS |
| 10 | row added as PO SELECTION REQUIRED, not in upload | PASS |
| 11 | after choosing P00343: READY, IN UPLOAD, 120 CTN10 = 1200 PCS shown | PASS |
| 12 | Benina 6 vs group 5 + 3 → QUANTITY MISMATCH, group shown, no line-selection question | PASS |
| 13 | selected PO stays selected for the next item (sticky) | PASS |
| 14 | split refused when parts (12) do not add up to the row (11) | PASS |
| 15 | split creates two linked rows (one per PO), original replaced | PASS |
| 16 | built-in UOM rules listed (CTN<n>, PCS, Pack of <n>) | PASS |
| 17 | definition without approver refused | PASS |
| 18 | approved definition "By 24 = 24 PCS" saved to the permanent table | PASS |
| 19 | re-import of a loaded PO opens a preview (1 line removed) | PASS |
| 20 | re-import applied after confirmation (37 lines) | PASS |
| 21 | ZIP download produced | PASS |
| 22 | ZIP holds P00343 + PA001 workbooks + master (shipment_P00343_reconciliation.xlsx, shipment_PA001_reconciliation.xlsx, shipment_MASTER_reconciliation.xlsx) | PASS |
| 23 | master PO Summary lists both POs with an overall status | PASS |
| 24 | P00343 after split: 120 + 1 = 121 vs 120 ordered → both rows QUANTITY MISMATCH, upload EMPTY until reviewed | PASS |
| 25 | per-PO and master buttons each write one workbook | PASS |
| 26 | after accepting: P00343 upload = 120 + 1 CTN10 (received qty, Odoo UOM) with PO + receipt ref [["5283001104785",120,"CTN10","P00343","BFL/IN/00067"],["5283001104785",1,"CTN10","P00343","BFL/IN/00067"]] | PASS |
| 27 | session autosaved under the v3 key with POs and a definitions snapshot | PASS |
| 28 | v1 and v2 storage keys never written | PASS |
| 29 | clearing the session keeps approved UOM definitions | PASS |
| 30 | no script errors during main run  | PASS |
| 31 | v2 single-PO browser session migrated: PO from old file name, vendor flagged missing, row READY | PASS |
| 32 | original v2 session left byte-identical | PASS |
| 33 | v1 session backup loads (rows wait for a PO) | PASS |
| 34 | no script errors during migration run  | PASS |

**34 / 34 UI checks passed.**
