// Shipment Manager v2 — engine test suite.
// Run:  node run_tests.js            (needs the "xlsx" npm package resolvable, e.g. NODE_PATH=<dir>/node_modules)
// Loads the <script id="engine"> block straight out of Shipment_Manager_v2.html, so the tested code IS the shipped code.
const fs=require('fs'), path=require('path'), vm=require('vm');
const XLSX=require('xlsx');
const HTML_PATH=process.env.SM_HTML || path.join(__dirname,'..','Shipment_Manager_v2.html');
const OUT_DIR=process.env.SM_OUT || path.join(__dirname,'test_output');
const html=fs.readFileSync(HTML_PATH,'utf8');
const src=html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const ctx={module:{exports:{}}}; vm.createContext(ctx); vm.runInContext(src, ctx);
const E=ctx.module.exports;

// ---------- test PO (header row, "No." first column like the real shipment file) ----------
const PO_AOA=[
  ['No.','BARCODE','ITEM','PCK SIZE','CTN'],
  [1,'6281100410072','ABOU KASS BASMATI RICE 4KG*8','CTN8',10],            // A ready
  [2,'8718951207394','AJAX FLOOR CLEANER FRESH 1250ML * 12','CTN12',15],   // B qty mismatch
  [3,'6212900002143','AL ATTAR ANISE SEEDS TEA 24PCK * 20PCS','CTN20',5],  // C formal, diff barcode same qty
  [4,'P0929','PLEIN SOLEIL CANNED SWEET CORN 24X340G','CTN24',15],         // D non-formal, diff bc same qty
  [5,'8001090421548','ARIEL HDL CLEAN & FRESH 3.3L * 4','CTN4',5],          // E formal, diff bc diff qty
  [6,'P1273','PLEIN SOLEIL BBQ SAUCE 12X350G','CTN12',5],                   // F non-formal, diff bc diff qty
  [7,'5283013330929','PLEIN SOLEIL BEEF STOCK CUBES 24X20G','CTN24',3],     // G missing
  [8,'5449000131805','FIZZ COLA 330ML','By 24',10],                         // I Fizz By 24
  [9,'6223001234567','AL AMIR HUMMUS TAHINI 500G','CTN12',6],               // J Al Amir 500g
  [10,'5285004341501','ELEGANCE STARS SPECIAL EDITION 34G','CTN144',10],   // K1 duplicate PO barcode
  [11,'5285004341501','ELEGANCE STARS WHITE VANILLA 34G','CTN144',10],     // K1 duplicate PO barcode
  [12,'7613034579102','PERRIER SPARKLING WATER 330ML * 24','CTN24',5],      // M ambiguous
  [13,'7613034579119','PERRIER MINERAL WATER 330ML * 24','CTN24',5],        // M ambiguous
  [14,'5285001522651','DERONI ITALIAN RICE 900G * 12','CTN12',5],           // L blank barcode
  [15,'6281100410089','ABOU KASS SELLA RICE 5KG*4','CTN4',8],               // L malformed barcode
  [16,'5000112637922','COCA COLA 330ML','CTN24',4],                         // K2 duplicate physical entry
  [17,'8690146101628','BEBETO MARSHMALLOW 135G','CTN24',4],                 // split lots
  [18,'5283009709623','DER GENERAL PERFUME PINE 1.5L*10','CTN10',6],        // UOM unknown
  [19,'62811004','KASSATLY JALLAB SYRUP 600ML * 12','CTN12',2],             // D3 numeric but 8 digits = NON-formal
];
const po=E.parsePoAoa(PO_AOA);

const ITEMS=[
  {no:1, item:'ABOU KASS BASMATI RICE 4KG*8', physicalBC:'6281100410072', physicalQty:10, expiry:'08/01/2028'},              // A
  {no:2, item:'AJAX FLOOR CLEANER FRESH 1250ML * 12', physicalBC:'8718951207394', physicalQty:12, expiry:'10/01/2027'},      // B
  {no:3, item:'AL ATTAR ANISE SEEDS TEA 24PCK * 20PCS', physicalBC:'6212900025821', physicalQty:5, expiry:'24/04/2029'},     // C
  {no:4, item:'PLEIN SOLEIL CANNED SWEET CORN 24X340G', physicalBC:'5285000835615', physicalQty:15, expiry:'01/12/2029'},    // D
  {no:5, item:'ARIEL HDL CLEAN & FRESH 3.3L * 4', physicalBC:'5283014932597', physicalQty:10, expiry:'01/09/2027'},          // E
  {no:6, item:'PLEIN SOLEIL BBQ SAUCE 12X350G', physicalBC:'5283013330998', physicalQty:4, expiry:'17/12/2027'},             // F
  {no:7, item:'SURPRISE BISCUITS 200G', physicalBC:'5280000000001', physicalQty:3, expiry:'01/01/2027'},                     // H extra
  {no:8, item:'FIZZ COLA 330ML', physicalBC:'5449000131805', physicalQty:40, physicalUom:'Pack of 6', expiry:'01/03/2027'},  // I
  {no:9, item:'AL AMIR HUMMUS TAHINI 500G', physicalBC:'6223001234567', physicalQty:6, physicalSpec:'750g', expiry:'01/05/2027'}, // J
  {no:10, item:'ELEGANCE STARS 34G', physicalBC:'5285004341501', physicalQty:10, expiry:'01/01/2028'},                      // K1
  {no:11, item:'COCA COLA 330ML', physicalBC:'5000112637922', physicalQty:2, expiry:'05/05/2027'},                          // K2 (with 12)
  {no:12, item:'COCA COLA 330ML', physicalBC:'5000112637922', physicalQty:2, expiry:'05/05/2027'},                          // K2 duplicate
  {no:13, item:'DERONI ITALIAN RICE 900G * 12', physicalBC:null, physicalQty:5, expiry:'21/05/2028'},                       // L blank
  {no:14, item:'ABOU KASS SELLA RICE 5KG*4', physicalBC:'6.2811E+12', physicalQty:8, expiry:'01/01/2028'},                  // L malformed
  {no:15, item:'PERRIER WATER 330ML * 24', physicalBC:'7613030000000', physicalQty:5, expiry:'04/01/2027'},                 // M ambiguous
  {no:16, item:'BEBETO MARSHMALLOW 135G', physicalBC:'8690146101628', physicalQty:1, expiry:'01/02/2027'},                  // split lot 1
  {no:17, item:'BEBETO MARSHMALLOW 135G', physicalBC:'8690146101628', physicalQty:3, expiry:'01/03/2027'},                  // split lot 2
  {no:18, item:'DER GENERAL PERFUME PINE 1.5L*10', physicalBC:'5283009709623', physicalQty:12, physicalUom:'Tray', expiry:'01/01/2028'}, // UOM unknown
  {no:19, item:'KASSATLY JALLAB SYRUP 600ML * 12', physicalBC:'5283001000019', physicalQty:2, expiry:'01/06/2027'},          // D3
].map(x=>({decisions:{}, ...x}));

// "By 24" is NOT built-in (rule: By <n> converts only once explicitly defined) — the Fizz fixtures carry an approved definition.
const BY24={key:'BY24', label:'By 24', pcsPerUnit:24, side:'both', approvedBy:'test fixture', approvedOn:'2026-10-01'};
const DEFS=[BY24];
const state={shipmentName:'TEST', poLines:po.lines, items:ITEMS, settings:{blankPhysUomSameAsPo:true}, uomDefinitions:DEFS};
const row=(ev,no)=>ev.rows.find(r=>r.no===no);
const results=[]; let fails=0;
function check(id, name, expected, actualFn){
  let actual, pass;
  try{ actual=actualFn(); pass=JSON.stringify(actual)===JSON.stringify(expected); }
  catch(e){ actual='THREW: '+e.message; pass=false; }
  if(!pass) fails++;
  results.push({id,name,expected,actual,pass});
}
const view=r=>({status:r.statusLabel, case:r.caseNo, odooQty:r.odooQty, inUpload:r.uploadEligible, uploadBC:r.uploadBarcode});

// ---------- rule unit checks ----------
check('R1','Formal barcode = exactly 13 digits (12-digit, 8-digit, 14-digit, alphanumeric, blank = non-formal)',
  [false,true,false,false,false,false,false],
  ()=>['123456789012','6281100410072','12345678','12345678901234','P0929','628110041007A',''].map(E.isFormalBarcode));
check('R2','UOM text → pieces, physical side, no definitions (only CTN<n>, PCS, Pack of <n> built in; nothing guessed)',
  [8,null,6,null,1,null,null,null],
  ()=>['CTN8','By 24','Pack of 6','6 pcs','PCS','CTN','Tray','6X4'].map(u=>{ const r=E.resolveUom(u,'physical',[]); return r?r.pcs:null; }));
check('R3','PO parsed by header names (No. column first)', {n:19, bc:'6281100410072', uom:'CTN8', qty:10, pieces:8},
  ()=>{ const l=po.lines[0]; return {n:po.lines.length, bc:l.barcode, uom:l.uom, qty:l.qty, pieces:E.odooUnit(l,[]).pcs}; });

let ev=E.evaluate(state);

// ---------- A–M initial classification ----------
check('A','Same barcode / same qty → READY, auto, in upload with PO barcode',
  {status:'READY',case:1,odooQty:10,inUpload:true,uploadBC:'6281100410072'}, ()=>view(row(ev,1)));
check('B','Same barcode / different qty → QUANTITY MISMATCH, pending, not uploaded',
  {status:'QUANTITY MISMATCH',case:2,odooQty:12,inUpload:false,uploadBC:null}, ()=>view(row(ev,2)));
check('C','Diff barcode / same qty / formal PO → ADDITIONAL BARCODE, pending confirm',
  {status:'ADDITIONAL BARCODE',case:3,odooQty:5,inUpload:false,uploadBC:null}, ()=>view(row(ev,3)));
check('D','Diff barcode / same qty / non-formal PO → NEW PRODUCT / EXCHANGE REVIEW (no auto choice)',
  {status:'NEW PRODUCT / EXCHANGE BARCODE REVIEW',case:3,odooQty:15,inUpload:false,uploadBC:null}, ()=>view(row(ev,4)));
check('D2','Case D offers exchange AND new product, nothing preselected',
  {options:['exchange','new_product','hold'], value:null}, ()=>{ const d=row(ev,4).decisions.find(x=>x.key==='barcode'); return {options:d.options.map(o=>o.v), value:d.value}; });
check('D3','Numeric 8-digit PO barcode is NON-formal → NEW PRODUCT / EXCHANGE REVIEW (v1 would have said additional)',
  {status:'NEW PRODUCT / EXCHANGE BARCODE REVIEW',case:3,odooQty:2,inUpload:false,uploadBC:null}, ()=>view(row(ev,19)));
check('E','Diff barcode / diff qty / formal PO → ADDITIONAL BARCODE + QTY DIFFERENCE REVIEW',
  {status:'ADDITIONAL BARCODE + QUANTITY DIFFERENCE REVIEW',case:4,odooQty:10,inUpload:false,uploadBC:null}, ()=>view(row(ev,5)));
check('F','Diff barcode / diff qty / non-formal PO → NEW PRODUCT / EXCHANGE + QTY DIFFERENCE REVIEW',
  {status:'NEW PRODUCT / EXCHANGE BARCODE REVIEW + QUANTITY DIFFERENCE REVIEW',case:4,odooQty:4,inUpload:false,uploadBC:null}, ()=>view(row(ev,6)));
check('G','Ordered, not received → MISSING (beef stock cubes)',
  ['PLEIN SOLEIL BEEF STOCK CUBES 24X20G'], ()=>ev.missing.filter(m=>!m.pendingMatch).map(m=>m.line.item).filter(x=>/BEEF/.test(x)));
check('H','Received, not ordered → EXTRA / NOT ON PO, not uploaded',
  {status:'EXTRA / NOT ON PO',case:6,odooQty:null,inUpload:false,uploadBC:null}, ()=>view(row(ev,7)));
check('I','Fizz: Odoo By 24 vs physical pack of 6, 40 packs → 240 pcs → 10 By 24, READY',
  {status:'READY',case:1,odooQty:10,inUpload:true,uploadBC:'5449000131805', factor:0.25, poUom:'By 24', physUom:'Pack of 6', physQty:40},
  ()=>{ const r=row(ev,8); return {...view(r), factor:r.conv.factor, poUom:r.poUom, physUom:r.conv.physUom, physQty:r.it.physicalQty}; });
