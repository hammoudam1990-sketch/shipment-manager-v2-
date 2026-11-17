// Shipment Manager v2 (multi-PO) — browser-level smoke test in jsdom.
// Run:  NODE_PATH=<dir with xlsx, jszip, jsdom>/node_modules node ui_smoke_test.js
// Drives the real page: PO import dialogs (real P00343 fixture + a generated second PO), receiving with Auto / selected PO,
// PO choice, split row, UOM definitions, re-import preview, ZIP / per-PO / master export, session migration.
const fs=require('fs'), path=require('path');
const {JSDOM, VirtualConsole}=require('jsdom'); const XLSX=require('xlsx'); const JSZip=require('jszip');
const HTML=fs.readFileSync(path.join(__dirname,'..','Shipment_Manager_v2.html'),'utf8')
  .replace(/<script src="https:\/\/cdnjs[^"]+xlsx[^"]+"><\/script>/,'').replace(/<script src="https:\/\/cdnjs[^"]+jszip[^"]+"><\/script>/,'');
const FIX=path.join(__dirname,'fixtures');
let pass=0, fail=0;
const uiRes=[];
const ok=(c,m)=>{ console.log((c?'PASS':'FAIL')+'  '+m); uiRes.push([!!c,m]); if(c) pass++; else fail++; };
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||250));

function makePage(preset){
  const errors=[], downloads=[], alerts=[];
  const vc=new VirtualConsole(); vc.on('jsdomError',e=>errors.push(e.message)); vc.on('error',e=>errors.push(String(e)));
  const dom=new JSDOM(HTML,{runScripts:'dangerously', url:'http://localhost/', virtualConsole:vc, beforeParse(win){
    win.XLSX=XLSX; win.JSZip=JSZip;
    win.confirm=()=>true; win.alert=m=>alerts.push(m); win.prompt=()=>null;
    win.URL.createObjectURL=b=>{ downloads.push({blob:b}); return 'blob:'+downloads.length; };
    win.HTMLAnchorElement.prototype.click=function(){ if(downloads.length) downloads[downloads.length-1].name=this.download; };
    if(preset) for(const [k,v] of Object.entries(preset)) win.localStorage.setItem(k,v);
  }});
  const w=dom.window, d=w.document;
  const written=[]; XLSX.writeFile=(wb,name)=>written.push({wb,name});
  return {w,d,errors,downloads,alerts,written};
}
function fileFromAoa(w,aoa,name){ const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(aoa),'Sheet1'); return new w.File([XLSX.write(wb,{bookType:'xlsx',type:'array'})], name); }
async function dropFiles(P, inputId, files){ const inp=P.d.getElementById(inputId); Object.defineProperty(inp,'files',{value:files,configurable:true}); inp.dispatchEvent(new P.w.Event('change')); await tick(400); }
const set=(P,id,v)=>{ const e=P.d.getElementById(id); e.value=v; e.dispatchEvent(new P.w.Event('input')); e.dispatchEvent(new P.w.Event('change')); };
const rowsHtml=P=>P.d.getElementById('itemsTbody').innerHTML;
const HDR=['Stock Moves/Barcode','Stock Moves/Product','Stock Moves/Quantity','Stock Moves/Allowed Uom','Stock Moves/Reference'];

