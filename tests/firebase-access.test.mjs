import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../firebase-sync.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
const appSource=await readFile(new URL('../app.js',import.meta.url),'utf8');
const initialAndNormalize=appSource.slice(0,appSource.indexOf('const key =')) + appSource.slice(appSource.indexOf('function normalizeData('),appSource.indexOf('async function saveData('));
const {initialData:seed,normalizeData}=vm.runInNewContext(initialAndNormalize+';({initialData,normalizeData})',{structuredClone});
function harness() {
 const nodes=new Map();const events=[];const listeners=[];const writes=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,value:'',textContent:'',classList:{remove(){},add(){},toggle(){}},addEventListener(type,fn){this[type]=fn;}});return nodes.get(id);};
 const sandbox={console:{warn(){},error(){}},structuredClone,localStorage:{getItem(){return 'Ami';}},document:{querySelector:node},window:{addEventListener(){},normalizeTripData:normalizeData,reportTripDataError(message){node("#dataWarning").textContent=message;},dispatchEvent(e){events.push(e);return true;}},Event:class{constructor(type){this.type=type;}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},initializeApp:()=>({}),getAuth:app=>({app}),getFirestore:()=>({}),signInAnonymously:async()=>({user:{uid:'device-test'}}),doc:(_, ...p)=>p.join('/'),collection:(_, ...p)=>p.join('/'),serverTimestamp:()=>1,setDoc:async(...args)=>writes.push(args),addDoc:async(...args)=>writes.push(args),onSnapshot(ref,opts,success,error){const entry={ref,success,error,stopped:false};listeners.push(entry);return()=>{entry.stopped=true;};}};
 vm.runInNewContext(source,sandbox);
 const snapshot=(data,fromCache=false)=>({exists:()=>data!==null,data:()=>data,metadata:{fromCache,hasPendingWrites:false}});
 return {nodes,events,listeners,writes,snapshot,save:content=>sandbox.window.saveSharedTrip(content)};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('appareil inconnu : code visible, aucun accès au carnet ni écriture',async()=>{
 const h=harness();await tick();assert.equal(h.nodes.get('#deviceCode').value,'device-test');assert.equal(h.listeners.length,1);
 h.listeners[0].success(h.snapshot(null));assert.equal(await h.save({text:'local'}),false);assert.equal(h.writes.length,0);assert.equal(h.listeners.length,1);
});
test('autorisation : attendre le serveur, charger le carnet sans envoyer l’ancien cache',async()=>{
 const h=harness();await tick();await h.save({text:'ancien cache'});
 h.listeners[0].success(h.snapshot({active:true},true));assert.equal(h.listeners.length,1);
 h.listeners[0].success(h.snapshot({active:true}));assert.equal(h.listeners.length,2);
 assert.equal(await h.save({text:'trop tôt'}),false);
 h.listeners[1].success(h.snapshot({contentJson:JSON.stringify(seed)},true));assert.equal(h.events.filter(e=>e.type==='shared-trip-data').length,0);
 h.listeners[1].success(h.snapshot({contentJson:JSON.stringify(seed)}));assert.equal(h.writes.length,0);assert.equal(h.nodes.get('#deviceAccess').hidden,true);
 assert.equal(await h.save({...structuredClone(seed),text:{...seed.text,intro:'nouvelle modification'}}),true);assert.equal(h.writes.length,2);
 assert.equal(h.writes[0][1].updatedByUid,'device-test');assert.equal(h.writes[1][1].changedByUid,'device-test');
});
test('retrait : arrêter le carnet, ignorer les callbacks tardifs et refuser les sauvegardes',async()=>{
 const h=harness();await tick();h.listeners[0].success(h.snapshot({active:true}));const trip=h.listeners[1];trip.success(h.snapshot({contentJson:JSON.stringify(seed)}));
 h.listeners[0].success(h.snapshot({active:false}));assert.equal(trip.stopped,true);const count=h.events.length;trip.success(h.snapshot({contentJson:'{"stale":true}'}));assert.equal(h.events.length,count);assert.equal(await h.save({text:'refusé'}),false);assert.equal(h.writes.length,0);assert.equal(h.nodes.get('#deviceAccess').hidden,false);
});
test('règles absentes ou carnet absent : aucune initialisation ou écriture automatique',async()=>{
 const h=harness();await tick();h.listeners[0].error({code:'permission-denied'});assert.match(h.nodes.get('#deviceAccessMessage').textContent,/règles Firebase/);assert.equal(h.writes.length,0);
 h.listeners[0].success(h.snapshot({active:true}));h.listeners[1].success(h.snapshot(null));assert.equal(await h.save({text:'défaut'}),false);assert.equal(h.writes.length,0);
});
test('une version partagée mal formée garde le carnet précédent et bloque les envois jusqu’à une réception saine',async()=>{
 const h=harness();await tick();h.listeners[0].success(h.snapshot({active:true}));const trip=h.listeners[1];trip.success(h.snapshot({contentJson:JSON.stringify(seed)}));
 const before=h.events.filter(e=>e.type==='shared-trip-data').length;
 for(const contentJson of ['{',JSON.stringify({...seed,faqs:null}),'[]','null','{}']){trip.success(h.snapshot({contentJson}));assert.equal(h.events.filter(e=>e.type==='shared-trip-data').length,before);assert.equal(await h.save(seed),false);assert.equal(h.writes.length,0);}
 assert.match(h.nodes.get('#dataWarning').textContent,/dernière copie/);trip.success(h.snapshot({contentJson:JSON.stringify(seed)}));assert.equal(await h.save(seed),true);
});

test('une sauvegarde mal formée n’est pas envoyée même depuis un appareil autorisé prêt',async()=>{
 const h=harness();await tick();h.listeners[0].success(h.snapshot({active:true}));h.listeners[1].success(h.snapshot({contentJson:JSON.stringify(seed)}));
 assert.equal(await h.save({...structuredClone(seed),faqs:null}),false);assert.equal(h.writes.length,0);assert.match(h.nodes.get('#dataWarning').textContent,/Envoi refusé/);
});