check('J','Al Amir: same barcode/description, 750g vs PO 500g → WEIGHT / SPEC MISMATCH, not READY',
  {status:'WEIGHT / SPECIFICATION MISMATCH',case:1,odooQty:6,inUpload:false,uploadBC:null}, ()=>view(row(ev,9)));
check('K1','Duplicate PO barcode → PRODUCT MATCH NEEDS CONFIRMATION (no silent pick) + PO issue raised',
  {status:'PRODUCT MATCH — NEEDS CONFIRMATION', inUpload:false, candidates:2, poIssue:true},
  ()=>{ const r=row(ev,10); return {status:r.statusLabel, inUpload:r.uploadEligible, candidates:r.match.candidates.length, poIssue:ev.poIssues.some(x=>/barcode 5285004341501 is on 2 genuinely different lines/.test(x))}; });
check('K2','Duplicate physical entry → 2nd row flagged POSSIBLE DUPLICATE, excluded from line total',
  {first:'QUANTITY MISMATCH', second:'POSSIBLE DUPLICATE ENTRY — NEEDS REVIEW', firstInUpload:false, secondInUpload:false},
  ()=>({first:row(ev,11).statusLabel, second:row(ev,12).statusLabel, firstInUpload:row(ev,11).uploadEligible, secondInUpload:row(ev,12).uploadEligible}));
check('L1','Blank physical barcode (matched by exact name) → BARCODE BLANK / MALFORMED review',
  {status:'BARCODE BLANK / MALFORMED — NEEDS REVIEW',case:null,odooQty:5,inUpload:false,uploadBC:null}, ()=>view(row(ev,13)));
check('L2','Scientific-notation barcode → BARCODE BLANK / MALFORMED review',
  {status:'BARCODE BLANK / MALFORMED — NEEDS REVIEW',inUpload:false, note:true},
  ()=>{ const r=row(ev,14); return {status:r.statusLabel, inUpload:r.uploadEligible, note:/scientific/.test(r.reasons.join())}; });
check('M','Ambiguous product-name match → NEEDS CONFIRMATION, both Perrier lines offered',
  {status:'PRODUCT MATCH — NEEDS CONFIRMATION', inUpload:false, candidates:['PERRIER MINERAL WATER 330ML * 24','PERRIER SPARKLING WATER 330ML * 24']},
  ()=>{ const r=row(ev,15); return {status:r.statusLabel, inUpload:r.uploadEligible, candidates:r.match.candidates.map(c=>c.item).sort()}; });
check('S1','Split lots (1 + 3 vs PO 4) compared as a line total → READY for both rows',
  ['READY','READY'], ()=>[row(ev,16).statusLabel,row(ev,17).statusLabel]);
check('U1','Unknown physical UOM ("Tray") → UOM CONVERSION NEEDS REVIEW, no invented conversion',
  {status:'UOM CONVERSION — NEEDS REVIEW', odooQty:null, inUpload:false}, ()=>{ const r=row(ev,18); return {status:r.statusLabel, odooQty:r.odooQty, inUpload:r.uploadEligible}; });
check('U2','PO/Odoo missing lines awaiting match not reported as plain missing',
  true, ()=>ev.missing.filter(m=>/PERRIER|ELEGANCE/.test(m.line.item)).every(m=>m.pendingMatch));

// ---------- only resolved rows are uploaded ----------
let up=E.buildUpload(ev);
check('V1','Before review: upload holds only auto-READY rows (A, I, split lots)',
  [1,8,16,17], ()=>up.rows.map(r=>r.no).sort((a,b)=>a-b));
check('V2','Upload qty for Fizz is in Odoo UOM (10 By 24), not physical 40 packs',
  {qty:10, uom:'By 24'}, ()=>{ const u=up.rows.find(r=>r.no===8); return {qty:u.qty, uom:u.uom}; });

// ---------- resolve reviews and re-evaluate ----------
const it=no=>ITEMS.find(x=>x.no===no);
it(2).decisions.qty='accept';
it(3).decisions.barcode='additional';
it(4).decisions.barcode='exchange';
it(5).decisions.barcode='additional'; it(5).decisions.qty='accept';
it(6).decisions.barcode='new_product'; it(6).decisions.qty='hold';
it(9).decisions.spec='hold';
it(10).manualLineId=po.lines.find(l=>/SPECIAL EDITION/.test(l.item)).id;
it(12).decisions.dup='hold';
it(13).decisions.physbc='use_po';
it(15).manualLineId=po.lines.find(l=>/SPARKLING/.test(l.item)).id;
it(18).tempPhysPieces=10; it(18).tempPoPieces=10;
ev=E.evaluate(state); up=E.buildUpload(ev);

check('B+','Qty mismatch accepted → uploaded with received qty 12 on PO barcode',
  {inUpload:true, bc:'8718951207394', qty:12}, ()=>{ const r=row(ev,2); return {inUpload:r.uploadEligible, bc:r.uploadBarcode, qty:r.odooQty}; });
check('C+','Additional barcode confirmed → uploaded with PO (Odoo) barcode + listed in Odoo Changes',
  {inUpload:true, bc:'6212900002143'}, ()=>({inUpload:row(ev,3).uploadEligible, bc:row(ev,3).uploadBarcode}));
check('D+','Exchange barcode chosen → uploaded with physical barcode',
  {inUpload:true, bc:'5285000835615'}, ()=>({inUpload:row(ev,4).uploadEligible, bc:row(ev,4).uploadBarcode}));
check('E+','Case 4 formal needs BOTH decisions; both given → uploaded',
  {inUpload:true, bc:'8001090421548', qty:10}, ()=>({inUpload:row(ev,5).uploadEligible, bc:row(ev,5).uploadBarcode, qty:row(ev,5).odooQty}));
check('F+','Any HOLD keeps the row out of the upload',
  {inUpload:false, review:'ON HOLD'}, ()=>({inUpload:row(ev,6).uploadEligible, review:row(ev,6).review}));
check('J+','Spec mismatch on hold → never uploaded',
  false, ()=>row(ev,9).uploadEligible);
check('K1+','Duplicate-PO-barcode row after manual line choice → READY, uploaded',
  {status:'READY', inUpload:true}, ()=>({status:row(ev,10).statusLabel, inUpload:row(ev,10).uploadEligible}));
check('K2+','Duplicate held → excluded from upload; original row (2 vs PO 4) stays QUANTITY MISMATCH',
  {first:'QUANTITY MISMATCH', second:false}, ()=>({first:row(ev,11).statusLabel, second:row(ev,12).uploadEligible}));
check('L1+','Blank barcode + identity confirmed (formal PO) → uploaded with PO barcode',
  {inUpload:true, bc:'5285001522651'}, ()=>({inUpload:row(ev,13).uploadEligible, bc:row(ev,13).uploadBarcode}));
check('L2+','Malformed barcode left unresolved → still not uploaded',
  false, ()=>row(ev,14).uploadEligible);
check('M+','Ambiguous row confirmed to Sparkling line; physical bc differs, PO formal → ADDITIONAL BARCODE pending',
  {status:'ADDITIONAL BARCODE', inUpload:false}, ()=>({status:row(ev,15).statusLabel, inUpload:row(ev,15).uploadEligible}));
check('U1+','User-entered conversion 10/10 → factor 1, qty 12 vs PO 6 → QUANTITY MISMATCH',
  {status:'QUANTITY MISMATCH', odooQty:12, source:'Temporary — this row only'}, ()=>({status:row(ev,18).statusLabel, odooQty:row(ev,18).odooQty, source:row(ev,18).conv.source}));
check('G+','Missing list: beef stock cubes still MISSING; Perrier Mineral missing after the ambiguity is resolved',
  ['PERRIER MINERAL WATER 330ML * 24','PLEIN SOLEIL BEEF STOCK CUBES 24X20G'],
  ()=>ev.missing.filter(m=>/BEEF|PERRIER/.test(m.line.item)).map(m=>m.line.item).sort());

// ---------- upload file validation ----------
const eligibleNos=ev.rows.filter(r=>r.uploadEligible).map(r=>r.no).sort((a,b)=>a-b);
check('V3','Upload rows = exactly the resolved/validated rows',
  [1,2,3,4,5,8,10,13,16,17], ()=>up.rows.map(r=>r.no).sort((a,b)=>a-b));
check('V4','Upload validation has zero FAIL checks',
  0, ()=>up.errors);
check('V5','No unresolved / held / extra / missing row reached the upload',
  true, ()=>up.rows.every(u=>eligibleNos.includes(u.no)) && ![6,7,9,11,12,14,15,18].some(n=>up.rows.some(u=>u.no===n)));

// ---------- workbook round-trip ----------
const wb=E.buildWorkbook(XLSX, state, ev, up);
if(!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR,{recursive:true});
const out=path.join(OUT_DIR,'single_po_reconciliation.xlsx');
XLSX.writeFile(wb, out);
const wb2=XLSX.readFile(out);
check('W1','Workbook contains Summary, Odoo Upload File, Upload Validation, Receiving Detail, Needs Review, Odoo Changes Required, missing',
  true, ()=>['Summary','Odoo Upload File','Upload Validation','Receiving Detail','Needs Review','Odoo Changes Required','missing'].every(s=>wb2.SheetNames.includes(s)));
check('W2','Odoo Upload File columns A–D keep v1 positions; Fizz row = 5449000131805 / 10 / By 24',
  {header:['Barcode','Qty (Odoo UOM)','Qty in Pieces','Expiry Date','Odoo UOM'], fizz:['5449000131805',10,'','01/03/2027','By 24']},
  ()=>{ const a=XLSX.utils.sheet_to_json(wb2.Sheets['Odoo Upload File'],{header:1,defval:''}); return {header:a[0].slice(0,5), fizz:a.find(r=>r[0]==='5449000131805').slice(0,5)}; });
check('W3','Receiving Detail shows every required column',
  true, ()=>{ const h=XLSX.utils.sheet_to_json(wb2.Sheets['Receiving Detail'],{header:1})[0];
    return ['PO Barcode','Physical Barcode','PO Product','PO UOM','Physical UOM','PO Qty','Physical Qty','Conversion Factor','Converted Odoo Qty','Status','Reason','Required Action','Review Status'].every(c=>h.includes(c)); });
check('W4','Odoo Changes Required lists additional barcode, exchange, new product, extra',
  true, ()=>{ const a=XLSX.utils.sheet_to_json(wb2.Sheets['Odoo Changes Required'],{header:1}).map(r=>r[0]).join('|');
    return /ADDITIONAL/.test(a) && /EXCHANGE barcode on existing/.test(a) && /Create NEW PRODUCT/.test(a) && /not on PO/.test(a); });

// ---------- v1 session compatibility ----------
check('X1','v1 import column order still accepted (no header detected)',
  {n:1, item:'FIZZ COLA 330ML', bc:'5449000131805', qty:40, uom:'Pack of 6'},
  ()=>{ const r=E.parseImportAoa([['a','b','c','d','e'],['FIZZ COLA 330ML','5449000131805',40,'01/03/2027','','Pack of 6']]).recs; return {n:r.length,item:r[0].item,bc:r[0].physicalBC,qty:r[0].physicalQty,uom:r[0].physicalUom}; });

// ---------- PRODUCTION READINESS: the nine final business rules (2026-09-30) ----------
const HDR=['BARCODE','ITEM','PCK SIZE','CTN'];
function one(poRows, items){
  const lines=E.parsePoAoa([HDR, ...poRows]).lines;
  const its=items.map((x,i)=>({no:i+1, decisions:{}, expiry:'01/01/2028', ...x}));
  const st={poLines:lines, items:its, settings:{}, uomDefinitions:DEFS};
  return {st, lines, its, ev:()=>E.evaluate(st)};
}
const FIZZ=['5449000131805','FIZZ COLA 330ML','By 24',10];

// Rule 1 — explicitly defined UOMs convert; undefined UOMs (CTN, Tray, 6X4) → NEEDS REVIEW; nothing invented
check('P1a','Rule 1: physical "CTN" (count not defined) vs Odoo By 24 → UOM NEEDS REVIEW, no qty',
  ['UOM CONVERSION — NEEDS REVIEW',null,false], ()=>{ const t=one([FIZZ],[{item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:10,physicalUom:'CTN'}]); const r=t.ev().rows[0]; return [r.statusLabel,r.odooQty,r.uploadEligible]; });
