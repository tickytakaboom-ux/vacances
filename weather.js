(() => {
  const root = document.querySelector("#weather");
  if (!root) return;
  const content = root.querySelector(".weather-content");
  const status = root.querySelector(".weather-status");
  const credit = root.querySelector(".weather-credit");
  const cacheKey = "zigotos-embrun-weather-v1";
  const hour = 3600000;
  let loading = false, lastCheck = 0;
  const paris = { timeZone: "Europe/Paris" };
  const today = () => new Intl.DateTimeFormat("en-CA", { ...paris, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const round = value => Number.isFinite(value) ? Math.round(value).toString() : "n.d.";
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function condition(value) {
    if (typeof value === "number") {
      if (value === 0) return "Soleil";
      if (value <= 3) return "Nuages";
      if (value === 45 || value === 48) return "Brouillard";
      if (value >= 95) return "Orages";
      if ([71, 73, 75, 77, 85, 86].includes(value)) return "Neige";
      return "Pluie";
    }
    if (/thunder/.test(value)) return "Orages";
    if (/snow|sleet/.test(value)) return "Neige";
    if (/rain/.test(value)) return "Pluie";
    if (/fog/.test(value)) return "Brouillard";
    if (/clearsky|fair/.test(value)) return "Soleil";
    return "Nuages";
  }
  function conditionElement(tag, value) {
    const label = condition(value);
    const iconName = { Soleil: "sun", Nuages: "cloud", Brouillard: "cloud-fog", Orages: "cloud-lightning", Neige: "cloud-snow", Pluie: "cloud-rain" }[label];
    const result = element(tag, "weather-condition");
    result.append(window.TripIcons.create(iconName), document.createTextNode(label));
    return result;
  }
  function valid(data) {
    return data?.version === 1 && data.location?.name === "Embrun" && Array.isArray(data.days) &&
      (!data.days.length || (Number.isFinite(Date.parse(data.fetchedAt)) &&
      data.days.every(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isFinite(day.min) && Number.isFinite(day.max))));
  }
  function render(data, networkFailed = false) {
    if (!valid(data)) throw new Error("Données météo invalides");
    const open = content.querySelector("details")?.open || false;
    content.replaceChildren(); credit.replaceChildren();
    const old = data.status === "stale" || networkFailed || Date.now() - Date.parse(data.fetchedAt) > hour * 2;
    const days = data.days.filter(day => day.date >= today());
    const first = days.find(day => day.date === today());
    if (!first) {
      status.textContent = data.days.length ? "Dernières prévisions expirées. Mise à jour en attente." : data.message || "Météo momentanément indisponible.";
    } else {
      const summary = element("div", "weather-today");
      summary.append(conditionElement("strong", first.condition),
        element("span", "weather-temperature", `${round(first.min)}–${round(first.max)} °C`));
      const metrics = element("div", "weather-metrics");
      const rain = Number.isFinite(first.rainProbability) ? `Pluie ${round(first.rainProbability)} %` :
        Number.isFinite(first.rain) ? `Pluie prévue ${first.rain.toLocaleString("fr-FR")} mm*` : "Pluie n.d.";
      metrics.append(element("span", "", rain), element("span", "", `Vent ≤ ${round(first.wind)} km/h`),
        element("span", "", `UV${first.uvKind === "clear-sky" ? " ciel clair" : ""} ${Number.isFinite(first.uv) ? first.uv.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "n.d."}`),
        element("span", "", `Coucher ${first.sunset ? first.sunset.replace(":", " h ") : "n.d."}`));
      summary.append(metrics); content.append(summary);
      const details = element("details", "weather-details"); details.open = open;
      details.append(element("summary", "", "Les prochains jours"));
      const list = element("div", "weather-days");
      for (const day of days.filter(day => day.date > today()).slice(0, 6)) {
        const label = new Intl.DateTimeFormat("fr-FR", { ...paris, weekday: "short", day: "numeric", month: "short" }).format(new Date(`${day.date}T12:00:00Z`));
        const row = element("div", "weather-day");
        row.append(element("span", "", label), conditionElement("span", day.condition),
          element("strong", "", `${round(day.min)}–${round(day.max)} °C`),
          element("span", "", Number.isFinite(day.rainProbability) ? `Pluie ${round(day.rainProbability)} %` : Number.isFinite(day.rain) ? `${day.rain.toLocaleString("fr-FR")} mm*` : "Pluie n.d."));
        list.append(row);
      }
      details.append(list); content.append(details);
      if (data.source === "met-norway") content.append(element("small", "weather-explanation", "* Estimations sur les heures disponibles. UV par ciel clair ; coucher du soleil pour aujourd'hui."));
      status.textContent = old ? "Mise à jour indisponible ou retardée : dernières prévisions connues." :
        data.status === "fallback" ? "Source de secours active." : "Prévisions actualisées chaque heure.";
    }
    if (data.fetchedAt) {
      const time = element("time", "", `Relevé le ${new Intl.DateTimeFormat("fr-FR", { ...paris, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(data.fetchedAt))}`);
      time.dateTime = data.fetchedAt; credit.append(time, document.createTextNode(" · Données : "));
      const link = element("a", "", data.source === "met-norway" ? "MET Norway" : "Open-Meteo");
      link.href = data.source === "met-norway" ? "https://api.met.no/" : "https://open-meteo.com/";
      link.target = "_blank"; link.rel = "noopener noreferrer"; credit.append(link);
      const license = element("a", "", "CC BY 4.0");
      license.href = "https://creativecommons.org/licenses/by/4.0/"; license.target = "_blank"; license.rel = "noopener noreferrer";
      credit.append(document.createTextNode(" · "), license);
    }
  }
  async function load() {
    if (loading || document.hidden) return;
    loading = true; lastCheck = Date.now();
    let cached;
    try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch {}
    try {
      const response = await fetch(`data/weather.json?v=${Math.floor(Date.now() / hour)}`, { signal: AbortSignal.timeout(8000), cache: "no-cache" });
      if (!response.ok) throw new Error("Météo indisponible");
      const data = await response.json(); render(data);
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    } catch {
      if (valid(cached)) render(cached, true);
      else status.textContent = "Météo momentanément indisponible. Le carnet reste accessible.";
    } finally { loading = false; }
  }
  load();
  setInterval(load, hour);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - lastCheck >= hour) load(); });
})();
