import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFile} from "node:fs/promises";
const source = await readFile(new URL("../app.js", import.meta.url), "utf8");
const normalize = source.slice(source.indexOf("function normalizeData("), source.indexOf("async function saveData("));
const functions = vm.runInNewContext(source.slice(0, source.indexOf("const key =")) + normalize + ";({initialData,normalizeData,calculateScenarioBudget,previousDefaultDays})", {structuredClone});
test("les textes personnalisés et données du groupe survivent à la retouche", () => {
  const data = structuredClone(functions.initialData);
  data.text.intro = "Notre texte personnalisé";
  data.days[0][1] = "Notre arrivée modifiée";
  data.activities[0][3] = "Notre note"; data.activities[0][4] = "25 €";
  data.ideas = [{id:"id-test",text:"Notre idée"}];
  const result = functions.normalizeData(data);
  assert.equal(result.text.intro, data.text.intro);
  assert.equal(result.days[0][1], data.days[0][1]);
  assert.equal(result.activities[0][3], "Notre note");
  assert.equal(result.activities[0][4], "25 €");
  assert.equal(result.ideas[0].text, "Notre idée");
});
test("seuls les anciens textes par défaut sont remplacés", () => {
  const data = structuredClone(functions.initialData);
  data.text.intro = "Le lac à quelques pas, les montagnes tout autour et assez d'activités pour remplir la semaine — ou ne rien faire du tout.";
  data.faqs = [["Comment fait-on les courses ?", "Dans un magasin 👍"], ["Notre question", "Notre réponse"]];
  const result = functions.normalizeData(data);
  assert.equal(result.text.intro, functions.initialData.text.intro);
  assert.equal(result.faqs[0][1], "On prépare la liste ensemble dans l’onglet Courses.");
  assert.equal(result.faqs[1][1], "Notre réponse");
});
const countdown = source.slice(source.indexOf("function updateCountdown("), source.indexOf("async function setEditing("));
function checkCountdown(now) {
  const nodes = new Map();
  const document = {querySelector: key => {if(!nodes.has(key))nodes.set(key,{});return nodes.get(key);}};
  class Clock extends Date {static now(){return Date.parse(now);}}
  vm.runInNewContext(countdown + ";updateCountdown()", {document, Date:Clock});
  return nodes;
}
test("le compteur cible le 11 juillet 2027 en heure française", () => {
  const nodes = checkCountdown("2027-07-10T21:00:00Z");
  assert.equal(nodes.get("#countdownDays").textContent, 0);
  assert.equal(nodes.get("#countdownHours").textContent, "01");
  assert.equal(nodes.get("#countdownMinutes").textContent, "00");
});
test("au départ le compteur affiche un message sans nombre négatif", () => {
  const nodes = checkCountdown("2027-07-10T22:00:00Z");
  assert.match(nodes.get("#countdown").innerHTML, /C'est parti/);
});

const budgetFunction = source.slice(source.indexOf("function updateBudget("), source.indexOf("function updateCountdown("));
test("les libellés du budget à sept personnes restent du texte", () => {
  const data = structuredClone(functions.initialData);
  const payload = '<img src="/missing.png" onerror="window.__budgetXss=true">';
  const labels = [payload, 'Péage & séjour "été" <amis>'];
  for (const count of [7]) {
    data.budgets[count].items[0][0] = labels[0];
    data.budgets[count].items[1][0] = labels[1];
    const snapshot = JSON.stringify(data);
    const nodes = new Map();
    function element(tagName) {
      return {tagName, textContent:"", children:[], append(...children){this.children.push(...children);}, replaceChildren(...children){this.children = children;}};
    }
    const document = {createElement: element, querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, element("div"));
      return nodes.get(selector);
    }};
    document.querySelector("#transportSelect").value = "train";
    const euro = new Intl.NumberFormat("fr-FR", {style:"currency", currency:"EUR"});
    vm.runInNewContext(budgetFunction + ";updateBudget()", {document, data, euro, calculateScenarioBudget:functions.calculateScenarioBudget});
    const rows = nodes.get("#budgetList").children;
    assert.equal(rows.length, data.budgets[count].items.length);
    rows.forEach((row, i) => {
      assert.equal(row.tagName, "div");
      assert.equal(row.className, "budget-row");
      assert.equal(row.children[0].tagName, "span");
      assert.equal(row.children[0].textContent, data.budgets[count].items[i][0]);
      assert.equal(row.children[1].tagName, "strong");
      assert.equal(row.children[1].textContent, euro.format(data.budgets[count].items[i][1]) + (data.budgets[count].itemBasis === "group" ? " pour le groupe" : " / pers."));
    });
    assert.equal(nodes.get("#perPersonTotal").textContent, euro.format(data.budgets[count].perPerson));
    assert.equal(nodes.get("#groupTotal").textContent, "Budget hors cautions : " + euro.format(data.budgets[count].total) + " pour le groupe");
    assert.equal(nodes.get("#depositPerPerson").textContent, euro.format(275.70 / count) + " / pers.");
    assert.equal(nodes.get("#depositCautionPerPerson").textContent, euro.format(200 / count) + " / pers.");
    assert.equal(nodes.get("#statPeople").textContent, count);
    assert.equal(nodes.get("#statPrice").textContent, euro.format(data.budgets[count].perPerson));
    assert.equal(JSON.stringify(data), snapshot);
  }
});