check('P1b','Rule 1: physical "Tray" → UOM NEEDS REVIEW',
  ['UOM CONVERSION — NEEDS REVIEW',null], ()=>{ const r=one([FIZZ],[{item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:10,physicalUom:'Tray'}]).ev().rows[0]; return [r.statusLabel,r.odooQty]; });
check('P1c','Rule 1: physical "6X4" → UOM NEEDS REVIEW (not guessed as 24)',
  ['UOM CONVERSION — NEEDS REVIEW',null], ()=>{ const r=one([FIZZ],[{item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:10,physicalUom:'6X4'}]).ev().rows[0]; return [r.statusLabel,r.odooQty]; });
check('P1d','Rule 1: Odoo UOM "CTN" (undefined) + physical "Pack of 6" → UOM NEEDS REVIEW',
  ['UOM CONVERSION — NEEDS REVIEW',null], ()=>{ const r=one([['5449000131805','FIZZ COLA 330ML','CTN',10]],[{item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:40,physicalUom:'Pack of 6'}]).ev().rows[0]; return [r.statusLabel,r.odooQty]; });
check('P1e','Rule 1: once the user defines the "Tray" conversion (6 pcs/tray, 24 pcs/By 24) it converts: 40 trays → 10',
  ['READY',10,true,'Temporary — this row only'], ()=>{ const t=one([FIZZ],[{item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:40,physicalUom:'Tray',tempPhysPieces:6,tempPoPieces:24}]); const r=t.ev().rows[0]; return [r.statusLabel,r.odooQty,r.uploadEligible,r.conv.source]; });

// Rule 2 — blank physical UOM = PO/Odoo UOM (fixed; a stored setting cannot switch it off)
check('P2','Rule 2: blank physical UOM → treated as Odoo UOM (factor 1), even if an old session carries the setting off',
  ['READY',10,1,true], ()=>{ const t=one([FIZZ],[{item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:10}]); t.st.settings={blankPhysUomSameAsPo:false}; const r=t.ev().rows[0]; return [r.statusLabel,r.odooQty,r.conv.factor,r.uploadEligible]; });

// Rule 3 — deterministic valid conversion: no extra confirmation, calculation shown
check('P3','Rule 3: Fizz 40 × Pack of 6 → 10 By 24, READY, no review decision, calculation shown',
  {status:'READY',review:'AUTO — no review needed',decisions:0,inUpload:true,qty:10,calc:'40 × 6 pcs = 240 pcs ÷ 24 pcs per By 24 = 10'},
  ()=>{ const r=one([FIZZ],[{item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:40,physicalUom:'Pack of 6'}]).ev().rows[0];
    return {status:r.statusLabel,review:r.review,decisions:r.decisions.filter(d=>d.required).length,inUpload:r.uploadEligible,qty:r.odooQty,calc:r.conv.explain}; });

// Rule 4 — additional barcode requires confirmation
check('P4','Rule 4: additional barcode NOT uploaded until confirmed; after confirmation uploaded on the PO barcode',
  [false,true,'5449000131805'], ()=>{ const t=one([FIZZ],[{item:'FIZZ COLA 330ML',physicalBC:'5449000999999',physicalQty:10}]);
    const a=t.ev().rows[0].uploadEligible; t.its[0].decisions.barcode='additional'; const r=t.ev().rows[0]; return [a,r.uploadEligible,r.uploadBarcode]; });

// Rule 5 — quantity difference: upload the RECEIVED qty converted to Odoo UOM, never the ordered qty
check('P5','Rule 5: ordered 10 By 24, received 36 × Pack of 6 = 9 By 24 → after acceptance upload 9 (not 10, not 36)',
  {status:'QUANTITY MISMATCH',before:false,after:true,uploadQty:9}, ()=>{ const t=one([FIZZ],[{item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:36,physicalUom:'Pack of 6'}]);
    const r0=t.ev().rows[0]; t.its[0].decisions.qty='accept'; const up=E.buildUpload(t.ev()); return {status:r0.statusLabel,before:r0.uploadEligible,after:up.rows.length===1,uploadQty:up.rows[0]&&up.rows[0].qty}; });

// Rule 6 — formal = exactly 13 digits (evaluated on the PO barcode)
check('P6','Rule 6: PO barcode 13 digits → ADDITIONAL BARCODE; 12, 14, 8 digits and alphanumeric → NEW PRODUCT / EXCHANGE REVIEW',
  ['ADDITIONAL BARCODE','NEW PRODUCT / EXCHANGE BARCODE REVIEW','NEW PRODUCT / EXCHANGE BARCODE REVIEW','NEW PRODUCT / EXCHANGE BARCODE REVIEW','NEW PRODUCT / EXCHANGE BARCODE REVIEW'],
  ()=>['5449000131805','544900013180','15449000131805','54490001','FIZ001'].map(bc=>one([[bc,'FIZZ COLA 330ML','By 24',10]],[{item:'FIZZ COLA 330ML',physicalBC:'5000000000017',physicalQty:10}]).ev().rows[0].statusLabel));

// Rule 7 — duplicate PO barcode → manual PO line selection
check('P7','Rule 7: barcode on 2 PO lines → manual selection required; chosen line (qty 5) is used, the other becomes MISSING',
  {before:'PRODUCT MATCH — NEEDS CONFIRMATION',cands:2,after:'READY',poQty:5,missing:['FIZZ COLA 330ML MULTIPACK']},
  ()=>{ const t=one([['5449000131805','FIZZ COLA 330ML','By 24',5],['5449000131805','FIZZ COLA 330ML MULTIPACK','By 24',10]],[{item:'FIZZ',physicalBC:'5449000131805',physicalQty:5}]);
    const r0=t.ev().rows[0]; t.its[0].manualLineId=t.lines[0].id; const e=t.ev(); const r=e.rows[0];
    return {before:r0.statusLabel,cands:r0.match.candidates.length,after:r.statusLabel,poQty:r.poQty,missing:e.missing.map(m=>m.line.item)}; });

// Rule 8 — different weight → HOLD / DO NOT UPLOAD until resolved
check('P8','Rule 8: same barcode/qty but 750g vs PO 500g → WEIGHT/SPEC MISMATCH, not uploaded (pending and on hold)',
  {status:'WEIGHT / SPECIFICATION MISMATCH',pending:false,held:false,heldReview:'ON HOLD'},
  ()=>{ const t=one([['6223001234567','AL AMIR HUMMUS TAHINI 500G','CTN12',6]],[{item:'AL AMIR HUMMUS TAHINI 500G',physicalBC:'6223001234567',physicalQty:6,physicalSpec:'750g'}]);
    const r0=t.ev().rows[0]; t.its[0].decisions.spec='hold'; const r1=t.ev().rows[0]; return {status:r0.statusLabel,pending:r0.uploadEligible,held:r1.uploadEligible,heldReview:r1.review}; });

// Rule 9 — fractional Odoo quantity needs explicit acceptance
check('P9','Rule 9: 38 × Pack of 6 = 228 pcs = 9.5 By 24 → needs acceptance; after acceptance uploads 9.5',
  {status:'UOM CONVERSION — NEEDS REVIEW',before:false,after:true,qty:9.5},
  ()=>{ const t=one([FIZZ],[{item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:38,physicalUom:'Pack of 6'}]);
    const r0=t.ev().rows[0]; t.its[0].decisions.fraction='accept'; t.its[0].decisions.qty='accept'; const up=E.buildUpload(t.ev());
    return {status:r0.statusLabel,before:r0.uploadEligible,after:up.rows.length===1,qty:up.rows[0]&&up.rows[0].qty}; });
check('P9b','Rule 9: fractional accepted but quantity difference not yet accepted → still not uploaded',
  false, ()=>{ const t=one([FIZZ],[{item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:38,physicalUom:'Pack of 6'}]); t.its[0].decisions.fraction='accept'; return t.ev().rows[0].uploadEligible; });

// ---------- UOM module (confirmed rules 2026-10-01) ----------
const R=(u,side,defs)=>{ const r=E.resolveUom(u,side,defs||[]); return r?r.pcs:null; };
check('UOM-1','Built-in CTN<n> on both sides and exact PCS: CTN10=10, CTN14=14, CTN5=5, PCS=1',
  [10,14,5,1,10,14,5,1], ()=>[...['CTN10','CTN14','CTN5','PCS'].map(u=>R(u,'odoo')), ...['CTN10','CTN14','CTN5','PCS'].map(u=>R(u,'physical'))]);
check('UOM-2','Only exact PCS: PC, EA, UNIT, UNITS, PIECES, PI are NOT built in',
  [null,null,null,null,null,null], ()=>['PC','EA','UNIT','UNITS','PIECES','PI'].map(u=>R(u,'physical')));
check('UOM-3','CTNP is undefined: CTNP10, CTNP12, CTNP 6x4 → no conversion (both sides)',
  [null,null,null,null], ()=>[R('CTNP10','odoo'),R('CTNP12','physical'),R('CTNP 6x4','physical'),R('CTNP10','physical')]);
check('UOM-4','Bare CTN, Tray, 6X4, BOX12, PK6, CASE12, X6 → no conversion',
  [null,null,null,null,null,null,null], ()=>['CTN','Tray','6X4','BOX12','PK6','CASE12','X6'].map(u=>R(u,'physical')));
check('UOM-5','By 24 is NOT inferred from the number; converts only once an approved definition exists',
  [null,null,24,24], ()=>[R('By 24','odoo'),R('By 24','physical'),R('By 24','odoo',DEFS),R('BY24','physical',DEFS)]);
check('UOM-6','Pack of <n> is built in on the PHYSICAL side only; as an Odoo UOM it needs an approved odoo definition',
  [6,12,null,6], ()=>[R('Pack of 6','physical'),R('Pack of 12','physical'),R('Pack of 6','odoo'),R('Pack of 6','odoo',[{key:'P6',label:'Pack of 6',pcsPerUnit:6,side:'odoo',approvedBy:'x'}])]);
check('UOM-7','Definition side is respected (odoo-only definition does not apply to physical)',
  [12,null], ()=>{ const d=[{key:'TR',label:'Tray',pcsPerUnit:12,side:'odoo',approvedBy:'x'}]; return [R('Tray','odoo',d),R('Tray','physical',d)]; });
check('UOM-8','Fizz WITHOUT the By 24 definition → UOM CONVERSION NEEDS REVIEW (no guess), not uploaded',
  ['UOM CONVERSION — NEEDS REVIEW',null,false], ()=>{ const lines=E.parsePoAoa([HDR,FIZZ]).lines;
    const e=E.evaluate({poLines:lines, items:[{no:1,decisions:{},item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:40,physicalUom:'Pack of 6'}]}, []); const r=e.rows[0]; return [r.statusLabel,r.odooQty,r.uploadEligible]; });
check('UOM-9','Temporary row conversion affects ONLY its row and never the definitions table',
  {row1temp:true, row1qty:20, row2:'UOM CONVERSION — NEEDS REVIEW', defsAfter:1},
  ()=>{ const defs=[BY24]; const lines=E.parsePoAoa([HDR,['5449000131805','FIZZ COLA 330ML','By 24',25]]).lines;
    const items=[{no:1,decisions:{},item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:20,physicalUom:'Tray',tempPhysPieces:24,tempPoPieces:24,expiry:'a'},
                 {no:2,decisions:{},item:'FIZZ COLA 330ML',physicalBC:'5449000131805',physicalQty:5,physicalUom:'Tray',expiry:'b'}];
    const e=E.evaluate({poLines:lines, items}, defs); return {row1temp:e.rows[0].conv.temporary, row1qty:e.rows[0].odooQty, row2:e.rows[1].statusLabel, defsAfter:defs.length}; });
check('UOM-10','The "* 10" in a product description is never a conversion source (Odoo UOM blank → undefined)',
  [null,null], ()=>{ const l=E.parsePoAoa([HDR,['5283001104785','ABIDO SEVEN SPICES 50G * 10 [BL00133]','',12]]).lines[0];
    const e=E.evaluate({poLines:[l], items:[{no:1,decisions:{},item:l.item,physicalBC:'5283001104785',physicalQty:120,physicalUom:'PCS'}]}, []); return [E.odooUnit(l,[]), e.rows[0].odooQty]; });
