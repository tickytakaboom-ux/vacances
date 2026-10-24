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
let allowed = false;
let ready = false;
let stopTrip = null;
let stopMember = null;
let generation = 0;
let lastRemoteData = null;
let userName = localStorage.getItem("zigotos-first-name-v1") || "";

const panel = document.querySelector("#deviceAccess");
const message = document.querySelector("#deviceAccessMessage");
const code = document.querySelector("#deviceCode");
function setStatus(label, state = "") {
  document.querySelector("#syncDot").classList.remove("online", "error");
  if (state) document.querySelector("#syncDot").classList.add(state);
  document.querySelector("#syncLabel").textContent = label;
  document.querySelector("#syncLabel").classList.toggle("error", state === "error");
  document.querySelector("#userChip").title = label;
  window.dispatchEvent(new Event("trip-sync-ready"));
}
function suspend(label) {
  allowed = false;
  ready = false;
  generation++;
  stopTrip?.();
  stopTrip = null;
  lastRemoteData = null;
  panel.hidden = false;
  message.textContent = label;
  setStatus("Appareil non autorisé", "error");
  document.querySelector("#lastEditor").textContent = "Aucun changement n’est envoyé au carnet partagé depuis cet appareil.";
}
function subscribeTrip() {
  if (stopTrip) return;
  allowed = true;
  ready = false;
  const current = ++generation;
  setStatus("Chargement du carnet…");
  stopTrip = onSnapshot(tripRef, {includeMetadataChanges: true}, snapshot => {
    if (!allowed || current !== generation || snapshot.metadata.fromCache) return;
    if (!snapshot.exists()) {
      ready = false;
      panel.hidden = false;
      message.textContent = "Le carnet partagé est introuvable. Contacte Julian : aucune copie locale ne sera envoyée automatiquement.";
      setStatus("Carnet introuvable", "error");
      return;
    }
    try {
      const data = snapshot.data();
      const remote = data.contentJson ? JSON.parse(data.contentJson) : data.content;
      if (!remote || typeof remote !== "object") throw new Error("Contenu absent");
      lastRemoteData = structuredClone(remote);
      window.dispatchEvent(new CustomEvent("shared-trip-data", {detail: remote}));
      ready = true;
      panel.hidden = true;
      if (data.updatedByName) document.querySelector("#lastEditor").textContent = "Dernière modification partagée par " + data.updatedByName + ".";
      setStatus(snapshot.metadata.hasPendingWrites ? "Synchronisation…" : "Synchronisé", snapshot.metadata.hasPendingWrites ? "" : "online");
    } catch (error) {
      ready = false;
      setStatus("Données partagées illisibles", "error");
      console.error("Firebase data parse failed", error);
    }
  }, error => {
    if (current !== generation) return;
    suspend("Accès au carnet refusé ou connexion interrompue. Vérifie ton autorisation puis réessaie.");
    console.warn("Firebase trip access failed", error);
  });
}
function watchMembership() {
  stopMember?.();
  suspend("Envoie ce code d’appareil à Julian pour qu’il autorise ton accès. Chaque navigateur doit être autorisé séparément.");
  stopMember = onSnapshot(doc(db, "trips", "embrun-2027", "members", user.uid), {includeMetadataChanges: true}, snapshot => {
    if (snapshot.metadata.fromCache) {
      suspend("Connexion nécessaire pour vérifier l’autorisation de cet appareil.");
      return;
    }
    if (snapshot.exists() && snapshot.data().active === true) subscribeTrip();
    else suspend("Envoie ce code d’appareil à Julian pour qu’il autorise ton accès. Tes modifications locales ne seront pas envoyées automatiquement.");
  }, error => {
    suspend("Autorisation impossible à vérifier. Julian doit activer les nouvelles règles Firebase ; tu peux déjà lui transmettre ce code.");
    console.warn("Firebase membership check failed", error);
  });
}
async function connect() {
  if (connecting) return;
  connecting = true;
  try {
    setStatus("Connexion…");
    user = (await signInAnonymously(auth)).user;
    code.value = user.uid;
    watchMembership();
  } catch (error) {
    suspend("Connexion impossible. Réessaie lorsque le réseau est disponible.");
    console.warn("Firebase connection failed", error);
  } finally { connecting = false; }
}
window.saveSharedTrip = async content => {
  if (!user || !userName || !allowed || !ready) {
    setStatus("Sauvegardé sur cet appareil", "error");
    return false;
  }
  const current = generation;
  const saved = structuredClone(content);
  const changedSections = Object.keys(saved).filter(section => JSON.stringify(lastRemoteData?.[section]) !== JSON.stringify(saved[section]));
  setStatus("Synchronisation…");
  try {
    await setDoc(tripRef, {contentJson: JSON.stringify(saved), updatedAt: serverTimestamp(), updatedByUid: user.uid, updatedByName: userName});
    if (!allowed || current !== generation) return false;
    lastRemoteData = saved;
    try {
      await addDoc(collection(db, "trips", "embrun-2027", "history"), {contentJson: JSON.stringify(saved), changedSections, changedByUid: user.uid, changedByName: userName, changedAt: serverTimestamp()});
    } catch (error) { console.warn("Firebase history save failed", error); }
    if (allowed && current === generation) setStatus("Synchronisé", "online");
    return true;
  } catch (error) {
    if (error.code === "permission-denied") suspend("Cet appareil n’est plus autorisé. Contacte Julian.");
    else setStatus("Sauvegardé sur cet appareil", "error");
    console.warn("Firebase save failed", error);
    return false;
  }
};
document.querySelector("#copyDeviceCode").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(code.value);
    message.textContent = "Code copié. Transmets-le à Julian pour autoriser cet appareil.";
  } catch {
    code.focus(); code.select();
    message.textContent = "Sélectionne et copie le code ci-dessus pour le transmettre à Julian.";
  }
});
document.querySelector("#retryDeviceAccess").addEventListener("click", () => {
  if (user) watchMembership(); else connect();
});
window.addEventListener("trip-user-ready", event => { userName = event.detail; if (!user) connect(); });
if (userName) connect();
