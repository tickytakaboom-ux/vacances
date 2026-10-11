import test from "node:test";
import assert from "node:assert/strict";
import { getOpenMeteo } from "../server/weather/open-meteo.mjs";
import { getMetNorway } from "../server/weather/met-norway.mjs";
test("Open-Meteo réel : température, pluie, vent, UV et coucher", async () => {
  const result = await getOpenMeteo();
  assert.equal(result.source, "open-meteo"); assert.equal(result.days.length, 7);
  for (const day of result.days) {
    assert.ok(Number.isFinite(day.rainProbability)); assert.ok(Number.isFinite(day.uv));
    assert.match(day.sunset, /^\d{2}:\d{2}$/);
  }
});
test("MET Norway réel : météo normalisée et coucher du jour", async () => {
  const result = await getMetNorway();
  assert.equal(result.source, "met-norway");
  assert.ok(result.days.length >= 5);
  assert.ok(result.days.some(day => Number.isFinite(day.uv)));
  assert.equal(result.days[0].uvKind, "clear-sky");
  assert.match(result.days[0].sunset, /^\d{2}:\d{2}$/);
});
