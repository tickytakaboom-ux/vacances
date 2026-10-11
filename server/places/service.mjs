import { DAY, RETRY, CENTER, CATEGORIES, getPhotonPlaces, validGroup } from "./photon.mjs";
export async function refreshPlaces(previous, { now = new Date(), source = getPhotonPlaces } = {}) {
  const groups = {};
  let changed = false;
  for (const category of Object.keys(CATEGORIES)) {
    const old = previous?.groups?.[category];
    if (validGroup(old) && Date.parse(old.nextAttemptAt) > now.getTime()) { groups[category] = old; continue; }
    changed = true;
    try {
      const places = await source(category);
      if (!Array.isArray(places) || !places.length || !validGroup({ places, fetchedAt: now.toISOString(), nextAttemptAt: now.toISOString() })) {
        throw new Error("Lieux invalides");
      }
      groups[category] = { status: "fresh", fetchedAt: now.toISOString(), nextAttemptAt: new Date(now.getTime() + DAY).toISOString(), places };
    } catch (error) {
      console.warn(`Photon ${category} indisponible : ${error.message}`);
      groups[category] = {
        status: validGroup(old) && old.places.length ? "stale" : "unavailable",
        fetchedAt: validGroup(old) ? old.fetchedAt : null,
        nextAttemptAt: new Date(now.getTime() + RETRY).toISOString(),
        places: validGroup(old) ? old.places : []
      };
    }
  }
  return !changed && previous ? previous : { version: 1, center: CENTER, checkedAt: now.toISOString(), groups };
}