test("les structures mal formées sont refusées avant toute migration", () => {
  const invalid = [null, [], "texte", 42, {}];
  for (const value of invalid) assert.throws(() => functions.normalizeData(value));
  const mutations = [d=>d.faqs=null,d=>d.faqs=[null],d=>d.activities=[{}],d=>d.days=[["Jour",42,"texte"]],d=>d.text=null,d=>d.textAuthors={intro:42},d=>d.checklist=[null],d=>d.checklist[0].checked="false",d=>d.assistanceContacts[0].number=42,d=>d.shopping=[{id:"a",text:"Pain",done:false,decision:{}}],d=>d.budgets["7"].items=null,d=>d.budgets["7"].total="12",d=>d.budgets["7"].perPerson=Infinity,d=>delete d.budgets["7"],d=>d.checklist.push({...d.checklist[0]}),d=>d.faqs=Array(101).fill(["Q","R"]),d=>d.text.intro="x".repeat(20001),d=>d.dataVersion="3",d=>d.textAuthors.intro={},d=>d.shopping=null,d=>d.ideas=[null],d=>d.assistanceContacts=[null],d=>d.budgets["7"].items=[["Montant",-1]],d=>Object.assign(d,JSON.parse('{"__proto__":{"polluted":true}}'))];
  for(const mutate of mutations){const data=structuredClone(functions.initialData);mutate(data);assert.throws(()=>functions.normalizeData(data));}
});
test("la validation conserve les champs personnalisés et les anciennes versions valides",()=>{
 const data=structuredClone(functions.initialData);data.text.intro="Nos souvenirs";data.textAuthors.intro="Julian";data.days[0].push("Ami","");data.shopping=[{id:"course-1",text:"Pain",decision:"bring",done:false,author:"Ami",updatedAt:"2026-10-24T12:00:00Z"}];
 const before=JSON.stringify(data);const result=functions.normalizeData(data);assert.equal(result.text.intro,"Nos souvenirs");assert.deepEqual(JSON.parse(JSON.stringify(result.shopping)),data.shopping);assert.equal(JSON.stringify(data),before);
 const old=structuredClone(data);delete old.textAuthors;delete old.shoppingVersion;assert.doesNotThrow(()=>functions.normalizeData(old));
});
test('les identifiants des contacts sont uniques et non vides',()=>{
 for(const id of ['', '   ', 'car-1']) {const data=structuredClone(functions.initialData);data.assistanceContacts[1].id=id;assert.throws(()=>functions.normalizeData(data));}
});

