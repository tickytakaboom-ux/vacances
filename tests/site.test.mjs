import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFile} from "node:fs/promises";
const source = await readFile(new URL("../app.js", import.meta.url), "utf8");
const normalize = source.slice(source.indexOf("function normalizeData("), source.indexOf("async function saveData("));
const functions = vm.runInNewContext(source.slice(0, source.indexOf("const key =")) + normalize + ";({initialData,normalizeData})", {structuredClone});
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
test("les libellés du budget sont du texte et les montants restent inchangés pour 4 à 7 personnes", () => {
  const data = structuredClone(functions.initialData);
  const payload = '<img src="/missing.png" onerror="window.__budgetXss=true">';
  const labels = [payload, 'Péage & séjour "été" <amis>'];
  for (const count of [4, 5, 6, 7]) {
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
    document.querySelector("#peopleSelect").value = String(count);
    const euro = new Intl.NumberFormat("fr-FR", {style:"currency", currency:"EUR"});
    vm.runInNewContext(budgetFunction + ";updateBudget()", {document, data, euro});
    const rows = nodes.get("#budgetList").children;
    assert.equal(rows.length, data.budgets[count].items.length);
    rows.forEach((row, i) => {
      assert.equal(row.tagName, "div");
      assert.equal(row.className, "budget-row");
      assert.equal(row.children[0].tagName, "span");
      assert.equal(row.children[0].textContent, data.budgets[count].items[i][0]);
      assert.equal(row.children[1].tagName, "strong");
      assert.equal(row.children[1].textContent, euro.format(data.budgets[count].items[i][1]) + " / pers.");
    });
    assert.equal(nodes.get("#perPersonTotal").textContent, euro.format(data.budgets[count].perPerson));
    assert.equal(nodes.get("#groupTotal").textContent, "Total du groupe : " + euro.format(data.budgets[count].total));
    assert.equal(nodes.get("#depositPerPerson").textContent, euro.format(275.70 / count) + " / pers.");
    assert.equal(nodes.get("#depositCautionPerPerson").textContent, euro.format(200 / count) + " / pers.");
    assert.equal(nodes.get("#statPeople").textContent, count);
    assert.equal(nodes.get("#statPrice").textContent, euro.format(data.budgets[count].perPerson) + " + " + euro.format(200 / count) + " = " + euro.format(data.budgets[count].perPerson + 200 / count));
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