check('UOM-11','PCS chain: 120 CTN10 received as 1,200 PCS → 120 CTN10; 1,195 PCS → 119.5 (fractional → review)',
  [120,1200,'READY',119.5,'UOM CONVERSION — NEEDS REVIEW'], ()=>{ const lines=E.parsePoAoa([HDR,['5283001104785','ABIDO SEVEN SPICES 50G * 10 [BL00133]','CTN10',120]]).lines;
    const a=E.evaluate({poLines:lines, items:[{no:1,decisions:{},item:'x',physicalBC:'5283001104785',physicalQty:1200,physicalUom:'PCS'}]},[]).rows[0];
    const b=E.evaluate({poLines:lines, items:[{no:1,decisions:{},item:'x',physicalBC:'5283001104785',physicalQty:1195,physicalUom:'PCS'}]},[]).rows[0];
    return [a.odooQty,a.conv.physPcs,a.statusLabel,b.odooQty,b.statusLabel]; });
check('UOM-12','Validation of a permanent definition: built-ins cannot be redefined, approver required, duplicate refused, Pack of <n> only as odoo',
  [true,true,true,true,false], ()=>{ const v=d=>E.validateUomDefinition(d,[BY24]).length>0;
    return [v({label:'CTN10',pcsPerUnit:10,side:'both',approvedBy:'a'}), v({label:'Tray',pcsPerUnit:6,side:'both',approvedBy:''}), v({label:'By 24',pcsPerUnit:24,side:'both',approvedBy:'a'}), v({label:'Pack of 6',pcsPerUnit:6,side:'both',approvedBy:'a'}), v({label:'Pack of 6',pcsPerUnit:6,side:'odoo',approvedBy:'a'})]; });

// =====================================================================================================
// MULTI-PO (phases 2–4): real files, identical-duplicate groups, multiple POs, split row, re-import
// =====================================================================================================
const MP_HDR=['Stock Moves/Barcode','Stock Moves/Product','Stock Moves/Quantity','Stock Moves/Allowed Uom','Stock Moves/Reference'];
function shipment(){ return {shipmentName:'T', pos:[], items:[], nextNo:1, uomDefinitions:DEFS}; }
function loadPo(st, fileName, rows, vendor, hdr){
  const parsed=E.parsePoAoa([hdr||MP_HDR, ...rows]); const d=E.buildPoDrafts(parsed,fileName)[0];
  const r=E.addPo(st,d,{vendor:vendor===undefined?'Vendor '+fileName:vendor}); if(r.errors) throw new Error(r.errors.join('; ')); return r.po; }
function recv(st, x){ const it={no:st.nextNo++, decisions:{}, expiry:'01/01/2028', ...x}; st.items.push(it); return it; }
const ev3=st=>E.evaluate(st, DEFS);
const rowOf=(e,no)=>e.rows.find(r=>r.no===no);
const readAoa=f=>{ const wb=XLSX.readFile(path.join(__dirname,'fixtures',f)); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:null}); };
const P343=readAoa('P00343.xlsx'), SEP=readAoa('shipment_sep_2026.xlsx');

// ---------- REAL: P00343 receipt export ----------
const p343parsed=E.parsePoAoa(P343), p343draft=E.buildPoDrafts(p343parsed,'P00343.xlsx')[0];
check('REAL-1','P00343: 38 lines; PO ref P00343 from the FILENAME; receipt ref BFL/IN/00067 kept separately, never the PO ref',
  {lines:38, ref:'P00343', refSource:'filename', receiptRefs:['BFL/IN/00067'], uomCol:true, poColumn:false},
  ()=>({lines:p343parsed.lines.length, ref:p343draft.ref, refSource:p343draft.refSource, receiptRefs:p343draft.receiptRefs, uomCol:p343parsed.map.uom!==undefined, poColumn:p343parsed.hasPoColumn}));
check('REAL-2','P00343 line 1: Allowed Uom CTN10 is the Odoo UOM; 120 CTN10 = 1,200 PCS; internal ref BL00133',
  {bc:'5283001104785', uom:'CTN10', qty:120, pcsPerUnit:10, qtyPcs:1200, internalRef:'BL00133', receiptRef:'BFL/IN/00067'},
  ()=>{ const l=p343parsed.lines[0]; const u=E.odooUnit(l,[]); return {bc:l.barcode, uom:l.uom, qty:l.qty, pcsPerUnit:u.pcs, qtyPcs:l.qty*u.pcs, internalRef:l.internalRef, receiptRef:l.receiptRef}; });
check('REAL-3','P00343: every Allowed Uom resolves by the built-in CTN<n> rule; all 38 barcodes formal; no duplicates → 38 receiving targets',
  {uoms:['CTN10','CTN14','CTN5'], resolved:38, formal:38, targets:38, groups:0},
  ()=>{ const st=shipment(); E.addPo(st,p343draft,{vendor:'V'}); const e=ev3(st);
    return {uoms:[...new Set(p343parsed.lines.map(l=>l.uom))], resolved:p343parsed.lines.filter(l=>E.odooUnit(l,[])).length, formal:p343parsed.lines.filter(l=>E.isFormalBarcode(l.barcode)).length, targets:e.targets.length, groups:e.targets.filter(t=>t.isGroup).length}; });
check('REAL-4','P00343: ABIDO SEVEN SPICES received 120 (UOM blank) → READY 120 CTN10 = 1,200 PCS; upload carries PO P00343 + receipt ref',
  {status:'READY', odooQty:120, physPcs:1200, poRef:'P00343', upload:{barcode:'5283001104785', qty:120, uom:'CTN10', poRef:'P00343', receiptRef:'BFL/IN/00067'}},
  ()=>{ const st=shipment(); E.addPo(st,p343draft,{vendor:'ABIDO supplier'}); recv(st,{item:'ABIDO SEVEN SPICES (MIX SPICE) 50G * 10',physicalBC:'5283001104785',physicalQty:120});
    const e=ev3(st); const r=e.rows[0]; const u=E.buildUpload(e, st.pos[0].poId).rows[0];
    return {status:r.statusLabel, odooQty:r.odooQty, physPcs:r.conv.physPcs, poRef:r.poRef, upload:{barcode:u.barcode, qty:u.qty, uom:u.uom, poRef:u.poRef, receiptRef:u.receiptRef}}; });
check('REAL-5','P00343: same line received as 1,200 PCS → 120 CTN10, READY (conversion through PCS)',
  ['READY',120], ()=>{ const st=shipment(); E.addPo(st,p343draft,{vendor:'V'}); recv(st,{item:'x',physicalBC:'5283001104785',physicalQty:1200,physicalUom:'PCS'}); const r=ev3(st).rows[0]; return [r.statusLabel,r.odooQty]; });
check('REAL-6','Receipt ref is never used as the PO ref: without a filename the PO ref stays blank and the import is refused',
  {draftRef:'', errors:['PO reference is required']}, ()=>{ const d=E.buildPoDrafts(p343parsed,'')[0]; const st=shipment(); return {draftRef:d.ref, errors:E.addPo(st,d,{vendor:'V'}).errors}; });
const sepParsed=E.parsePoAoa(SEP);
check('REAL-7','shipment_sep_2026 (old layout BARCODE/ITEM/PCK SIZE/CTN) still parses: 571 lines, UOM from PCK SIZE, qty from CTN',
  {lines:571, first:{bc:'6281100410072', uom:'CTN8', qty:10}}, ()=>{ const l=sepParsed.lines[0]; return {lines:sepParsed.lines.length, first:{bc:l.barcode, uom:l.uom, qty:l.qty}}; });
check('REAL-8','shipment_sep_2026 as ONE PO: exactly 8 identical-duplicate groups and 1 genuinely-different duplicate barcode (Deroni)',
  {groups:8, different:['52850015220176'], benina:{qty:8, rows:[90,91]}},
  ()=>{ const st=shipment(); E.addPo(st,E.buildPoDrafts(sepParsed,'shipment_sep_2026.xlsx')[0],{vendor:'V'});
    const e=ev3(st); const g=e.targets.filter(t=>t.isGroup); const b=g.find(t=>/BENINA QUINOA BLACK 500G/.test(t.item));
    const idx=E.buildPoIndex(e.targets); return {groups:g.length, different:idx.dupBarcodes.map(x=>x[0]), benina:{qty:b.qty, rows:b.lines.map(l=>l.row)}}; });

// ---------- DUP: identical duplicate lines within one PO ----------
const BEN=['5285001032167','BENINA QUINOA BLACK 500G * 20 [BL01001]'];
function benPo(qtys, uoms){ const st=shipment(); loadPo(st,'PO001.xlsx', qtys.map((q,i)=>[BEN[0],BEN[1],q,(uoms&&uoms[i])||'CTN20','WH/IN/1']), 'Benina'); return st; }
check('DUP-1','Benina 5 + 3 ordered, 6 received → one group, ordered 8, difference −2, QUANTITY MISMATCH, NO line-selection question',
  {status:'QUANTITY MISMATCH', ordered:8, received:6, diff:-2, isGroup:true, lines:2, decisions:['qty']},
  ()=>{ const st=benPo([5,3]); recv(st,{item:BEN[1],physicalBC:BEN[0],physicalQty:6}); const r=ev3(st).rows[0];
    return {status:r.statusLabel, ordered:r.line.qty, received:r.group.total, diff:r.group.total-r.line.qty, isGroup:r.isGroup, lines:r.line.lines.length, decisions:r.decisions.map(d=>d.key)}; });
check('DUP-2','Group 5 + 3: 8 received in one row → READY; 8 received as two lots (5 + 3) → both READY',
  ['READY','READY','READY'], ()=>{ const a=benPo([5,3]); recv(a,{item:BEN[1],physicalBC:BEN[0],physicalQty:8});
    const b=benPo([5,3]); recv(b,{item:BEN[1],physicalBC:BEN[0],physicalQty:5,expiry:'01/01/2028'}); recv(b,{item:BEN[1],physicalBC:BEN[0],physicalQty:3,expiry:'01/02/2028'});
    return [ev3(a).rows[0].statusLabel, ...ev3(b).rows.map(r=>r.statusLabel)]; });
check('DUP-3','Group of THREE identical lines (2 + 2 + 2), 6 received → READY',
  ['READY',6,3], ()=>{ const st=benPo([2,2,2]); recv(st,{item:BEN[1],physicalBC:BEN[0],physicalQty:6}); const r=ev3(st).rows[0]; return [r.statusLabel,r.line.qty,r.line.lines.length]; });
check('DUP-4','Same barcode + name but DIFFERENT UOM (CTN20 vs CTN10) → genuinely separate → manual line choice',
  {status:'PRODUCT MATCH — NEEDS CONFIRMATION', candidates:2}, ()=>{ const st=benPo([5,3],['CTN20','CTN10']); recv(st,{item:BEN[1],physicalBC:BEN[0],physicalQty:8}); const r=ev3(st).rows[0]; return {status:r.statusLabel, candidates:r.match.candidates.length}; });
check('DUP-5','Same barcode but different WEIGHT in the name (500G vs 1K) → manual line choice',
  'PRODUCT MATCH — NEEDS CONFIRMATION', ()=>{ const st=shipment(); loadPo(st,'PO002.xlsx',[[BEN[0],'BENINA QUINOA BLACK 500G * 20',5,'CTN20','R'],[BEN[0],'BENINA QUINOA BLACK 1K * 20',3,'CTN20','R']]);
    recv(st,{item:'BENINA',physicalBC:BEN[0],physicalQty:8}); return ev3(st).rows[0].statusLabel; });
check('DUP-6','Same barcode + same name but different internal ref [BL01001] vs [BL01002] → manual line choice',
  'PRODUCT MATCH — NEEDS CONFIRMATION', ()=>{ const st=shipment(); loadPo(st,'PO003.xlsx',[[BEN[0],'BENINA QUINOA BLACK 500G * 20 [BL01001]',5,'CTN20','R'],[BEN[0],'BENINA QUINOA BLACK 500G * 20 [BL01002]',3,'CTN20','R']]);
    recv(st,{item:'BENINA',physicalBC:BEN[0],physicalQty:8}); return ev3(st).rows[0].statusLabel; });
check('DUP-7','Group with UOM conversion: 5 + 3 CTN20 ordered, 160 PCS received → 8 CTN20 → READY',
  ['READY',8,160], ()=>{ const st=benPo([5,3]); recv(st,{item:BEN[1],physicalBC:BEN[0],physicalQty:160,physicalUom:'PCS'}); const r=ev3(st).rows[0]; return [r.statusLabel,r.odooQty,r.conv.physPcs]; });