test('le budget à sept distingue dépenses, cautions et objectif avec arrondis corrects',()=>{
 const budget=functions.initialData.budgets['7'];const cents=budget.items.reduce((sum,item)=>sum+Math.round(item[1]*100),0);
 assert.equal(cents,342434);assert.equal(budget.total,3424.34);assert.equal((cents/100/7).toFixed(2),'489.19');assert.equal(((cents+20000)/100/7).toFixed(2),'517.76');assert.equal(((cents+26000)/100/7).toFixed(2),'526.33');assert.equal((200/7).toFixed(2),'28.57');assert.equal(550*7,3850);
 const old=structuredClone(functions.initialData);delete old.budgets['7'].revision;old.budgets['7'].total=2411.34;old.text.intro='Texte du groupe';old.days[0][1]='Programme du groupe';
 const before=structuredClone(old);const normalized=functions.normalizeData(old);assert.equal(normalized.budgets['7'].total,3424.34);assert.equal(normalized.budgets['7'].itemBasis,'group');assert.equal(normalized.text.intro,before.text.intro);assert.equal(normalized.days[0][1],before.days[0][1]);
 for(const key of ['checklist','shopping','assistanceContacts','faqs','ideas'])assert.equal(JSON.stringify(normalized[key]),JSON.stringify(before[key]));
 for(const count of ['4','5','6'])assert.equal(JSON.stringify(normalized.budgets[count]),JSON.stringify(before.budgets[count]));assert.equal(JSON.stringify(old),JSON.stringify(before));
});

test('trois scénarios : tronc commun unique, dépenses, cautions et marges calculés en centimes',()=>{
 const format=value=>new Intl.NumberFormat('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
 const expected={train:[342434,'489,19',368434,'526,33',16566,'23,67'],cars:[263634,'376,62',289634,'413,76',95366,'136,24'],mixed:[312434,'446,33',338434,'483,48',46566,'66,52']};
 const budget=functions.initialData.budgets['7'];const before=JSON.stringify(budget);
 for(const [scenario,values] of Object.entries(expected)){
  const result=functions.calculateScenarioBudget(budget,scenario);
  assert.equal(result.totalCents,values[0]);assert.equal(format(result.totalCents/100/7),values[1]);assert.equal(result.maximumCashCents,values[2]);assert.equal(format(result.maximumCashCents/100/7),values[3]);assert.equal(result.marginCents,values[4]);assert.equal(format(result.marginCents/100/7),values[5]);
  assert.equal(result.items.filter((_,i)=>i!==1).reduce((sum,item)=>sum+Math.round(item[1]*100),0),202434);
 }
 assert.equal(JSON.stringify(budget),before);assert.equal(functions.calculateScenarioBudget(budget,'__proto__').totalCents,342434);
});

test('la nouvelle enveloppe loisirs remplace uniquement ce poste dans les copies précédentes',()=>{
 const old=structuredClone(functions.initialData);old.budgets['7'].revision='embrun-2027-train-provision-v1';old.budgets['7'].items[4][1]=300;old.budgets['7'].total=3324.34;old.budgets['7'].perPerson=474.91;
 const before=structuredClone(old);const normalized=functions.normalizeData(old);
 assert.equal(normalized.budgets['7'].items[4][1],400);assert.equal(normalized.budgets['7'].total,3424.34);assert.equal(normalized.budgets['7'].perPerson,489.19);
 for(let i=0;i<old.budgets['7'].items.length;i++)if(i!==4)assert.equal(JSON.stringify(normalized.budgets['7'].items[i]),JSON.stringify(before.budgets['7'].items[i]));
 assert.equal(JSON.stringify(old),JSON.stringify(before));assert.equal((400/7).toFixed(2),'57.14');assert.equal(400-105,295);assert.equal(400-90,310);
});

test('le récapitulatif alimentaire distingue enveloppe, estimation provisoire et marge sans modifier les scénarios',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');const summary=html.match(/<article id="foodBudgetSummary">([\s\S]*?)<\/article>/)?.[1];assert.ok(summary);
 for(const text of ['588 € pour le groupe · 84 €/personne','Environ 236 € pour le groupe','352 € pour le groupe','estimation provisoire','panier entièrement vérifié','réserve flexible','pas une somme obligatoirement réservée à l’alimentation','boissons, snacks','d’autres dépenses communes','intégrée au budget global','besoins réels du groupe','quantités oubliés','variations de prix','achats alimentaires complémentaires','six participants qui ne sont pas végétariens','menus seront préparés plus tard'])assert.ok(summary.includes(text),text);
 assert.equal(588/7,84);assert.equal(588-236,352);
 assert.equal(functions.initialData.budgets['7'].items.find(item=>item[0]==='Alimentation')[1],588);
 for(const [scenario,total] of Object.entries({train:342434,cars:263634,mixed:312434}))assert.equal(functions.calculateScenarioBudget(functions.initialData.budgets['7'],scenario).totalCents,total);
 assert.equal((html.match(/id="shoppingList"/g)||[]).length,1);
});

