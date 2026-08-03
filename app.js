const initialData = {
  dataVersion: 3,
  activityVersion: 2,
  faqVersion: 3,
  checklistVersion: 3,
  contactsVersion: 1,
  ideasVersion: 1,
  shoppingVersion: 1,
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
  checklist: [
    { id: "games", text: "Jeux", checked: false, author: "" },
    { id: "speaker", text: "Enceinte", checked: false, author: "" },
    { id: "cooler", text: "Glacière ou sacs isothermes", checked: false, author: "" },
    { id: "first-aid", text: "Trousse de premiers secours", checked: false, author: "" }
  ],
  assistanceContacts: [
    { id: "car-1", vehicle: "Voiture 1", insurer: "", number: "", author: "" },
    { id: "car-2", vehicle: "Voiture 2", insurer: "", number: "", author: "" }
  ],
  ideas: [],
  shopping: [],
  budgets: {
    "4": { total: 1648.48, perPerson: 407.50, items: [["Chalet", 200], ["Essence", 45], ["Péage", 22.5], ["Courses", 40], ["Restaurant", 50], ["Activités", 50]] },
    "5": { total: 1912.10, perPerson: 382.42, items: [["Chalet", 188.42], ["Essence", 36], ["Péage", 18], ["Courses", 40], ["Restaurant", 50], ["Activités", 50]] },
    "6": { total: 2266.72, perPerson: 377.79, items: [["Chalet", 157.79], ["Essence", 50], ["Péage", 30], ["Courses", 40], ["Restaurant", 50], ["Activités", 50]] },
    "7": { total: 2411.34, perPerson: 344.48, items: [["Chalet", 135.91], ["Essence", 42.86], ["Péage", 25.71], ["Courses", 40], ["Restaurant", 50], ["Activités", 50]] }
  },
  faqs: [
    ["D'où part-on et à quelle heure ?", "Le départ se fera depuis Maurepas, à 7 h au plus tard."],
    ["Comment se répartit-on dans les voitures ?", "Deux voitures sont prévues : 3 personnes dans l'une et 4 personnes dans l'autre. La répartition exacte sera décidée avant le départ."],
    ["Les draps et les serviettes sont-ils fournis ?", "Oui, en supplément. Les draps coûtent 15 € pour une personne ou 25 € pour deux personnes. Le kit avec une petite et une grande serviette coûte 20 € par personne."],
    ["Qui conduit ?", "Ceux qui ont le permis. Les conducteurs et les voitures seront fixés avant le départ."],
    ["Comment fait-on les courses ?", "Dans un magasin 👍"],
    ["Qui dort où ?", "Tout le monde dans le chalet de 7 personnes. La répartition se fera sur place."],
    ["Comment partage-t-on le budget ?", "À parts égales pour les courses, le voyage et la location. Chacun paie ses activités et son restaurant."],
    ["Quand faut-il réserver ?", "Au plus tard en janvier. L'objectif est de tout fixer avant la fin de l'année civile."],
    ["Et si quelqu'un annule ?", "La part engagée reste due afin de ne pas augmenter le budget des autres."]
  ]
};

const key = "zigotos-embrun-data-v1";
const nameKey = "zigotos-first-name-v1";
const adminKey = "zigotos-admin-v1";
const lastVisitKey = "zigotos-last-visit-v1";
const personalChecklistKey = "zigotos-personal-checklist-v1";
const personalChecklistVersionKey = "zigotos-personal-checklist-version";
const listTabKey = "zigotos-list-tab-v1";
const adminCodeHash = "a8f5c8afb801ba1992ca7ccb79908e1d78c493a0f03cbe310c6b561f9d4647f5";
let data = loadData();
let editing = false;
let editSnapshot = null;
let editTextSnapshot = null;
let activeListTab = localStorage.getItem(listTabKey) || "shared";
let personalChecklist = loadPersonalChecklist();
let activeActivityIndex = null;
let showAllIdeas = false;
let showAllFaqs = false;
const previousVisit = Number(localStorage.getItem(lastVisitKey)) || Date.now();
const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
let pageLoaded = document.readyState === "complete";
let syncReady = !currentUserName();
let loaderHidden = false;
const loaderStartedAt = performance.now();
const minimumLoaderDuration = 500;

