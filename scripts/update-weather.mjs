import { readFile, writeFile, mkdir } from "node:fs/promises";
import { refreshWeather } from "../server/weather/service.mjs";
const target = new URL("../data/weather.json", import.meta.url);
let previous = null;
try { previous = JSON.parse(await readFile(target, "utf8")); } catch {}
const result = await refreshWeather(previous);
await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(target, JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(`Météo Embrun : ${result.status}, source ${result.source || "aucune"}, relevé ${result.fetchedAt || "absent"}`);