check('DUP-8','Group difference accepted → ONE upload row with the RECEIVED qty (6), not the ordered 8, not per line',
  [{barcode:BEN[0], qty:6}], ()=>{ const st=benPo([5,3]); const it=recv(st,{item:BEN[1],physicalBC:BEN[0],physicalQty:6}); it.decisions.qty='accept'; return E.buildUpload(ev3(st)).rows.map(u=>({barcode:u.barcode, qty:u.qty})); });
check('DUP-9','Group never received → ONE missing entry listing both original lines (5 and 3)',
  {missing:1, lineQtys:[5,3], ordered:8}, ()=>{ const st=benPo([5,3]); const e=ev3(st); return {missing:e.missing.length, lineQtys:e.missing[0].line.lines.map(l=>l.qty), ordered:e.missing[0].line.qty}; });
check('DUP-10','Real file: OMO LIQ LAVENDER (11 + 10) received 21 → READY; Deroni 14-digit shared barcode → manual line choice',
  ['READY','PRODUCT MATCH — NEEDS CONFIRMATION'], ()=>{ const st=shipment(); E.addPo(st,E.buildPoDrafts(sepParsed,'shipment_sep_2026.xlsx')[0],{vendor:'V'});
    recv(st,{item:'OMO',physicalBC:'6111026123322',physicalQty:21}); recv(st,{item:'DERONI',physicalBC:'52850015220176',physicalQty:5}); return ev3(st).rows.map(r=>r.statusLabel); });

// ---------- MPO: multiple POs in one shipment ----------
const X1=['5449000000011','PRODUCT ALPHA 330ML * 24 [BLA01]'], X2=['5449000000028','PRODUCT BETA 1L * 12 [BLB01]'];
function twoPos(aRows, bRows){ const st=shipment(); const a=loadPo(st,'PA001.xlsx',aRows,'Vendor A'); const b=loadPo(st,'PB002.xlsx',bRows,'Vendor B'); return {st,a,b}; }
check('MPO-1','Two PO files → two independent POs (ref, vendor, receipt ref, own line ids)',
  {refs:['PA001','PB002'], vendors:['Vendor A','Vendor B'], receipt:[['IN/A'],['IN/B']], idsUnique:true},
  ()=>{ const {st}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X1[0],X1[1],3,'CTN24','IN/B']]); const ids=st.pos.flatMap(p=>p.lines.map(l=>l.id));
    return {refs:st.pos.map(p=>p.ref), vendors:st.pos.map(p=>p.vendor), receipt:st.pos.map(p=>p.receiptRefs), idsUnique:new Set(ids).size===ids.length}; });
check('MPO-2','A file WITH an explicit PO column is split by that column (one file → 2 POs)',
  [['P1','column',1],['P2','column',2]], ()=>{ const hdr=['Barcode','Product','Quantity','Allowed Uom','Source Document'];
    const ds=E.buildPoDrafts(E.parsePoAoa([hdr,[X1[0],X1[1],5,'CTN24','P1'],[X2[0],X2[1],2,'CTN12','P2'],[X1[0],X1[1],1,'CTN24','P2']]),'combined.xlsx'); return ds.map(d=>[d.ref,d.refSource,d.lines.length]); });
check('MPO-3','PO column disagreeing with the filename → conflict flagged for the user (import must stop and ask)',
  {column:'P00999', filename:'P00343'}, ()=>{ const hdr=['Barcode','Product','Quantity','Allowed Uom','Purchase Order'];
    return E.buildPoDrafts(E.parsePoAoa([hdr,[X1[0],X1[1],5,'CTN24','P00999']]),'P00343.xlsx')[0].conflict; });
check('MPO-4','Vendor is required; the same PO ref cannot be loaded twice (re-import instead)',
  [['Vendor is required'],['PO PA001 is already loaded — use Re-import to replace it']], ()=>{ const st=shipment(); const d=E.buildPoDrafts(E.parsePoAoa([MP_HDR,[X1[0],X1[1],5,'CTN24','R']]),'PA001.xlsx')[0];
    const e1=E.addPo(st,d,{vendor:''}).errors; E.addPo(st,d,{vendor:'V'}); return [e1, E.addPo(st,d,{vendor:'V'}).errors]; });
check('MPO-5','Product on exactly ONE loaded PO, no PO selected → linked automatically to that PO and READY',
  {status:'READY', poRef:'PB002', auto:true}, ()=>{ const {st}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X2[0],X2[1],3,'CTN12','IN/B']]);
    recv(st,{item:X2[1],physicalBC:X2[0],physicalQty:3}); const r=ev3(st).rows[0]; return {status:r.statusLabel, poRef:r.poRef, auto:r.notes.some(n=>/determined automatically/.test(n))}; });
check('MPO-6','Same barcode on PO A (5) and PO B (3), no PO selected → PO SELECTION REQUIRED, 2 candidates, NOT combined, NOT uploaded',
  {status:'PO SELECTION REQUIRED', candidates:['PA001','PB002'], odooQty:null, inUpload:false, missingPending:2},
  ()=>{ const {st}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X1[0],X1[1],3,'CTN24','IN/B']]); recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:8});
    const e=ev3(st); const r=e.rows[0]; return {status:r.statusLabel, candidates:r.poCandidates.map(c=>c.ref), odooQty:r.odooQty, inUpload:r.uploadEligible, missingPending:e.missing.filter(m=>m.pendingMatch).length}; });
check('MPO-7','Same product on A and B, receiver selected PO A, received 5 → compared ONLY with A (5) → READY; B stays missing',
  {status:'READY', poRef:'PA001', missing:['PB002']}, ()=>{ const {st,a}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X1[0],X1[1],3,'CTN24','IN/B']]);
    recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:5,poId:a.poId,poSource:'selected'}); const e=ev3(st); return {status:e.rows[0].statusLabel, poRef:e.rows[0].poRef, missing:e.missing.map(m=>m.poRef)}; });
check('MPO-8','Identical lines on DIFFERENT POs are never grouped: A 5 + B 3, 8 received against A → A QUANTITY MISMATCH (8 vs 5), B MISSING',
  {status:'QUANTITY MISMATCH', ordered:5, received:8, targets:2, missing:['PB002']}, ()=>{ const {st,a}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X1[0],X1[1],3,'CTN24','IN/B']]);
    recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:8,poId:a.poId,poSource:'selected'}); const e=ev3(st); const r=e.rows[0];
    return {status:r.statusLabel, ordered:r.line.qty, received:r.group.total, targets:e.targets.length, missing:e.missing.map(m=>m.poRef)}; });
check('MPO-9','Selected PO A lacks the product but PO B has it → PO MISMATCH review (no silent switch); choosing B → READY on B',
  {before:'PO MISMATCH — NEEDS REVIEW', cands:['PB002'], beforeUpload:false, after:'READY', afterPo:'PB002'}, ()=>{ const {st,a,b}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X2[0],X2[1],3,'CTN12','IN/B']]);
    const it=recv(st,{item:X2[1],physicalBC:X2[0],physicalQty:3,poId:a.poId,poSource:'selected'}); const r0=ev3(st).rows[0];
    E.setRowPo(st,it.no,b.poId); const r1=ev3(st).rows[0]; return {before:r0.statusLabel, cands:r0.poCandidates.map(c=>c.ref), beforeUpload:r0.uploadEligible, after:r1.statusLabel, afterPo:r1.poRef}; });
check('MPO-10','PO MISMATCH resolved as "keep on selected PO as extra" → EXTRA on PO A, not uploaded',
  {status:'EXTRA / NOT ON PO', poRef:'PA001', inUpload:false}, ()=>{ const {st,a}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X2[0],X2[1],3,'CTN12','IN/B']]);
    const it=recv(st,{item:X2[1],physicalBC:X2[0],physicalQty:3,poId:a.poId,poSource:'selected'}); E.setRowPo(st,it.no,'__keep_extra__'); const r=ev3(st).rows[0]; return {status:r.statusLabel, poRef:r.poRef, inUpload:r.uploadEligible}; });
check('MPO-11','Extra received against a selected PO belongs to that PO; extra with no PO is unassigned',
  [['EXTRA / NOT ON PO','PA001'],['EXTRA / NOT ON PO',null]], ()=>{ const {st,a}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X2[0],X2[1],3,'CTN12','IN/B']]);
    recv(st,{item:'UNKNOWN THING',physicalBC:'5000000000001',physicalQty:1,poId:a.poId}); recv(st,{item:'OTHER UNKNOWN',physicalBC:'5000000000002',physicalQty:1}); return ev3(st).rows.map(r=>[r.statusLabel,r.poRef]); });
check('MPO-12','Bulk import PO column: a loaded ref links the row; an unknown ref → PO SELECTION REQUIRED ("not loaded")',
  {recs:['PA001','P99999'], known:'PA001', unknownStatus:'PO SELECTION REQUIRED', note:true}, ()=>{ const {st}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X1[0],X1[1],3,'CTN24','IN/B']]);
    const recs=E.parseImportAoa([['Product','Physical Barcode','Physical Qty','PO'],[X1[1],X1[0],5,'PA001'],[X1[1],X1[0],3,'P99999']]).recs;
    for(const rc of recs){ const pid=E.resolvePoRef(st,rc.poRef); recv(st,{...rc, poId:pid, poSource:pid?'import-column':null, poRefText:pid?null:rc.poRef}); }
    const e=ev3(st); return {recs:recs.map(r=>r.poRef), known:e.rows[0].poRef, unknownStatus:e.rows[1].statusLabel, note:e.rows[1].reasons.join().includes('P99999')}; });
check('MPO-13','Missing lines are reported per PO (each missing entry carries its PO ref)',
  [['PA001','PRODUCT BETA 1L * 12 [BLB01]'],['PB002','PRODUCT ALPHA 330ML * 24 [BLA01]']], ()=>{ const {st,a,b}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A'],[X2[0],X2[1],2,'CTN12','IN/A']],[[X1[0],X1[1],3,'CTN24','IN/B']]);
    recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:5,poId:a.poId}); return ev3(st).missing.map(m=>[m.poRef,m.line.item]); });
check('MPO-14','Quantities never combined across POs: A 5 and B 3 received as separate rows → each READY against its own PO; uploads per PO',
  {statuses:['READY','READY'], upA:[5], upB:[3]}, ()=>{ const {st,a,b}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X1[0],X1[1],3,'CTN24','IN/B']]);
    recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:5,poId:a.poId}); recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:3,poId:b.poId});
    const e=ev3(st); return {statuses:e.rows.map(r=>r.statusLabel), upA:E.buildUpload(e,a.poId).rows.map(u=>u.qty), upB:E.buildUpload(e,b.poId).rows.map(u=>u.qty)}; });

// ---------- SPLIT: one physical row belonging to several POs ----------
function splitSetup(){ const {st,a,b}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X1[0],X1[1],4,'CTN24','IN/B']]); const it=recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:8,expiry:'09/09/2028',notes:'lot 77'}); return {st,a,b,it}; }
check('SPLIT-1','Split validation: parts must add up EXACTLY, at least two parts, each PO once, qty > 0',
  [true,true,true,true], ()=>{ const {st,a,b,it}=splitSetup(); const f=p=>!!E.splitItem(st,it.no,p).errors;
    return [f([{poId:a.poId,qty:5},{poId:b.poId,qty:2}]), f([{poId:a.poId,qty:8}]), f([{poId:a.poId,qty:4},{poId:a.poId,qty:4}]), f([{poId:a.poId,qty:8},{poId:b.poId,qty:0}])]; });
check('SPLIT-2','Split 8 → A 5 + B 3: two new rows inherit barcode/expiry/notes, carry the split link, have no decisions; original replaced',
  {count:2, qtys:[5,3], pos:['PA001','PB002'], inherit:true, links:true, noDecisions:true, origGone:true},
  ()=>{ const {st,a,b,it}=splitSetup(); const res=E.splitItem(st,it.no,[{poId:a.poId,qty:5},{poId:b.poId,qty:3}]); const rows=st.items;
    return {count:rows.length, qtys:rows.map(r=>r.physicalQty), pos:rows.map(r=>st.pos.find(p=>p.poId===r.poId).ref), inherit:rows.every(r=>r.physicalBC===X1[0]&&r.expiry==='09/09/2028'&&r.notes==='lot 77'),
      links:rows.every(r=>r.splitFrom===it.no&&r.splitGroup===res.splitGroup&&r.poSource==='split'), noDecisions:rows.every(r=>!Object.keys(r.decisions).length), origGone:!rows.some(r=>r.no===it.no)}; });