function hideSiteLoader() {
  if (loaderHidden) return;
  const remaining = minimumLoaderDuration - (performance.now() - loaderStartedAt);
  if (remaining > 0) {
    setTimeout(hideSiteLoader, remaining);
    return;
  }
  loaderHidden = true;
  const loader = document.querySelector("#siteLoader");
  loader.classList.add("leaving");
  setTimeout(() => loader.remove(), 280);
}

function finishLoadingWhenReady() {
  if (pageLoaded && syncReady) setTimeout(hideSiteLoader, 450);
}

window.addEventListener("load", () => { pageLoaded = true; finishLoadingWhenReady(); });
window.addEventListener("trip-sync-ready", () => { syncReady = true; finishLoadingWhenReady(); });
setTimeout(hideSiteLoader, 2500);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function currentUserName() {
  return localStorage.getItem(nameKey) || "";
}

function loadPersonalChecklist() {
  const newEssentials = ["Coupe-vent", "Claquettes / tongs", "Lunettes de soleil", "Casquette", "Gourde", "Crème solaire", "Anti-moustiques", "Baume à lèvres", "Batterie externe"];
  const defaults = ["Vêtements", "Sous-vêtements", "Maillot de bain", "Trousse de toilette", "Médicaments", "Chargeur", "Papiers d'identité", "Chaussures", "Serviettes", ...newEssentials]
    .map((text, index) => ({ id: `personal-${index}`, text, checked: false }));
  try {
    const saved = JSON.parse(localStorage.getItem(personalChecklistKey));
    if (!Array.isArray(saved)) return defaults;
    if (localStorage.getItem(personalChecklistVersionKey) !== "2") {
      const normalizedTexts = saved.map(item => item.text.toLocaleLowerCase("fr").replace(/[\s/-]+/g, " ").trim());
      newEssentials.forEach((text, index) => {
        const normalizedText = text.toLocaleLowerCase("fr").replace(/[\s/-]+/g, " ").trim();
        if (!normalizedTexts.includes(normalizedText)) saved.push({ id: `personal-new-${index}-${Date.now()}`, text, checked: false });
      });
      const hasCharger = normalizedTexts.some(text => text === "chargeur" || text === "chargeurs");
      if (!hasCharger) saved.push({ id: `personal-new-charger-${Date.now()}`, text: "Chargeur", checked: false });
      localStorage.setItem(personalChecklistKey, JSON.stringify(saved));
      localStorage.setItem(personalChecklistVersionKey, "2");
    }
    return saved;
  }
  catch { return defaults; }
}

