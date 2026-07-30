const initialData = {
  dataVersion: 3,
  activityVersion: 2,
  text: {
    intro: "Le lac à quelques pas, les montagnes tout autour et assez d'activités pour remplir la semaine — ou ne rien faire du tout.",
    camping: "Un camping 4 étoiles au bord du plan d'eau d'Embrun, entre lac et montagnes. Plage et loisirs sont accessibles à pied."
  },
  textAuthors: {},
  days: [
    ["Jour 1 · Dimanche", "Arrivée et installation", "Trajet, courses, découverte du camping et première soirée ensemble."],
    ["Jour 2 · Lundi", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 3 · Mardi", "Les Orres", "Montagne, randonnée, accrobranche ou simplement profiter du panorama."],
    ["Jour 4 · Mercredi", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 5 · Jeudi", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 6 · Vendredi", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 7 · Samedi", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 8 · Dimanche", "Derniers souvenirs", "Rangement, derniers plongeons et trajet du retour."]
  ],
  activities: [
    ["🏊", "Baignade", "Plan d'eau"], ["🏄", "Paddle", "Sur le lac"],
    ["🛶", "Canoë", "Sur le lac"], ["🌲", "Accrobranche", "À vérifier"],
    ["⛳", "Mini-golf", "À proximité"], ["⛰", "Les Orres", "Montagne"],
    ["🥾", "Randonnée", "Selon le niveau"], ["🌅", "Coucher de soleil", "Gratuit"],
    ["✨", "Et plein d'autres…", "À découvrir ensemble"]
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
const adminKey = "zigotos-admin-v1";
const adminCodeHash = "a8f5c8afb801ba1992ca7ccb79908e1d78c493a0f03cbe310c6b561f9d4647f5";
let data = loadData();
let editing = false;
let editSnapshot = null;
let editTextSnapshot = null;
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

function updateAdminControls() {
  document.querySelector("#resetData").hidden = localStorage.getItem(adminKey) !== "true";
}

async function isValidAdminCode(code) {
  const bytes = new TextEncoder().encode(code);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("") === adminCodeHash;
}

function loadData() {
  try { return normalizeData(JSON.parse(localStorage.getItem(key))); }
  catch { return structuredClone(initialData); }
}

function normalizeData(source) {
  const normalized = { ...structuredClone(initialData), ...(source || {}) };
  if (source?.dataVersion !== initialData.dataVersion) {
    normalized.dataVersion = initialData.dataVersion;
    normalized.days = structuredClone(initialData.days);
  }
  if (source?.activityVersion !== initialData.activityVersion) {
    normalized.activityVersion = initialData.activityVersion;
    normalized.activities = structuredClone(initialData.activities);
  }
  return normalized;
}

async function saveData() {
  localStorage.setItem(key, JSON.stringify(data));
  if (!window.saveSharedTrip) return false;
  return window.saveSharedTrip(structuredClone(data));
}

function render() {
  document.querySelectorAll(".text-editor").forEach(el => el.remove());
  document.querySelectorAll(".editable[data-key]").forEach(el => {
    const textKey = el.dataset.key;
    el.textContent = data.text[textKey];
    const author = data.textAuthors?.[textKey];
    if (author) el.insertAdjacentHTML("afterend", `<span class="text-editor" title="Modifié par ${escapeHTML(author)}"><b>${escapeHTML(author.charAt(0).toUpperCase())}</b><span>${escapeHTML(author)}</span></span>`);
  });
  document.querySelector("#timeline").innerHTML = data.days.map((d, i) => `<article class="day"><span class="day-number">${escapeHTML(d[0])}</span><div><div class="day-heading"><strong class="day-title" data-index="${i}">${escapeHTML(d[1])}</strong>${d[3] ? `<span class="day-editor" title="Modifié par ${escapeHTML(d[3])}"><b>${escapeHTML(d[3].charAt(0).toUpperCase())}</b><span>${escapeHTML(d[3])}</span></span>` : ""}</div><p class="day-copy" data-index="${i}">${escapeHTML(d[2])}</p></div></article>`).join("");
  document.querySelector("#activityGrid").innerHTML = data.activities.map(a => `<article class="activity-card"><span class="activity-icon">${escapeHTML(a[0])}</span><div><strong>${escapeHTML(a[1])}</strong><small>${escapeHTML(a[2])}</small></div></article>`).join("");
  document.querySelector("#faqList").innerHTML = data.faqs.map(f => `<article class="faq-item"><button class="faq-question" type="button">${escapeHTML(f[0])}<span>+</span></button><div class="faq-answer">${escapeHTML(f[1])}</div></article>`).join("");
  document.querySelectorAll(".faq-question").forEach(button => button.addEventListener("click", () => button.parentElement.classList.toggle("open")));
  updateBudget();
}

function updateBudget() {
  const count = Number(document.querySelector("#peopleSelect").value);
  const budget = data.budgets[count];
  document.querySelector("#perPersonTotal").textContent = euro.format(budget.perPerson);
  document.querySelector("#groupTotal").textContent = `Total du groupe : ${euro.format(budget.total)}`;
  document.querySelector("#budgetList").innerHTML = budget.items.map(item => `<div class="budget-row"><span>${item[0]}</span><strong>${euro.format(item[1])} / pers.</strong></div>`).join("");
  document.querySelector("#depositPerPerson").textContent = `${euro.format(275.70 / count)} / pers.`;
  document.querySelector("#depositCautionPerPerson").textContent = `${euro.format(200 / count)} / pers.`;
  document.querySelector("#statPeople").textContent = count;
  document.querySelector("#statPrice").textContent = `${euro.format(budget.perPerson)} + ${euro.format(200 / count)}`;
}

function updateCountdown() {
  const departure = new Date("2027-07-04T00:00:00+02:00");
  const remaining = departure.getTime() - Date.now();
  if (remaining <= 0) {
    document.querySelector("#countdown").innerHTML = "<strong class=\"countdown-live\">C'est parti !</strong>";
    document.querySelector("#countdownNote").textContent = "Direction Embrun";
    return;
  }
  const totalSeconds = Math.floor(remaining / 1000);
  document.querySelector("#countdownDays").textContent = Math.floor(totalSeconds / 86400);
  document.querySelector("#countdownHours").textContent = String(Math.floor(totalSeconds / 3600) % 24).padStart(2, "0");
  document.querySelector("#countdownMinutes").textContent = String(Math.floor(totalSeconds / 60) % 60).padStart(2, "0");
  document.querySelector("#countdownSeconds").textContent = String(totalSeconds % 60).padStart(2, "0");
}

async function setEditing(active) {
  editing = active;
  if (active) {
    editSnapshot = structuredClone(data.days);
    editTextSnapshot = structuredClone(data.text);
  }
  document.body.classList.toggle("editing", active);
  document.querySelector("#editButton").setAttribute("aria-pressed", String(active));
  document.querySelector("#editButton").innerHTML = active ? "✓ Terminer" : "<span aria-hidden=\"true\">✎</span> Modifier";
  document.querySelectorAll(".editable").forEach(el => el.contentEditable = active);
  document.querySelectorAll(".day-title,.day-copy").forEach(el => el.contentEditable = active);
  if (!active) {
    document.querySelectorAll(".editable[data-key]").forEach(el => {
      const textKey = el.dataset.key;
      data.text[textKey] = el.textContent.trim();
      if (editTextSnapshot && data.text[textKey] !== editTextSnapshot[textKey]) {
        data.textAuthors ??= {};
        data.textAuthors[textKey] = currentUserName();
      }
    });
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
let adminTapCount = 0;
let adminTapTimer = null;
document.querySelector("#userChip").addEventListener("click", async () => {
  adminTapCount += 1;
  clearTimeout(adminTapTimer);
  adminTapTimer = setTimeout(() => { adminTapCount = 0; }, 2200);
  if (adminTapCount < 5) return;
  adminTapCount = 0;
  const code = prompt("Code administrateur :");
  if (!code) return;
  if (await isValidAdminCode(code)) {
    localStorage.setItem(adminKey, "true");
    updateAdminControls();
    showToast("Mode administrateur activé sur cet appareil");
  } else {
    showToast("Code administrateur incorrect");
  }
});
document.querySelector("#resetData").addEventListener("click", async () => {
  if (localStorage.getItem(adminKey) !== "true") return;
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
  data = normalizeData(event.detail);
  localStorage.setItem(key, JSON.stringify(data));
  render();
});

render();
updateUserBadge(currentUserName());
updateAdminControls();
updateCountdown();
setInterval(updateCountdown, 1000);

if (!localStorage.getItem(nameKey)) {
  document.querySelector("#nameDialog").showModal();
} else {
  window.dispatchEvent(new CustomEvent("trip-user-ready", { detail: localStorage.getItem(nameKey) }));
}
