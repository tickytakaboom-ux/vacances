import test from "node:test";
import assert from "node:assert/strict";
import { refreshWeather } from "../server/weather/service.mjs";
import { HOUR, LOCATION } from "../server/weather/http.mjs";
const now = new Date("2026-10-11T12:00:00Z");
const fixture = (overrides = {}) => ({
  version: 1, location: LOCATION, source: "open-meteo", status: "fresh", message: "",
  fetchedAt: "2026-10-11T10:00:00Z", nextAttemptAt: "2026-10-11T11:00:00Z",
  days: [{ date: "2026-10-11", min: 6, max: 18, wind: 14, rain: 0, rainProbability: 0, uv: 4.5, sunset: "18:56" }],
  ...overrides
});
test("aucun appel tant que le cache est valide", async () => {
  const previous = fixture({ nextAttemptAt: "2026-10-11T13:00:00Z" });
  const forbidden = () => { throw new Error("appel interdit"); };
  assert.equal(await refreshWeather(previous, { now, primary: forbidden, backup: forbidden }), previous);
});
test("bascule au secours quand la principale échoue", async () => {
  let calls = 0;
  const result = await refreshWeather(fixture(), { now,
    primary: async () => { throw new Error("HTTP 503"); },
    backup: async () => { calls++; return fixture({ source: "met-norway", status: "fallback", fetchedAt: now.toISOString() }); }
  });
  assert.equal(result.source, "met-norway"); assert.equal(calls, 1);
});
test("réponse principale malformée déclenche aussi le secours", async () => {
  const result = await refreshWeather(null, { now, primary: async () => ({ days: [] }), backup: async () => fixture({ source: "met-norway" }) });
  assert.equal(result.source, "met-norway");
});
test("deux pannes conservent le relevé et limitent les nouvelles tentatives", async () => {
  const previous = fixture();
  const unavailable = async () => { throw new Error("timeout"); };
  const result = await refreshWeather(previous, { now, primary: unavailable, backup: unavailable });
  assert.equal(result.status, "stale"); assert.equal(result.fetchedAt, previous.fetchedAt);
  assert.deepEqual(result.days, previous.days);
  assert.equal(Date.parse(result.nextAttemptAt), now.getTime() + HOUR);
  assert.equal(await refreshWeather(result, { now, primary: unavailable, backup: unavailable }), result);
});
test("première visite sans aucune source reste un état affichable", async () => {
  const unavailable = async () => { throw new Error("HTTP 429"); };
  const result = await refreshWeather(null, { now, primary: unavailable, backup: unavailable });
  assert.equal(result.status, "unavailable"); assert.deepEqual(result.days, []); assert.equal(result.fetchedAt, null);
});

test("première panne sans cache conserve aussi le délai de nouvelle tentative", async () => {
  const unavailable = async () => { throw new Error("HTTP 429"); };
  const first = await refreshWeather(null, { now, primary: unavailable, backup: unavailable });
  const forbidden = () => { assert.fail("appel avant expiration"); };
  assert.equal(await refreshWeather(first, { now, primary: forbidden, backup: forbidden }), first);
});
