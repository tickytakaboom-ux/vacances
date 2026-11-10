// Le choix est une simulation locale : il ne réserve aucun transport et ne modifie pas le carnet partagé.
const transportScenarios = {
  train: {label: "100 % Train", amount: 1400, note: "Référence budgétaire temporaire : provision de 200 € par personne pour le train aller-retour et le préacheminement depuis Maurepas. Aucun billet réservé ; les tarifs 2027 ne sont pas connus."},
  cars: {label: "2 voitures", amount: 612, note: "En pause : aucun véhicule défini. Le montant de 612 € est une estimation provisoire du carburant et des péages aller-retour ; véhicules, assurances et coût réel restent à confirmer."},
  mixed: {label: "Mixte (C1 + Train)", amount: 1100, note: "En pause : provision de 300 € pour la C1 et de 800 € pour quatre billets de train à 200 € chacun. Lucas et deux passagers en C1, quatre personnes en train. Disponibilité de la C1, assurance et prix des billets non confirmés."}
};
function calculateScenarioBudget(budget, scenarioId) {
  const scenario = Object.hasOwn(transportScenarios, scenarioId) ? transportScenarios[scenarioId] : transportScenarios.train;
  const items = budget.items.map((item, index) => [item[0], index === 1 ? scenario.amount : item[1]]);
  const totalCents = items.reduce((sum, item) => sum + Math.round(item[1] * 100), 0);
  const maximumCashCents = totalCents + 26000;
  return {scenario, items, totalCents, maximumCashCents, marginCents: 385000 - maximumCashCents};
}

