import { HOUR, LOCATION, numeric, requestJSON, validateForecast } from "./http.mjs";
export const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
export async function getOpenMeteo({ now = new Date(), fetcher = fetch } = {}) {
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({
    latitude: String(LOCATION.latitude), longitude: String(LOCATION.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunset",
    timezone: LOCATION.timezone, forecast_days: "7"
  });
  const { body } = await requestJSON(url, { fetcher });
  if (body.timezone !== LOCATION.timezone || !Array.isArray(body.daily?.time)) throw new Error("Réponse Open-Meteo incompatible");
  const daily = body.daily;
  return validateForecast({
    version: 1, location: LOCATION, source: "open-meteo",
    fetchedAt: now.toISOString(), nextAttemptAt: new Date(now.getTime() + HOUR).toISOString(),
    status: "fresh", message: "",
    days: daily.time.map((date, index) => ({
      date, min: numeric(daily.temperature_2m_min?.[index]), max: numeric(daily.temperature_2m_max?.[index]),
      wind: numeric(daily.wind_speed_10m_max?.[index]), rain: numeric(daily.precipitation_sum?.[index]),
      rainProbability: numeric(daily.precipitation_probability_max?.[index]),
      uv: numeric(daily.uv_index_max?.[index]), uvKind: "forecast",
      sunset: typeof daily.sunset?.[index] === "string" ? daily.sunset[index].slice(11, 16) : null,
      condition: numeric(daily.weather_code?.[index]), partial: false
    }))
  });
}
