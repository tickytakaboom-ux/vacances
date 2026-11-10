import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
const functions=source.slice(source.indexOf('function personalChecklistCategories()'),source.indexOf('function savePersonalChecklist()'));
function harness(saved=null,version='2',writeBlocked=false){
 const values=new Map([['zigotos-personal-checklist-version',version],['zigotos-embrun-data-v1','DONNEES PARTAGEES INCHANGEES']]);if(saved!==null)values.set('zigotos-personal-checklist-v1',JSON.stringify(saved));const writes=[];
 const result=vm.runInNewContext('let personalLoadFailed=false,personalMigrationUnsaved=false;'+functions+';({personalChecklistCategories,personalChecklistReferences,migratePersonalChecklist,loadPersonalChecklist,flags:()=>({personalLoadFailed,personalMigrationUnsaved})})',{personalChecklistKey:'zigotos-personal-checklist-v1',personalChecklistVersionKey:'zigotos-personal-checklist-version',localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>{if(writeBlocked)throw Error('quota');values.set(key,value);writes.push(key);}}});return {...result,values,writes};
}
test('29 références, six catégories, literie conditionnelle et aucun matériel technique ajouté',()=>{
 const h=harness();const items=h.loadPersonalChecklist(),refs=h.personalChecklistReferences();assert.equal(items.length,29);assert.equal(h.personalChecklistCategories().length,6);assert.equal(new Set(items.map(item=>item.id)).size,29);assert.equal(new Set(items.map(item=>item.text)).size,29);assert.equal(refs.filter(item=>item.category==='bedding'&&item.conditional).length,2);
 for(const forbidden of ['compression','bâtons','frontale','étanche','aliment'])assert.equal(items.some(item=>item.text.toLowerCase().includes(forbidden)),false);assert.equal(h.values.get('zigotos-personal-checklist-version'),'3');assert.equal(items.every(item=>item.checked===false),true);
});
test('migration des anciens noms : coches conservées, doublons fusionnés, textes et identifiants personnels préservés',()=>{
 const saved=[{id:'personal-0',text:'Vêtements',checked:true},{id:'personal-8',text:'Serviettes',checked:true},{id:'charger-1',text:'Chargeur',checked:false},{id:'charger-2',text:'Chargeurs',checked:true},{id:'personal-7',text:'Mes baskets habituelles',checked:true},{id:'custom-book',text:'Livre',checked:true}];const copy=JSON.stringify(saved);const h=harness(saved);const result=h.loadPersonalChecklist();
 for(const id of ['packing-clothes','packing-shower-towel','packing-charger','personal-7','custom-book'])assert.equal(result.find(item=>item.id===id).checked,true,id);assert.equal(result.find(item=>item.id==='packing-beach-towel').checked,false);assert.equal(result.find(item=>item.id==='packing-walking-shoes').checked,false);assert.equal(result.length,31);assert.equal(result.find(item=>item.id==='personal-7').text,'Mes baskets habituelles');assert.equal(JSON.stringify(saved),copy);assert.equal(h.values.get('zigotos-embrun-data-v1'),'DONNEES PARTAGEES INCHANGEES');assert.equal(h.writes.every(key=>key.startsWith('zigotos-personal-checklist')),true);
});
test('migration idempotente et noms modernisés conservés',()=>{
 const h=harness();const first=h.migratePersonalChecklist([{id:'a',text:'Gourde',checked:true}]);assert.equal(JSON.stringify(h.migratePersonalChecklist(first)),JSON.stringify(first));first.find(item=>item.id==='packing-medicine').text='Mon traitement personnel';assert.equal(h.migratePersonalChecklist(first).find(item=>item.id==='packing-medicine').text,'Mon traitement personnel');
});
test('une suppression ou une personnalisation en version 3 reste effective au rechargement',()=>{
 const h=harness([{id:'packing-phone',text:'Mon téléphone',checked:true}],'3');const result=h.loadPersonalChecklist();assert.equal(result.length,1);assert.equal(result[0].text,'Mon téléphone');assert.equal(h.writes.length,0);assert.equal(harness([],'3').loadPersonalChecklist().length,0);
});
test('un cache incorrect reste intact et les données migrées restent disponibles si la sauvegarde échoue',()=>{
 const bad=harness([null]);assert.equal(bad.loadPersonalChecklist().length,29);assert.equal(bad.values.get('zigotos-personal-checklist-v1'),'[null]');assert.equal(bad.writes.length,0);assert.equal(bad.flags().personalLoadFailed,true);
 const blocked=harness([{id:'old',text:'Gourde',checked:true}],'2',true);assert.equal(blocked.loadPersonalChecklist().find(item=>item.id==='packing-bottle').checked,true);assert.equal(blocked.flags().personalMigrationUnsaved,true);assert.equal(blocked.values.get('zigotos-personal-checklist-version'),'2');
});
