import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DAY, RETRY, CENTER, normalizePhoton } from "../server/places/photon.mjs";
import { refreshPlaces } from "../server/places/service.mjs";
const recorded = JSON.parse(await readFile(new URL("../data/nearby-places.json", import.meta.url)));
const chosen = JSON.parse(await readFile(new URL("../data/selected-places.json", import.meta.url)));
const now = new Date("2026-10-11T12:00:00Z");
function oldData() {
  return { ...recorded, groups: Object.fromEntries(Object.entries(recorded.groups).map(([name, group]) => [name, { ...group, fetchedAt: "2026-10-10T10:00:00Z", nextAttemptAt: "2026-10-11T10:00:00Z" }])) };
}
test("cache journalier évite tout appel", async () => {
  const data = oldData();
  for (const group of Object.values(data.groups)) group.nextAttemptAt = "2026-10-12T12:00:00Z";
  assert.equal(await refreshPlaces(data, { now, source: () => assert.fail("appel interdit") }), data);
});
test("une panne partielle conserve seulement la catégorie défaillante", async () => {
  const previous = oldData();
  const result = await refreshPlaces(previous, { now, source: async category => {
    if (category === "courses") throw new Error("HTTP 503");
    return recorded.groups[category].places;
  } });
  assert.equal(result.groups.courses.status, "stale");
  assert.equal(result.groups.courses.fetchedAt, previous.groups.courses.fetchedAt);
  assert.deepEqual(result.groups.courses.places, previous.groups.courses.places);
  assert.equal(result.groups.restaurants.status, "fresh");
  assert.equal(Date.parse(result.groups.restaurants.nextAttemptAt), now.getTime() + DAY);
  assert.equal(Date.parse(result.groups.courses.nextAttemptAt), now.getTime() + RETRY);
});
test("première panne sans cache retourne un état affichable et temporisé", async () => {
  const result = await refreshPlaces(null, { now, source: async () => { throw new Error("timeout"); } });
  assert.ok(Object.values(result.groups).every(group => group.status === "unavailable" && group.places.length === 0));
  assert.equal(await refreshPlaces(result, { now, source: () => assert.fail("nouvel appel prématuré") }), result);
});
test("données corrompues ne remplacent pas la dernière liste valide", async () => {
  const previous = oldData();
  const result = await refreshPlaces(previous, { now, source: async () => [{ id: "invalide", latitude: NaN }] });
  assert.deepEqual(result.groups.restaurants.places, previous.groups.restaurants.places);
  assert.equal(result.groups.restaurants.status, "stale");
});
test("filtrage des coordonnées invalides et déduplication des éléments OSM", () => {
  const feature = { type: "Feature", properties: { osm_type: "N", osm_id: 1, name: "Test", countrycode: "FR" }, geometry: { type: "Point", coordinates: [CENTER.longitude, CENTER.latitude] } };
  const result = normalizePhoton({ features: [feature, feature, { ...feature, geometry: { type: "Point", coordinates: [0, 0] } }, { ...feature, properties: { ...feature.properties, osm_id: 2 }, geometry: { type: "Point", coordinates: [NaN, 0] } }] }, "restaurants");
  assert.equal(result.length, 1); assert.equal(result[0].id, "node/1");
});
test("les dix lieux sont présents, et Les Orres est la station 1650", () => {
  assert.equal(chosen.places.length, 10);
  assert.equal(new Set(chosen.places.map(place => place.id)).size, 10);
  const station = chosen.places.find(place => place.id === "les-orres");
  assert.equal(station.latitude, 44.49311); assert.equal(station.longitude, 6.55641);
  assert.match(station.name, /1650/);
});
