const initialData = {
  text: {
    intro: "Le lac à quelques pas, les montagnes tout autour et assez d'activités pour remplir la semaine — ou ne rien faire du tout.",
    camping: "Un camping 4 étoiles au bord du plan d'eau d'Embrun, entre lac et montagnes. Plage et loisirs sont accessibles à pied."
  },
  days: [
    ["Jour 1", "Arrivée et installation", "Trajet, courses, découverte du camping et première soirée ensemble."],
    ["Jour 2", "Plan d'eau d'Embrun", "Baignade, paddle ou canoë, puis coucher de soleil au bord du lac."],
    ["Jour 3", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 4", "Les Orres", "Montagne, randonnée, accrobranche ou simplement profiter du panorama."],
    ["Jour 5", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 6", "Embrun et alentours", "Balade en ville, bonnes adresses et dernière grande soirée."],
    ["Jour 7", "Derniers souvenirs", "Rangement, derniers plongeons et trajet du retour."]
  ],
  activities: [
    ["🏊", "Baignade", "Plan d'eau"], ["🏄", "Paddle", "Sur le lac"],
    ["🛶", "Canoë", "Sur le lac"], ["🌲", "Accrobranche", "À vérifier"],
    ["⛳", "Mini-golf", "À proximité"], ["⛰", "Les Orres", "Montagne"],
    ["🥾", "Randonnée", "Selon le niveau"], ["🌅", "Coucher de soleil", "Gratuit"]
  ],
  budgets: {
    "4": { total: 1648.48, perPerson: 407.50, items: [["Chalet", 200], ["Essence", 45], ["Péage", 22.5], ["Courses", 40], ["Restaurant", 50], ["Activités", 50]] },
    "5": { total: 1912.10, perPerson: 382.42, items: [["Chalet", 188.42], ["Essence", 36], ["Péage", 18], ["Courses", 40], ["Restaurant", 50], ["Activités", 50]] },
    "6": { total: 2266.72, perPerson: 377.79, items: [["Chalet", 157.79], ["Essence", 50], ["Péage", 30], ["Courses", 40], ["Restaurant", 50], ["Activités", 50]] },
    "7": { total: 2411.34, perPerson: 344.48, items: [["Chalet", 135.91], ["Essence", 42.86], ["Péage", 25.71], ["Courses", 40], ["Restaurant", 50], ["Activités", 50]] }
  },
  faqs: [
    ["Qui conduit ?", "Ceux qui ont le permis. Les conducteurs et les voitures seront fixés avant le départ."],
    ["Comment fait-on les courses ?", "Dans un magasin 👍 Le budget prévoit environ 40 € par personne."],
    ["Qui dort où ?", "Tout le monde dans le chalet de 7 personnes. La répartition se fera sur place."],
    ["Comment partage-t-on le budget ?", "À parts égales pour les courses, le voyage et la location. Chacun paie ses activités et son restaurant."],
    ["Quand faut-il réserver ?", "Au plus tard en janvier. L'objectif est de tout fixer avant la fin de l'année civile."],
    ["Et si quelqu'un annule ?", "La part engagée reste due afin de ne pas augmenter le budget des autres."]
  ]
};

const key = "zigotos-embrun-data-v1";
const nameKey = "zigotos-first-name-v1";
let data = loadData();
let editing = false;
let editSnapshot = null;
const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function currentUserName() {
  return localStorage.getItem(nameKey) || "";
}

function updateUserBadge(name) {
  document.querySelector("#userName").textContent = name || "Invité";
  document.querySelector("#userInitial").textContent = name ? name.charAt(0).toUpperCase() : "?";
}

function loadData() {
  try { return { ...initialData, ...JSON.parse(localStorage.getItem(key)) }; }
  catch { return structuredClone(initialData); }
}

async function saveData() {
  document.querySelectorAll(".editable[data-key]").forEach(el => data.text[el.dataset.key] = el.textContent.trim());
  localStorage.setItem(key, JSON.stringify(data));
  if (!window.saveSharedTrip) return false;
  return window.saveSharedTrip(structuredClone(data));
}

function render() {
  document.querySelectorAll(".editable[data-key]").forEach(el => el.textContent = data.text[el.dataset.key]);
  document.querySelector("#timeline").innerHTML = data.days.map((d, i) => `<article class="day"><span class="day-number">${escapeHTML(d[0])}</span><div><div class="day-heading"><strong class="day-title" data-index="${i}">${escapeHTML(d[1])}</strong>${d[3] ? `<span class="day-editor" title="Modifié par ${escapeHTML(d[3])}"><b>${escapeHTML(d[3].charAt(0).toUpperCase())}</b><span>${escapeHTML(d[3])}</span></span>` : ""}</div><p class="day-copy" data-index="${i}">${escapeHTML(d[2])}</p></div></article>`).join("");
  document.querySelector("#activityGrid").innerHTML = data.activities.map(a => `<article class="activity-card"><span class="activity-icon">${escapeHTML(a[0])}</span><div><strong>${escapeHTML(a[1])}</strong><small>${escapeHTML(a[2])}</small></div></article>`).join("");
  document.querySelector("#faqList").innerHTML = data.faqs.map(f => `<article class="faq-item"><button class="faq-question" type="button">${escapeHTML(f[0])}<span>+</span></button><div class="faq-answer">${escapeHTML(f[1])}</div></article>`).join("");
  document.querySelectorAll(".faq-question").forEach(button => button.addEventListener("click", () => button.parentElement.classList.toggle("open")));
  updateBudget();
}

function updateBudget() {
  const count = document.querySelector("#peopleSelect").value;
  const budget = data.budgets[count];
  document.querySelector("#perPersonTotal").textContent = euro.format(budget.perPerson);
  document.querySelector("#groupTotal").textContent = `Total du groupe : ${euro.format(budget.total)}`;
  document.querySelector("#budgetList").innerHTML = budget.items.map(item => `<div class="budget-row"><span>${item[0]}</span><strong>${euro.format(item[1])} / pers.</strong></div>`).join("");
}

async function setEditing(active) {
  editing = active;
  if (active) editSnapshot = structuredClone(data.days);
  document.body.classList.toggle("editing", active);
  document.querySelector("#editButton").setAttribute("aria-pressed", String(active));
  document.querySelector("#editButton").innerHTML = active ? "✓ Terminer" : "<span aria-hidden=\"true\">✎</span> Modifier";
  document.querySelectorAll(".editable").forEach(el => el.contentEditable = active);
  document.querySelectorAll(".day-title,.day-copy").forEach(el => el.contentEditable = active);
  if (!active) {
    document.querySelectorAll(".day-title").forEach(el => data.days[el.dataset.index][1] = el.textContent.trim());
    document.querySelectorAll(".day-copy").forEach(el => data.days[el.dataset.index][2] = el.textContent.trim());
    data.days.forEach((day, index) => {
      if (editSnapshot && (day[1] !== editSnapshot[index]?.[1] || day[2] !== editSnapshot[index]?.[2])) day[3] = currentUserName();
    });
    render();
    const synced = await saveData();
    showToast(synced ? "Changements partagés avec le groupe" : "Sauvegardé sur cet appareil — Firebase indisponible");
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

document.querySelector("#peopleSelect").addEventListener("change", updateBudget);
document.querySelector("#editButton").addEventListener("click", () => editing ? setEditing(false) : document.querySelector("#editDialog").showModal());
document.querySelector("#toggleEdit").addEventListener("click", () => { document.querySelector("#editDialog").close(); setEditing(true); });
document.querySelector("#exportData").addEventListener("click", () => {
  saveData(); const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  const a = Object.assign(document.createElement("a"), {href:URL.createObjectURL(blob), download:"embrun-2027.json"}); a.click(); URL.revokeObjectURL(a.href); showToast("Fichier exporté");
});
document.querySelector("#importData").addEventListener("change", async e => {
  try { data = JSON.parse(await e.target.files[0].text()); render(); const synced = await saveData(); document.querySelector("#editDialog").close(); showToast(synced ? "Changements importés et partagés" : "Importé localement — Firebase indisponible"); }
  catch { showToast("Ce fichier n'est pas valide"); }
});
document.querySelector("#resetData").addEventListener("click", async () => {
  if (confirm("Restaurer la version initiale pour tout le monde ?")) {
    data = structuredClone(initialData);
    render();
    const synced = await saveData();
    document.querySelector("#editDialog").close();
    showToast(synced ? "Version initiale restaurée pour tout le monde" : "Reset local uniquement — Firebase indisponible");
  }
});

document.querySelector("#nameForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.querySelector("#firstName").value.trim().replace(/\s+/g, " ");
  if (name.length < 2) return;
  localStorage.setItem(nameKey, name);
  updateUserBadge(name);
  document.querySelector("#nameDialog").close();
  window.dispatchEvent(new CustomEvent("trip-user-ready", { detail: name }));
  showToast(`Bienvenue ${name} !`);
});

window.getTripData = () => structuredClone(data);
window.addEventListener("shared-trip-data", event => {
  data = { ...structuredClone(initialData), ...event.detail };
  localStorage.setItem(key, JSON.stringify(data));
  render();
});

render();
updateUserBadge(currentUserName());

if (!localStorage.getItem(nameKey)) {
  document.querySelector("#nameDialog").showModal();
} else {
  window.dispatchEvent(new CustomEvent("trip-user-ready", { detail: localStorage.getItem(nameKey) }));
}
