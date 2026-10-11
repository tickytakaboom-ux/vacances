export const HOUR = 60 * 60 * 1000;
export const LOCATION = { name: "Embrun", latitude: 44.56387, longitude: 6.49526, timezone: "Europe/Paris" };
export const dateInParis = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: LOCATION.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
export const numeric = value => typeof value === "number" && Number.isFinite(value) ? value : null;
export async function requestJSON(url, { fetcher = fetch, headers = {} } = {}) {
  const response = await fetcher(url, { headers: { Accept: "application/json", ...headers }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { body: await response.json(), expires: response.headers.get("expires") };
}
export function validateForecast(value) {
  if (!value || value.location?.name !== "Embrun" || !Array.isArray(value.days) || !value.days.length ||
      !Number.isFinite(Date.parse(value.fetchedAt)) || !Number.isFinite(Date.parse(value.nextAttemptAt))) throw new Error("Prévisions invalides");
  for (const day of value.days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(day.min) || !Number.isFinite(day.max) ||
        !Number.isFinite(day.wind)) throw new Error("Champs météo obligatoires absents");
    for (const field of ["rain", "rainProbability", "uv"]) {
      if (day[field] !== null && !Number.isFinite(day[field])) throw new Error(`Champ ${field} invalide`);
    }
  }
  return value;
}