// Anciens libellés par défaut : ne pas écraser les journées personnalisées du groupe.
const previousDefaultDays = [
    ["Jour 1 · Dimanche", "Arrivée et installation", "Trajet, courses, découverte du camping et première soirée ensemble."],
    ["Jour 2 · Lundi", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 3 · Mardi", "Les Orres", "Montagne, randonnée, accrobranche ou simplement profiter du panorama."],
    ["Jour 4 · Mercredi", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 5 · Jeudi", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 6 · Vendredi", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 7 · Samedi", "Journée libre", "Une journée à compléter selon les envies du groupe."],
    ["Jour 8 · Dimanche", "Derniers souvenirs", "Rangement, derniers plongeons et trajet du retour."]
  ];

const initialData = {
  dataVersion: 3,
  activityVersion: 2,
  faqVersion: 3,
  checklistVersion: 3,
  contactsVersion: 1,
  ideasVersion: 1,
  shoppingVersion: 1,
  text: {
    intro: "On loge à sept au camping La Clapière. Le programme et les affaires à emporter se préparent ici, ensemble.",
    camping: "Un camping 4 étoiles au bord du plan d'eau d'Embrun, entre lac et montagnes. Plage et loisirs sont accessibles à pied."
  },
  textAuthors: {},
  days: [
    [
      "Dimanche 11 juillet",
      "Arrivée et installation",
      "Au programme : trajet vers Embrun, arrivée au camping La Clapière et installation dans le chalet.\nAu choix : découverte du plan d’eau et détente selon l’heure d’arrivée. Journée volontairement légère."
    ],
    [
      "Lundi 12 juillet",
      "Courses et détente",
      "Au programme : courses complémentaires si nécessaire, puis baignade, détente et activités libres au plan d’eau. Une journée tranquille pour récupérer du trajet."
    ],
    [
      "Mardi 13 juillet",
      "Les Orres",
      "Au programme : journée à la station des Orres et randonnée adaptée aux envies et aux capacités du groupe.\nAu choix : luge sur rail et/ou tyrolienne. Les activités payantes restent facultatives.\nÀ confirmer : horaires et conditions d’accès en transports."
    ],
    [
      "Mercredi 14 juillet",
      "Repos et fête nationale",
      "Au programme : journée légère, baignade, détente et temps libre au plan d’eau.\nAu choix : le soir, regarder le feu d’artifice depuis le petit chemin sous le Roc que Julian connaît déjà, si l’événement et les conditions le permettent.\nÀ confirmer : tenue du feu d’artifice en 2027, horaire, programme officiel et conditions d’accès à l’approche du séjour."
    ],
    [
      "Jeudi 15 juillet",
      "Découverte du territoire",
      "Au programme : découverte de Mont-Dauphin, en adaptant la journée à l’énergie du groupe.\nAu choix : Sentier des Marmottes et/ou Fontaine Pétrifiante. Toutes les visites ne sont pas imposées dans la même journée.\nÀ confirmer : déplacements en TER et éventuelles correspondances."
    ],
    [
      "Vendredi 16 juillet",
      "Crots Branches",
      "Au programme : départ à pied du camping vers Crots Branches, accrobranche et retour avec une marge de temps pour les trajets.\nItinéraire du groupe : voie verte le long du lac, puis passage sous la N94 et arrivée au parc ; parcours retenu par le groupe après repérage Google Maps et reconnaissance visuelle du passage.\nAu choix : pizzeria le soir, selon les envies et l’organisation du groupe."
    ],
    [
      "Samedi 17 juillet",
      "Journée flexible",
      "Au choix : récupérer, profiter du plan d’eau ou choisir une activité restante, sans programme collectif imposé. Randonnée possible vers la Ripisylve du Petit Liou.\nOption exigeante : l’Hivernet, uniquement pour les participants motivés et suffisamment préparés."
    ],
    [
      "Dimanche 18 juillet",
      "Départ",
      "Au programme : rangement, préparation des bagages, état des lieux et restitution du chalet selon les consignes du camping, puis départ d’Embrun.\nÀ confirmer : horaires selon le transport finalement retenu."
    ]
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
    "7": {"revision":"embrun-2027-leisure-400-v2","itemBasis":"group","total":3424.34,"perPerson":489.19,"items":[["Hébergement + taxe de séjour",951.34],["Transport",transportScenarios.train.amount],["Alimentation",588],["Déplacements locaux et divers",35],["Loisirs et restaurants",400],["Frais communs et imprévus",50]]}
  },
  faqs: [
    ["D'où part-on et à quelle heure ?", "Le départ se fera depuis Maurepas, à 7 h au plus tard."],
    ["Comment se répartit-on dans les voitures ?", "Deux voitures sont prévues : 3 personnes dans l'une et 4 personnes dans l'autre. La répartition exacte sera décidée avant le départ."],
    ["Les draps et les serviettes sont-ils fournis ?", "Oui, en supplément. Les draps coûtent 15 € pour une personne ou 25 € pour deux personnes. Le kit avec une petite et une grande serviette coûte 20 € par personne."],
    ["Qui conduit ?", "Ceux qui ont le permis. Les conducteurs et les voitures seront fixés avant le départ."],
    ["Comment fait-on les courses ?", "On prépare la liste ensemble dans l’onglet Courses."],
    ["Qui dort où ?", "Tout le monde dans le chalet de 7 personnes. La répartition se fera sur place."],
    ["Comment partage-t-on le budget ?", "À parts égales pour les courses, le voyage et la location. Chacun paie ses activités et son restaurant."],
    ["Quand faut-il réserver ?", "Au plus tard en janvier. L'objectif est de tout fixer avant la fin de l'année civile."],
    ["Et si quelqu'un annule ?", "La part engagée reste due afin de ne pas augmenter le budget des autres."]
  ]
};

const key = "zigotos-embrun-data-v1";
const nameKey = "zigotos-first-name-v1";
const adminKey = "zigotos-admin-v1";
// Migration ciblée : suppression du repère facultatif de dernière visite.
localStorage.removeItem("zigotos-last-visit-v1");
const personalChecklistKey = "zigotos-personal-checklist-v1";
const personalChecklistVersionKey = "zigotos-personal-checklist-version";
const listTabKey = "zigotos-list-tab-v1";
const adminCodeHash = "a8f5c8afb801ba1992ca7ccb79908e1d78c493a0f03cbe310c6b561f9d4647f5";
let dataLoadFailed = false;
let data = loadData();
let editing = false;
let editSnapshot = null;
let editTextSnapshot = null;
let activeListTab = localStorage.getItem(listTabKey) || "shared";
let personalLoadFailed = false;
let personalMigrationUnsaved = false;
let personalChecklist = loadPersonalChecklist();
let activeActivityIndex = null;
let showAllFaqs = false;

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function currentUserName() {
  return localStorage.getItem(nameKey) || "";
}

function personalChecklistCategories() {
  return [
    {id:"clothes", title:"Vêtements", items:[
      ["clothes","Vêtements quotidiens (t-shirts, shorts, pantalons…)",["Vêtements"]],
      ["underwear","Sous-vêtements et chaussettes",["Sous-vêtements"]],
      ["sleepwear","Pyjama / tenue pour dormir",["Pyjama"]],
      ["swimwear","Maillots de bain (idéalement 2)",["Maillot de bain","Maillots de bain"]],
      ["sweater","Sweat ou pull chaud",["Sweat","Pull chaud"]],
      ["jacket","Coupe-vent / veste imperméable",["Coupe-vent"]]
    ]},
    {id:"shoes", title:"Chaussures", items:[
      ["walking-shoes","Baskets confortables pour les balades",["Chaussures","Baskets confortables"]],
      ["city-shoes","Baskets de ville (si besoin)",[],true],
      ["sandals","Claquettes / tongs",[]]
    ]},
    {id:"hygiene", title:"Hygiène et santé", items:[
      ["toiletries","Trousse de toilette",[]],
      ["medicine","Médicaments personnels",["Médicaments"]],
      ["shower-towel","Serviette de douche",["Serviettes"]],
      ["beach-towel","Serviette de plage / lac",["Serviette de plage"]],
      ["sunscreen","Crème solaire",[]],
      ["repellent","Anti-moustiques",[]],
      ["lip-balm","Baume à lèvres",[]]
    ]},
    {id:"outings", title:"Sorties et balades", items:[
      ["daypack","Petit sac à dos de journée",["Sac à dos"]],
      ["bottle","Gourde individuelle",["Gourde"]],
      ["sunglasses","Lunettes de soleil",[]],
      ["hat","Casquette / chapeau",["Casquette"]]
    ]},
    {id:"electronics", title:"Électronique et papiers", items:[
      ["phone","Téléphone",[]],
      ["charger","Chargeur et câble",["Chargeur","Chargeurs"]],
      ["powerbank","Batterie externe",[]],
      ["identity","Pièce d’identité",["Papiers d'identité","Pièce d'identité"]],
      ["health-card","Carte Vitale",[]],
      ["payment","Carte bancaire / espèces",[]]
    ]},
    {id:"bedding", title:"Divers et literie", items:[
      ["laundry-bag","Sac pour le linge sale",[]],
      ["sheets","Draps et taie d’oreiller adaptés au couchage (à confirmer)",["Draps"],true],
      ["sleeping-bag","Sac de couchage léger ou location de linge (alternative éventuelle, à confirmer)",[],true]
    ]}
  ];
}
function personalChecklistReferences() {
  return personalChecklistCategories().flatMap(group => group.items.map(([id, text, aliases, conditional]) => ({id: 'packing-' + id, text, aliases, conditional: Boolean(conditional), category: group.id})));
}
function normalizePersonalText(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').replace(/[^a-z0-9]+/g, ' ').trim();
}
function personalChecklistIdentity(text) {
  const name = normalizePersonalText(text);
  const reference = personalChecklistReferences().find(item => [item.text, ...item.aliases].some(label => normalizePersonalText(label) === name));
  return reference ? reference.id : 'custom:' + name;
}
function migratePersonalChecklist(saved) {
  const references = personalChecklistReferences();
  const items = new Map(references.map(item => [item.id, {id:item.id, text:item.text, checked:false}]));
  const custom = new Map();
  for (const item of saved) {
    const reference = references.find(ref => ref.id === item.id) || references.find(ref => [ref.text, ...ref.aliases].some(label => normalizePersonalText(label) === normalizePersonalText(item.text)));
    if (reference) {
      const target = items.get(reference.id);
      target.checked = target.checked || item.checked;
      if (reference.id === item.id) target.text = item.text;
    } else {
      const name = normalizePersonalText(item.text);
      if (custom.has(name)) custom.get(name).checked ||= item.checked;
      else custom.set(name, {...item});
    }
  }
  return [...items.values(), ...custom.values()];
}
function loadPersonalChecklist() {
  const defaults = () => migratePersonalChecklist([]);
  try {
    const saved = JSON.parse(localStorage.getItem(personalChecklistKey));
    if (saved !== null && (!Array.isArray(saved) || saved.length > 1000 || saved.some(item => !item || typeof item.id !== 'string' || !item.id || typeof item.text !== 'string' || typeof item.checked !== 'boolean') || new Set(saved.map(item => item.id)).size !== saved.length)) throw new TypeError('Liste personnelle invalide');
    if (saved !== null && localStorage.getItem(personalChecklistVersionKey) === '3') return saved;
    const migrated = saved === null ? defaults() : migratePersonalChecklist(saved);
    try {
      localStorage.setItem(personalChecklistKey, JSON.stringify(migrated));
      localStorage.setItem(personalChecklistVersionKey, '3');
    } catch { personalMigrationUnsaved = true; }
    return migrated;
  } catch { personalLoadFailed = true; return defaults(); }
}

function savePersonalChecklist() {
  try { localStorage.setItem(personalChecklistKey, JSON.stringify(personalChecklist)); }
  catch { showToast("Impossible d’enregistrer ta valise sur cet appareil"); }
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
  try {
    const saved = localStorage.getItem(key);
    return normalizeData(saved === null ? initialData : JSON.parse(saved));
  } catch {
    dataLoadFailed = true;
    return normalizeData(initialData);
  }
}

function normalizeData(source) {
  // Valider avant les migrations : une valeur incorrecte ne devient pas une valeur par défaut.
  const record = value => value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.prototype.toString.call(value) === "[object Object]"
    && (Object.getPrototypeOf(value) === null || Object.getPrototypeOf(Object.getPrototypeOf(value)) === null)
    && !Object.keys(value).some(name => ["__proto__", "prototype", "constructor"].includes(name));
  const text = value => typeof value === "string" && value.length <= 20000;
  const number = value => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1e9;
  const list = (value, max, check) => Array.isArray(value) && value.length <= max && Array.from(value).every(check);
  const tuple = (value, min, max) => Array.isArray(value) && value.length >= min && value.length <= max && Array.from(value).every(text);
  const optional = (value, name, check) => !Object.hasOwn(value, name) || check(value[name]);
  const items = (value, check) => {
    if (!list(value, 1000, item => record(item) && text(item.id) && item.id.length > 0 && item.id.length <= 128 && text(item.text) && optional(item, "author", text) && optional(item, "updatedAt", text) && check(item))) return false;
    return new Set(value.map(item => item.id)).size === value.length;
  };
  const checks = {
    text: value => record(value) && Object.values(value).every(text),
    textAuthors: value => record(value) && Object.values(value).every(text),
    days: value => list(value, 31, day => tuple(day, 3, 5)) && value.length > 0,
    activities: value => list(value, 100, activity => tuple(activity, 3, 6)),
    faqs: value => list(value, 100, faq => tuple(faq, 2, 2)),
    checklist: value => items(value, item => typeof item.checked === "boolean"),
    shopping: value => items(value, item => typeof item.done === "boolean" && ["undecided", "bring", "buy"].includes(item.decision)),
    ideas: value => items(value, () => true),
    assistanceContacts: value => list(value, 20, item => record(item) && ["id", "vehicle", "insurer", "number"].every(name => text(item[name])) && item.id.trim().length > 0 && item.id.length <= 128 && optional(item, "author", text)) && new Set(value.map(item => item.id)).size === value.length,
    budgets: value => record(value) && ["4", "5", "6", "7"].every(count => {
      const budget = value[count];
      return record(budget) && number(budget.total) && number(budget.perPerson)
        && list(budget.items, 100, item => Array.isArray(item) && item.length === 2 && text(item[0]) && number(item[1]));
    })
  };
  const versions = ["dataVersion", "activityVersion", "faqVersion", "checklistVersion", "contactsVersion", "ideasVersion", "shoppingVersion"];
  if (!record(source) || !["text", "days", "activities", "checklist", "budgets", "faqs"].every(name => Object.hasOwn(source, name)) || JSON.stringify(source).length > 200000
    || !Object.keys(source).every(name => Object.hasOwn(checks, name) || versions.includes(name) || ["transport", "transportVersion"].includes(name))
    || !Object.entries(checks).every(([name, check]) => optional(source, name, check))
    || !versions.every(name => optional(source, name, value => Number.isSafeInteger(value) && value >= 0))) {
    throw new TypeError("Structure du carnet invalide");
  }

  const normalized = { ...structuredClone(initialData), ...structuredClone(source) };
  // Actualisation ciblée : les anciennes copies locales/Firebase ne rétablissent pas le budget précédent.
  if (normalized.budgets["7"].revision === "embrun-2027-train-provision-v1") {
    const budget = normalized.budgets["7"];
    budget.items = budget.items.map(([label, amount]) => [label, label === "Loisirs et restaurants" ? 400 : amount]);
    budget.total = budget.items.reduce((sum, item) => sum + Math.round(item[1] * 100), 0) / 100;
    budget.perPerson = Math.round(budget.total * 100 / 7) / 100;
    budget.revision = initialData.budgets["7"].revision;
  }
  if (normalized.budgets["7"].revision !== initialData.budgets["7"].revision) normalized.budgets["7"] = structuredClone(initialData.budgets["7"]);
  normalized.text = { ...initialData.text, ...normalized.text };
  if (source?.dataVersion !== initialData.dataVersion) {
    normalized.dataVersion = initialData.dataVersion;
    normalized.days = structuredClone(initialData.days);
  }
  if (source?.activityVersion !== initialData.activityVersion) {
    normalized.activityVersion = initialData.activityVersion;
    normalized.activities = structuredClone(initialData.activities);
  }
  normalized.days = normalized.days.map((day, index) => {
    const previous = previousDefaultDays[index];
    const planned = initialData.days[index];
    if (!previous || !planned) return day;
    return day.map((value, column) => column < 3 && value === previous[column] ? planned[column] : value);
  });
  // Mettre à jour seulement les textes par défaut, sans toucher aux textes du groupe.
  if (normalized.text?.intro === "Le lac à quelques pas, les montagnes tout autour et assez d'activités pour remplir la semaine \u2014 ou ne rien faire du tout.") normalized.text.intro = "On loge à sept au camping La Clapière. Le programme et les affaires à emporter se préparent ici, ensemble.";
  if (normalized.text?.intro === "On loge à sept au camping La Clapière. Le programme, les idées et les affaires à emporter se préparent ici, ensemble.") normalized.text.intro = "On loge à sept au camping La Clapière. Le programme et les affaires à emporter se préparent ici, ensemble.";
  normalized.faqs = normalized.faqs.map(faq => faq[0] === "Comment fait-on les courses ?" && faq[1] === "Dans un magasin 👍" ? [faq[0], "On prépare la liste ensemble dans l’onglet Courses."] : faq);
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
  if (JSON.stringify(normalized).length > 200000) throw new TypeError("Carnet trop volumineux");
  return normalized;
}

async function saveData() {
  try { normalizeData(data); } catch {
    reportDataError("Enregistrement refusé : données mal formées. La dernière copie enregistrée est conservée.");
    return false;
  }
  localStorage.setItem(key, JSON.stringify(data));
  if (!window.saveSharedTrip) return false;
  return window.saveSharedTrip(structuredClone(data));
}

function editableDayText(element) {
  // Le navigateur peut créer des <br> pendant une saisie multiligne.
  if (element.classList.contains('day-copy') && element.querySelector('.planning-part')) {
    const content = element.cloneNode(true);
    content.querySelectorAll('summary').forEach(summary => summary.remove());
    return content.textContent;
  }
  return element.classList.contains('day-copy') && element.childElementCount > 0 ? element.innerText : element.textContent;
}
function captureDrafts() {
  const fields = [];
  document.querySelectorAll('.assistance-card').forEach(form => {
    const contact = data.assistanceContacts.find(item => item.id === form.dataset.id);
    if (!contact) return;
    for (const name of ['insurer', 'number']) {
      const input = form.elements[name];
      if (input.value !== contact[name]) fields.push({selector: '.assistance-card[data-id="' + CSS.escape(contact.id) + '"] input[name="' + name + '"]', value: input.value, input: true, focused: document.activeElement === input, start: input.selectionStart, end: input.selectionEnd});
    }
  });
  if (editing) {
    document.querySelectorAll('.editable[data-key],.day-title,.day-copy').forEach(element => {
      const key = element.dataset.key;
      const column = element.classList.contains('day-title') ? 1 : 2;
      const baseline = key ? editTextSnapshot?.[key] : editSnapshot?.[element.dataset.index]?.[column];
      const value = editableDayText(element);
      if (value !== baseline) fields.push({selector: key ? '.editable[data-key="' + CSS.escape(key) + '"]' : (column === 1 ? '.day-title' : '.day-copy') + '[data-index="' + element.dataset.index + '"]', value, focused: document.activeElement === element, start: window.getSelection()?.anchorOffset ?? 0, end: window.getSelection()?.focusOffset ?? 0});
    });
  }
  return fields;
}
function restoreDrafts(fields) {
  document.querySelectorAll('.editable[data-key],.day-title,.day-copy').forEach(element => {
    element.contentEditable = editing;
    if (editing && element.classList.contains('day-copy')) element.textContent = editableDayText(element);
  });
  for (const field of fields) {
    const element = document.querySelector(field.selector);
    if (!element) continue;
    if (field.input) element.value = field.value;
    else element.textContent = field.value;
    if (field.focused) {
      element.focus({preventScroll: true});
      if (field.input && field.start !== null) element.setSelectionRange(field.start, field.end);
      else if (!field.input && element.firstChild) window.getSelection()?.setBaseAndExtent(element.firstChild, Math.min(field.start, element.textContent.length), element.firstChild, Math.min(field.end, element.textContent.length));
    }
  }
}

function render(drafts = captureDrafts()) {
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
  document.querySelector("#faqList").innerHTML = displayedFaqs.map(f => `<article class="faq-item"><button class="faq-question" type="button">${escapeHTML(f[0])}<span>${window.TripIcons.icon("plus")}</span></button><div class="faq-answer">${escapeHTML(f[1])}</div></article>`).join("");
  const faqShowAll = document.querySelector("#faqShowAll");
  faqShowAll.hidden = data.faqs.length <= 5;
  faqShowAll.textContent = showAllFaqs ? "Réduire la liste" : `Voir les ${data.faqs.length} questions`;
  document.querySelectorAll(".faq-question").forEach(button => button.addEventListener("click", () => button.parentElement.classList.toggle("open")));
  renderChecklist();
  renderPersonalChecklist();
  renderShoppingList();
  updateListTabs();
  renderAssistanceContacts();
  updateBudget();
  restoreDrafts(drafts);
}

function renderDayDescription(text, dayIndex) {
  const labels = {'Au programme': 'main', 'Au choix': 'optional', 'À confirmer': 'pending', 'Itinéraire du groupe': 'route', 'Option exigeante': 'pending'};
  return text.split("\n").map(line => {
    const separator = line.indexOf(' : ');
    const label = separator < 0 ? '' : line.slice(0, separator);
    if (!Object.hasOwn(labels, label)) return '<span class="planning-part">' + escapeHTML(line) + '</span>';
    const part = '<span class="planning-part planning-' + labels[label] + '"><b>' + escapeHTML(label) + ' :</b> ' + escapeHTML(line.slice(separator + 3)) + '</span>';
    const summary = dayIndex === 3 && label === 'À confirmer' && line.includes('feu d’artifice') ? 'À confirmer : feu d’artifice 2027' : dayIndex === 5 && label === 'Itinéraire du groupe' ? 'Itinéraire retenu par le groupe' : '';
    return summary ? '<details class="planning-details" data-planning-note="' + dayIndex + '"><summary contenteditable="false">' + summary + '</summary>' + part + '</details>' : part;
  }).join("\n");
}
function renderDayReferences(index) {
  const references = {0:[0], 1:[0], 2:[5,6], 3:[0], 5:[3], 6:[6]};
  return (references[index] || []).filter(activityIndex => data.activities[activityIndex]).map(activityIndex => '<a href="#activity-' + activityIndex + '">Fiche : ' + escapeHTML(data.activities[activityIndex][1]) + '</a>').join('');
}

function renderTimeline() {
  const levels = [
    ["relax", "🟢 Détente"], ["walk", "🟡 Balade"], ["sport", "🟠 Sport"], ["major", "🔵 Sortie majeure"]
  ];
  const timeline = document.querySelector("#timeline");
  const openNotes = new Set([...timeline.querySelectorAll(".planning-details[open]")].map(note => note.dataset.planningNote));
  timeline.innerHTML = data.days.map((day, index) => `<article class="day"><span class="day-number">${escapeHTML(day[0])}</span><div><div class="day-heading"><strong class="day-title" data-index="${index}">${escapeHTML(day[1])}</strong>${day[3] ? `<span class="day-editor" title="Modifié par ${escapeHTML(day[3])}"><b>${escapeHTML(day[3].charAt(0).toUpperCase())}</b><span>${escapeHTML(day[3])}</span></span>` : ""}</div><div class="day-copy" data-index="${index}">${renderDayDescription(day[2], index)}</div><div class="day-links">${renderDayReferences(index)}</div><label class="day-level level-${escapeHTML(day[4] || "none")}"><span class="sr-only">Rythme de la journée</span><select data-index="${index}"><option value="">Rythme à choisir</option>${levels.map(level => `<option value="${level[0]}"${day[4] === level[0] ? " selected" : ""}>${level[1]}</option>`).join("")}</select></label></div></article>`).join("");
  timeline.querySelectorAll(".planning-details").forEach(note => { note.open = openNotes.has(note.dataset.planningNote); });
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
  grid.innerHTML = data.activities.map((activity, index) => `<article id="activity-${index}" class="activity-card${activity[3] || activity[4] ? " has-details" : ""}"><button class="activity-open" type="button" data-index="${index}" aria-label="Ouvrir les détails de ${escapeHTML(activity[1])}"><span class="activity-icon">${window.TripIcons.icon(activity[0])}</span><div class="activity-summary"><div><strong>${escapeHTML(activity[1])}</strong>${activity[4] ? `<span class="activity-price">${escapeHTML(activity[4])}</span>` : ""}</div><small>${escapeHTML(activity[3] || activity[2] || "Ajouter des détails")}</small>${activity[5] ? `<span class="activity-editor" title="Modifié par ${escapeHTML(activity[5])}"><b>${escapeHTML(activity[5].charAt(0).toUpperCase())}</b></span>` : ""}</div><span class="activity-more">Détails <b>${window.TripIcons.icon("arrow-right")}</b></span></button></article>`).join("");
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

function renderAssistanceContacts() {
  const container = document.querySelector("#assistanceContacts");
  container.innerHTML = data.assistanceContacts.map(contact => {
    const phone = contact.number.replace(/[^+\d]/g, "");
    return `<form class="assistance-card" data-id="${escapeHTML(contact.id)}"><span>${escapeHTML(contact.vehicle)}</span><p class="list-note">Contact d’assistance public, partagé via Firebase avec ton prénom ou surnom. Ne saisis pas de numéro de contrat. <a href="confidentialite.html">Confidentialité</a>.</p><label>Assurance (facultatif)<input name="insurer" maxlength="40" value="${escapeHTML(contact.insurer)}" placeholder="À compléter"></label><label>Numéro d'assistance (facultatif)<input name="number" inputmode="tel" maxlength="24" value="${escapeHTML(contact.number)}" placeholder="À compléter"></label><div><button type="submit">Enregistrer</button>${phone ? `<a href="tel:${escapeHTML(phone)}">Appeler</a>` : ""}</div>${contact.author ? `<small>Modifié par ${escapeHTML(contact.author)}</small>` : ""}</form>`;
  }).join("");
  container.querySelectorAll(".assistance-card").forEach(form => form.addEventListener("submit", async event => {
    event.preventDefault();
    const drafts = captureDrafts();
    const contact = data.assistanceContacts.find(item => item.id === form.dataset.id);
    contact.insurer = new FormData(form).get("insurer").trim();
    contact.number = new FormData(form).get("number").trim();
    contact.author = currentUserName();
    renderAssistanceContacts();
    restoreDrafts(drafts);
    const synced = await saveData();
    showToast(synced ? "Assistance enregistrée pour tout le monde" : "Assistance sauvegardée sur cet appareil");
  }));
}

function renderChecklist() {
  const list = document.querySelector("#checklistList");
  const completed = data.checklist.filter(item => item.checked).length;
  if (activeListTab === "shared") document.querySelector("#checklistProgress").textContent = `${completed} / ${data.checklist.length} préparé${completed > 1 ? "s" : ""}`;
  list.innerHTML = data.checklist.map(item => `<article class="checklist-item${item.checked ? " checked" : ""}" data-id="${escapeHTML(item.id)}"><label><input type="checkbox" ${item.checked ? "checked" : ""}><span class="check-mark">${window.TripIcons.icon("check")}</span><span class="check-text">${escapeHTML(item.text)}</span></label>${item.author ? `<span class="check-author" title="Modifié par ${escapeHTML(item.author)}"><b>${escapeHTML(item.author.charAt(0).toUpperCase())}</b></span>` : ""}<button class="check-edit" type="button" aria-label="Modifier ${escapeHTML(item.text)}">${window.TripIcons.icon("pencil")}</button><button class="check-delete" type="button" aria-label="Supprimer ${escapeHTML(item.text)}">${window.TripIcons.icon("x")}</button></article>`).join("");
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
  const references = personalChecklistReferences();
  const groups = [...personalChecklistCategories(), {id:'custom', title:'Mes ajouts', items:[]}];
  list.innerHTML = groups.map(group => {
    const items = personalChecklist.filter(item => (references.find(ref => ref.id === item.id)?.category || 'custom') === group.id);
    if (!items.length) return '';
    const beddingNote = group.id === 'bedding' ? '<p class="list-note packing-bedding-note">Literie à confirmer avec le camping : draps et taie, ou sac de couchage léger ou location de linge sont des alternatives éventuelles. N’apporte pas tout systématiquement.</p>' : '';
    return '<section class="packing-category" aria-labelledby="packing-category-' + group.id + '"><h3 id="packing-category-' + group.id + '">' + escapeHTML(group.title) + '</h3>' + beddingNote + items.map(item => {
      const conditional = references.find(ref => ref.id === item.id)?.conditional;
      const badge = conditional ? '<small class="packing-conditional">' + (group.id === 'bedding' ? 'Alternative · à confirmer' : 'Si besoin') + '</small>' : '';
      return '<article class="checklist-item' + (item.checked ? ' checked' : '') + '" data-id="' + escapeHTML(item.id) + '"><label><input type="checkbox" ' + (item.checked ? 'checked' : '') + '><span class="check-mark">' + window.TripIcons.icon('check') + '</span><span class="check-text">' + escapeHTML(item.text) + badge + '</span></label><button class="personal-edit check-edit" type="button" aria-label="Modifier ' + escapeHTML(item.text) + '">' + window.TripIcons.icon('pencil') + '</button><button class="personal-delete check-delete" type="button" aria-label="Supprimer ' + escapeHTML(item.text) + '">' + window.TripIcons.icon('x') + '</button></article>';
    }).join('') + '</section>';
  }).join('');
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
    if (personalChecklist.some(other => other.id !== item.id && personalChecklistIdentity(other.text) === personalChecklistIdentity(nextText))) { showToast('Cet élément est déjà dans ta valise'); return; }
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
  list.innerHTML = data.shopping.map(item => `<article class="shopping-item${item.done ? " done" : ""}" data-id="${escapeHTML(item.id)}"><label class="shopping-done"><input type="checkbox" ${item.done ? "checked" : ""}><span class="check-mark">${window.TripIcons.icon("check")}</span><strong>${escapeHTML(item.text)}</strong></label><div class="shopping-choice" role="group" aria-label="Décision pour ${escapeHTML(item.text)}"><button type="button" data-decision="bring" class="${item.decision === "bring" ? "selected" : ""}">On apporte</button><button type="button" data-decision="buy" class="${item.decision === "buy" ? "selected" : ""}">On achète</button></div>${item.author ? `<span class="check-author" title="Modifié par ${escapeHTML(item.author)}"><b>${escapeHTML(item.author.charAt(0).toUpperCase())}</b></span>` : ""}<button class="shopping-edit check-edit" type="button" aria-label="Modifier ${escapeHTML(item.text)}">${window.TripIcons.icon("pencil")}</button><button class="shopping-delete check-delete" type="button" aria-label="Supprimer ${escapeHTML(item.text)}">${window.TripIcons.icon("x")}</button></article>`).join("");
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
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll(".list-panel").forEach(panel => panel.hidden = panel.dataset.panel !== activeListTab);
}

function updateBudget() {
  const count = 7;
  const budget = data.budgets["7"];
  const {scenario, items, totalCents, marginCents} = calculateScenarioBudget(budget, document.querySelector("#transportSelect").value);
  const total = totalCents / 100;
  const perPerson = total / count;
  document.querySelector("#perPersonTotal").textContent = euro.format(perPerson);
  document.querySelector("#groupTotal").textContent = `Budget hors cautions : ${euro.format(total)} pour le groupe`;
  const rows = items.map(item => {
    const row = document.createElement("div");
    row.className = "budget-row";
    const label = document.createElement("span");
    label.textContent = item[0];
    const amount = document.createElement("strong");
    amount.textContent = `${euro.format(item[1])} pour le groupe`;
    row.append(label, amount);
    return row;
  });
  document.querySelector("#budgetList").replaceChildren(...rows);
  document.querySelector("#depositPerPerson").textContent = `${euro.format(275.70 / count)} / pers.`;
  document.querySelector("#depositCautionPerPerson").textContent = `${euro.format(200 / count)} / pers.`;
  document.querySelector("#statPeople").textContent = count;
  document.querySelector("#statPrice").textContent = euro.format(perPerson);
  document.querySelector("#cashWithDeposit").textContent = euro.format((totalCents + 20000) / 100) + " · " + euro.format((totalCents + 20000) / 100 / count) + " / pers.";
  document.querySelector("#cashWithBothDeposits").textContent = euro.format((totalCents + 26000) / 100) + " · " + euro.format((totalCents + 26000) / 100 / count) + " / pers.";
  document.querySelector("#cleaningDepositPerPerson").textContent = euro.format(60 / count) + " / pers.";
  document.querySelector("#savingsGoal").textContent = euro.format(550) + " / pers. · " + euro.format(550 * count) + " pour le groupe";
  document.querySelector("#savingsMargin").textContent = euro.format(marginCents / 100) + " pour le groupe · " + euro.format(marginCents / 100 / count) + " / pers.";
  document.querySelector("#transportScenarioNote").textContent = scenario.note;
}

function updateCountdown() {
  const departure = new Date("2027-07-11T00:00:00+02:00");
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
  document.querySelector("#editButton").innerHTML = active ? window.TripIcons.icon("check") + " Terminer" : window.TripIcons.icon("pencil") + " Modifier";
  document.querySelectorAll(".editable").forEach(el => el.contentEditable = active);
  document.querySelectorAll(".day-title,.day-copy").forEach(el => { el.contentEditable = active; if (active && el.classList.contains("day-copy")) el.textContent = editableDayText(el); });
  if (!active) {
    document.querySelectorAll(".editable[data-key]").forEach(el => {
      const textKey = el.dataset.key;
      const value = el.textContent.trim();
      if (editTextSnapshot && value !== editTextSnapshot[textKey]) {
        data.text[textKey] = value;
        data.textAuthors ??= {};
        data.textAuthors[textKey] = currentUserName();
      }
    });
    document.querySelectorAll(".day-title").forEach(el => { if (el.textContent.trim() !== editSnapshot?.[el.dataset.index]?.[1]) data.days[el.dataset.index][1] = el.textContent.trim(); });
    document.querySelectorAll(".day-copy").forEach(el => { const value = editableDayText(el).trim(); if (value !== editSnapshot?.[el.dataset.index]?.[2]) data.days[el.dataset.index][2] = value; });
    data.days.forEach((day, index) => {
      if (editSnapshot && (day[1] !== editSnapshot[index]?.[1] || day[2] !== editSnapshot[index]?.[2])) day[3] = currentUserName();
    });
    render();
    const synced = await saveData();
    showToast(synced ? "Changements partagés avec le groupe" : "Sauvegardé sur cet appareil. Firebase indisponible");
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function hasUnsavedDrafts() {
  if (editing) return true;
  if (["#checklistInput", "#personalInput", "#shoppingInput"].some(selector => document.querySelector(selector).value.trim())) return true;
  return [...document.querySelectorAll(".assistance-card")].some(form => {
    const contact = data.assistanceContacts.find(item => item.id === form.dataset.id);
    if (!contact) return false;
    return form.elements.insurer.value.trim() !== contact.insurer || form.elements.number.value.trim() !== contact.number;
  });
}

document.querySelector("#transportSelect").addEventListener("change", updateBudget);
document.querySelector("#faqShowAll").addEventListener("click", () => { showAllFaqs = !showAllFaqs; render(); });
document.querySelector("#backToTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
window.addEventListener("scroll", () => document.querySelector("#backToTop").classList.toggle("visible", scrollY > 700), { passive: true });
window.addEventListener("beforeunload", event => {
  if (!hasUnsavedDrafts()) return;
  event.preventDefault();
  event.returnValue = "";
});

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
  if (personalChecklist.some(item => personalChecklistIdentity(item.text) === personalChecklistIdentity(text))) { showToast('Cet élément est déjà dans ta valise'); return; }
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
    showToast(synced ? "Version initiale restaurée pour tout le monde" : "Reset local uniquement. Firebase indisponible");
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

window.normalizeTripData = normalizeData;
function reportDataError(message) {
  const warning = document.querySelector("#dataWarning");
  warning.textContent = message;
  warning.hidden = false;
}
window.reportTripDataError = reportDataError;
window.clearTripDataError = () => { document.querySelector("#dataWarning").hidden = true; };
window.getTripData = () => structuredClone(data);
window.addEventListener("shared-trip-data", event => {
  try {
    const received = normalizeData(event.detail);
    const drafts = captureDrafts();
    localStorage.setItem(key, JSON.stringify(received));
    data = received;
    if (editing) { editSnapshot = structuredClone(data.days); editTextSnapshot = structuredClone(data.text); }
    render(drafts);
    window.clearTripDataError();
  } catch {
    event.preventDefault();
    reportDataError("Version du carnet refusée : données mal formées. La dernière copie utilisable est conservée. Contacte Julian.");
  }
});

render();
if (dataLoadFailed) reportDataError("La copie locale du carnet est illisible. La version initiale est affichée en attendant le carnet partagé ; la copie locale n’a pas été effacée.");
if (personalMigrationUnsaved) reportDataError("Ta valise a été mise à jour à l’écran, mais la sauvegarde locale a échoué. Tes anciennes données n’ont pas été effacées.");
if (personalLoadFailed) reportDataError("La copie locale de ta valise est illisible. La liste initiale est affichée ; la copie enregistrée n’a pas été effacée.");
updateUserBadge(currentUserName());
updateAdminControls();
updateCountdown();
setInterval(updateCountdown, 1000);

if (!localStorage.getItem(nameKey)) {
  document.querySelector("#nameDialog").showModal();
} else {
  window.dispatchEvent(new CustomEvent("trip-user-ready", { detail: localStorage.getItem(nameKey) }));
}

// Onglets : une seule étape de tabulation, flèches, Début et Fin.
document.querySelectorAll(".list-tab").forEach((button, index) => {
  button.addEventListener("keydown", event => {
    const tabs = [...document.querySelectorAll(".list-tab")];
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    tabs[next].click();
    tabs[next].focus();
  });
});
