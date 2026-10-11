import { readFile, writeFile, mkdir } from "node:fs/promises";
import { refreshPlaces } from "../server/places/service.mjs";
const target = new URL("../data/nearby-places.json", import.meta.url);
let previous = null;
try { previous = JSON.parse(await readFile(target, "utf8")); } catch {}
const result = await refreshPlaces(previous);
await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(target, JSON.stringify(result, null, 2) + "\n");
console.log("Lieux autour du camping : " + Object.entries(result.groups).map(([name, group]) => `${name} ${group.places.length} (${group.status})`).join(", "));
