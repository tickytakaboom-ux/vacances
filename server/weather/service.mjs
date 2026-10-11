import { HOUR, validateForecast } from "./http.mjs";
import { getOpenMeteo } from "./open-meteo.mjs";
import { getMetNorway } from "./met-norway.mjs";
export async function refreshWeather(previous, { now = new Date(), primary = getOpenMeteo, backup = getMetNorway } = {}) {
  if (previous?.status === "unavailable" && Array.isArray(previous.days) && previous.days.length === 0 && Date.parse(previous.nextAttemptAt) > now.getTime()) return previous;
  let validPrevious = null;
  try { validPrevious = validateForecast(previous); } catch { /* Cache absent ou invalide. */ }
  if (validPrevious && Date.parse(validPrevious.nextAttemptAt) > now.getTime()) return validPrevious;
  for (const [name, source] of [["Open-Meteo", primary], ["MET Norway", backup]]) {
    try { return validateForecast(await source({ now, previous: validPrevious })); }
    catch (error) { console.warn(`${name} indisponible : ${error.message}`); }
  }
  if (validPrevious) return {
    ...validPrevious, status: "stale",
    nextAttemptAt: new Date(now.getTime() + HOUR).toISOString(),
    message: "Les sources météo sont indisponibles. Dernières prévisions connues, à vérifier."
  };
  return {
    version: 1, location: { name: "Embrun", timezone: "Europe/Paris" }, source: null,
    status: "unavailable", fetchedAt: null, nextAttemptAt: new Date(now.getTime() + HOUR).toISOString(),
    message: "La météo est momentanément indisponible.", days: []
  };
}