function savePersonalChecklist() {
  localStorage.setItem(personalChecklistKey, JSON.stringify(personalChecklist));
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
  normalized.activities = normalized.activities.map(activity => [activity[0] || "✨", activity[1] || "Activité", activity[2] || "", activity[3] || "", activity[4] || "", activity[5] || ""]);
  if (source?.faqVersion !== initialData.faqVersion) {
    normalized.faqVersion = initialData.faqVersion;
    normalized.faqs = structuredClone(initialData.faqs);
  }
  if (source?.checklistVersion !== initialData.checklistVersion) {
    normalized.checklistVersion = initialData.checklistVersion;
    const existingItems = Array.isArray(source?.checklist) ? source.checklist : [];
    const previousDefaultIds = new Set(["clothes", "sheets", "towels", "swimsuit", "shoes", "toiletries", "medicine", "games", "speaker", "power-strip", "cooler", "first-aid", "outdoor-games", "parasol"]);
    const newDefaultIds = new Set(initialData.checklist.map(item => item.id));
    const sharedDefaults = initialData.checklist.map(defaultItem => ({ ...defaultItem, ...existingItems.find(item => item.id === defaultItem.id) }));
    const customItems = existingItems.filter(item => !previousDefaultIds.has(item.id) && !newDefaultIds.has(item.id));
    normalized.checklist = [...sharedDefaults, ...customItems];
  }
  if (source?.contactsVersion !== initialData.contactsVersion) {
    normalized.contactsVersion = initialData.contactsVersion;
    normalized.assistanceContacts = structuredClone(initialData.assistanceContacts);
  }
  delete normalized.transportVersion;
  delete normalized.transport;
  normalized.days = normalized.days.map(day => [day[0], day[1], day[2], day[3] || "", day[4] || ""]);
  if (source?.ideasVersion !== initialData.ideasVersion) {
    normalized.ideasVersion = initialData.ideasVersion;
    normalized.ideas = Array.isArray(source?.ideas) ? source.ideas : [];
  }
  if (source?.shoppingVersion !== initialData.shoppingVersion) {
    normalized.shoppingVersion = initialData.shoppingVersion;
    normalized.shopping = Array.isArray(source?.shopping) ? source.shopping : [];
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
  renderTimeline();
  renderActivities();
  const displayedFaqs = showAllFaqs ? data.faqs : data.faqs.slice(0, 5);
  document.querySelector("#faqList").innerHTML = displayedFaqs.map(f => `<article class="faq-item"><button class="faq-question" type="button">${escapeHTML(f[0])}<span>+</span></button><div class="faq-answer">${escapeHTML(f[1])}</div></article>`).join("");
  const faqShowAll = document.querySelector("#faqShowAll");
  faqShowAll.hidden = data.faqs.length <= 5;
  faqShowAll.textContent = showAllFaqs ? "Réduire la liste" : `Voir les ${data.faqs.length} questions`;
  document.querySelectorAll(".faq-question").forEach(button => button.addEventListener("click", () => button.parentElement.classList.toggle("open")));
  renderChecklist();
  renderPersonalChecklist();
  renderShoppingList();
  updateListTabs();
  renderAssistanceContacts();
  renderIdeas();
  updateBudget();
  setupRevealAnimations();
}

function renderTimeline() {
  const levels = [
    ["relax", "🟢 Détente"], ["walk", "🟡 Balade"], ["sport", "🟠 Sport"], ["major", "🔵 Sortie majeure"]
  ];
  const timeline = document.querySelector("#timeline");
  timeline.innerHTML = data.days.map((day, index) => `<article class="day"><span class="day-number">${escapeHTML(day[0])}</span><div><div class="day-heading"><strong class="day-title" data-index="${index}">${escapeHTML(day[1])}</strong>${day[3] ? `<span class="day-editor" title="Modifié par ${escapeHTML(day[3])}"><b>${escapeHTML(day[3].charAt(0).toUpperCase())}</b><span>${escapeHTML(day[3])}</span></span>` : ""}</div><p class="day-copy" data-index="${index}">${escapeHTML(day[2])}</p><label class="day-level level-${escapeHTML(day[4] || "none")}"><span class="sr-only">Rythme de la journée</span><select data-index="${index}"><option value="">Rythme à choisir</option>${levels.map(level => `<option value="${level[0]}"${day[4] === level[0] ? " selected" : ""}>${level[1]}</option>`).join("")}</select></label></div></article>`).join("");
  timeline.querySelectorAll(".day-level select").forEach(select => select.addEventListener("change", async event => {
    const day = data.days[Number(event.target.dataset.index)];
    day[4] = event.target.value;
    day[3] = currentUserName();
    renderTimeline();
    const synced = await saveData();
    showToast(synced ? "Rythme partagé avec le groupe" : "Rythme sauvegardé sur cet appareil");
  }));
}

function renderActivities() {
  const grid = document.querySelector("#activityGrid");
  grid.innerHTML = data.activities.map((activity, index) => `<article class="activity-card${activity[3] || activity[4] ? " has-details" : ""}"><button class="activity-open" type="button" data-index="${index}" aria-label="Ouvrir les détails de ${escapeHTML(activity[1])}"><span class="activity-icon">${escapeHTML(activity[0])}</span><div class="activity-summary"><div><strong>${escapeHTML(activity[1])}</strong>${activity[4] ? `<span class="activity-price">${escapeHTML(activity[4])}</span>` : ""}</div><small>${escapeHTML(activity[3] || activity[2] || "Ajouter des détails")}</small>${activity[5] ? `<span class="activity-editor" title="Modifié par ${escapeHTML(activity[5])}"><b>${escapeHTML(activity[5].charAt(0).toUpperCase())}</b></span>` : ""}</div><span class="activity-more">Détails <b>→</b></span></button></article>`).join("");
  grid.querySelectorAll(".activity-open").forEach(button => button.addEventListener("click", () => openActivityDialog(Number(button.dataset.index))));
}

function openActivityDialog(index) {
  const activity = data.activities[index];
  if (!activity) return;
  activeActivityIndex = index;
  document.querySelector("#activityDialogTitle").textContent = activity[1];
  document.querySelector("#activityName").value = activity[1];
  document.querySelector("#activityPrice").value = activity[4] || "";
  document.querySelector("#activityNotes").value = activity[3] || "";
  document.querySelector("#activityDialog").showModal();
}

function renderIdeas() {
  const list = document.querySelector("#ideasList");
  document.querySelector("#ideasShowAll").hidden = true;
  document.querySelector("#ideasCount").textContent = `${data.ideas.length} idée${data.ideas.length > 1 ? "s" : ""}`;
  if (!data.ideas.length) {
    list.innerHTML = '<p class="ideas-empty">Aucune idée pour l’instant. À vous de lancer le mouvement.</p>';
    return;
  }
  const displayedIdeas = showAllIdeas ? data.ideas : data.ideas.slice(0, 4);
  const ideasShowAll = document.querySelector("#ideasShowAll");
  ideasShowAll.hidden = data.ideas.length <= 4;
  ideasShowAll.textContent = showAllIdeas ? "Réduire la liste" : `Voir les ${data.ideas.length} idées`;
  list.innerHTML = displayedIdeas.map(idea => `<article class="idea-card${new Date(idea.createdAt).getTime() > previousVisit ? " is-new" : ""}" data-id="${escapeHTML(idea.id)}"><p>${escapeHTML(idea.text)}</p><footer><span>${idea.author ? `${escapeHTML(idea.author)} · ` : ""}${escapeHTML(new Date(idea.createdAt).toLocaleDateString("fr-FR"))}</span><div><button class="idea-edit" type="button" aria-label="Modifier cette idée">✎</button><button class="idea-delete" type="button" aria-label="Supprimer cette idée">×</button></div></footer></article>`).join("");
  list.querySelectorAll(".idea-edit").forEach(button => button.addEventListener("click", async event => {
    const idea = data.ideas.find(item => item.id === event.target.closest(".idea-card").dataset.id);
    const nextText = prompt("Modifier cette idée :", idea.text)?.trim();
    if (!nextText || nextText === idea.text) return;
    idea.text = nextText;
    idea.author = currentUserName();
    idea.createdAt = new Date().toISOString();
    renderIdeas();
    const synced = await saveData();
    showToast(synced ? "Idée modifiée pour tout le monde" : "Idée modifiée sur cet appareil");
  }));
  list.querySelectorAll(".idea-delete").forEach(button => button.addEventListener("click", async event => {
    const id = event.target.closest(".idea-card").dataset.id;
    if (!confirm("Supprimer cette idée ?")) return;
    data.ideas = data.ideas.filter(item => item.id !== id);
    renderIdeas();
    const synced = await saveData();
    showToast(synced ? "Idée supprimée pour tout le monde" : "Idée supprimée sur cet appareil");
  }));
}

function renderAssistanceContacts() {
  const container = document.querySelector("#assistanceContacts");
  container.innerHTML = data.assistanceContacts.map(contact => {
    const phone = contact.number.replace(/[^+\d]/g, "");
    return `<form class="assistance-card" data-id="${escapeHTML(contact.id)}"><span>${escapeHTML(contact.vehicle)}</span><label>Assurance<input name="insurer" maxlength="40" value="${escapeHTML(contact.insurer)}" placeholder="À compléter"></label><label>Numéro d'assistance<input name="number" inputmode="tel" maxlength="24" value="${escapeHTML(contact.number)}" placeholder="À compléter"></label><div><button type="submit">Enregistrer</button>${phone ? `<a href="tel:${escapeHTML(phone)}">Appeler</a>` : ""}</div>${contact.author ? `<small>Modifié par ${escapeHTML(contact.author)}</small>` : ""}</form>`;
  }).join("");
  container.querySelectorAll(".assistance-card").forEach(form => form.addEventListener("submit", async event => {
    event.preventDefault();
    const contact = data.assistanceContacts.find(item => item.id === form.dataset.id);
    contact.insurer = new FormData(form).get("insurer").trim();
    contact.number = new FormData(form).get("number").trim();
    contact.author = currentUserName();
    renderAssistanceContacts();
    const synced = await saveData();
    showToast(synced ? "Assistance enregistrée pour tout le monde" : "Assistance sauvegardée sur cet appareil");
  }));
}

function renderChecklist() {
  const list = document.querySelector("#checklistList");
  const completed = data.checklist.filter(item => item.checked).length;
  if (activeListTab === "shared") document.querySelector("#checklistProgress").textContent = `${completed} / ${data.checklist.length} préparé${completed > 1 ? "s" : ""}`;
  list.innerHTML = data.checklist.map(item => `<article class="checklist-item${item.checked ? " checked" : ""}${new Date(item.updatedAt || 0).getTime() > previousVisit ? " is-new" : ""}" data-id="${escapeHTML(item.id)}"><label><input type="checkbox" ${item.checked ? "checked" : ""}><span class="check-mark">✓</span><span class="check-text">${escapeHTML(item.text)}</span></label>${item.author ? `<span class="check-author" title="Modifié par ${escapeHTML(item.author)}"><b>${escapeHTML(item.author.charAt(0).toUpperCase())}</b></span>` : ""}<button class="check-edit" type="button" aria-label="Modifier ${escapeHTML(item.text)}">✎</button><button class="check-delete" type="button" aria-label="Supprimer ${escapeHTML(item.text)}">×</button></article>`).join("");
  list.querySelectorAll("input[type=checkbox]").forEach(input => input.addEventListener("change", async event => {
    const item = data.checklist.find(entry => entry.id === event.target.closest(".checklist-item").dataset.id);
    item.checked = event.target.checked;
    item.author = currentUserName();
    item.updatedAt = new Date().toISOString();
    renderChecklist();
    const synced = await saveData();
    showToast(synced ? "Check-list partagée" : "Check-list sauvegardée sur cet appareil");
  }));
  list.querySelectorAll(".check-edit").forEach(button => button.addEventListener("click", async event => {
    const item = data.checklist.find(entry => entry.id === event.target.closest(".checklist-item").dataset.id);
    const nextText = prompt("Modifier cet élément :", item.text)?.trim();
    if (!nextText || nextText === item.text) return;
    item.text = nextText;
    item.author = currentUserName();
    item.updatedAt = new Date().toISOString();
    renderChecklist();
    const synced = await saveData();
    showToast(synced ? "Élément modifié pour tout le monde" : "Modification sauvegardée sur cet appareil");
  }));
  list.querySelectorAll(".check-delete").forEach(button => button.addEventListener("click", async event => {
    const id = event.target.closest(".checklist-item").dataset.id;
    const item = data.checklist.find(entry => entry.id === id);
    if (!confirm(`Supprimer « ${item.text} » de la liste ?`)) return;
    data.checklist = data.checklist.filter(entry => entry.id !== id);
    renderChecklist();
    const synced = await saveData();
    showToast(synced ? "Élément supprimé pour tout le monde" : "Suppression sauvegardée sur cet appareil");
  }));
}

function renderPersonalChecklist() {
  const list = document.querySelector("#personalList");
  const completed = personalChecklist.filter(item => item.checked).length;
  if (activeListTab === "personal") document.querySelector("#checklistProgress").textContent = `${completed} / ${personalChecklist.length} dans ma valise`;
  list.innerHTML = personalChecklist.map(item => `<article class="checklist-item${item.checked ? " checked" : ""}" data-id="${escapeHTML(item.id)}"><label><input type="checkbox" ${item.checked ? "checked" : ""}><span class="check-mark">✓</span><span class="check-text">${escapeHTML(item.text)}</span></label><button class="personal-edit check-edit" type="button" aria-label="Modifier ${escapeHTML(item.text)}">✎</button><button class="personal-delete check-delete" type="button" aria-label="Supprimer ${escapeHTML(item.text)}">×</button></article>`).join("");
  list.querySelectorAll("input[type=checkbox]").forEach(input => input.addEventListener("change", event => {
    const item = personalChecklist.find(entry => entry.id === event.target.closest(".checklist-item").dataset.id);
    item.checked = event.target.checked;
    savePersonalChecklist();
    renderPersonalChecklist();
  }));
  list.querySelectorAll(".personal-edit").forEach(button => button.addEventListener("click", event => {
    const item = personalChecklist.find(entry => entry.id === event.target.closest(".checklist-item").dataset.id);
    const nextText = prompt("Modifier cet élément personnel :", item.text)?.trim();
    if (!nextText || nextText === item.text) return;
    item.text = nextText;
    savePersonalChecklist();
    renderPersonalChecklist();
  }));
  list.querySelectorAll(".personal-delete").forEach(button => button.addEventListener("click", event => {
    const id = event.target.closest(".checklist-item").dataset.id;
    personalChecklist = personalChecklist.filter(item => item.id !== id);
    savePersonalChecklist();
    renderPersonalChecklist();
  }));
}

function renderShoppingList() {
  const list = document.querySelector("#shoppingList");
  const completed = data.shopping.filter(item => item.done).length;
  if (activeListTab === "shopping") document.querySelector("#checklistProgress").textContent = `${completed} / ${data.shopping.length} réglé${completed > 1 ? "s" : ""}`;
  if (!data.shopping.length) {
    list.innerHTML = '<p class="list-empty">La liste des courses est vide pour l’instant.</p>';
    return;
  }
  list.innerHTML = data.shopping.map(item => `<article class="shopping-item${item.done ? " done" : ""}" data-id="${escapeHTML(item.id)}"><label class="shopping-done"><input type="checkbox" ${item.done ? "checked" : ""}><span class="check-mark">✓</span><strong>${escapeHTML(item.text)}</strong></label><div class="shopping-choice" role="group" aria-label="Décision pour ${escapeHTML(item.text)}"><button type="button" data-decision="bring" class="${item.decision === "bring" ? "selected" : ""}">On apporte</button><button type="button" data-decision="buy" class="${item.decision === "buy" ? "selected" : ""}">On achète</button></div>${item.author ? `<span class="check-author" title="Modifié par ${escapeHTML(item.author)}"><b>${escapeHTML(item.author.charAt(0).toUpperCase())}</b></span>` : ""}<button class="shopping-edit check-edit" type="button" aria-label="Modifier ${escapeHTML(item.text)}">✎</button><button class="shopping-delete check-delete" type="button" aria-label="Supprimer ${escapeHTML(item.text)}">×</button></article>`).join("");
  list.querySelectorAll(".shopping-done input").forEach(input => input.addEventListener("change", async event => {
    const item = data.shopping.find(entry => entry.id === event.target.closest(".shopping-item").dataset.id);
    item.done = event.target.checked;
    item.author = currentUserName();
    item.updatedAt = new Date().toISOString();
    renderShoppingList();
    await saveData();
  }));
  list.querySelectorAll(".shopping-choice button").forEach(button => button.addEventListener("click", async event => {
    const item = data.shopping.find(entry => entry.id === event.target.closest(".shopping-item").dataset.id);
    item.decision = item.decision === button.dataset.decision ? "undecided" : button.dataset.decision;
    item.author = currentUserName();
    item.updatedAt = new Date().toISOString();
    renderShoppingList();
    const synced = await saveData();
    showToast(synced ? "Décision partagée" : "Décision sauvegardée sur cet appareil");
  }));
  list.querySelectorAll(".shopping-edit").forEach(button => button.addEventListener("click", async event => {
    const item = data.shopping.find(entry => entry.id === event.target.closest(".shopping-item").dataset.id);
    const nextText = prompt("Modifier ce produit :", item.text)?.trim();
    if (!nextText || nextText === item.text) return;
    item.text = nextText;
    item.author = currentUserName();
    renderShoppingList();
    await saveData();
  }));
  list.querySelectorAll(".shopping-delete").forEach(button => button.addEventListener("click", async event => {
    const id = event.target.closest(".shopping-item").dataset.id;
    if (!confirm("Supprimer ce produit de la liste ?")) return;
    data.shopping = data.shopping.filter(item => item.id !== id);
    renderShoppingList();
    await saveData();
  }));
}

function updateListTabs() {
  document.querySelectorAll(".list-tab").forEach(button => {
    const active = button.dataset.tab === activeListTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".list-panel").forEach(panel => panel.hidden = panel.dataset.panel !== activeListTab);
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
  const cautionPerPerson = 200 / count;
  document.querySelector("#statPrice").textContent = `${euro.format(budget.perPerson)} + ${euro.format(cautionPerPerson)} = ${euro.format(budget.perPerson + cautionPerPerson)}`;
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

let revealObserver = null;
function setupRevealAnimations() {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  revealObserver ??= new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("revealed");
    revealObserver.unobserve(entry.target);
  }), { rootMargin: "0px 0px -8%", threshold: .08 });
  document.querySelectorAll(".stat-card,.day,.activity-card,.idea-card,.payment-card,.checklist-card,.contact-featured,.emergency-grid a,.assistance-card,.link-grid a").forEach(element => {
    if (element.classList.contains("reveal-ready")) return;
    element.classList.add("reveal-ready");
    revealObserver.observe(element);
  });
}

