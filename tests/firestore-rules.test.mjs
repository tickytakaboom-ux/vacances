
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import test,{before,after,beforeEach} from 'node:test';
const require=createRequire(new URL("../.preview/firebase-tests/package.json", import.meta.url));
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,collection,getDoc,getDocs,setDoc,updateDoc,deleteDoc,serverTimestamp}=require('firebase/firestore');
let env;
const projectId='demo-vacances-access';
if(!process.env.FIRESTORE_EMULATOR_HOST?.startsWith('127.0.0.1:'))throw Error('Tests uniquement sur un émulateur loopback explicite.');
const rules=await readFile(process.env.FIRESTORE_RULES_FILE || new URL('../firestore.rules',import.meta.url),'utf8');
before(async()=>{env=await initializeTestEnvironment({projectId,firestore:{rules}});});
after(async()=>{await env?.cleanup();});
beforeEach(async()=>{
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async context=>{
  const db=context.firestore();
  await setDoc(doc(db,'trips/embrun-2027'),{contentJson:'{"souvenir":"conservé"}',updatedByUid:'member-active',updatedByName:'Ami',updatedAt:serverTimestamp()});
  await setDoc(doc(db,'trips/embrun-2027/members/member-active'),{active:true});
  await setDoc(doc(db,'trips/embrun-2027/members/member-revoked'),{active:false});
  await setDoc(doc(db,'trips/embrun-2027/history/old'),{contentJson:'{"souvenir":"ancien"}',changedByUid:'member-active',changedByName:'Ami',changedAt:serverTimestamp()});
 });
});
const guest=()=>env.unauthenticatedContext().firestore();
const signed=uid=>env.authenticatedContext(uid,{firebase:{sign_in_provider:'anonymous'}}).firestore();
const trip=db=>doc(db,'trips/embrun-2027');
const entry=db=>doc(db,'trips/embrun-2027/history/new');
const payload=uid=>({contentJson:'{"souvenir":"mis à jour"}',updatedByUid:uid,updatedByName:'Ami',updatedAt:serverTimestamp()});
test('visiteur non connecté : lecture, écriture et historique refusés',async()=>{
 const db=guest();await assertFails(getDoc(trip(db)));await assertFails(setDoc(trip(db),payload('guest')));
 await assertFails(getDocs(collection(db,'trips/embrun-2027/history')));
});
test('compte anonyme extérieur : lecture et écriture refusées',async()=>{
 const db=signed('outsider');await assertFails(getDoc(trip(db)));await assertFails(setDoc(trip(db),payload('outsider')));
 await assertFails(setDoc(entry(db),{contentJson:'{}',changedByUid:'outsider'}));
});
test('membre autorisé : carnet et historique accessibles',async()=>{
 const db=signed('member-active');await assertSucceeds(getDoc(trip(db)));
 await assertSucceeds(setDoc(trip(db),payload('member-active')));
 await assertSucceeds(setDoc(entry(db),{contentJson:'{}',changedByUid:'member-active',changedByName:'Ami',changedAt:serverTimestamp()}));
 await assertSucceeds(getDocs(collection(db,'trips/embrun-2027/history')));
});
test('membre révoqué : accès refusé',async()=>{
 const db=signed('member-revoked');await assertFails(getDoc(trip(db)));await assertFails(setDoc(trip(db),payload('member-revoked')));
});
test('impossible de s’accorder ou réactiver un accès',async()=>{
 const db=signed('outsider');await assertFails(setDoc(doc(db,'trips/embrun-2027/members/outsider'),{active:true}));
 const revoked=signed('member-revoked');await assertFails(updateDoc(doc(revoked,'trips/embrun-2027/members/member-revoked'),{active:true}));
});
test('la liste des membres et les fiches des autres sont privées',async()=>{
 const db=signed('member-active');await assertFails(getDocs(collection(db,'trips/embrun-2027/members')));
 await assertFails(getDoc(doc(db,'trips/embrun-2027/members/member-revoked')));
 await assertSucceeds(getDoc(doc(db,'trips/embrun-2027/members/member-active')));
});
test('les UID d’auteur ne peuvent pas être usurpés',async()=>{
 const db=signed('member-active');await assertFails(setDoc(trip(db),payload('outsider')));
 await assertFails(setDoc(entry(db),{contentJson:'{}',changedByUid:'outsider'}));
});
test('suppression du carnet et réécriture de l’historique refusées',async()=>{
 const db=signed('member-active');await assertFails(deleteDoc(trip(db)));
 await assertFails(updateDoc(doc(db,'trips/embrun-2027/history/old'),{contentJson:'{}'}));
 await assertFails(deleteDoc(doc(db,'trips/embrun-2027/history/old')));
});
test('autres chemins : accès refusé',async()=>{
 const db=signed('member-active');await assertFails(getDoc(doc(db,'trips/another-trip')));
 await assertFails(setDoc(doc(db,'other/data'),{value:true}));
});

test('une autorisation retirée bloque aussi un appareil déjà connecté',async()=>{
 const db=signed('member-active');await assertSucceeds(getDoc(trip(db)));
 await env.withSecurityRulesDisabled(async context=>{await updateDoc(doc(context.firestore(),'trips/embrun-2027/members/member-active'),{active:false});});
 await assertFails(getDoc(trip(db)));await assertFails(setDoc(trip(db),payload('member-active')));
});
