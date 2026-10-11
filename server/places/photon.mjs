export const ENDPOINT = "https://photon.komoot.io/reverse";
export const DAY = 24 * 60 * 60 * 1000;
export const RETRY = 60 * 60 * 1000;
export const CENTER = { latitude: 44.5518881, longitude: 6.4768568, radiusKm: 4 };
export const CATEGORIES = {
  restaurants: { label: "Restaurants", tag: "amenity:restaurant" },
  courses: { label: "Courses", tag: "shop:supermarket" },
  sorties: { label: "Sorties", tag: "tourism:attraction" }
};
const TYPES = { N: "node", W: "way", R: "relation" };
export function normalizePhoton(body, category) {
  if (!Array.isArray(body?.features)) throw new Error("Réponse Photon incompatible");
  const seen = new Set();
  const places = [];
  for (const feature of body.features) {
    const props = feature.properties;
    const coordinates = feature.geometry?.coordinates;
    if (feature.geometry?.type !== "Point" || !Array.isArray(coordinates) ||
        !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1]) ||
        !props?.name || props.countrycode?.toUpperCase() !== "FR" ||
        !TYPES[props.osm_type] || !Number.isSafeInteger(props.osm_id)) continue;
    const [longitude, latitude] = coordinates;
    const deltaLat = (latitude - CENTER.latitude) * Math.PI / 180;
    const deltaLon = (longitude - CENTER.longitude) * Math.PI / 180;
    const distance = 6371 * 2 * Math.asin(Math.sqrt(Math.sin(deltaLat / 2) ** 2 +
      Math.cos(latitude * Math.PI / 180) * Math.cos(CENTER.latitude * Math.PI / 180) * Math.sin(deltaLon / 2) ** 2));
    if (distance > CENTER.radiusKm + 0.1) continue;
    const id = `${TYPES[props.osm_type]}/${props.osm_id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    places.push({
      id, name: String(props.name), category, latitude, longitude,
      address: [props.housenumber, props.street, props.postcode, props.city].filter(Boolean).join(" "),
      source: "OpenStreetMap / Photon"
    });
  }
  if (!places.length) throw new Error("Aucun lieu exploitable renvoyé par Photon");
  return places;
}
export async function getPhotonPlaces(category, { fetcher = fetch } = {}) {
  if (!CATEGORIES[category]) throw new Error("Catégorie inconnue");
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({
    lat: String(CENTER.latitude), lon: String(CENTER.longitude), radius: String(CENTER.radiusKm),
    osm_tag: CATEGORIES[category].tag, limit: "20", lang: "fr"
  });
  const response = await fetcher(url, {
    headers: { Accept: "application/json", "User-Agent": "LesZigotosEmbrun/1.0 (+https://github.com/tickytakaboom-ux/vacances)" },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return normalizePhoton(await response.json(), category);
}
export function validGroup(group) {
  return group && Number.isFinite(Date.parse(group.nextAttemptAt)) && Array.isArray(group.places) &&
    (group.places.length === 0 || Number.isFinite(Date.parse(group.fetchedAt))) &&
    group.places.every(place => typeof place.id === "string" && typeof place.name === "string" &&
      Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
}