function hasUnsavedDrafts() {
  if (editing) return true;
  if (["#ideaInput", "#checklistInput", "#personalInput", "#shoppingInput"].some(selector => document.querySelector(selector).value.trim())) return true;
  return [...document.querySelectorAll(".assistance-card")].some(form => {
    const contact = data.assistanceContacts.find(item => item.id === form.dataset.id);
    if (!contact) return false;
    return form.elements.insurer.value.trim() !== contact.insurer || form.elements.number.value.trim() !== contact.number;
  });
}

document.querySelector("#peopleSelect").addEventListener("change", updateBudget);
document.querySelector("#ideasShowAll").addEventListener("click", () => { showAllIdeas = !showAllIdeas; renderIdeas(); setupRevealAnimations(); });
document.querySelector("#faqShowAll").addEventListener("click", () => { showAllFaqs = !showAllFaqs; render(); });
document.querySelector("#backToTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", () => document.querySelector("#backToTop").classList.toggle("visible", scrollY > 700), { passive: true });
window.addEventListener("beforeunload", event => {
  if (!hasUnsavedDrafts()) return;
  event.preventDefault();
  event.returnValue = "";
});
window.addEventListener("pagehide", () => localStorage.setItem(lastVisitKey, String(Date.now())));
const navigationLinks = [...document.querySelectorAll(".section-nav a,.mobile-nav a")];
const observedSections = [...document.querySelectorAll("main section[id]")];
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navigationLinks.forEach(link => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-18% 0px -62%", threshold: [0, .15, .4] });
  observedSections.forEach(section => sectionObserver.observe(section));
}
document.querySelector("#checklistForm").addEventListener("submit", async event => {
  event.preventDefault();
  const input = document.querySelector("#checklistInput");
  const text = input.value.trim().replace(/\s+/g, " ");
  if (!text) return;
  data.checklist.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, checked: false, author: currentUserName(), updatedAt: new Date().toISOString() });
  input.value = "";
  renderChecklist();
  const synced = await saveData();
  showToast(synced ? "Ajouté à la liste partagée" : "Ajouté sur cet appareil");
});
document.querySelectorAll(".list-tab").forEach(button => button.addEventListener("click", () => {
  activeListTab = button.dataset.tab;
  localStorage.setItem(listTabKey, activeListTab);
  updateListTabs();
  renderChecklist();
  renderPersonalChecklist();
  renderShoppingList();
}));
document.querySelector("#personalForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.querySelector("#personalInput");
  const text = input.value.trim().replace(/\s+/g, " ");
  if (!text) return;
  personalChecklist.push({ id: `personal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, checked: false });
  input.value = "";
  savePersonalChecklist();
  renderPersonalChecklist();
  showToast("Ajouté à ta valise sur cet appareil");
});
document.querySelector("#shoppingForm").addEventListener("submit", async event => {
  event.preventDefault();
  const input = document.querySelector("#shoppingInput");
  const text = input.value.trim().replace(/\s+/g, " ");
  if (!text) return;
  data.shopping.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, decision: "undecided", done: false, author: currentUserName(), updatedAt: new Date().toISOString() });
  input.value = "";
  renderShoppingList();
  const synced = await saveData();
  showToast(synced ? "Produit ajouté pour tout le monde" : "Produit sauvegardé sur cet appareil");
});
document.querySelector("#activityForm").addEventListener("submit", async event => {
  event.preventDefault();
  const activity = data.activities[activeActivityIndex];
  if (!activity) return;
  const name = document.querySelector("#activityName").value.trim().replace(/\s+/g, " ");
  if (!name) return;
  activity[1] = name;
  activity[3] = document.querySelector("#activityNotes").value.trim();
  activity[4] = document.querySelector("#activityPrice").value.trim().replace(/\s+/g, " ");
  activity[5] = currentUserName();
  document.querySelector("#activityDialog").close();
  renderActivities();
  const synced = await saveData();
  showToast(synced ? "Activité mise à jour pour tout le monde" : "Activité sauvegardée sur cet appareil");
});
document.querySelector("#closeActivityDialog").addEventListener("click", () => document.querySelector("#activityDialog").close());
document.querySelector("#ideaForm").addEventListener("submit", async event => {
  event.preventDefault();
  const input = document.querySelector("#ideaInput");
  const text = input.value.trim().replace(/\s+/g, " ");
  if (!text) return;
  data.ideas.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, author: currentUserName(), createdAt: new Date().toISOString() });
  input.value = "";
  renderIdeas();
  const synced = await saveData();
  showToast(synced ? "Idée ajoutée pour tout le monde" : "Idée ajoutée sur cet appareil");
});
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
