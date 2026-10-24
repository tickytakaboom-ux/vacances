import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, doc, collection, addDoc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuQZUhTfJhpf33JioWKdrgp8YwuY18e2Y",
  authDomain: "vacances-73619.firebaseapp.com",
  projectId: "vacances-73619",
  storageBucket: "vacances-73619.firebasestorage.app",
  messagingSenderId: "861120662557",
  appId: "1:861120662557:web:b4e7ecf6257c5734530af4",
  measurementId: "G-TZ4QFX9QHK"
};


const auth = getAuth(initializeApp(firebaseConfig));
const db = getFirestore(auth.app);
const tripRef = doc(db, "trips", "embrun-2027");
let user = null;
let connecting = false;
let ready = false;
let stopTrip = null;
let generation = 0;
let lastRemoteData = null;
let userName = localStorage.getItem("zigotos-first-name-v1") || "";

function setStatus(label, state = "") {
  document.querySelector("#syncDot").classList.remove("online", "error");
  if (state) document.querySelector("#syncDot").classList.add(state);
  document.querySelector("#syncLabel").textContent = label;
  document.querySelector("#syncLabel").classList.toggle("error", state === "error");
  document.querySelector("#userChip").title = label;
  window.dispatchEvent(new Event("trip-sync-ready"));
}
function suspend(label) {
  ready = false;
  generation++;
  stopTrip?.();
  stopTrip = null;
  lastRemoteData = null;
  window.reportTripDataError(label);
  setStatus("Connexion indisponible", "error");
  document.querySelector("#lastEditor").textContent = "Aucun changement n’est envoyé au carnet partagé depuis cet appareil.";
}
function subscribeTrip() {
  if (stopTrip) return;
  ready = false;
  const current = ++generation;
  setStatus("Chargement du carnet…");
  stopTrip = onSnapshot(tripRef, {includeMetadataChanges: true}, snapshot => {
    if (current !== generation || snapshot.metadata.fromCache) return;
    if (!snapshot.exists()) {
      ready = false;
      window.reportTripDataError("Le carnet partagé est introuvable. Contacte Julian : aucune copie locale ne sera envoyée automatiquement.");
      setStatus("Carnet introuvable", "error");
      return;
    }
    try {
      const data = snapshot.data();
      if (Object.hasOwn(data, "contentJson") && (typeof data.contentJson !== "string" || data.contentJson.length > 200000)) throw new TypeError("Contenu invalide");
      const remote = window.normalizeTripData(Object.hasOwn(data, "contentJson") ? JSON.parse(data.contentJson) : data.content);
      if (!remote || typeof remote !== "object") throw new Error("Contenu absent");
      const received = new CustomEvent("shared-trip-data", {detail: remote, cancelable: true});
      if (!window.dispatchEvent(received)) throw new TypeError("Carnet refusé par l’application");
      lastRemoteData = structuredClone(remote);
      ready = true;
      if (data.updatedByName) document.querySelector("#lastEditor").textContent = "Dernière modification partagée par " + data.updatedByName + ".";
      setStatus(snapshot.metadata.hasPendingWrites ? "Synchronisation…" : "Synchronisé", snapshot.metadata.hasPendingWrites ? "" : "online");
    } catch (error) {
      ready = false;
      window.reportTripDataError("Version partagée refusée : données mal formées. La dernière copie utilisable est conservée. Contacte Julian.");
      setStatus("Données partagées illisibles", "error");
      console.error("Firebase data parse failed", error);
    }
  }, error => {
    if (current !== generation) return;
    suspend("Connexion au carnet interrompue. Actualise la page pour réessayer.");
    console.warn("Firebase trip access failed", error);
  });
}
async function connect() {
  if (connecting) return;
  connecting = true;
  try {
    setStatus("Connexion…");
    user = (await signInAnonymously(auth)).user;
    subscribeTrip();
  } catch (error) {
    suspend("Connexion impossible. Réessaie lorsque le réseau est disponible.");
    console.warn("Firebase connection failed", error);
  } finally { connecting = false; }
}
window.saveSharedTrip = async content => {
  if (!user || !userName || !ready) {
    setStatus("Sauvegardé sur cet appareil", "error");
    return false;
  }
  const current = generation;
  let saved;
  try { saved = window.normalizeTripData(content); } catch {
    window.reportTripDataError("Envoi refusé : données mal formées. Aucun changement partagé n’a été envoyé.");
    setStatus("Données non envoyées", "error");
    return false;
  }
  const changedSections = Object.keys(saved).filter(section => JSON.stringify(lastRemoteData?.[section]) !== JSON.stringify(saved[section]));
  setStatus("Synchronisation…");
  try {
    await setDoc(tripRef, {contentJson: JSON.stringify(saved), updatedAt: serverTimestamp(), updatedByUid: user.uid, updatedByName: userName});
    if (current !== generation) return false;
    lastRemoteData = saved;
    try {
      await addDoc(collection(db, "trips", "embrun-2027", "history"), {contentJson: JSON.stringify(saved), changedSections, changedByUid: user.uid, changedByName: userName, changedAt: serverTimestamp()});
    } catch (error) { console.warn("Firebase history save failed", error); }
    if (current === generation) setStatus("Synchronisé", "online");
    return true;
  } catch (error) {
    if (error.code === "permission-denied") suspend("La sauvegarde est refusée. Vérifie que les nouvelles règles Firebase sont publiées.");
    else setStatus("Sauvegardé sur cet appareil", "error");
    console.warn("Firebase save failed", error);
    return false;
  }
};
window.addEventListener("trip-user-ready", event => { userName = event.detail; if (!user) connect(); });
if (userName) connect();