check('SPLIT-3','No automatic allocation: evaluating a multi-PO row never changes the rows, and the engine has no allocation function',
  {itemsBefore:1, itemsAfter:1, status:'PO SELECTION REQUIRED', allocFns:[]}, ()=>{ const {st}=splitSetup(); const before=JSON.stringify(st.items); const e=ev3(st);
    return {itemsBefore:1, itemsAfter:JSON.stringify(st.items)===before?1:-1, status:e.rows[0].statusLabel, allocFns:Object.keys(E).filter(k=>/alloc|distribut|autoSplit/i.test(k))}; });
check('SPLIT-4','Undo split is allowed before any decision, blocked once a split row has a decision',
  {undoOk:true, restoredQty:8, blocked:true}, ()=>{ const s1=splitSetup(); const r1=E.splitItem(s1.st,s1.it.no,[{poId:s1.a.poId,qty:5},{poId:s1.b.poId,qty:3}]); const u=E.undoSplit(s1.st,r1.splitGroup);
    const s2=splitSetup(); const r2=E.splitItem(s2.st,s2.it.no,[{poId:s2.a.poId,qty:5},{poId:s2.b.poId,qty:3}]); s2.st.items[1].decisions.qty='accept';
    return {undoOk:!u.errors, restoredQty:s1.st.items[0].physicalQty, blocked:!!E.undoSplit(s2.st,r2.splitGroup).errors}; });
check('SPLIT-5','Each split row reconciles against ITS OWN PO: A ordered 5 got 5 → READY; B ordered 4 got 3 → QUANTITY MISMATCH',
  [['PA001','READY'],['PB002','QUANTITY MISMATCH']], ()=>{ const {st,a,b,it}=splitSetup(); E.splitItem(st,it.no,[{poId:a.poId,qty:5},{poId:b.poId,qty:3}]); return ev3(st).rows.map(r=>[r.poRef,r.statusLabel]); });

// ---------- REIMP: re-import of a PO already loaded ----------
const RA=['5449000000035','PRODUCT GAMMA 500G * 6 [BLG01]'];
function reimpSetup(){ const st=shipment(); const po=loadPo(st,'PA001.xlsx',[[X1[0],X1[1],5,'CTN24','IN/A'],[X2[0],X2[1],2,'CTN12','IN/A'],[RA[0],RA[1],4,'CTN6','IN/A']],'Vendor A');
  const newDraft=E.buildPoDrafts(E.parsePoAoa([MP_HDR,[X1[0],X1[1],5,'CTN24','IN/A2'],[X2[0],X2[1],3,'CTN12','IN/A2'],['5449000000042','PRODUCT DELTA [BLD01]',1,'CTN10','IN/A2']]),'PA001.xlsx')[0];
  return {st,po,newDraft}; }
check('REIMP-1','Preview: 1 added (DELTA), 1 removed (GAMMA), 1 changed (BETA qty 2 → 3), 1 unchanged (ALPHA)',
  {added:['PRODUCT DELTA [BLD01]'], removed:['PRODUCT GAMMA 500G * 6 [BLG01]'], changed:[['PRODUCT BETA 1L * 12 [BLB01]','qty 2 → 3']], unchanged:1},
  ()=>{ const {st,po,newDraft}=reimpSetup(); const p=E.planReimport(st,po.poId,newDraft,DEFS); return {added:p.added.map(l=>l.item), removed:p.removed.map(l=>l.item), changed:p.changed.map(c=>[c.old.item,c.fields.join()]), unchanged:p.unchanged}; });
check('REIMP-2','Preview (and cancel) changes nothing in the session',
  true, ()=>{ const {st,po,newDraft}=reimpSetup(); recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:5}); const before=JSON.stringify(st); E.planReimport(st,po.poId,newDraft,DEFS); return JSON.stringify(st)===before; });
check('REIMP-3','Apply keeps received rows; a manual line confirmation survives when the line still exists (remapped to the new line id)',
  {items:2, remapped:1, status:'ADDITIONAL BARCODE', confirmed:'confirmed', line:'PRODUCT BETA 1L * 12 [BLB01]'}, ()=>{ const {st,po,newDraft}=reimpSetup();
    recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:5}); const it=recv(st,{item:'BETA?',physicalBC:'5449000000999',physicalQty:3}); it.manualTargetId=po.lines[1].id;
    const plan=E.planReimport(st,po.poId,newDraft,DEFS); const res=E.applyReimport(st,po.poId,newDraft,plan,{});
    const e=ev3(st); const r=rowOf(e,it.no); return {items:st.items.length, remapped:res.remapped, status:r.statusLabel, confirmed:r.match.confidence, line:r.line.item}; });
check('REIMP-4','A row received on a line REMOVED by the re-import is never dropped: it goes to PRODUCT MATCH review with the reason',
  {kept:true, orphans:1, status:'PRODUCT MATCH — NEEDS CONFIRMATION', reason:true, inUpload:false}, ()=>{ const {st,po,newDraft}=reimpSetup();
    const it=recv(st,{item:RA[1],physicalBC:RA[0],physicalQty:4}); const plan=E.planReimport(st,po.poId,newDraft,DEFS); E.applyReimport(st,po.poId,newDraft,plan,{});
    const r=rowOf(ev3(st),it.no); return {kept:st.items.some(x=>x.no===it.no), orphans:plan.orphanRows.length, status:r.statusLabel, reason:/re-import/.test(r.reasons.join()), inUpload:r.uploadEligible}; });
check('REIMP-5','Apply records history (version 2, +1 −1 ~1) and replaces receipt refs; PO ref unchanged',
  {version:2, history:{added:1, removed:1, changed:1}, ref:'PA001', receipt:['IN/A2']}, ()=>{ const {st,po,newDraft}=reimpSetup(); const plan=E.planReimport(st,po.poId,newDraft,DEFS); E.applyReimport(st,po.poId,newDraft,plan,{});
    const h=po.history[0]; return {version:po.version, history:{added:h.added, removed:h.removed, changed:h.changed}, ref:po.ref, receipt:po.receiptRefs}; });

// ---------- WB: per-PO workbooks, master workbook, ZIP ----------
const JSZip=require('jszip');
const OUT=OUT_DIR;
// A realistic 3-PO shipment: P00343 (real file), PA001 (complete), PB002 (needs review), plus one unassigned row.
function wbShipment(){
  const st=shipment(); st.shipmentName='TEST Shipment / Oct:2026';
  E.addPo(st,p343draft,{vendor:'ABIDO supplier'});
  const a=loadPo(st,'PA001.xlsx',[[X1[0],X1[1],5,'CTN24','IN/A'],[BEN[0],BEN[1],5,'CTN20','IN/A'],[BEN[0],BEN[1],3,'CTN20','IN/A']],'Vendor A');
  const b=loadPo(st,'PB002.xlsx',[[X1[0],X1[1],3,'CTN24','IN/B'],[X2[0],X2[1],2,'CTN12','IN/B']],'Vendor B');
  const p343=st.pos[0];
  recv(st,{item:'ABIDO SEVEN SPICES (MIX SPICE) 50G * 10',physicalBC:'5283001104785',physicalQty:1200,physicalUom:'PCS',poId:p343.poId}); // 120 CTN10 READY
  recv(st,{item:'ABIDO ANISE',physicalBC:'5283001111431',physicalQty:50,poId:p343.poId}); // 50 vs 60 qty mismatch (pending)
  recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:5,poId:a.poId});           // READY on A
  recv(st,{item:BEN[1],physicalBC:BEN[0],physicalQty:8,poId:a.poId});         // group 5+3 READY on A
  recv(st,{item:X2[1],physicalBC:X2[0],physicalQty:2,poId:b.poId});           // READY on B
  recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:3});                       // product on A and B, no PO → unassigned (PO selection)
  recv(st,{item:'MYSTERY ITEM',physicalBC:'5000000000099',physicalQty:1,poId:b.poId}); // extra on B
  return {st,a,b,p343};
}
const sheetAoa=(wb,n)=>XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:''});
check('WB-1','Each PO workbook contains ONLY that PO\'s rows (Receiving Detail PO Ref column)',
  {P00343:[1,2], PA001:[3,4], PB002:[5,7]}, ()=>{ const {st}=wbShipment(); const e=ev3(st); const out=E.buildAllOutputs(XLSX,st,e); const res={};
    for(const f of out.files.filter(f=>f.kind==='po')){ const a=sheetAoa(f.wb,'Receiving Detail'); const iRef=a[0].indexOf('PO Ref');
      if(a.slice(1).some(r=>r[iRef]!==f.ref)) return 'foreign row in '+f.ref; res[f.ref]=a.slice(1).map(r=>r[0]).sort((x,y)=>x-y); } return res; });
check('WB-2','Upload conservation: upload rows across all PO workbooks = shipment eligible rows, no duplicates, no losses',
  {perPo:4, eligible:4, unique:true, cross:'PASS'}, ()=>{ const {st}=wbShipment(); const e=ev3(st); const out=E.buildAllOutputs(XLSX,st,e);
    const nos=out.files.filter(f=>f.kind==='po').flatMap(f=>sheetAoa(f.wb,'Odoo Upload File').slice(1).map(r=>r[7]));
    return {perPo:nos.length, eligible:e.rows.filter(r=>r.uploadEligible).length, unique:new Set(nos).size===nos.length, cross:out.cross.checks[1].result}; });
check('WB-3','Master PO Summary equals the per-PO figures (ordered/received PCS, statuses) and sums correctly',
  {rows:[['P00343','ABIDO supplier','BFL/IN/00067','NEEDS REVIEW'],['PA001','Vendor A','IN/A','COMPLETE'],['PB002','Vendor B','IN/B','RESOLVED WITH DIFFERENCES']], totalsOk:true, p343Received:1700, aReceived:280},
  ()=>{ const {st}=wbShipment(); const e=ev3(st); const out=E.buildAllOutputs(XLSX,st,e); const m=out.files.find(f=>f.kind==='master').wb; const a=sheetAoa(m,'PO Summary');
    const H=a[3], body=a.slice(4,7), tot=a[7]; const col=n=>H.indexOf(n);
    const totalsOk=['Total Ordered (PCS)','Total Received (PCS)','Rows in Upload','Missing Lines'].every(n=>Math.abs(body.reduce((s,r)=>s+r[col(n)],0)-tot[col(n)])<1e-9)
      && out.summaries.every((s,i)=>body[i][col('Total Ordered (PCS)')]===s.orderedPcs && body[i][col('Overall PO Status')]===s.status);
    return {rows:body.map(r=>[r[0],r[1],r[2],r[col('Overall PO Status')]]), totalsOk, p343Received:body[0][col('Total Received (PCS)')], aReceived:body[1][col('Total Received (PCS)')]}; });
check('WB-4','PO status matrix: NOT STARTED / NEEDS REVIEW / RESOLVED WITH DIFFERENCES / COMPLETE',
  ['NOT STARTED','NEEDS REVIEW','RESOLVED WITH DIFFERENCES','COMPLETE'], ()=>{
    const mk=(qty,extra)=>{ const st=shipment(); const p=loadPo(st,'PZ.xlsx',[[X1[0],X1[1],5,'CTN24','R']],'V'); if(qty!==null) recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:qty}); if(extra) recv(st,{item:'UNKNOWN',physicalBC:'5000000000077',physicalQty:1}); return E.poSummary(ev3(st),p).status; };
    return [mk(null), mk(4), (()=>{ const st=shipment(); const p=loadPo(st,'PZ.xlsx',[[X1[0],X1[1],5,'CTN24','R']],'V'); const it=recv(st,{item:X1[1],physicalBC:X1[0],physicalQty:4}); it.decisions.qty='accept'; return E.poSummary(ev3(st),p).status; })(), mk(5)]; });
