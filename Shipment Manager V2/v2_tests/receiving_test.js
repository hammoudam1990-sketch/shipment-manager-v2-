// Focused receiving and dashboard regression tests using a synthetic session.
const assert=require('assert'), fs=require('fs'), path=require('path'), vm=require('vm');
const {JSDOM, VirtualConsole}=require('jsdom'), XLSX=require('xlsx'), JSZip=require('jszip');
const html=fs.readFileSync(path.join(__dirname,'..','Shipment_Manager_v2.html'),'utf8');
const ctx={module:{exports:{}}}; vm.createContext(ctx);
vm.runInContext(html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1],ctx);
const E=ctx.module.exports;
const line=(id,poId,item,barcode,qty,uom='PCS')=>({id,poId,item,barcode,qty,uom,row:2});
const po=(poId,ref,lines)=>({poId,ref,vendor:'Vendor',lines,receiptRefs:[]});
const state={version:3, shipmentName:'Test', poSeq:2, nextNo:1, pos:[
  po('P1','PO-1',[line('L1','P1','Product A','1234567890123',10),line('L2','P1','Product B','1234567890124',3)]),
  po('P2','PO-2',[line('L3','P2','Product A','1234567890123',20)])
],items:[]};
const item=(damage,extra={})=>({no:1,item:'Product A',physicalBC:'1234567890123',physicalQty:10,damagedQty:damage,poId:'P1',decisions:{},...extra});
const evFor=it=>E.evaluate({...state,items:[it]},[]);
const catalog=E.evaluate(state,[]).catalog;
for(const candidate of [item(0),item(0,{poId:null}),item(0,{physicalBC:'',item:'Product'}),item(0,{physicalBC:'',item:'Unrelated'})]){
  const full=evFor(candidate).rows[0], preview=E.previewItem(candidate,[],catalog);
  const result=r=>JSON.stringify([r.status,r.poId,r.statusLabel,r.odooQty,r.uploadEligible,r.match,r.poCandidates,r.reasons]);
  assert.strictEqual(result(preview),result(full));
}

let ev=evFor(item(2)), r=ev.rows[0];
assert.strictEqual(r.usableQty,8);
assert.strictEqual(r.odooQty,10);
assert.strictEqual(r.group.total,10);
assert.strictEqual(r.uploadEligible,false);
assert.match(r.review,/ON HOLD/);
assert.strictEqual(E.buildUpload(ev,'P1').rows.length,0);
const wb=E.buildPoWorkbook(XLSX,state,ev,'P1');
const detail=XLSX.utils.sheet_to_json(wb.Sheets['Receiving Detail'],{header:1});
assert.strictEqual(detail[1][detail[0].indexOf('Damaged Qty (Physical UOM)')],2);
assert.strictEqual(detail[1][detail[0].indexOf('Usable Qty (Physical UOM)')],8);
assert.strictEqual(XLSX.utils.sheet_to_json(wb.Sheets['Odoo Upload File'],{header:1}).length,1);
const fullOutput=E.buildAllOutputs(XLSX,state,ev);
for(const selection of [{kind:'po',poId:'P1'},{kind:'master'}]){
  const selected=E.buildAllOutputs(XLSX,state,ev,selection);
  assert.strictEqual(selected.files.length,1);
  const expected=fullOutput.files.find(f=>f.kind===selection.kind && (selection.kind!=='po' || f.poId===selection.poId));
  assert.strictEqual(selected.files[0].name,expected.name);
  assert.deepStrictEqual(selected.files[0].wb.SheetNames,expected.wb.SheetNames);
  for(const name of expected.wb.SheetNames)
    assert.strictEqual(JSON.stringify(XLSX.utils.sheet_to_json(selected.files[0].wb.Sheets[name],{header:1})),JSON.stringify(XLSX.utils.sheet_to_json(expected.wb.Sheets[name],{header:1})));
}
for(const bad of [-1,11,'invalid']){
  r=evFor(item(bad)).rows[0];
  assert.strictEqual(r.uploadEligible,false);
  assert.strictEqual(r.damagedQty,null);
}
assert.strictEqual(evFor(item(10)).rows[0].usableQty,0);
assert.strictEqual(evFor(item(null)).rows[0].uploadEligible,true);
assert.strictEqual(evFor(item(2,{physicalQty:9,decisions:{qty:'accept'}})).rows[0].uploadEligible,false);
const convertedState={...state,pos:[po('P1','PO-1',[
  line('L1','P1','Product A','1234567890123',12),line('L2','P1','Product A','1234567890123',12)
]),state.pos[1]],items:[item(0.5,{physicalQty:2,physicalUom:'CTN12'})]};
const converted=E.evaluate(convertedState,[]);
assert.strictEqual(converted.rows[0].group.total,24);
assert.strictEqual(converted.rows[0].conv.factor,12);
assert.strictEqual(converted.rows[0].usableQty,1.5);
assert.strictEqual(converted.rows[0].uploadEligible,false);
assert.strictEqual(converted.missing.filter(m=>m.poId==='P2').length,1);
assert.strictEqual(evFor(item(2,{physicalUom:'Tray'})).rows[0].conv.known,false);
assert.strictEqual(E.migrateSession({...state,items:[item(2)]}).state.items[0].damagedQty,2);
assert.strictEqual(E.migrateSession({...state,items:[item(undefined)]}).state.items[0].damagedQty,null);
const splitState={...state,items:[item(2)],nextNo:2};
assert.ok(E.splitItem(splitState,1,[{poId:'P1',qty:5},{poId:'P2',qty:5}]).errors);
assert.strictEqual(splitState.items.length,1);

