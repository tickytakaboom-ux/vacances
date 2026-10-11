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
