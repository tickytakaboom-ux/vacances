import test from "node:test";
import assert from "node:assert/strict";
import { getPhotonPlaces, CATEGORIES } from "../server/places/photon.mjs";
test("Photon réel : coordonnées et noms dans les trois catégories", async () => {
  for (const category of Object.keys(CATEGORIES)) {
    const places = await getPhotonPlaces(category);
    assert.ok(places.length > 0); assert.ok(places.length <= 20);
    for (const place of places) {
      assert.ok(place.name); assert.ok(Number.isFinite(place.latitude)); assert.ok(Number.isFinite(place.longitude));
      assert.equal(place.category, category); assert.match(place.id, /^(node|way|relation)\/\d+$/);
    }
    await new Promise(resolve => setTimeout(resolve, 1100));
  }
});