const errors=[], alerts=[];
const vc=new VirtualConsole(); vc.on('jsdomError',e=>errors.push(e.message)); vc.on('error',e=>errors.push(String(e)));
const page=new JSDOM(html.replace(/<script src="https:\/\/cdnjs[^"]+"><\/script>/g,''),{
  runScripts:'dangerously', url:'http://localhost/', virtualConsole:vc, beforeParse(w){
    w.XLSX=XLSX; w.JSZip=JSZip; w.alert=m=>alerts.push(m); w.confirm=()=>true;
    w.localStorage.setItem('bfl_shipment_manager_v3_session',JSON.stringify(state));
  }
});
const w=page.window, d=w.document, $=id=>d.getElementById(id);
function set(id,value){ const el=$(id); el.value=value; el.dispatchEvent(new w.Event('input',{bubbles:true})); el.dispatchEvent(new w.Event('change',{bubbles:true})); }
assert.strictEqual(w.localStorage.getItem('bfl_shipment_manager_v3_session'),JSON.stringify(state));
assert.match($('damageTbody').textContent,/No damaged items/);
assert.strictEqual($('damageCount').textContent,'0');
set('qaPo','P1'); set('qaItem','Product A'); set('qaPhysBC','1234567890123'); set('qaPhysQty','10'); set('qaDamagedQty','11');
$('addItemBtn').click();
assert.match(alerts.pop(),/no greater/);
assert.strictEqual(JSON.parse(w.localStorage.getItem('bfl_shipment_manager_v3_session')).items.length,0);
set('qaDamagedQty','2'); $('addItemBtn').click();
const details=d.querySelector('#poTbody details');
assert.strictEqual(details.querySelector('table').tBodies[0].rows.length,0);
details.open=true; details.dispatchEvent(new w.Event('toggle'));
assert.match(details.textContent,/Product A/);
const cells=details.querySelector('table').tBodies[0].rows[0].cells;
assert.deepStrictEqual([...cells].map(x=>x.textContent.trim()),['Product A','PCS','10','10','2','8']);
assert.match($('itemsTbody').textContent,/2 \/ 8/);
assert.strictEqual($('damageCount').textContent,'1');
assert.match($('damageTbody').textContent,/PO-1/);
assert.match($('damageTbody').textContent,/Product A/);
assert.deepStrictEqual([...$('damageTbody').rows[0].cells].slice(3,7).map(x=>x.textContent.trim()),['PCS','10','2','8']);
set('poFilter','P2');
assert.strictEqual($('damageCount').textContent,'1');
set('poFilter','');
assert.strictEqual(d.querySelector('#poTbody details'),details);
assert.strictEqual(JSON.parse(w.localStorage.getItem('bfl_shipment_manager_v3_session')).items[0].damagedQty,2);
const stored=w.localStorage.getItem('bfl_shipment_manager_v3_session');
const reloaded=new JSDOM(html.replace(/<script src="https:\/\/cdnjs[^"]+"><\/script>/g,''),{
  runScripts:'dangerously',url:'http://localhost/',beforeParse(win){ win.XLSX=XLSX; win.JSZip=JSZip; win.localStorage.setItem('bfl_shipment_manager_v3_session',stored); }
});
assert.strictEqual(reloaded.window.localStorage.getItem('bfl_shipment_manager_v3_session'),stored);
assert.match(reloaded.window.document.getElementById('damageTbody').textContent,/Product A/);
assert.match(reloaded.window.document.getElementById('damageTbody').textContent,/2/);
reloaded.window.close();
const tile=d.querySelector('#poTiles button[data-po="P1"]'); tile.click();
assert.match($('modal').textContent,/Product A/);
assert.match($('modal').textContent,/Product B/);
$('dashClose').click();
assert.strictEqual(d.activeElement,tile);
d.querySelector('#dashGrid button[data-f="__damaged__"]').click();
assert.match($('modal').textContent,/Damaged: 2/);
$('dashApply').click();
assert.match($('itemsTbody').textContent,/Product A/);
assert.match($('filterTagWrap').textContent,/Damaged/);
d.querySelector('#damageTbody button[data-damage-edit]').click();
assert.strictEqual($('qaDamagedQty').value,'2');
set('qaDamagedQty','0'); $('addItemBtn').click();
assert.strictEqual(JSON.parse(w.localStorage.getItem('bfl_shipment_manager_v3_session')).items[0].damagedQty,0);
assert.strictEqual($('damageCount').textContent,'0');
assert.match($('damageTbody').textContent,/No damaged items/);
for(const button of [...d.querySelectorAll('#dashGrid button')]){
  button.click(); assert.ok($('modalBack').classList.contains('show')); $('dashClose').click();
}
const storageBefore=w.localStorage.getItem('bfl_shipment_manager_v3_session');
const originalSet=w.Storage.prototype.setItem;
w.Storage.prototype.setItem=function(key,value){ if(key==='bfl_shipment_manager_v3_session') throw new Error('Storage full'); return originalSet.call(this,key,value); };
set('shipmentName','Unsaved change');
assert.match(alerts.pop(),/could not be saved/i);
assert.strictEqual(w.localStorage.getItem('bfl_shipment_manager_v3_session'),storageBefore);
w.Storage.prototype.setItem=originalSet;
assert.deepStrictEqual(errors,[]);
page.window.close();
const convertedPage=new JSDOM(html.replace(/<script src="https:\/\/cdnjs[^"]+"><\/script>/g,''),{
  runScripts:'dangerously', url:'http://localhost/', beforeParse(win){
    win.XLSX=XLSX; win.JSZip=JSZip;
    win.localStorage.setItem('bfl_shipment_manager_v3_session',JSON.stringify(convertedState));
  }
});
const convertedDetails=convertedPage.window.document.querySelectorAll('#poTbody details');
for(const el of convertedDetails){ el.open=true; el.dispatchEvent(new convertedPage.window.Event('toggle')); }
const grouped=convertedDetails[0].querySelector('table').tBodies[0].rows[0];
assert.match(grouped.cells[0].textContent,/not allocated/);
assert.deepStrictEqual([...grouped.cells].slice(1).map(x=>x.textContent.trim()),['PCS','24','24','6','18']);
const other=convertedDetails[1].querySelector('table').tBodies[0].rows[0];
assert.deepStrictEqual([...other.cells].slice(1).map(x=>x.textContent.trim()),['PCS','20','0','0','0']);
convertedPage.window.close();
console.log('Receiving and dashboard regression tests passed');
