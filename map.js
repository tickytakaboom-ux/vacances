(() => {
  const root = document.querySelector("#carte");
  if (!root) return;
  const card = root.querySelector(".trip-map-card");
  const gate = root.querySelector(".trip-map-gate");
  const loadButton = root.querySelector("#loadTripMap");
  const status = root.querySelector(".trip-map-status");
  const filters = new Set(["restaurants", "courses", "sorties"]);
  const colors = { restaurants: "#aa7259", courses: "#557f91", sorties: "#638265" };
  const labels = { restaurants: "Restaurant", courses: "Courses", sorties: "Sortie" };
  const markers = new Map();
  let selected = [], nearby = null, map = null, nearbyLayer = null, chosenLayer = null, libraryPromise = null, ready = null;
  let loadingMap = false, tileFailed = false, networkFailed = false;
  const node = (tag, className, text) => {
    const value = document.createElement(tag);
    if (className) value.className = className;
    if (text !== undefined) value.textContent = text;
    return value;
  };
  const directions = place => {
    const url = new URL("https://www.google.com/maps/dir/");
    url.search = new URLSearchParams({ api: "1", destination: `${place.latitude},${place.longitude}` });
    return String(url);
  };
  function validPlace(place) {
    return typeof place?.id === "string" && typeof place.name === "string" && Number.isFinite(place.latitude) &&
      Number.isFinite(place.longitude) && Math.abs(place.latitude) <= 90 && Math.abs(place.longitude) <= 180;
  }
  async function readData(path, key, validate) {
    try {
      const response = await fetch(path, { signal: AbortSignal.timeout(8000), cache: "no-cache" });
      if (!response.ok) throw new Error("Données indisponibles");
      const data = await response.json();
      if (!validate(data)) throw new Error("Données invalides");
      try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
      return data;
    } catch (error) {
      networkFailed = true;
      try {
        const cached = JSON.parse(localStorage.getItem(key));
        if (validate(cached)) return cached;
      } catch {}
      throw error;
    }
  }
  function placesAround() {
    const chosenIds = new Set(selected.map(place => place.osmId).filter(Boolean));
    const seen = new Set();
    return Object.entries(nearby?.groups || {}).flatMap(([category, group]) => {
      if (!filters.has(category) || !Array.isArray(group.places)) return [];
      return group.places.filter(place => {
        if (!validPlace(place) || chosenIds.has(place.id) || seen.has(place.id)) return false;
        seen.add(place.id); return true;
      }).map(place => ({ ...place, category }));
    });
  }
  function updateStatus() {
    const groups = Object.values(nearby?.groups || {});
    const dates = groups.map(group => Date.parse(group.fetchedAt)).filter(Number.isFinite);
    const old = networkFailed || groups.some(group => group.status !== "fresh" || Date.now() - Date.parse(group.fetchedAt) > 48 * 3600000);
    const count = placesAround().length;
    root.querySelector("#nearbyCount").textContent = `${count} lieu${count > 1 ? "x" : ""} alentour`;
    let text = selected.length ? `${selected.length} lieux choisis` : "Chargement des lieux choisis";
    if (dates.length) {
      const timestamp = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(Math.min(...dates)));
      text += ` · Lieux alentour relevés le ${timestamp}`;
      if (old) text += " · Mise à jour indisponible ou retardée : dernière liste connue.";
    } else if (selected.length) text += " · Lieux alentour momentanément indisponibles.";
    if (tileFailed) text += " · Fond de carte indisponible ; les repères et itinéraires restent accessibles.";
    status.textContent = text;
  }
  function popup(place, index = null) {
    const content = node("div", "trip-map-popup");
    content.append(node("strong", "", place.name), node("small", "", index === null ? labels[place.category] || "À proximité" : `Lieu choisi · n° ${index + 1}`));
    if (place.address) content.append(node("p", "", place.address));
    if (place.note) content.append(node("small", "", place.note));
    const link = node("a", "", "Ouvrir l’itinéraire ↗");
    link.href = directions(place); link.target = "_blank"; link.rel = "noopener noreferrer";
    content.append(link); return content;
  }
  function showOverview() {
    if (!map || !selected.length) return;
    map.fitBounds(selected.map(place => [place.latitude, place.longitude]), { padding: [32, 32], maxZoom: 14, animate: false });
  }
  function drawNearby() {
    if (!map || !nearbyLayer) return;
    nearbyLayer.clearLayers();
    for (const place of placesAround()) {
      const marker = L.circleMarker([place.latitude, place.longitude], { radius: 6, color: "#fff", weight: 2, fillColor: colors[place.category], fillOpacity: .9 });
      marker.bindPopup(popup(place)); marker.addTo(nearbyLayer);
      const path = marker.getElement();
      if (path) {
        path.setAttribute("tabindex", "0"); path.setAttribute("role", "button");
        path.setAttribute("aria-label", `${labels[place.category]} : ${place.name}`);
        path.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); marker.openPopup(); } });
      }
    }
    updateStatus();
  }
  function loadLibrary() {
    if (window.L) return Promise.resolve();
    if (libraryPromise) return libraryPromise;
    libraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "assets/vendor/leaflet/leaflet.js";
      script.onload = () => window.L ? resolve() : reject(new Error("Bibliothèque indisponible"));
      script.onerror = () => { libraryPromise = null; script.remove(); reject(new Error("Bibliothèque indisponible")); };
      document.head.append(script);
    });
    return libraryPromise;
  }
  async function initMap() {
    if (map) return true;
    if (loadingMap) return false;
    loadingMap = true; loadButton.disabled = true; loadButton.textContent = "Ouverture…";
    try {
      await ready;
      if (!selected.length) throw new Error("Lieux choisis indisponibles");
      await loadLibrary();
      gate.hidden = true;
      map = L.map("tripMapViewport", { scrollWheelZoom: false, zoomControl: false, attributionControl: true });
      L.control.zoom({ zoomInTitle: "Zoomer", zoomOutTitle: "Dézoomer" }).addTo(map);
      map.attributionControl.setPrefix(false);
      // Les images ne sont chargées qu'à l'ouverture volontaire de la carte.
      L.tileLayer(root.dataset.tileUrl, { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' })
        .on("tileerror", () => { tileFailed = true; updateStatus(); }).addTo(map);
      map.createPane("chosenPlaces"); map.getPane("chosenPlaces").style.zIndex = "650";
      nearbyLayer = L.layerGroup().addTo(map); chosenLayer = L.layerGroup().addTo(map);
      selected.forEach((place, index) => {
        const icon = L.divIcon({ className: "trip-map-pin", html: `<span>${index + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] });
        const marker = L.marker([place.latitude, place.longitude], { icon, title: place.name, keyboard: true, pane: "chosenPlaces", zIndexOffset: 1000 });
        marker.bindPopup(popup(place, index)); marker.addTo(chosenLayer);
        marker.getElement()?.setAttribute("aria-label", `Lieu choisi ${index + 1} : ${place.name}`);
        markers.set(place.id, marker);
      });
      showOverview(); drawNearby();
      root.querySelectorAll(".trip-map-actions button").forEach(button => button.disabled = false);
      updateStatus(); return true;
    } catch {
      if (map) { map.remove(); map = null; markers.clear(); }
      gate.hidden = false;
      status.textContent = "La carte ne peut pas s’ouvrir pour le moment. Les liens d’itinéraire restent disponibles.";
      loadButton.textContent = "Réessayer"; return false;
    } finally { loadingMap = false; loadButton.disabled = false; }
  }
  function renderChosen() {
    const list = root.querySelector(".trip-map-places");
    list.replaceChildren();
    selected.forEach((place, index) => {
      const item = node("li");
      const button = node("button", "trip-map-place");
      button.type = "button"; button.dataset.place = place.id;
      button.append(node("span", "", String(index + 1)), node("span", "", place.name));
      button.setAttribute("aria-label", `Voir ${place.name} sur la carte`);
      button.addEventListener("click", async () => {
        if (!await initMap()) return;
        map.setView([place.latitude, place.longitude], 17, { animate: false });
        markers.get(place.id)?.openPopup();
        root.querySelector(".trip-map-canvas").scrollIntoView({ block: "center", behavior: "auto" });
      });
      const link = node("a", "", "↗");
      link.href = directions(place); link.target = "_blank"; link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `Itinéraire vers ${place.name}`);
      item.append(button, link); list.append(item);
    });
  }
  ready = (async () => {
    const results = await Promise.allSettled([
      readData("data/selected-places.json", "zigotos-map-chosen-v1", data => data?.version === 1 && Array.isArray(data.places) && data.places.length > 0 && data.places.every(validPlace)),
      readData(`data/nearby-places.json?v=${Math.floor(Date.now() / 86400000)}`, "zigotos-map-nearby-v1", data => data?.version === 1 && data.groups && Object.values(data.groups).every(group => Array.isArray(group.places) && group.places.every(validPlace)))
    ]);
    if (results[0].status === "fulfilled") { selected = results[0].value.places; renderChosen(); }
    if (results[1].status === "fulfilled") nearby = results[1].value;
    updateStatus();
    if (!selected.length) status.textContent = "Les lieux choisis sont indisponibles pour le moment. La carte Google reste accessible.";
  })();
  loadButton.addEventListener("click", initMap);
  root.querySelectorAll("[data-map-filter]").forEach(button => button.addEventListener("click", () => {
    const category = button.dataset.mapFilter;
    if (category === "all") {
      if (filters.size === 3) filters.clear();
      else ["restaurants", "courses", "sorties"].forEach(value => filters.add(value));
    } else if (filters.has(category)) filters.delete(category);
    else filters.add(category);
    root.querySelectorAll("[data-map-filter]").forEach(value => value.setAttribute("aria-pressed", String(value.dataset.mapFilter === "all" ? filters.size === 3 : filters.has(value.dataset.mapFilter))));
    drawNearby(); updateStatus();
  }));
  root.querySelector("#mapOverview").addEventListener("click", showOverview);
  const expand = root.querySelector("#expandTripMap");
  function setExpanded(value) {
    card.classList.toggle("expanded", value); expand.setAttribute("aria-expanded", String(value));
    expand.textContent = value ? "Réduire ↙" : "Agrandir ↗";
    requestAnimationFrame(() => map?.invalidateSize({ pan: false }));
  }
  expand.addEventListener("click", () => setExpanded(!card.classList.contains("expanded")));
  root.addEventListener("keydown", event => { if (event.key === "Escape") setExpanded(false); });
})();