check('WB-5','PO Lines sheet keeps BOTH original Benina lines (5 and 3) with group totals and "not allocated (identical group)"',
  {lines:[[5,8,8,0,'not allocated (identical group)'],[3,8,8,0,'not allocated (identical group)']]}, ()=>{ const {st,a}=wbShipment(); const e=ev3(st); const wb=E.buildPoWorkbook(XLSX,st,e,a.poId); const s=sheetAoa(wb,'PO Lines'); const H=s[0];
    const c=n=>H.indexOf(n); return {lines:s.slice(1).filter(r=>r[c('Barcode')]===BEN[0]).map(r=>[r[c('Ordered Qty')],r[c('Group Ordered')],r[c('Group Received (Odoo UOM)')],r[c('Group Difference')],r[c('Received Allocation')]])}; });
check('WB-6','Per-PO Odoo Upload File: columns A–D unchanged, then Odoo UOM … PO Ref, Receipt Ref; P00343 row = 120 CTN10 + BFL/IN/00067',
  {head:['Barcode','Qty (Odoo UOM)','Qty in Pieces','Expiry Date','Odoo UOM','Possible Duplicate?','Item (reference only)','Source row No.','PO Ref','Receipt Ref'], row:['5283001104785',120,'','01/01/2028','CTN10','','ABIDO SEVEN SPICES (MIX SPICE) 50G * 10 [BL00133]',1,'P00343','BFL/IN/00067']},
  ()=>{ const {st,p343}=wbShipment(); const e=ev3(st); const a=sheetAoa(E.buildPoWorkbook(XLSX,st,e,p343.poId),'Odoo Upload File'); return {head:a[0], row:a[1]}; });
check('WB-7','File names: one per PO + master, filesystem-safe (no / : \\ * ? [ ]) and unique',
  ['TEST Shipment - Oct-2026_P00343_reconciliation.xlsx','TEST Shipment - Oct-2026_PA001_reconciliation.xlsx','TEST Shipment - Oct-2026_PB002_reconciliation.xlsx','TEST Shipment - Oct-2026_MASTER_reconciliation.xlsx'],
  ()=>{ const {st}=wbShipment(); const out=E.buildAllOutputs(XLSX,st,ev3(st)); const names=out.files.map(f=>f.name); if(names.some(n=>/[\/:\\*?\[\]]/.test(n))||new Set(names).size!==names.length) return 'unsafe/duplicate: '+names; return names; });
check('WB-8','Master has Unassigned (the PO-selection row), Cross-PO Validation and All Receiving sheets; unassigned row is in no PO workbook',
  {sheets:true, unassigned:[6], cross:{'Every received row is in exactly one PO workbook or in Unassigned':'PASS','Rows waiting for a PO choice (not in any PO workbook)':'WARN'}},
  ()=>{ const {st}=wbShipment(); const out=E.buildAllOutputs(XLSX,st,ev3(st)); const m=out.files.find(f=>f.kind==='master').wb;
    const cv=Object.fromEntries(sheetAoa(m,'Cross-PO Validation').slice(1).filter(r=>/exactly one PO|waiting for a PO/.test(r[0])).map(r=>[r[0],r[1]]));
    return {sheets:['PO Summary','Unassigned','Cross-PO Validation','All Receiving','UOM Definitions Used'].every(s=>m.SheetNames.includes(s)), unassigned:sheetAoa(m,'Unassigned').slice(1).map(r=>r[0]), cross:cv}; });
// ZIP: async — run and collect before the report
const zipChecks=(async()=>{
  const {st}=wbShipment(); const out=E.buildAllOutputs(XLSX,st,ev3(st));
  const buf=await E.buildZip(JSZip,XLSX,out).generateAsync({type:'nodebuffer'});
  fs.writeFileSync(path.join(OUT,'test_shipment_outputs.zip'),buf);
  for(const f of out.files) XLSX.writeFile(f.wb, path.join(OUT,f.name));
  const z=await JSZip.loadAsync(buf); const names=Object.keys(z.files);
  const valid=[]; for(const n of names){ const wb=XLSX.read(await z.file(n).async('uint8array'),{type:'array'}); valid.push(wb.SheetNames.length>0); }
  check('ZIP-1','ZIP contains N + 1 files (3 PO workbooks + master), each a valid workbook with the expected sheets',
    {count:4, valid:true, names:out.files.map(f=>f.name).sort()}, ()=>({count:names.length, valid:valid.every(Boolean), names:names.sort()}));
})();

// ---------- MATCH: a single uncertain similar-name match is never trusted ----------
check('MATCH-1','Single similar-name TOKEN match (one candidate) → PRODUCT MATCH — NEEDS CONFIRMATION, not uploaded; after confirmation → classified',
  {before:'PRODUCT MATCH — NEEDS CONFIRMATION', conf:'uncertain', inUpload:false, after:'ADDITIONAL BARCODE'},
  ()=>{ const t=one([['6212900002143','AL ATTAR ANISE SEEDS TEA 24PCK * 20PCS','CTN20',5]],[{item:'ATTAR ANISE TEA 24PCK 20PCS',physicalBC:'6212900099999',physicalQty:5}]);
    const r0=t.ev().rows[0]; t.its[0].manualTargetId=t.lines[0].id; const r1=t.ev().rows[0]; return {before:r0.statusLabel, conf:r0.match.confidence, inUpload:r0.uploadEligible, after:r1.statusLabel}; });
check('MATCH-2','Single FUZZY name match (one candidate) → PRODUCT MATCH — NEEDS CONFIRMATION, not uploaded',
  {status:'PRODUCT MATCH — NEEDS CONFIRMATION', conf:'uncertain', inUpload:false},
  ()=>{ const t=one([['7613034579102','PERRIER SPARKLING WATER','CTN24',5]],[{item:'PERRIER SPARKLING WATR',physicalBC:'7613030000000',physicalQty:5}]);
    const r=t.ev().rows[0]; return {status:r.statusLabel, conf:r.match.confidence, inUpload:r.uploadEligible}; });

// ---------- C1: an UNDEFINED Odoo UOM is always UOM NEEDS REVIEW (final rule 2026-10-01) ----------
function c1(odooUom, physUom, defs){ const st=shipment(); loadPo(st,'PC1.xlsx',[['5283001104785','ITEM C1 [BLC1]',10,odooUom,'R']],'V');
  recv(st,{item:'ITEM C1',physicalBC:'5283001104785',physicalQty:10, ...(physUom!==undefined?{physicalUom:physUom}:{})});
  const e=E.evaluate(st, defs||[]); const r=e.rows[0]; return {status:r.statusLabel, odooQty:r.odooQty, inUpload:r.uploadEligible, upload:E.buildUpload(e).rows.length}; }
const UOM_REVIEW={status:'UOM CONVERSION — NEEDS REVIEW', odooQty:null, inUpload:false, upload:0};
check('C1-1','CTNP10 Odoo UOM + BLANK physical UOM → UOM NEEDS REVIEW, not uploaded', UOM_REVIEW, ()=>c1('CTNP10'));
check('C1-2','CTNP10 Odoo UOM + physical CTNP10 (identical text) → UOM NEEDS REVIEW, not uploaded', UOM_REVIEW, ()=>c1('CTNP10','CTNP10'));
check('C1-3','Bare CTN Odoo UOM + BLANK physical UOM → UOM NEEDS REVIEW, not uploaded', UOM_REVIEW, ()=>c1('CTN'));
check('C1-4','Tray Odoo UOM + BLANK physical UOM → UOM NEEDS REVIEW, not uploaded', UOM_REVIEW, ()=>c1('Tray'));
check('C1-5','Arbitrary undefined Odoo UOM "BUNDLE-X7" + BLANK physical UOM → UOM NEEDS REVIEW, not uploaded', UOM_REVIEW, ()=>c1('BUNDLE-X7'));
check('C1-6','Other undefined forms also gated: bare CTN + physical CTN, Tray + physical Tray, BLANK Odoo UOM + blank physical, By 24 (not approved) + blank',
  ['UOM CONVERSION — NEEDS REVIEW','UOM CONVERSION — NEEDS REVIEW','UOM CONVERSION — NEEDS REVIEW','UOM CONVERSION — NEEDS REVIEW'],
  ()=>[c1('CTN','CTN').status, c1('Tray','Tray').status, c1('').status, c1('By 24').status]);
check('C1-7','Defined UOMs stay valid: CTN10 + blank → READY; PCS + blank → READY; approved odoo-side "Tray"=6 + blank → READY; approved "By 24" + blank → READY',
  ['READY','READY','READY','READY'], ()=>[c1('CTN10').status, c1('PCS').status, c1('Tray',undefined,[{key:'T',label:'Tray',pcsPerUnit:6,side:'odoo',approvedBy:'x'}]).status, c1('By 24',undefined,DEFS).status]);
check('C1-8','A physical-only definition does NOT define an Odoo UOM: "Tray" approved for physical side only, Odoo UOM Tray + blank → still UOM NEEDS REVIEW',
  'UOM CONVERSION — NEEDS REVIEW', ()=>c1('Tray',undefined,[{key:'T',label:'Tray',pcsPerUnit:6,side:'physical',approvedBy:'x'}]).status);
check('C1-9','The review shows the reason and offers the per-row temporary conversion as the only in-row resolution; with it the row converts (marked temporary)',
  {reason:true, offersTemp:true, after:'READY', temporary:true}, ()=>{ const st=shipment(); loadPo(st,'PC1.xlsx',[['5283001104785','ITEM C1',10,'CTNP10','R']],'V');
    const it=recv(st,{item:'ITEM C1',physicalBC:'5283001104785',physicalQty:10}); const r0=E.evaluate(st,[]).rows[0];
    it.tempPhysPieces=10; it.tempPoPieces=10; const r1=E.evaluate(st,[]).rows[0];
    return {reason:/Odoo UOM "CTNP10" is not defined/.test(r0.reasons.join()), offersTemp:r0.decisions.some(d=>d.type==='conversion'&&d.required), after:r1.statusLabel, temporary:r1.conv.temporary}; });
check('C1-10','Real file shipment_sep_2026: a line with a BLANK UOM (no PCK SIZE), received 5 with blank physical UOM → UOM NEEDS REVIEW because the Odoo UOM is undefined',
  {blankUomLines:5, status:'UOM CONVERSION — NEEDS REVIEW', reason:true, inUpload:false}, ()=>{ const st=shipment(); E.addPo(st,E.buildPoDrafts(sepParsed,'shipment_sep_2026.xlsx')[0],{vendor:'V'});
    const blank=st.pos[0].lines.filter(l=>!String(l.uom||'').trim()); const l=blank.find(x=>/FIZZLY passion/.test(x.item)); recv(st,{item:l.item,physicalBC:'5280000000000',physicalQty:5});
    const r=ev3(st).rows[0]; return {blankUomLines:blank.length, status:r.statusLabel, reason:/Odoo UOM "blank" is not defined/.test(r.reasons.join()), inUpload:r.uploadEligible}; });

// ---------- C2: accurate automatic-PO note ----------
check('C2-1','Certain match on PO A, only a similar-name candidate on PO B → auto to A; note says "certain match" and names B; never "only loaded PO containing this product"',
  {po:'PA', certain:true, namesB:true, oldWording:false}, ()=>{ const st=shipment(); loadPo(st,'PA.xlsx',[['5000000000011','PERRIER SPARKLING WATER',5,'CTN24','RA']],'A'); loadPo(st,'PB.xlsx',[['5000000000028','PERRIER SPARKLING WATR',5,'CTN24','RB']],'B');
    recv(st,{item:'PERRIER SPARKLING WATER',physicalBC:'5000000000011',physicalQty:5}); const r=ev3(st).rows[0]; const n=r.notes.join(' ');
    return {po:r.poRef, certain:/only loaded PO with a certain match/.test(n), namesB:/PB had only a similar-name candidate/.test(n), oldWording:/only loaded PO containing this product/.test(n)}; });
check('C2-2','Product matched on exactly one PO and nowhere else → note says "only loaded PO with a matching line" and the match method',
  true, ()=>{ const {st}=twoPos([[X1[0],X1[1],5,'CTN24','IN/A']],[[X2[0],X2[1],3,'CTN12','IN/B']]); recv(st,{item:X2[1],physicalBC:X2[0],physicalQty:3});
    return /PB002 determined automatically because it is the only loaded PO with a matching line \(Physical barcode = PO barcode\)/.test(ev3(st).rows[0].notes.join(' ')); });
