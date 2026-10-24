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