(async()=>{
  // ---------------------------------------------------------------- main page
  const P=makePage(); const {w,d}=P;
  ok(P.errors.length===0, 'page loads with no script errors '+P.errors.join(';'));

  // 1. Real P00343 through the import dialog
  await dropFiles(P,'filePO',[new w.File([fs.readFileSync(path.join(FIX,'P00343.xlsx'))],'P00343.xlsx')]);
  ok(d.getElementById('modalBack').classList.contains('show') && d.getElementById('impRef').value==='P00343', 'import dialog opens; PO ref prefilled from the FILE NAME (P00343)');
  ok(/BFL\/IN\/00067/.test(d.getElementById('modal').textContent) && /not the PO number/.test(d.getElementById('modal').textContent), 'dialog shows receipt ref BFL/IN/00067 as a separate receipt reference');
  d.getElementById('impAddBtn').click(); await tick();
  ok(/Vendor is required/.test(d.getElementById('impMsg').textContent) && d.getElementById('modalBack').classList.contains('show'), 'vendor is required — PO not added without it');
  d.getElementById('impVendor').value='ABIDO supplier'; d.getElementById('impAddBtn').click(); await tick();
  const poTxt=()=>d.getElementById('poTbody').textContent;
  const poLinesCell=ref=>{ const tr=[...d.querySelectorAll('#poTbody tr')].find(t=>t.cells[0].textContent.startsWith(ref)); return tr?tr.cells[4].textContent.trim():null; };
  ok(!d.getElementById('modalBack').classList.contains('show') && /P00343/.test(poTxt()) && /ABIDO supplier/.test(poTxt()) && /BFL\/IN\/00067/.test(poTxt()) && poLinesCell('P00343')==='38', 'P00343 listed with vendor, receipt ref and 38 lines');

  // 2. Second PO (generated) with the same ABIDO product + identical Benina lines
  await dropFiles(P,'filePO',[fileFromAoa(w,[HDR,['5283001104785','ABIDO SEVEN SPICES (MIX SPICE) 50G * 10 [BL00133]',10,'CTN10','WH/IN/00070'],['5285001032167','BENINA QUINOA BLACK 500G * 20 [BL01001]',5,'CTN20','WH/IN/00070'],['5285001032167','BENINA QUINOA BLACK 500G * 20 [BL01001]',3,'CTN20','WH/IN/00070']],'PA001.xlsx')]);
  ok(/Identical duplicate-line groups: 1/.test(d.getElementById('modal').textContent), 'import preview reports 1 identical duplicate-line group (Benina 5 + 3)');
  d.getElementById('impVendor').value='Vendor A'; d.getElementById('impAddBtn').click(); await tick();
  ok((d.getElementById('poTbody').querySelectorAll('tr').length===2) && /PA001/.test(poTxt()), 'two POs loaded and listed separately');
  ok(d.getElementById('qaPo').options.length===3, '"Receiving against PO" selector offers Auto + both POs');

  // 3. Auto receiving of a product present on BOTH POs → PO SELECTION REQUIRED → choose P00343 → READY
  set(P,'qaPo',''); set(P,'qaPhysBC','5283001104785'); set(P,'qaPhysQty','120'); await tick(50);
  ok(/PO SELECTION REQUIRED/.test(d.getElementById('qaStatusBadge').textContent), 'preview: product on two POs with Auto → PO SELECTION REQUIRED');
  set(P,'qaItem','ABIDO SEVEN SPICES'); d.getElementById('addItemBtn').click(); await tick();
  ok(/PO SELECTION REQUIRED/.test(rowsHtml(P)) && !/IN UPLOAD/.test(rowsHtml(P)), 'row added as PO SELECTION REQUIRED, not in upload');
  const poSel=d.querySelector('select[data-key="po"]'); const p343Id=[...poSel.options].find(o=>/P00343/.test(o.textContent)).value;
  poSel.value=p343Id; poSel.dispatchEvent(new w.Event('change',{bubbles:true})); await tick();
  ok(/READY/.test(rowsHtml(P)) && /IN UPLOAD/.test(rowsHtml(P)) && /1200 PCS/.test(rowsHtml(P)), 'after choosing P00343: READY, IN UPLOAD, 120 CTN10 = 1200 PCS shown');

  // 4. Receiving against a selected PO: Benina 6 vs identical group 5 + 3 → QUANTITY MISMATCH, no line question
  const paId=[...d.getElementById('qaPo').options].find(o=>/PA001/.test(o.textContent)).value;
  set(P,'qaPo',paId); set(P,'qaItem','BENINA QUINOA BLACK'); set(P,'qaPhysBC','5285001032167'); set(P,'qaPhysQty','6'); d.getElementById('addItemBtn').click(); await tick();
  const benRow=[...d.querySelectorAll('#itemsTbody tr')].find(tr=>/5285001032167/.test(tr.textContent));
  ok(benRow && /QUANTITY MISMATCH/.test(benRow.textContent) && /group: 5 \+ 3/.test(benRow.textContent) && !benRow.querySelector('select[data-key="match"]'), 'Benina 6 vs group 5 + 3 → QUANTITY MISMATCH, group shown, no line-selection question');
  ok(d.getElementById('qaPo').value===paId, 'selected PO stays selected for the next item (sticky)');

  // 5. Split row: 11 Abido received with Auto → split 10 to PA001 + 1 to P00343
  set(P,'qaPo',''); set(P,'qaItem','ABIDO SEVEN SPICES'); set(P,'qaPhysBC','5283001104785'); set(P,'qaPhysQty','11'); d.getElementById('addItemBtn').click(); await tick();
  const before=d.querySelectorAll('#itemsTbody tr').length;
  const splitBtn=[...d.querySelectorAll('button[data-act="split"]')][0]; splitBtn.click(); await tick();
  const parts=d.querySelectorAll('#spParts .split-part');
  parts[0].querySelector('.spPo').value=paId; parts[0].querySelector('.spQty').value='10'; parts[1].querySelector('.spPo').value=p343Id; parts[1].querySelector('.spQty').value='2';
  d.getElementById('spSaveBtn').click(); await tick();
  ok(/add up exactly/.test(d.getElementById('spMsg').textContent), 'split refused when parts (12) do not add up to the row (11)');
  parts[1].querySelector('.spQty').value='1'; d.getElementById('spSaveBtn').click(); await tick();
  ok(d.querySelectorAll('#itemsTbody tr').length===before+1 && (rowsHtml(P).match(/split of #/g)||[]).length===2, 'split creates two linked rows (one per PO), original replaced');

  // 6. UOM definitions: built-ins listed; invalid refused; valid saved & persisted
  ok(/CTN&lt;n&gt;|CTN<n>/.test(d.getElementById('uomTbody').innerHTML) && /Pack of/.test(d.getElementById('uomTbody').textContent), 'built-in UOM rules listed (CTN<n>, PCS, Pack of <n>)');
  set(P,'uomLabel','CTNP10'); set(P,'uomPcs','10'); set(P,'uomSide','both'); set(P,'uomBy',''); d.getElementById('uomAddBtn').click();
  ok(/Approved by is required/.test(d.getElementById('uomMsg').textContent), 'definition without approver refused');
  set(P,'uomLabel','By 24'); set(P,'uomPcs','24'); set(P,'uomSide','both'); set(P,'uomBy','Ops manager'); d.getElementById('uomAddBtn').click(); await tick();
  const defs=JSON.parse(w.localStorage.getItem('bfl_uom_definitions_v1')||'[]');
  ok(defs.length===1 && defs[0].label==='By 24' && defs[0].pcsPerUnit===24 && /By 24/.test(d.getElementById('uomTbody').textContent), 'approved definition "By 24 = 24 PCS" saved to the permanent table');

  // 7. Re-import P00343 with one line removed → preview → confirm
  const aoa=XLSX.utils.sheet_to_json(XLSX.readFile(path.join(FIX,'P00343.xlsx')).Sheets.Sheet1,{header:1,defval:null}).filter(r=>r[0]!=='5283001111431');
  await dropFiles(P,'filePO',[fileFromAoa(w,aoa,'P00343.xlsx')]);
  ok(d.getElementById('reimpOkBtn') && /Removed: 1/.test(d.getElementById('modal').textContent.replace(/\s+/g,' ')), 're-import of a loaded PO opens a preview (1 line removed)');
  d.getElementById('reimpOkBtn').click(); await tick();
  ok(/Re-imported PO P00343/.test(d.getElementById('poStatus').textContent) && poLinesCell('P00343')==='37', 're-import applied after confirmation (37 lines)');

  // 8. Exports: ZIP (2 PO workbooks + master), per-PO button, master button
  d.getElementById('exportZipBtn').click(); await tick(800);
  const zipDl=P.downloads.find(x=>/\.zip$/.test(x.name||''));
  ok(!!zipDl, 'ZIP download produced');
  if(zipDl){ const z=await JSZip.loadAsync(Buffer.from(await zipDl.blob.arrayBuffer())); const names=Object.keys(z.files);
    const master=XLSX.read(await z.file(names.find(n=>/MASTER/.test(n))).async('uint8array'),{type:'array'});
    const sum=XLSX.utils.sheet_to_json(master.Sheets['PO Summary'],{header:1,defval:''});
    ok(names.length===3 && names.some(n=>/_P00343_reconciliation\.xlsx$/.test(n)) && names.some(n=>/_PA001_reconciliation\.xlsx$/.test(n)), 'ZIP holds P00343 + PA001 workbooks + master ('+names.join(', ')+')');
    ok(sum[4][0]==='P00343' && sum[5][0]==='PA001' && /NEEDS REVIEW|RESOLVED|COMPLETE/.test(sum[4][17]), 'master PO Summary lists both POs with an overall status');
    const p=XLSX.read(await z.file(names.find(n=>/P00343/.test(n))).async('uint8array'),{type:'array'});
    const up=XLSX.utils.sheet_to_json(p.Sheets['Odoo Upload File'],{header:1,defval:''});
    const det=XLSX.utils.sheet_to_json(p.Sheets['Receiving Detail'],{header:1,defval:''}); const iSt=det[0].indexOf('Status');
    ok(up.length===1 && det.slice(1).length===2 && det.slice(1).every(r=>r[iSt]==='QUANTITY MISMATCH'), 'P00343 after split: 120 + 1 = 121 vs 120 ordered → both rows QUANTITY MISMATCH, upload EMPTY until reviewed'); }
  // accept the received quantity on both P00343 rows, then export that PO alone
  // re-query after every change: each decision re-renders the table
  for(let guard=0; guard<10; guard++){ const s=[...d.querySelectorAll('select[data-key="qty"]')].find(x=>/P00343/.test(x.closest('tr').cells[1].textContent) && x.value===''); if(!s) break;
    s.value='accept'; s.dispatchEvent(new w.Event('change',{bubbles:true})); await tick(50); }
  const poBtn=[...d.querySelectorAll('button[data-exportpo]')].find(b=>/P00343/.test(b.textContent)); poBtn.click(); d.getElementById('exportMasterBtn').click(); await tick();
  ok(P.written.length===2 && /_P00343_reconciliation\.xlsx$/.test(P.written[0].name) && /_MASTER_reconciliation\.xlsx$/.test(P.written[1].name), 'per-PO and master buttons each write one workbook');
  const up2=XLSX.utils.sheet_to_json(P.written[0].wb.Sheets['Odoo Upload File'],{header:1,defval:''}).slice(1).map(r=>[r[0],r[1],r[4],r[8],r[9]]).sort((a,b)=>b[1]-a[1]);
  ok(JSON.stringify(up2)===JSON.stringify([['5283001104785',120,'CTN10','P00343','BFL/IN/00067'],['5283001104785',1,'CTN10','P00343','BFL/IN/00067']]), 'after accepting: P00343 upload = 120 + 1 CTN10 (received qty, Odoo UOM) with PO + receipt ref '+JSON.stringify(up2));

  // 9. Session keys
  const v3=JSON.parse(w.localStorage.getItem('bfl_shipment_manager_v3_session')||'{}');
  ok(v3.version===3 && v3.pos.length===2 && Array.isArray(v3.uomDefinitionsSnapshot) && v3.uomDefinitionsSnapshot.length===1, 'session autosaved under the v3 key with POs and a definitions snapshot');
  ok(w.localStorage.getItem('bfl_shipment_manager_v2_session')===null && w.localStorage.getItem('bfl_shipment_session_v3')===null, 'v1 and v2 storage keys never written');
  d.getElementById('clearSessionBtn').click(); await tick();
  ok(JSON.parse(w.localStorage.getItem('bfl_uom_definitions_v1')).length===1 && d.getElementById('poTbody').querySelectorAll('tr').length===1, 'clearing the session keeps approved UOM definitions');
  ok(P.errors.length===0, 'no script errors during main run '+P.errors.join(' ; '));

  // ---------------------------------------------------------------- legacy single-PO v2 browser session is migrated (copy), original untouched
  const v2session=JSON.stringify({version:2, shipmentName:'Old shipment', poFileName:'shipment sep 2026.xlsx',
    poLines:[{id:'L1',row:2,barcode:'6281100410072',item:'ABOU KASS BASMATI RICE 4KG*8',uom:'CTN8',qty:10}],
    items:[{no:1,item:'ABOU KASS BASMATI RICE 4KG*8',physicalBC:'6281100410072',physicalQty:10,expiry:'08/01/2028',decisions:{}}], nextNo:2});
  const L=makePage({'bfl_shipment_manager_v2_session':v2session}); await tick();
  ok(/shipment sep 2026/.test(L.d.getElementById('poTbody').textContent) && /vendor missing/.test(L.d.getElementById('poTbody').textContent) && /READY/.test(L.d.getElementById('itemsTbody').innerHTML),
     'v2 single-PO browser session migrated: PO from old file name, vendor flagged missing, row READY');
  ok(L.w.localStorage.getItem('bfl_shipment_manager_v2_session')===v2session, 'original v2 session left byte-identical');
  // v1 backup file
  const v1=JSON.stringify({shipmentName:'v1 shipment', items:[{no:1,item:'ABOU KASS BASMATI RICE 4KG*8',physicalBC:'6281100410072',physicalQty:10,expiry:'x',notes:null,bucket:'ready'}], nextNo:2});
  await dropFiles(L,'loadSessionInput',[new L.w.File([v1],'old_v1.json')]);
  ok(L.alerts.some(a=>/v1 session backup/.test(a)) && L.d.getElementById('shipmentName').value==='v1 shipment', 'v1 session backup loads (rows wait for a PO)');
  ok(L.errors.length===0, 'no script errors during migration run '+L.errors.join(' ; '));

  console.log('\n'+pass+' / '+(pass+fail)+' UI checks passed');
  // append to TEST_RESULTS.md (run after run_tests.js, which rewrites the file)
  const md='\n## UI checks (jsdom, real page)\n\nRun: '+new Date().toISOString()+'\n\n| # | Check | Result |\n|---|---|---|\n'+uiRes.map(([p,m],i)=>'| '+(i+1)+' | '+m.replace(/\|/g,'/')+' | '+(p?'PASS':'**FAIL**')+' |').join('\n')+'\n\n**'+pass+' / '+(pass+fail)+' UI checks passed.**\n';
  try{ fs.appendFileSync(path.join(__dirname,'TEST_RESULTS.md'), md); }catch(e){ console.error('could not append UI results', e.message); }
  process.exit(fail?1:0);
})().catch(e=>{ console.error('UI TEST CRASH', e); process.exit(2); });