check('C2-3','Only a similar-name candidate on one PO → note does NOT claim the PO was determined by a certain match; row still needs match confirmation',
  {status:'PRODUCT MATCH — NEEDS CONFIRMATION', honest:true}, ()=>{ const st=shipment(); loadPo(st,'PA.xlsx',[['6212900002143','AL ATTAR ANISE SEEDS TEA 24PCK * 20PCS',5,'CTN20','R']],'A'); loadPo(st,'PB.xlsx',[[X2[0],X2[1],3,'CTN12','IN/B']],'B');
    recv(st,{item:'ATTAR ANISE TEA 24PCK 20PCS',physicalBC:'6212900099999',physicalQty:5}); const r=ev3(st).rows[0];
    return {status:r.statusLabel, honest:/only loaded PO with a similar-name candidate — the match itself still needs confirmation/.test(r.notes.join(' '))}; });

// ---------- SES: session migration / backward compatibility ----------
const V2SESSION={version:2, shipmentName:'Old', poFileName:'shipment sep 2026.xlsx', poLines:po.lines, nextNo:20,
  items:JSON.parse(JSON.stringify(ITEMS)).map(x=>{ const y={...x}; if(x.no===10) y.manualLineId=po.lines.find(l=>/SPECIAL EDITION/.test(l.item)).id; if(x.no===18){ y.manualPhysPieces=10; y.manualPoPieces=10; delete y.tempPhysPieces; delete y.tempPoPieces; } return y; })};
check('SES-1','v2 single-PO session → one PO (ref from old file name, vendor to be entered), manual line choice + old per-row conversion carried over, SAME statuses as before',
  {pos:1, ref:'shipment sep 2026', refSource:'migrated from v2 session', vendor:'', allOnPO1:true, sameStatuses:true, manualKept:true, tempKept:true},
  ()=>{ const m=E.migrateSession(V2SESSION).state; const legacy=E.evaluate({poLines:V2SESSION.poLines, items:V2SESSION.items}, DEFS); const now=E.evaluate(m, DEFS);
    return {pos:m.pos.length, ref:m.pos[0].ref, refSource:m.pos[0].refSource, vendor:m.pos[0].vendor, allOnPO1:m.items.every(i=>i.poId==='PO1'),
      sameStatuses:JSON.stringify(legacy.rows.map(r=>[r.no,r.statusLabel]))===JSON.stringify(now.rows.map(r=>[r.no,r.statusLabel])),
      manualKept:rowOf(now,10).match.confidence==='confirmed', tempKept:rowOf(now,18).conv.temporary===true}; });
check('SES-2','v1 session backup → rows kept with no PO (they classify once POs are loaded); note shown',
  {items:1, poId:null, note:true}, ()=>{ const r=E.migrateSession({shipmentName:'v1', items:[{no:1,item:'X',physicalBC:'1',physicalQty:2,bucket:'ready'}], nextNo:2}); return {items:r.state.items.length, poId:r.state.items[0].poId, note:/v1 session backup/.test(r.notes.join())}; });
check('SES-3','Migration never modifies its input',
  true, ()=>{ const before=JSON.stringify(V2SESSION); E.migrateSession(V2SESSION); return JSON.stringify(V2SESSION)===before; });
check('SES-4','v3 snapshot round-trip keeps POs, rows, decisions, split archive and the definitions snapshot',
  {same:true, defs:1}, ()=>{ const {st}=splitSetup(); E.splitItem(st,st.items[0].no,[{poId:st.pos[0].poId,qty:5},{poId:st.pos[1].poId,qty:3}]); st.items[0].decisions.qty='accept';
    const snap=JSON.parse(JSON.stringify(E.sessionSnapshot(st,DEFS))); const back=E.migrateSession(snap);
    return {same:JSON.stringify(ev3(back.state).rows.map(r=>[r.no,r.poRef,r.statusLabel,r.review]))===JSON.stringify(ev3(st).rows.map(r=>[r.no,r.poRef,r.statusLabel,r.review])) && JSON.stringify(back.state.splitArchive)===JSON.stringify(st.splitArchive), defs:back.uomDefinitionsSnapshot.length}; });
check('SES-5','Definitions from a backup are only OFFERED: missing ones listed, conflicting ones reported, current table never changed',
  {add:['Tray'], conflicts:['By 24'], currentUnchanged:true}, ()=>{ const cur=[BY24]; const before=JSON.stringify(cur);
    const o=E.definitionsToOffer(cur,[{key:'x',label:'BY 24',pcsPerUnit:12,side:'both'},{key:'y',label:'Tray',pcsPerUnit:6,side:'physical'}]);
    return {add:o.add.map(d=>d.label), conflicts:o.conflicts.map(c=>c.current.label), currentUnchanged:JSON.stringify(cur)===before}; });

// ---------- report (after async checks) ----------
zipChecks.then(()=>{
const pad=(s,n)=>String(s).padEnd(n);
let md='# Shipment Manager v2 — test results\n\nRun: '+new Date().toISOString()+'\n\n| ID | Test | Expected | Actual | Result |\n|---|---|---|---|---|\n';
for(const r of results){
  console.log((r.pass?'PASS':'FAIL')+'  '+pad(r.id,5)+' '+r.name+(r.pass?'':'\n        expected: '+JSON.stringify(r.expected)+'\n        actual:   '+JSON.stringify(r.actual)));
  md+='| '+r.id+' | '+r.name.replace(/\|/g,'/')+' | `'+JSON.stringify(r.expected).replace(/\|/g,'/')+'` | `'+JSON.stringify(r.actual).replace(/\|/g,'/')+'` | '+(r.pass?'PASS':'**FAIL**')+' |\n';
}
md+='\n**'+(results.length-fails)+' / '+results.length+' passed.**\n';
console.log('\n'+(results.length-fails)+' / '+results.length+' passed');
// ---------- mutation checks (node run_tests.js --mutations): each mutant MUST make the named tests fail ----------
let mutFails=0;
if(process.argv.includes('--mutations')){
  const {spawnSync}=require('child_process'), os=require('os');
  const MUTANTS=[
    ['MUT-1','Group identical lines on barcode only', ["return [bc, norm(l.internalRef||''), norm(stripBrackets(l.item)), uomKey(l.uom), ou?String(ou.pcs):'', [...specTokens(l.item)].sort().join(',')].join('|');", 'return bc;'], ['DUP-4','DUP-5','DUP-6']],
    ['MUT-2','Group / combine lines ACROSS POs', ['  const view=shipmentView(state);\n', '  const view=(v=>v.pos.length>1?{...v,pos:[{...v.pos[0], lines:v.pos.flatMap(p=>p.lines.map(l=>({...l,poId:v.pos[0].poId})))}]}:v)(shipmentView(state));\n'], ['MPO-8']],
    ['MUT-3','Auto-pick a PO when the product is on several POs', ['  if(use.length===1){', '  if(use.length>=1){'], ['MPO-6']],
    ['MUT-4','Treat By <n> as automatic (inferred from the number)', ["  if(t==='PCS') return {pcs:1, source:'built-in PCS'};", "  if(t==='PCS') return {pcs:1, source:'built-in PCS'};\n  { const mm=t.match(/^BY\\s*(\\d+)$/); if(mm) return {pcs:+mm[1], source:'MUTANT'}; }"], ['UOM-5','UOM-8']],
    ['MUT-5','Temporary row conversion treated as a global definition', ['  const defs = defsArg || state.uomDefinitions || [];\n  const settings={blankPhysUomSameAsPo:true}; // business rule #2 — fixed, not configurable\n  const view=', "  const defs = [...(defsArg || state.uomDefinitions || []), ...(state.items||[]).filter(i=>i.tempPhysPieces&&i.physicalUom).map(i=>({key:'T'+i.no,label:i.physicalUom,pcsPerUnit:i.tempPhysPieces,side:'both'}))];\n  const settings={blankPhysUomSameAsPo:true}; // business rule #2 — fixed, not configurable\n  const view="], ['UOM-9']],
    ['MUT-6','Receipt reference used as the PO reference', ['ref:k||stem, refSource:', 'ref:k||receiptRefs[0]||stem, refSource:'], ['REAL-1','REAL-6']],
    ['MUT-7','v1 formal-barcode rule (12 or 13 digits)', ['return /^\\d{13}$/.test(normBC(v));', 'return /^\\d{12,13}$/.test(normBC(v));'], ['R1','P6']],
    ['MUT-8','Trust a single TOKEN (similar-name) match without confirmation', ["return {line:scored[0].line, confidence:'uncertain'", "return {line:scored[0].line, confidence:'certain'"], ['MATCH-1']],
    ['MUT-11','Trust a single FUZZY name match without confirmation', ["return {line:fz[0].line, confidence:'uncertain'", "return {line:fz[0].line, confidence:'certain'"], ['MATCH-2']],
    ['MUT-9','Split allowed when parts do not add up', ["if(total!==null && Math.abs(round6(sum)-total)>1e-9) errors.push(", "if(false) errors.push("], ['SPLIT-1']],
    ['MUT-12','Bypass the undefined-Odoo-UOM gate (C1) — remove it', ['  if(!ou){\n    r.reason=', '  if(false){\n    r.reason='], ['C1-1','C1-2','C1-3','C1-4','C1-5','C1-6','C1-8','C1-10']],
    ['MUT-13','Gate bypass via the blank-physical-UOM shortcut placed before the gate', ["  if(tPhys!==null && tPo!==null){ r.temporary=true; return done(tPhys, tPo, TEMP_SOURCE); }\n", "  if(tPhys!==null && tPo!==null){ r.temporary=true; return done(tPhys, tPo, TEMP_SOURCE); }\n  if(!physUom) return done(null, r.poPieces, 'MUTANT shortcut');\n  if(poUom && uomKey(physUom)===uomKey(poUom)) return done(null, r.poPieces, 'MUTANT same-text shortcut');\n"], ['C1-1','C1-2','C1-3','C1-4','C1-5']],
    ['MUT-14','Old misleading automatic-PO wording (C2)', ["'PO '+use[0].p.ref+' determined automatically because it is the only loaded PO with a certain match ('+use[0].m.via+'); '+others.join(', ')+' had only a similar-name candidate, which was not used'", "'PO '+use[0].p.ref+' determined automatically (only loaded PO containing this product)'"], ['C2-1']],
    ['MUT-10','Upload the ORDERED qty instead of the received qty', ['base.odooQty=base.conv.known?base.conv.odooQty:null;', 'base.odooQty=base.conv.known?(toNum(base.poQty)??base.conv.odooQty):null;'], ['P5','DUP-8']],
  ];
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sm-mut-'));
  md+='\n## Mutation checks\n\nEach mutant re-introduces a forbidden behaviour into a temporary copy of the page; the named tests must fail.\n\n| ID | Mutation | Must fail | Failed | Result |\n|---|---|---|---|---|\n';
  for(const [id,name,[from,to],mustFail] of MUTANTS){
    const n=html.split(from).length-1; let failed=[], ok=false;
    if(n===1){ const f=path.join(tmp,id+'.html'); fs.writeFileSync(f, html.replace(from,()=>to));
      const r=spawnSync(process.execPath,[__filename],{env:{...process.env, SM_HTML:f, SM_OUT:path.join(tmp,id+'_out'), SM_NO_REPORT:'1'}, encoding:'utf8', maxBuffer:64*1024*1024});
      failed=[...(r.stdout||'').matchAll(/^FAIL  (\S+)/gm)].map(m=>m[1]); ok=mustFail.every(t=>failed.includes(t)); }
    if(!ok) mutFails++;
    console.log((ok?'PASS':'FAIL')+'  '+id+'  '+name+' → must fail '+mustFail.join(', ')+'; failed: '+(n===1?(failed.join(', ')||'none'):'MUTATION NOT APPLIED ('+n+' matches)'));
    md+='| '+id+' | '+name+' | '+mustFail.join(', ')+' | '+(n===1?(failed.join(', ')||'none'):'not applied')+' | '+(ok?'PASS':'**FAIL**')+' |\n';
  }
  md+='\n**'+(MUTANTS.length-mutFails)+' / '+MUTANTS.length+' mutation checks passed.**\n';
  console.log('\n'+(MUTANTS.length-mutFails)+' / '+MUTANTS.length+' mutation checks passed');
}
if(!process.env.SM_NO_REPORT) fs.writeFileSync(path.join(__dirname,'TEST_RESULTS.md'), md);
process.exit((fails||mutFails)?1:0);
}).catch(e=>{ console.error('ASYNC TEST ERROR', e); process.exit(2); });
