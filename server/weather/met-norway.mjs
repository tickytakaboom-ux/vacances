import { HOUR, LOCATION, dateInParis, numeric, requestJSON, validateForecast } from "./http.mjs";
export const ENDPOINT = "https://api.met.no/weatherapi/locationforecast/2.0/complete";
export const SUN_ENDPOINT = "https://api.met.no/weatherapi/sunrise/3.0/sun";
export const DEFAULT_USER_AGENT = "LesZigotosEmbrun/1.0 https://github.com/tickytakaboom-ux/vacances";
export async function getMetNorway({ now = new Date(), fetcher = fetch, previous = null, userAgent = process.env.MET_NO_USER_AGENT || DEFAULT_USER_AGENT } = {}) {
  const headers = { "User-Agent": userAgent };
  const { body, expires } = await requestJSON(`${ENDPOINT}?lat=44.5638&lon=6.4952`, { fetcher, headers });
  if (!Array.isArray(body.properties?.timeseries)) throw new Error("Réponse MET Norway incompatible");
  const groups = new Map();
  const today = dateInParis(now);
  for (const entry of body.properties.timeseries) {
    const date = dateInParis(new Date(entry.time));
    if (date < today) continue;
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(entry);
  }
  const days = [...groups].slice(0, 7).map(([date, entries]) => {
    const temperatures = entries.map(entry => numeric(entry.data?.instant?.details?.air_temperature)).filter(value => value !== null);
    const winds = entries.map(entry => numeric(entry.data?.instant?.details?.wind_speed)).filter(value => value !== null);
    const uvs = entries.map(entry => numeric(entry.data?.instant?.details?.ultraviolet_index_clear_sky)).filter(value => value !== null);
    if (!temperatures.length || !winds.length) throw new Error("Champs MET Norway absents");
    const midday = entries.find(entry => new Intl.DateTimeFormat("en-GB", { timeZone: LOCATION.timezone, hour: "2-digit", hourCycle: "h23" }).format(new Date(entry.time)) === "12") || entries[0];
    return {
      date, min: Math.min(...temperatures), max: Math.max(...temperatures), wind: Math.max(...winds) * 3.6,
      rain: null, rainProbability: null, uv: uvs.length ? Math.max(...uvs) : null, uvKind: "clear-sky",
      sunset: null, condition: midday.data?.next_1_hours?.summary?.symbol_code || midday.data?.next_6_hours?.summary?.symbol_code || "",
      partial: true
    };
  });
  // Accumuler uniquement des périodes non chevauchantes entièrement contenues dans la journée.
  for (const day of days) {
    const entries = groups.get(day.date);
    let coveredUntil = 0, rain = 0, hasRain = false;
    for (const entry of entries) {
      const start = Date.parse(entry.time);
      if (start < coveredUntil) continue;
      for (const hours of [1, 6]) {
        const value = numeric(entry.data?.[`next_${hours}_hours`]?.details?.precipitation_amount);
        const end = start + hours * HOUR;
        if (value !== null && dateInParis(new Date(end - 1)) === day.date) {
          rain += value; coveredUntil = end; hasRain = true; break;
        }
      }
    }
    day.rain = hasRain ? Math.round(rain * 10) / 10 : null;
  }
  const knownSunset = previous?.days?.find(day => day.date === today)?.sunset;
  if (knownSunset) {
    const day = days.find(day => day.date === today);
    if (day) day.sunset = knownSunset;
  } else try {
    const offset = new Intl.DateTimeFormat("en", { timeZone: LOCATION.timezone, timeZoneName: "longOffset" }).formatToParts(now).find(part => part.type === "timeZoneName").value.replace("GMT", "");
    const query = new URLSearchParams({ lat: "44.5638", lon: "6.4952", date: today, offset });
    const { body: sun } = await requestJSON(`${SUN_ENDPOINT}?${query}`, { fetcher, headers });
    const sunset = sun.properties?.sunset?.time;
    const day = days.find(day => day.date === today);
    if (day && typeof sunset === "string") day.sunset = sunset.slice(11, 16);
  } catch { /* La météo reste disponible si le service solaire échoue. */ }
  const expiry = Date.parse(expires);
  return validateForecast({
    version: 1, location: LOCATION, source: "met-norway", fetchedAt: now.toISOString(),
    nextAttemptAt: new Date(Math.max(now.getTime() + HOUR, Number.isFinite(expiry) ? expiry : 0)).toISOString(),
    status: "fallback",
    message: "Source de secours. Températures et pluie sur les heures disponibles ; UV par ciel clair.",
    days
  });
}