test('le planning couvre les huit dates et distingue les options et confirmations',()=>{
 const days=functions.initialData.days;assert.equal(days.length,8);
 days.forEach((day,index)=>{const date=new Date(Date.UTC(2027,6,11+index));assert.ok(day[0].includes(String(date.getUTCDate())+' juillet'));});
 assert.match(days[2][2],/station des Orres/);assert.match(days[2][2],/facultatives/);assert.match(days[3][2],/À confirmer.*feu d’artifice/);assert.match(days[4][2],/Toutes les visites ne sont pas imposées/);assert.match(days[5][2],/retenu par le groupe/);assert.match(days[5][2],/passage sous la N94/);assert.match(days[6][2],/suffisamment préparés/);assert.match(days[7][2],/À confirmer/);
});
test('les anciens jours par défaut sont actualisés sans écraser les personnalisations ni les autres rubriques',()=>{
 const source=structuredClone(functions.initialData);source.days=structuredClone(functions.previousDefaultDays);source.days[0][1]='Notre arrivée personnalisée';source.days[1][2]='Notre note du lundi';source.days[1][3]='Julian';source.days[1][4]='relax';
 const original=JSON.stringify(source);const baseline=functions.normalizeData(functions.initialData);const result=functions.normalizeData(source);
 assert.equal(result.days[0][0],'Dimanche 11 juillet');assert.equal(result.days[0][1],'Notre arrivée personnalisée');assert.equal(result.days[1][2],'Notre note du lundi');assert.equal(result.days[1][3],'Julian');assert.equal(result.days[1][4],'relax');assert.equal(result.days[5][1],'Crots Branches');
 for(const key of Object.keys(baseline).filter(key=>key!=='days'))assert.equal(JSON.stringify(result[key]),JSON.stringify(baseline[key]),key);assert.equal(JSON.stringify(source),original);
});

 test("FAQ : 12 références, migration ciblée et idempotente sans toucher aux autres données", () => {
 const data=structuredClone(functions.initialData);assert.equal(data.faqs.length,12);
 assert.equal(data.faqs[0][0],"Quand et où part-on ?");assert.equal(data.faqs[11][0],"Et si quelqu'un doit annuler ?");
 data.faqVersion=3;data.faqs=[["D'où part-on et à quelle heure ?","Le départ se fera depuis Maurepas, à 7 h au plus tard."],["Qui dort où ?","Notre répartition personnalisée"],["Notre question","Notre réponse"]];
 const before=structuredClone(data), result=functions.normalizeData(data);
 assert.equal(result.faqVersion,4);assert.equal(result.faqs.length,13);assert.equal(result.faqs[6][1],"Notre répartition personnalisée");assert.equal(result.faqs[12][0],"Notre question");
 assert.equal(JSON.stringify(data),JSON.stringify(before));assert.equal(JSON.stringify(functions.normalizeData(result)),JSON.stringify(result));
 for(const key of ['days','budgets','activities','checklist','shopping','assistanceContacts'])assert.equal(JSON.stringify(result[key]),JSON.stringify(functions.normalizeData({...before,faqVersion:4})[key]));
 const future=structuredClone(data);future.faqVersion=5;assert.equal(JSON.stringify(functions.normalizeData(future).faqs),JSON.stringify(future.faqs));
 const full=structuredClone(data);full.faqs=Array.from({length:100},(_,i)=>['Question '+i,'Réponse']);assert.equal(functions.normalizeData(full).faqs.length,100);assert.equal(functions.normalizeData(full).faqVersion,3);
 });
